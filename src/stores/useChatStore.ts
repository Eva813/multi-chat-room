'use client'

import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { Conversation, Message } from '@/lib/types'
import { getConversations, getMessages, createMessage } from '@/apis/conversation'

interface ChatState {
  conversations: Conversation[]
  messages: Message[]
  selectedConversationId: number
  // Loading
  isLoading: boolean
  isMessagesLoading: boolean
  isSending: boolean
  sendError?: string

  // Actions
  loadConversations: () => Promise<void>
  loadMessages: (conversationId: number) => Promise<void>
  selectConversation: (id: number) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  clearSendError: () => void
}

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      conversations: [],
      messages: [],
      selectedConversationId: 1,
      isLoading: false,
      isMessagesLoading: false,
      isSending: false,
      sendError: undefined,

      // 載入對話列表
      loadConversations: async () => {
        set({ isLoading: true })

        try {
          const data = await getConversations()
          set({ conversations: data })
        } catch (error) {
          console.error('載入對話失敗:', error)
        } finally {
          set({ isLoading: false })
        }
      },

      loadMessages: async (conversationId: number) => {
        set({ isMessagesLoading: true })

        try {
          const data = await getMessages(conversationId)
          set({ messages: data })
        } catch (error) {
          console.error('載入訊息失敗:', error)
        } finally {
          set({ isMessagesLoading: false })
        }
      },

      // 選擇對話並加載對應的訊息
      selectConversation: async (id: number) => {
        set({ selectedConversationId: id })
        await get().loadMessages(id)
      },

      // 發送訊息，需要同時更新多個狀態
      sendMessage: async (content: string) => {
        // 驗證輸入
        if (!content.trim()) return
        const { selectedConversationId, conversations, messages } = get()
        set({ isSending: true, sendError: undefined })

        try {
          // 呼叫 API 建立新訊息
          const newMessage = await createMessage(selectedConversationId, {
            userId: 6,
            message: content,
            messageType: 'text',
            user: 'Me',
            avatar: 'https://i.pravatar.cc/150?img=6',
          })

          // 同時更新兩個狀態
          set({
            // 1. 更新訊息列表：加入新訊息
            messages: [...messages, newMessage],

            // 2. 更新對話列表：更新最後訊息和時間戳記
            conversations: conversations.map((conv) =>
              conv.id === selectedConversationId
                ? {
                  ...conv,
                  lastMessage: content,
                  timestamp: newMessage.timestamp,
                }
                : conv
            ),
          })
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : '傳送訊息失敗，請稍後重試'
          set({ sendError: errorMessage })
          console.error('傳送訊息失敗:', error)
        } finally {
          set({ isSending: false })
        }
      },

      clearSendError: () => set({ sendError: undefined }),
    }),
    {
      name: 'ChatStore',
    }
  )
)