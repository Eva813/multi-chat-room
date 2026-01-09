'use client'

import { useMemo } from 'react'
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
  const conversationMessages = useMemo(
    () => messages.filter((m) => m.conversationId === conversationId),
    [messages, conversationId]
  )

  // 預先整理訊息顯示所需的資料
  const messagesWithFormattedTime = useMemo(
    () =>
      conversationMessages.map((message, index) => ({
        ...message,
        formattedTime: new Date(message.timestamp).toLocaleTimeString('zh-TW', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        isOwn: message.userId === currentUserId,
        showAvatar:
          index === 0 ||
          conversationMessages[index - 1].userId !== message.userId,
      })),
    [conversationMessages, currentUserId]
  )

  return (
    <ScrollArea className="flex-1 min-h-0 bg-gray-50 dark:bg-gray-900">
      <div className="px-6 py-4 space-y-1">
        {messagesWithFormattedTime.map((message, index) => (
          <MessageBubble
            key={`${message.conversationId}-${message.timestamp}`}
            messageId={`${message.conversationId}-${message.timestamp}`}
            content={message.message}
            timestamp={message.formattedTime}
            isOwn={message.isOwn}
            sender={message.user}
            avatar={message.avatar}
            showAvatar={message.showAvatar}
            messageType={message.messageType}
            reactions={message.reactions}
            imagePriority={index < 8 && message.messageType === 'image'}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
