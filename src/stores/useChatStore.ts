/**
 * 統一的聊天應用 Store
 * 
 * - ConversationSlice: 對話列表管理
 * - MessageSlice: 訊息與 Reactions 管理
 * - Reactions 與 Messages 在同一 slice 中管理，確保同步更新
 */

'use client'

import { create } from 'zustand'
import { devtools, persist, createJSONStorage } from 'zustand/middleware'
import type { StoreState } from './slices/types'
import { createConversationSlice } from './slices/createConversationSlice'
import { createMessageSlice } from './slices/createMessageSlice'

export const useChatStore = create<StoreState>()(
  devtools(
    persist(
      (set, get, store) => ({
        ...createConversationSlice(set, get, store),
        ...createMessageSlice(set, get, store),
      }),
      {
        name: 'meep-chat-storage',
        version: 2, // ✅ 從 1 改為 2，清理舊的髒資料

        // 只持久化必要的資料
        partialize: (state) => ({
          persistedMessages: state.persistedMessages,
          reactions: state.reactions,
        }),

        storage: createJSONStorage(() => localStorage),
      }
    ),
    {
      name: 'ChatStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)

export type { MessageId, ReactionType, MessageReactions } from './types'
export { REACTION_TYPES } from './types'

/**
 * 清除所有資料（開發用）
 * 用於清除 localStorage 和重新載入頁面
 */
export const clearAllData = () => {
  console.log('[clearAllData] 開始清除...')

  // 1. 停止 polling
  useChatStore.getState().stopPolling()
  console.log('[clearAllData] polling 已停止')

  // 2. 先設定 state 為空
  useChatStore.setState({
    persistedMessages: [],
    reactions: {}
  })
  console.log('[clearAllData] state 已清空')

  // 3. 清除 localStorage
  localStorage.removeItem('meep-chat-storage')
  console.log('[clearAllData] localStorage 已移除')

  // 4. 確認清除
  console.log('[clearAllData] 確認 localStorage:', localStorage.getItem('meep-chat-storage'))

  // 5. 重新載入頁面
  setTimeout(() => {
    console.log('[clearAllData] 準備重新載入...')
    window.location.reload()
  }, 100)
}