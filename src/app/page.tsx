'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { ChatLayout } from '@/components/layout/ChatLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Skeleton } from '@/components/ui/skeleton'
import { Conversation, Message } from '@/lib/types'
import { getConversations, getMessages, createMessage } from '@/apis/conversation'

// 當前用戶（獨立於 chatData.json 中的用戶）
const CURRENT_USER = {
  userId: 6,
  user: 'Me',
  avatar: 'https://i.pravatar.cc/150?img=6'
}

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedConversationId, setSelectedConversationId] = useState<number>(1)
  const [currentUserId] = useState<number>(CURRENT_USER.userId)
  const [loading, setLoading] = useState(true)
  const [isMessagesLoading, setIsMessagesLoading] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [sendError, setSendError] = useState<string | undefined>()

  // 載入對話列表
  useEffect(() => {
    const loadConversations = async () => {
      try {
        setLoading(true)
        const data = await getConversations()
        setConversations(data)
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    loadConversations()
  }, [])

  // 當選擇對話時，載入訊息
  useEffect(() => {
    if (!selectedConversationId) return

    const loadMessages = async () => {
      try {
        setIsMessagesLoading(true)
        const data = await getMessages(selectedConversationId)
        setMessages(data)
      } catch (error) {
        console.error('❌ 載入訊息失敗:', error)
      } finally {
        setIsMessagesLoading(false)
      }
    }

    loadMessages()
  }, [selectedConversationId])

  const handleSelectConversation = useCallback((conversationId: number) => {
    setSelectedConversationId(conversationId)
  }, [])

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return

      setSendError(undefined)
      setIsSending(true)

      try {
        // 使用 API 建立新訊息
        const newMessage = await createMessage(selectedConversationId, {
          userId: CURRENT_USER.userId,
          message: content,
          messageType: 'text',
          user: CURRENT_USER.user,
          avatar: CURRENT_USER.avatar,
        })

        console.log('成功傳送訊息:', newMessage)

        // 更新本地訊息列表
        setMessages((prevMessages) => [...prevMessages, newMessage])

        // 更新對話的最後訊息和時間戳記
        setConversations((prevConversations) =>
          prevConversations.map((conv) =>
            conv.id === selectedConversationId
              ? {
                ...conv,
                lastMessage: content,
                timestamp: newMessage.timestamp,
              }
              : conv
          )
        )
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '傳送訊息失敗，請稍後重試'
        console.error('❌ 傳送訊息失敗:', error)
        setSendError(errorMessage)
      } finally {
        setIsSending(false)
      }
    },
    [selectedConversationId]
  )

  // 預先過濾當前對話的訊息
  const conversationMessages = useMemo(
    () => messages.filter((m) => m.conversationId === selectedConversationId),
    [messages, selectedConversationId]
  )

  // 預先計算當前對話名稱
  const conversationName = useMemo(() => {
    const conversation = conversations.find((c) => c.id === selectedConversationId)
    if (!conversation) return 'Chat Room'

    const otherParticipants = conversation.participants.filter(
      (p) => p.userId !== currentUserId
    )
    return otherParticipants.map((p) => p.user).join(', ') || 'Chat Room'
  }, [selectedConversationId, conversations, currentUserId])

  if (loading && conversations.length === 0) {
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
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
        isLoading={isMessagesLoading}
        isSending={isSending}
        sendError={sendError}
        onClearSendError={() => setSendError(undefined)}
      />
    </ChatLayout>
  )
}
