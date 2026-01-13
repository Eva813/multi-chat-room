'use client'

import React from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MessageInteractive } from './MessageInteractive'
import { MessageImage } from './MessageImage'

interface MessageBubbleProps {
  content: string
  timestamp: string
  isOwn?: boolean
  sender?: string
  avatar?: string
  showAvatar?: boolean
  messageType?: 'text' | 'image' | 'system'
  reactions?: {
    like: number
    love: number
    laugh: number
  }
  messageId?: string
  imagePriority?: boolean
}

export const MessageBubble = React.memo(function MessageBubble({
  content,
  timestamp,
  isOwn = false,
  sender,
  avatar,
  showAvatar = true,
  messageType = 'text',
  reactions,
  messageId,
  imagePriority = false,
}: MessageBubbleProps) {

  if (messageType === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-2 bg-message-system text-message-system-foreground rounded-full text-sm italic">
          {content}
        </div>
      </div>
    )
  }

  // 一般訊息（text 或 image）
  return (
    <div
      className={cn(
        'mb-6 flex items-start gap-2 group',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar ? (
        <Avatar className="h-8 w-8 mt-0.5">
          <AvatarImage
            src={avatar}
            alt={`${sender}的大頭貼`}
          />
          <AvatarFallback>{sender?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      ) : (
        // 留位置避免版面跳動
        <div className="h-8 w-8" aria-hidden="true" />
      )}

      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {/* 顯示發送者和時間 */}
        {showAvatar && sender && (
          <div className={cn(
            'mb-1 flex items-baseline gap-2 whitespace-nowrap',
            isOwn ? 'flex-row-reverse' : 'flex-row'
          )}>
            {!isOwn && (
              <span className="text-xs text-muted-foreground">
                {sender}
              </span>
            )}
            <span className="text-xs text-muted-foreground/60">
              {timestamp}
            </span>
          </div>
        )}

        <MessageInteractive
          messageId={messageId}
          initialReactions={reactions}
          isOwn={isOwn}
        >
          <div
            className={cn(
              'max-w-md rounded-2xl',
              messageType === 'image'
                ? 'p-1'
                : [
                  'px-4 py-2.5',
                  isOwn
                    ? 'bg-message-own text-message-own-foreground'
                    : 'bg-message-other text-message-other-foreground'
                ]
            )}
          >
            {messageType === 'image' ? (
              <MessageImage
                src={content}
                alt={`${sender || '使用者'}分享的圖片`}
                priority={imagePriority}
              />
            ) : (
              <p className="text-sm">{content}</p>
            )}
          </div>
        </MessageInteractive>
      </div>
    </div>
  )
})
