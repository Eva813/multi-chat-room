'use client'

import { useState, ReactNode } from 'react'
import { cn } from '@/lib/utils'

const REACTION_TYPES = ['like', 'love', 'laugh'] as const
type ReactionType = typeof REACTION_TYPES[number]

interface MessageInteractiveProps {
  children: ReactNode
  messageId?: string
  reactions?: Record<ReactionType, number>
  isOwn?: boolean
}

export function MessageInteractive({
  children,
  messageId,
  reactions,
  isOwn = false
}: MessageInteractiveProps) {
  const [currentReactions, setCurrentReactions] = useState(
    reactions || { like: 0, love: 0, laugh: 0 }
  )

  // 處理 reaction 點擊 - 更新記憶體狀態
  const handleReaction = (type: ReactionType) => {
    if (!messageId) return

    setCurrentReactions({
      ...currentReactions,
      [type]: currentReactions[type] + 1,
    })
  }

  const reactionEmojis: Record<ReactionType, string> = {
    like: '👍',
    love: '❤️',
    laugh: '😂',
  }

  const hasReactions = REACTION_TYPES.some(type => currentReactions[type] > 0)

  return (
    <>
      <div className="relative group/message">
        {children}

        {messageId && (
          <div className={cn(
            'absolute top-1/2 -translate-y-1/2 flex gap-1 bg-white dark:bg-gray-800 rounded-full px-2 py-1 shadow-md border border-gray-200 dark:border-gray-700 z-10',
            'opacity-0 group-hover/message:opacity-100 hover:opacity-100 transition-opacity',
            isOwn
              ? '-left-2 -translate-x-full' // 自己的訊息，按鈕在左側
              : '-right-2 translate-x-full'  // 他人的訊息，按鈕在右側
          )}>
            {REACTION_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => handleReaction(type)}
                className="text-lg hover:scale-125 transition-transform cursor-pointer"
                title={type}
                aria-label={`React with ${type}`}
              >
                {reactionEmojis[type]}
              </button>
            ))}
          </div>
        )}
      </div>

      {hasReactions && (
        <div className={cn(
          'flex gap-2 mt-1 text-sm',
          isOwn ? 'justify-end' : 'justify-start'
        )}>
          {REACTION_TYPES.map((type) =>
            currentReactions[type] > 0 ? (
              <span key={type} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full text-xs">
                {reactionEmojis[type]} {currentReactions[type]}
              </span>
            ) : null
          )}
        </div>
      )}
    </>
  )
}
