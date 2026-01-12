'use client'

import { useMemo } from 'react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ConversationItem } from './ConversationItem'
import { Conversation } from '@/lib/types'

interface ConversationListProps {
  conversations: Conversation[]
  selectedConversationId: number
  onSelectConversation: (conversationId: number) => void
}

export function ConversationList({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: ConversationListProps) {
  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.timestamp - a.timestamp),
    [conversations]
  )

  return (
    <ScrollArea className="flex-1 min-h-0">
      <div className="space-y-1 p-2">
        {sortedConversations.map((conversation) => {
          // 對話名稱：其他參與者的名稱
          const conversationName = conversation.participants
            .map((p) => p.user)
            .join(', ')

          return (
            <ConversationItem
              key={conversation.id}
              name={conversationName}
              lastMessage={conversation.lastMessage}
              timestamp={new Date(conversation.timestamp).toLocaleTimeString(
                'zh-TW',
                { hour: '2-digit', minute: '2-digit' }
              )}
              avatars={conversation.participants.map((p) => p.avatar)}
              names={conversation.participants.map((p) => p.user)}
              isActive={conversation.id === selectedConversationId}
              onClick={() => onSelectConversation(conversation.id)}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}
