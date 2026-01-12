'use client'

import { MessageList } from './MessageList'
import { MessageInput } from './MessageInput'
import { Message } from '@/lib/types'
import { Skeleton } from '@/components/ui/skeleton'

interface ChatWindowProps {
  conversationName: string
  messages: Message[]
  currentUserId: number
  onSendMessage: (message: string) => Promise<void>
  isLoading?: boolean
  isSwitchingConversation?: boolean
  isSending?: boolean
  sendError?: string
  onClearSendError?: () => void
}

function MessageListSkeleton() {
  return (
    <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-6 py-4 space-y-6">
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-64 rounded-lg" />
        </div>
      </div>
      <div className="flex items-start gap-3">
        <Skeleton className="h-8 w-8 rounded-full" />
        <div className="space-y-1">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-20 w-72 rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function ChatWindow({
  conversationName,
  messages,
  currentUserId,
  onSendMessage,
  isLoading = false,
  isSwitchingConversation = false,
  isSending = false,
  sendError,
  onClearSendError,
}: ChatWindowProps) {
  return (
    <div className="flex h-full flex-col">
      <header className="border-b border-border px-6 py-4 bg-background">
        <h1 className="flex items-center h-9 text-xl font-bold">
          {conversationName}
        </h1>
      </header>

      {(isLoading || isSwitchingConversation) ? (
        <MessageListSkeleton />
      ) : (
        <div className="flex-1 min-h-0 flex flex-col transition-opacity duration-200">
          <MessageList
            messages={messages}
            currentUserId={currentUserId}
          />
        </div>
      )}

      <MessageInput
        onSendMessage={onSendMessage}
        isSending={isSending}
        error={sendError}
        onClearError={onClearSendError}
      />
    </div>
  )
}
