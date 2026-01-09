export interface Participant {
  userId: number
  user: string
  avatar: string
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
  reactions: {
    like: number
    love: number
    laugh: number
  }
  timestamp: number
}

export interface ChatData {
  conversations: Conversation[]
  messages: Message[]
}
