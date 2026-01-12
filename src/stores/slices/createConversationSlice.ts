/**
 * ConversationSlice - 對話列表管理
 * - 載入與管理對話列表
 * - 處理對話選擇
 * - 更新對話最後訊息時間
 */

import type { SliceCreator, ConversationSlice } from './types'
import { getConversations } from '@/apis/conversation'

const initialState = {
  conversations: [],
  selectedConversationId: 1,
  isLoading: false,
}

export const createConversationSlice: SliceCreator<ConversationSlice> = (set, get) => ({
  ...initialState,

  loadConversations: async () => {
    set({ isLoading: true })

    try {
      const data = await getConversations()
      set({ conversations: data })
    } catch (error) {
      console.error('[ConversationSlice] 載入對話失敗:', error)
    } finally {
      set({ isLoading: false })
    }
  },

  selectConversation: async (id: number) => {
    set({ selectedConversationId: id })
    await get().loadMessages(id)
  },

  updateConversationTimestamp: (id: number, lastMessage: string, timestamp: number) => {
    set((state) => ({
      conversations: state.conversations.map((conv) =>
        conv.id === id
          ? {
            ...conv,
            lastMessage,
            timestamp,
          }
          : conv
      ),
    }))
  },
})
