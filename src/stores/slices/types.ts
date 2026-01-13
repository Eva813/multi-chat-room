/**
 * Slice 類型定義
 * 
 * 每個 Slice 定義獨立的狀態和 Actions
 * 使用 StateCreator 確保跨 Slice 類型安全
 */

import type { StateCreator } from 'zustand'
import type {
  Conversation,
  Message,
  MessageId,
  MessageReactions,
  ReactionType,
  PendingOperation,
} from '../types'

// 重新導出用於 slice 中使用
export type {
  Conversation,
  Message,
  MessageId,
  MessageReactions,
  ReactionType,
  PendingOperation,
}

/**
 * ConversationSlice - 對話列表管理
 */
export interface ConversationSlice {
  // State
  conversations: Conversation[]
  selectedConversationId: number
  isLoading: boolean
  isInitialized: boolean

  // Actions
  initialize: () => Promise<void>
  loadConversations: () => Promise<void>
  selectConversation: (id: number) => Promise<void>
  updateConversationTimestamp: (id: number, lastMessage: string, timestamp: number) => void
}

export interface MessageSlice {
  // State - 訊息相關
  messages: Message[]
  persistedMessages: Message[]
  isMessagesLoading: boolean
  isSwitchingConversation: boolean
  isSending: boolean
  sendError?: string

  // State - Reaction 相關
  reactions: Record<string, MessageReactions>
  pendingReactions: Record<string, PendingOperation>
  reactionErrors: Record<string, string>
  reactionTimeouts: Record<string, NodeJS.Timeout>

  // Actions - 訊息相關
  loadMessages: (conversationId: number) => Promise<void>
  sendMessage: (content: string, messageType?: 'text' | 'image') => Promise<void>
  clearSendError: () => void

  // Actions - Reaction 相關
  toggleReaction: (messageId: MessageId, type: ReactionType) => Promise<void>
  clearReactionError: (messageId: MessageId) => void
}

export type StoreState = ConversationSlice & MessageSlice

export type SliceCreator<T> = StateCreator<StoreState, [], [], T>
