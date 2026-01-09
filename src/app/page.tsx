'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChatLayout } from '@/components/layout/ChatLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
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
        const data = await getMessages(selectedConversationId)
        setMessages(data)
      } catch (error) {
        console.error('❌ 載入訊息失敗:', error)
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

      try {
        // 使用 API 建立新訊息
        const newMessage = await createMessage(selectedConversationId, {
          userId: CURRENT_USER.userId,
          message: content,
          messageType: 'text',
          user: CURRENT_USER.user,
          avatar: CURRENT_USER.avatar,
        })

        console.log('✅ 成功傳送訊息:', newMessage)

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
        console.error('❌ 傳送訊息失敗:', error)
      }
    },
    [selectedConversationId]
  )


  if (loading && conversations.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="text-lg font-medium">載入中...</div>
          <div className="text-sm text-gray-500 mt-2">正在取得對話列表</div>
        </div>
      </div>
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
        selectedConversationId={selectedConversationId}
        conversations={conversations}
        messages={messages}
        currentUserId={currentUserId}
        onSendMessage={handleSendMessage}
      />
    </ChatLayout>
  )
}
