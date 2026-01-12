'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useChatStore, REACTION_TYPES, type ReactionType, type MessageId } from '@/stores/useChatStore'

interface MessageInteractiveProps {
  children: ReactNode
  messageId?: string
  initialReactions?: Record<ReactionType, number>
  isOwn?: boolean
}

export function MessageInteractive({
  children,
  messageId,
  initialReactions,
  isOwn = false
}: MessageInteractiveProps) {
  // 從 ChatStore 獲取 reaction 狀態
  const reactions = useChatStore((state) =>
    messageId ? state.reactions[messageId] : null
  )
  const toggleReaction = useChatStore((state) => state.toggleReaction)
  const isPending = useChatStore((state) =>
    messageId ? !!state.pendingReactions[messageId] : false
  )
  const error = useChatStore((state) =>
    messageId ? state.reactionErrors[messageId] : null
  )

  // 優先使用 store 中的值，否則使用初始值
  const displayReactions = reactions || initialReactions || { like: 0, love: 0, laugh: 0 }

  const handleReaction = async (type: ReactionType) => {
    if (!messageId || isPending) return
    await toggleReaction(messageId as MessageId, type)
  }

  const reactionEmojis: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
  }

  const hasReactions = REACTION_TYPES.some(type => displayReactions[type] > 0)

  return (
    <>
      <div className="relative group/message">
        {children}

        {messageId && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 flex gap-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md border border-gray-200 dark:border-gray-700 z-10',
            'opacity-0 group-hover/message:opacity-100 hover:opacity-100 transition-opacity',
            isPending && 'opacity-50 cursor-wait',
            isOwn
              ? '-left-2 -translate-x-full' // 自己的訊息，按鈕在左側
              : '-right-2 translate-x-full'  // 他人的訊息，按鈕在右側
          )}>
            {REACTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                disabled={isPending}
                className={cn(
                  'text-lg hover:scale-125 transition-transform',
                  isPending ? 'cursor-wait' : 'cursor-pointer'
                )}
                title={type}
                aria-label={`React with ${type}`}
              >
                {reactionEmojis[type]}
              </button>
            ))}
          </div>
        )}

        {/* 錯誤提示 */}
        {error && (
          <div className="absolute -bottom-6 left-0 right-0 text-xs text-red-500 text-center">
            {error}
          </div>
        )}
      </div>

      {hasReactions && (
        <div className={cn(
          'flex gap-2 mt-1 text-sm',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          {REACTION_TYPES.map((type) =>
            displayReactions[type] > 0 ? (
              <span
                key={type}
                className={cn(
                  'bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs',
                  isPending && 'opacity-50'
                )}
              >
                {reactionEmojis[type]} {displayReactions[type]}
              </span>
            ) : null
          )}
        </div>
      )}
    </>
  )
}
