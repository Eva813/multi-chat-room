import Image from 'next/image'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { MessageInteractive } from './MessageInteractive'

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
}

export function MessageBubble({
  content,
  timestamp,
  isOwn = false,
  sender,
  avatar,
  showAvatar = true,
  messageType = 'text',
  reactions,
  messageId,
}: MessageBubbleProps) {
  // System message
  if (messageType === 'system') {
    return (
      <div className="flex justify-center my-2">
        <div className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-full text-sm text-gray-600 dark:text-gray-400 italic">
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
          <AvatarImage src={avatar} alt={sender} />
          <AvatarFallback>{sender?.[0] || 'U'}</AvatarFallback>
        </Avatar>
      ) : (
        <div className="h-8 w-8" />
      )}

      <div className={cn('flex flex-col', isOwn ? 'items-end' : 'items-start')}>
        {showAvatar && !isOwn && sender && (
          <div className="mb-1 flex items-baseline gap-2 whitespace-nowrap">
            <span className="text-xs text-muted-foreground">
              {sender}
            </span>
            <span className="text-xs text-muted-foreground/60">
              {timestamp}
            </span>
          </div>
        )}

        <MessageInteractive
          messageId={messageId}
          reactions={reactions}
          isOwn={isOwn}
        >
          <div
            className={cn(
              'max-w-md rounded-2xl',
              messageType === 'image' ? 'p-1' : 'px-4 py-2.5',
              isOwn
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100'
            )}
          >
            {messageType === 'image' ? (
              <div className="relative max-w-xs">
                <Image
                  src={content}
                  alt="Message image"
                  width={384}
                  height={384}
                  className="rounded-lg object-cover"
                  unoptimized={content.startsWith('blob:') || content.startsWith('data:')}
                />
              </div>
            ) : (
              <p className="text-sm">{content}</p>
            )}
          </div>
        </MessageInteractive>
      </div>
    </div>
  )
}
