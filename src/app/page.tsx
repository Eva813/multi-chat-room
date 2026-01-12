'use client'

import { useEffect, useMemo, useCallback } from 'react'
import { ChatLayout } from '@/components/layout/ChatLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Skeleton } from '@/components/ui/skeleton'
import { useChatStore } from '@/stores/useChatStore'

// 當前用戶（獨立於 chatData.json 中的用戶）
const CURRENT_USER = {
  userId: 6,
  user: 'Me',
  avatar: 'https://i.pravatar.cc/150?img=6'
}

export default function Home() {
  const conversations = useChatStore((state) => state.conversations)
  const messages = useChatStore((state) => state.messages)
  const selectedConversationId = useChatStore((state) => state.selectedConversationId)

  // Loading 狀態
  const isLoading = useChatStore((state) => state.isLoading)
  const isMessagesLoading = useChatStore((state) => state.isMessagesLoading)
  const isSwitchingConversation = useChatStore((state) => state.isSwitchingConversation)
  const isSending = useChatStore((state) => state.isSending)
  const sendError = useChatStore((state) => state.sendError)

  // 取得 actions
  const initialize = useChatStore((state) => state.initialize)
  const selectConversation = useChatStore((state) => state.selectConversation)
  const sendMessage = useChatStore((state) => state.sendMessage)
  const clearSendError = useChatStore((state) => state.clearSendError)

  useEffect(() => {
    initialize()
  }, [initialize])

  const handleSelectConversation = useCallback((id: number) => {
    selectConversation(id)
  }, [selectConversation])

  // 當前對話的訊息
  const conversationMessages = useMemo(
    () => messages.filter((m) => m.conversationId === selectedConversationId),
    [messages, selectedConversationId]
  )

  // 預先計算當前對話名稱
  const conversationName = useMemo(() => {
    const conversation = conversations.find((c) => c.id === selectedConversationId)
    if (!conversation) return 'Chat Room'

    const otherParticipants = conversation.participants.filter(
      (p) => p.userId !== CURRENT_USER.userId
    )
    return otherParticipants.map((p) => p.user).join(', ') || 'Chat Room'
  }, [selectedConversationId, conversations])

  if (isLoading && conversations.length === 0) {
    return (
      <ChatLayout
        sidebar={
          <div className="flex h-full w-full flex-col bg-background">
            {/* Header Skeleton */}
            <div className="border-b border-border px-6 py-4">
              <Skeleton className="h-9 w-full" />
            </div>
            <div className="flex-1 overflow-hidden p-2 space-y-1">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 p-3">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        }
      >
        <div className="flex h-full flex-col">
          {/* Chat Header Skeleton */}
          <div className="border-b border-border px-6 py-4">
            <Skeleton className="h-9 w-48" />
          </div>

          {/* Message List Skeleton */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 px-6 py-4 space-y-6">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-10 w-64 rounded-lg" />
              </div>
            </div>
          </div>
        </div>
      </ChatLayout>
    )
  }

  return (
    <ChatLayout
      sidebar={
        <Sidebar
          conversations={conversations}
          selectedConversationId={selectedConversationId}
          onSelectConversation={handleSelectConversation}
        />
      }
    >
      <ChatWindow
        conversationName={conversationName}
        messages={conversationMessages}
        currentUserId={CURRENT_USER.userId}
        onSendMessage={sendMessage}
        isLoading={isMessagesLoading}
        isSwitchingConversation={isSwitchingConversation}
        isSending={isSending}
        sendError={sendError}
        onClearSendError={clearSendError}
      />
    </ChatLayout>
  )
}
