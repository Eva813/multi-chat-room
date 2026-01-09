'use client'

import { useState } from 'react'
import { ChatLayout } from '@/components/layout/ChatLayout'
import { Sidebar } from '@/components/sidebar/Sidebar'
import { ChatWindow } from '@/components/chat/ChatWindow'
import { Conversation, Message, ChatData } from '@/lib/types'
import chatDataFile from '@/lib/chatData.json'

// 當前用戶（獨立於 chatData.json 中的用戶）
const CURRENT_USER = {
  userId: 6,
  user: 'Me',
  avatar: 'https://i.pravatar.cc/150?img=6'
}

const chatData = chatDataFile as ChatData

export default function Home() {
  const [conversations, setConversations] = useState<Conversation[]>(chatData.conversations)
  const [messages, setMessages] = useState<Message[]>(chatData.messages)
  const [selectedConversationId, setSelectedConversationId] = useState<number>(1)
  const [currentUserId] = useState<number>(CURRENT_USER.userId)

  const handleSelectConversation = (conversationId: number) => {
    setSelectedConversationId(conversationId)
  }

  const handleSendMessage = (content: string) => {
    if (!content.trim()) return

    const newMessage: Message = {
      conversationId: selectedConversationId,
      userId: CURRENT_USER.userId,
      user: CURRENT_USER.user,
      avatar: CURRENT_USER.avatar,
      messageType: 'text',
      message: content,
      reactions: {
        like: 0,
        love: 0,
        laugh: 0,
      },
      timestamp: Date.now(),
    }

    setMessages([...messages, newMessage])

    // 更新對話的最後訊息和時間戳記
    setConversations(
      conversations.map((conv) =>
        conv.id === selectedConversationId
          ? {
            ...conv,
            lastMessage: content,
            timestamp: Date.now(),
          }
          : conv
      )
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
