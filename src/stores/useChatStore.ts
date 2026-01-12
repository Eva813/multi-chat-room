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
        version: 1,

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