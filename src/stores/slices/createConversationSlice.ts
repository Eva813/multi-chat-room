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
  isInitialized: false,
}

export const createConversationSlice: SliceCreator<ConversationSlice> = (set, get) => ({
  ...initialState,

  initialize: async () => {
    if (get().isInitialized) return

    set({ isInitialized: true })
    await get().loadConversations()

    const selectedId = get().selectedConversationId
    if (selectedId) {
      await get().selectConversation(selectedId)
    }
  },

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
    const currentId = get().selectedConversationId
    const { messages } = get()

    if (currentId === id && messages.length > 0) return

    // 切換前停止輪詢
    get().stopPolling()

    // 清除未讀數量
    get().clearUnreadCount()

    // ✅ 重置新對話的 reveal 計數（讓輪詢從頭開始）
    const { resetRevealCount } = await import('@/apis/conversation')
    resetRevealCount(id)

    const loadPromise = get().loadMessages(id)
    set({ selectedConversationId: id })
    await loadPromise

    // 為新對話開始輪詢
    get().startPolling()
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
