'use client'

import { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { ArrowDown } from 'lucide-react'
import { ScrollArea } from '@/components/ui/scroll-area'
import { MessageBubble } from './MessageBubble'
import { Message } from '@/lib/types'

const SCROLL_THRESHOLD = 100

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
  const scrollViewportRef = useRef<HTMLDivElement>(null)
  const scrollRAFRef = useRef<number | null>(null)
  const [isNearBottom, setIsNearBottom] = useState(true)
  const [showScrollButton, setShowScrollButton] = useState(false)

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

  const scrollToBottom = useCallback((smooth = false) => {
    if (!scrollViewportRef.current) return

    scrollViewportRef.current.scrollTo({
      top: scrollViewportRef.current.scrollHeight,
      behavior: smooth ? 'smooth' : 'auto'
    })
  }, [])

  const handleScrollToBottomClick = useCallback(() => {
    scrollToBottom(true)
  }, [scrollToBottom])

  // 處理滾動事件
  useEffect(() => {
    const viewport = scrollViewportRef.current
    if (!viewport) return

    const handleScroll = () => {
      if (scrollRAFRef.current !== null) return

      scrollRAFRef.current = requestAnimationFrame(() => {
        if (!viewport) return

        const { scrollTop, scrollHeight, clientHeight } = viewport
        const distanceFromBottom = scrollHeight - scrollTop - clientHeight

        const isNear = distanceFromBottom < SCROLL_THRESHOLD
        setIsNearBottom(isNear)
        setShowScrollButton(!isNear)

        scrollRAFRef.current = null
      })
    }

    viewport.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      viewport.removeEventListener('scroll', handleScroll)
      // 清理未完成的 RAF
      if (scrollRAFRef.current !== null) {
        cancelAnimationFrame(scrollRAFRef.current)
        scrollRAFRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (isNearBottom && scrollViewportRef.current) {
      scrollToBottom(false)
    }
  }, [conversationMessages, isNearBottom, scrollToBottom])

  return (
    <div className="relative flex-1 min-h-0">
      <ScrollArea ref={scrollViewportRef} className="h-full bg-secondary">
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

      {/* Scroll to Bottom 按鈕 */}
      {showScrollButton && (
        <button
          type="button"
          onClick={handleScrollToBottomClick}
          className="absolute bottom-4 right-4 z-10
                     flex items-center justify-center
                     w-10 h-10 rounded-full
                     bg-card border-border
                     shadow-lg hover:shadow-xl
                     transition-all duration-200
                     hover:scale-110
                     focus:outline-none focus:ring-2 focus:ring-primary/50"
          aria-label="滾動到底部"
          title="滾動到底部"
        >
          <ArrowDown className="h-5 w-5 text-foreground" />
        </button>
      )}
    </div>
  )
}
