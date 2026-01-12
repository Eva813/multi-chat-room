export type MessageId = `${number}-${number}`

export interface Participant {
  userId: number
  user: string
  avatar: string
}

export const REACTION_TYPES = ['like', 'love', 'laugh'] as const
export type ReactionType = (typeof REACTION_TYPES)[number]

export interface MessageReactions {
  like: number
  love: number
  laugh: number
}

export interface Conversation {
  id: number
  participants: Participant[]
  lastMessage: string
  timestamp: number
}

export interface Message {
  conversationId: number
  userId: number
  user: string
  avatar: string
  messageType: 'text' | 'image' | 'system'
  message: string
  reactions: MessageReactions
  timestamp: number
}

export interface ChatData {
  conversations: Conversation[]
  messages: Message[]
}
