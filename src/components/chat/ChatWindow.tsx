'use client'

import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Conversation, Message } from '@/lib/types'

interface ChatWindowProps {
  selectedConversationId: number
  conversations: Conversation[]
  messages: Message[]
  currentUserId: number
  onSendMessage: (message: string) => void
}

export function ChatWindow({
  selectedConversationId,
  conversations,
  messages,
  currentUserId,
  onSendMessage,
}: ChatWindowProps) {
  const selectedConversation = conversations.find(
    (conversation) => conversation.id === selectedConversationId
  )

  const conversationName = selectedConversation?.participants
    .map((participant) => participant.user)
    .join(', ')

  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-6 py-4 bg-background">
        <h1 className="flex items-center h-9 text-xl font-bold">
          {conversationName || 'Chat Room'}
        </h1>
      </header>

      <MessageList
        messages={messages}
        conversationId={selectedConversationId}
        currentUserId={currentUserId}
      />

      <MessageInput onSendMessage={onSendMessage} />
    </div>
  )
}
