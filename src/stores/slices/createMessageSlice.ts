/**
 * MessageSlice - 訊息管理與持久化（包含 Reactions）
 * - 從 chatData.json 載入固定訊息（唯讀）
 * - 使用者發送的新訊息直接加入 messages 陣列
 * - 持久化「完整的」使用者訊息
 * - Reactions 直接更新在 messages 陣列中
 */

import type { SliceCreator, MessageSlice, MessageId, ReactionType } from './types'
import { getMessages, createMessage, getMessagesUpdates } from '@/apis/conversation'
import { updateReaction } from '@/apis/conversation'
import { generateMessageId } from '../utils/messageId'
import { REACTION_TYPES } from '../types'

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
  // 輪詢相關
  isPolling: false,
  pollingError: undefined,
  lastPollTimestamp: 0,
  pollRetryCount: 0,
  // 未讀追蹤
  unreadCount: 0,
  hasUnreadMessages: false,
}

// 輪詢計時器 ID（在模組層級管理）
let pollingTimeoutId: NodeJS.Timeout | null = null

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
      set({ isMessagesLoading: true })
    }

    try {
      // 1. 從 chatData 載入固定訊息
      const chatDataMessages = await getMessages(conversationId)

      // ✅ 只顯示前 3 則訊息（其餘透過輪詢 reveal）
      const initialMessages = chatDataMessages.slice(0, Math.min(3, chatDataMessages.length))

      // 2. 取得該對話的持久化訊息（使用者發送的）
      const { persistedMessages } = get()
      const userMessages = persistedMessages.filter(
        (msg) => msg.conversationId === conversationId
      )

      // 3. 合併並按時間排序
      const allMessages = [...initialMessages, ...userMessages]
        .sort((a, b) => a.timestamp - b.timestamp)

      set({ messages: allMessages })

      // 4. 初始化 reactions（只從 localStorage 讀取，不自動加入所有訊息）
      // ✅ 不再將所有訊息的 reactions 加入 store
      // reactions 只在使用者實際操作時才會被加入
      const { reactions } = get()

      // 清理不屬於當前對話的 reactions（避免 localStorage 累積太多資料）
      const conversationMessageIds = new Set(
        allMessages.map(msg => generateMessageId(msg.conversationId, msg.timestamp))
      )

      const cleanedReactions: Record<string, { like: number; love: number; laugh: number }> = {}
      Object.keys(reactions).forEach(messageId => {
        if (conversationMessageIds.has(messageId as MessageId)) {
          cleanedReactions[messageId] = reactions[messageId]
        }
      })

      set({ reactions: cleanedReactions })

      // ✅ 5. 設置 lastPollTimestamp 為「第一則 chatData 訊息」的時間戳減 1
      // 這樣後續 reveal 的訊息（timestamp 更大）才能通過過濾
      // ⚠️ 注意：只使用 initialMessages（chatData），不包含 userMessages
      const earliestTimestamp = initialMessages.length > 0
        ? Math.min(...initialMessages.map(m => m.timestamp))
        : 0

      set({ lastPollTimestamp: earliestTimestamp - 1 })
      console.log(`[MessageSlice] 載入完成 - 對話 ${conversationId}`)
      console.log(`  - 載入訊息數量: ${allMessages.length}`)
      console.log(`  - 設定 lastPollTimestamp: ${earliestTimestamp - 1}`)
      console.log(`  - 訊息 timestamp 範圍: ${Math.min(...allMessages.map(m => m.timestamp))} ~ ${Math.max(...allMessages.map(m => m.timestamp))}`)
    } catch (error) {
      console.error('[MessageSlice] 載入訊息失敗:', error)
    } finally {
      set({ isMessagesLoading: false, isSwitchingConversation: false })
    }
  },

  /**
   * 發送新訊息
   */
  sendMessage: async (content: string, messageType: 'text' | 'image' = 'text') => {
    if (!content.trim()) return

    const { selectedConversationId, messages, persistedMessages } = get()
    set({ isSending: true, sendError: undefined })

    try {
      // 呼叫 API 建立新訊息（已包含完整資料）
      const newMessage = await createMessage(selectedConversationId, {
        userId: 6,
        message: content,
        messageType: messageType,
        user: 'Me',
        avatar: 'https://i.pravatar.cc/150?img=6',
      })

      set({
        messages: [...messages, newMessage],
        persistedMessages: [...persistedMessages, newMessage],
      })

      // 更新對話列表的最後訊息
      const lastMessageDisplay = messageType === 'image' ? '[圖片]' : content
      get().updateConversationTimestamp(
        selectedConversationId,
        lastMessageDisplay,
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
   * 切換 reaction
   */
  toggleReaction: async (messageId: MessageId, type: ReactionType) => {
    const { reactions, pendingReactions } = get()

    // 使用 messageId-type 組合作為 key 防止重複操作
    const pendingKey = `${messageId}-${type}`
    if (pendingReactions[pendingKey]) {
      console.warn('[MessageSlice] Reaction operation already in progress:', { messageId, type })
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
        [pendingKey]: { type, previousValue, timestamp: Date.now() },
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
        pendingReactions: omit(state.pendingReactions, pendingKey),
      }))
    } catch (error) {
      console.error('[MessageSlice] Reaction update failed:', error)

      const { reactionTimeouts } = get()
      const errorKey = `${messageId}-error`
      if (reactionTimeouts[errorKey]) {
        clearTimeout(reactionTimeouts[errorKey])
      }

      // 回滾到原始狀態並清除 pending 
      set((state) => ({
        reactions: {
          ...state.reactions,
          [messageId]: {
            ...state.reactions[messageId],
            [type]: previousValue,
          },
        },
        pendingReactions: omit(state.pendingReactions, pendingKey),
        reactionErrors: {
          ...state.reactionErrors,
          [messageId]: 'Failed to update reaction',
        },
      }))

      // 3 秒後清除錯誤訊息
      const timeoutId = setTimeout(() => {
        get().clearReactionError(messageId)
      }, 3000)

      // 保存 timeout ID 供後續清理
      set((state) => ({
        reactionTimeouts: {
          ...state.reactionTimeouts,
          [errorKey]: timeoutId,
        },
      }))
    }
  },

  /**
   * 清除指定訊息的 reaction 錯誤
   */
  clearReactionError: (messageId: MessageId) => {
    const { reactionTimeouts } = get()
    const errorKey = `${messageId}-error`

    if (reactionTimeouts[errorKey]) {
      clearTimeout(reactionTimeouts[errorKey])
    }

    set((state) => ({
      reactionErrors: omit(state.reactionErrors, messageId),
      reactionTimeouts: omit(state.reactionTimeouts, errorKey),
    }))
  },

  /**
   * 開始輪詢
   */
  startPolling: () => {
    const { isPolling } = get()
    if (isPolling) return

    set({ isPolling: true, pollRetryCount: 0 })
    get().pollForUpdates()
  },

  /**
   * 停止輪詢
   */
  stopPolling: () => {
    if (pollingTimeoutId) {
      clearTimeout(pollingTimeoutId)
      pollingTimeoutId = null
    }
    set({ isPolling: false })
  },

  /**
   * 輪詢更新
   */
  pollForUpdates: async () => {
    const { isPolling, selectedConversationId, lastPollTimestamp } = get()
    if (!isPolling) return

    console.log(`[Store] 開始輪詢 - 對話: ${selectedConversationId}, lastPollTimestamp: ${lastPollTimestamp}`)

    try {
      // 呼叫長輪詢 API
      const { newMessages, updatedReactions } = await getMessagesUpdates(
        selectedConversationId,
        lastPollTimestamp
      )

      // 處理新訊息
      if (newMessages.length > 0) {
        const { messages } = get()

        // 使用 Map 來去重，避免重複的訊息（使用 conversationId-timestamp 作為 key）
        const messageMap = new Map<string, typeof messages[0]>()

        // 先加入現有訊息
        messages.forEach(msg => {
          const key = `${msg.conversationId}-${msg.timestamp}`
          messageMap.set(key, msg)
        })

        // 再加入新訊息（如果已存在則覆蓋）
        newMessages.forEach(msg => {
          const key = `${msg.conversationId}-${msg.timestamp}`
          messageMap.set(key, msg)
        })

        const allMessages = Array.from(messageMap.values())
          .sort((a, b) => a.timestamp - b.timestamp)

        set({
          messages: allMessages,
          // ✅ 不更新 persistedMessages！輪詢獲取的訊息不應該持久化
          // ✅ 使用「新獲取訊息」的最大 timestamp，而不是所有訊息的
          lastPollTimestamp: newMessages.length > 0
            ? Math.max(...newMessages.map(m => m.timestamp))
            : lastPollTimestamp
        })

        // 如果使用者捲動到上方則增加未讀（由元件管理）
        // 元件會在需要時呼叫 incrementUnreadCount
      }

      // 合併反應更新（避免與待處理操作衝突）
      if (Object.keys(updatedReactions).length > 0) {
        const { reactions, pendingReactions } = get()
        const newReactions = { ...reactions }

        Object.entries(updatedReactions).forEach(([messageId, reactionValues]) => {
          const hasPending = REACTION_TYPES.some(type =>
            pendingReactions[`${messageId}-${type}`]
          )

          if (!hasPending) {
            newReactions[messageId] = reactionValues
          }
        })

        set({
          reactions: newReactions
        })
      }

      // 清除錯誤狀態
      set({ pollingError: undefined, pollRetryCount: 0 })

      // 繼續輪詢（長輪詢循環）
      if (get().isPolling) {
        pollingTimeoutId = setTimeout(() => {
          get().pollForUpdates()
        }, 100) // 下次輪詢前的小延遲
      }

    } catch (error) {
      console.error('[Polling] Error:', error)
      const retryCount = get().pollRetryCount + 1
      const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 30000)

      set({
        pollingError: 'Failed to fetch updates',
        pollRetryCount: retryCount
      })

      // 使用指數退避重試
      if (get().isPolling) {
        pollingTimeoutId = setTimeout(() => {
          get().pollForUpdates()
        }, backoffDelay)
      }
    }
  },

  /**
   * 增加未讀數量
   */
  incrementUnreadCount: () => {
    set(state => ({
      unreadCount: state.unreadCount + 1,
      hasUnreadMessages: true
    }))
  },

  /**
   * 清除未讀數量
   */
  clearUnreadCount: () => {
    set({ unreadCount: 0, hasUnreadMessages: false })
  },
})
