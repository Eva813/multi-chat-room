import {
  type Conversation,
  type Message,
  type MessageId,
  type MessageReactions,
  type ReactionType,
  REACTION_TYPES,
} from '@/lib/types'

/**
 * Pending 操作追蹤
 */
export interface PendingOperation {
  type: ReactionType
  previousValue: number
  timestamp: number
}

export { REACTION_TYPES }
export type {
  Conversation,
  Message,
  MessageId,
  MessageReactions,
  ReactionType,
}
