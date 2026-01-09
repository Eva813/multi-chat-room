'use client'

import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { Message } from '@/lib/types'

interface MessageListProps {
  messages: Message[]
  conversationId: number
  currentUserId: number
}

export function MessageList({
  messages,
  conversationId,
  currentUserId,
}: MessageListProps) {
  // 過濾指定對話的訊息
  const conversationMessages = messages.filter(
    (m) => m.conversationId === conversationId
  )

  return (
    <ScrollArea className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4 space-y-1">
        {conversationMessages.map((message, index) => {
          const isOwn = message.userId === currentUserId
          const showAvatar =
            index === 0 ||
            conversationMessages[index - 1].userId !== message.userId

          return (
            <MessageBubble
              key={`${message.conversationId}-${message.timestamp}`}
              messageId={`${message.conversationId}-${message.timestamp}`}
              content={message.message}
              timestamp={new Date(message.timestamp).toLocaleTimeString(
                'zh-TW',
                { hour: '2-digit', minute: '2-digit' }
              )}
              isOwn={isOwn}
              sender={message.user}
              avatar={message.avatar}
              showAvatar={showAvatar}
              messageType={message.messageType}
              reactions={message.reactions}
            />
          )
        })}
      </div>
    </ScrollArea>
  )
}
