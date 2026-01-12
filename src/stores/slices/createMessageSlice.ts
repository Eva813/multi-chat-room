/**
 * MessageSlice - 訊息管理與持久化（包含 Reactions）
 * - 從 chatData.json 載入固定訊息（唯讀）
 * - 使用者發送的新訊息直接加入 messages 陣列
 * - 持久化「完整的」使用者訊息
 * - Reactions 直接更新在 messages 陣列中
 */

import type { SliceCreator, MessageSlice, MessageId, ReactionType } from './types'
import { getMessages, createMessage } from '@/apis/conversation'
import { updateReaction } from '@/apis/conversation'
import { generateMessageId } from '../utils/messageId'

const initialState = {
  // 訊息相關
  messages: [],
  persistedMessages: [],
  isMessagesLoading: false,
  isSwitchingConversation: false,
  isSending: false,
  sendError: undefined,
  // Reaction 相關
  reactions: {},
  pendingReactions: {},
  reactionErrors: {},
  reactionTimeouts: {},
}

/**
 * 從物件中移除指定的 key
 */
function omit<T extends Record<string, unknown>, K extends keyof T>(
  obj: T,
  key: K
): Omit<T, K> {
  const { [key]: _, ...rest } = obj
  return rest as Omit<T, K>
}

export const createMessageSlice: SliceCreator<MessageSlice> = (set, get) => ({
  ...initialState,

  /**
   * 載入指定對話的訊息
   */
  loadMessages: async (conversationId: number) => {
    const { messages } = get()
    const hasExistingMessages = messages.length > 0

    // 根據是否有現有訊息來設定不同的載入狀態
    if (hasExistingMessages) {
      // 有訊息時使用切換狀態，保持舊訊息可見
      set({ isSwitchingConversation: true })
    } else {
      // 初次載入時使用載入狀態，顯示骨架
      set({ isMessagesLoading: true })
    }

    try {
      // 1. 從 chatData 載入固定訊息
      const chatDataMessages = await getMessages(conversationId)

      // 2. 取得該對話的持久化訊息（使用者發送的）
      const { persistedMessages } = get()
      const userMessages = persistedMessages.filter(
        (msg) => msg.conversationId === conversationId
      )

      // 3. 合併並按時間排序
      const allMessages = [...chatDataMessages, ...userMessages]
        .sort((a, b) => a.timestamp - b.timestamp)

      set({ messages: allMessages })

      // 4. 初始化 reactions（從 messages 中提取）
      const { reactions } = get()
      const newReactions = { ...reactions }

      allMessages.forEach((msg) => {
        const messageId = generateMessageId(msg.conversationId, msg.timestamp)
        // 如果 localStorage 沒有，使用訊息的初始值
        if (!newReactions[messageId]) {
          newReactions[messageId] = msg.reactions
        }
      })

      set({ reactions: newReactions })
    } catch (error) {
      console.error('[MessageSlice] 載入訊息失敗:', error)
    } finally {
      set({ isMessagesLoading: false, isSwitchingConversation: false })
    }
  },

  /**
   * 發送新訊息
   */
  sendMessage: async (content: string) => {
    if (!content.trim()) return

    const { selectedConversationId, messages, persistedMessages } = get()
    set({ isSending: true, sendError: undefined })

    try {
      // 呼叫 API 建立新訊息（已包含完整資料）
      const newMessage = await createMessage(selectedConversationId, {
        userId: 6,
        message: content,
        messageType: 'text',
        user: 'Me',
        avatar: 'https://i.pravatar.cc/150?img=6',
      })

      set({
        messages: [...messages, newMessage],
        persistedMessages: [...persistedMessages, newMessage],
      })

      // 更新對話列表的最後訊息
      get().updateConversationTimestamp(
        selectedConversationId,
        content,
        newMessage.timestamp
      )
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : '傳送訊息失敗，請稍後重試'
      set({ sendError: errorMessage })
      console.error('傳送訊息失敗:', error)
    } finally {
      set({ isSending: false })
    }
  },

  /**
   * 清除發送錯誤訊息
   */
  clearSendError: () => set({ sendError: undefined }),

  /**
   * 切換 reaction（樂觀更新 + 錯誤回滾）
   */
  toggleReaction: async (messageId: MessageId, type: ReactionType) => {
    const { reactions, pendingReactions } = get()

    // 防止重複操作
    if (pendingReactions[messageId]) {
      console.warn('[MessageSlice] Reaction operation already in progress for', messageId)
      return
    }

    // 獲取當前值
    const currentReactions = reactions[messageId] || { like: 0, love: 0, laugh: 0 }
    const previousValue = currentReactions[type]

    // 樂觀更新：立即增加計數
    const newValue = previousValue + 1

    set({
      reactions: {
        ...reactions,
        [messageId]: {
          ...currentReactions,
          [type]: newValue,
        },
      },
      pendingReactions: {
        ...pendingReactions,
        [messageId]: { type, previousValue, timestamp: Date.now() },
      },
    })

    try {
      // 呼叫 API
      const updatedReactions = await updateReaction(messageId, type, newValue)

      // 更新最終值並清除 pending 狀態
      set((state) => ({
        reactions: {
          ...state.reactions,
          [messageId]: updatedReactions,
        },
        pendingReactions: omit(state.pendingReactions, messageId),
      }))
    } catch (error) {
      console.error('[MessageSlice] Reaction update failed:', error)

      set((state) => ({
        reactions: {
          ...state.reactions,
          [messageId]: {
            ...state.reactions[messageId],
            [type]: previousValue,
          },
        },
        pendingReactions: omit(state.pendingReactions, messageId),
        reactionErrors: {
          ...state.reactionErrors,
          [messageId]: 'Failed to update reaction',
        },
      }))

      // 清除舊的 timeout
      const { reactionTimeouts } = get()
      if (reactionTimeouts[messageId]) {
        clearTimeout(reactionTimeouts[messageId])
      }

      // 3 秒後清除錯誤訊息
      const timeoutId = setTimeout(() => {
        get().clearReactionError(messageId)
      }, 3000)

      // 保存 timeout ID
      set((state) => ({
        reactionTimeouts: {
          ...state.reactionTimeouts,
          [messageId]: timeoutId,
        },
      }))
    }
  },

  /**
   * 清除指定訊息的 reaction 錯誤
   */
  clearReactionError: (messageId: MessageId) => {
    const { reactionTimeouts } = get()
    if (reactionTimeouts[messageId]) {
      clearTimeout(reactionTimeouts[messageId])
    }

    set((state) => ({
      reactionErrors: omit(state.reactionErrors, messageId),
      reactionTimeouts: omit(state.reactionTimeouts, messageId),
    }))
  },
})
