'use client'

import { useState, useCallback, useMemo, memo } from 'react'
import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Conversation } from '@/lib/types'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversationId: number
  onSelectConversation: (conversationId: number) => void
}

export const Sidebar = memo(function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
  }, [])

  const handleSearchClear = useCallback(() => {
    setSearchQuery('')
  }, [])

  const filteredConversations = useMemo(() => {
    if (!searchQuery.trim()) {
      return conversations
    }

    const query = searchQuery.toLowerCase().trim()
    // 將查詢字串拆分為多個關鍵字
    const searchTerms = query.split(/\s+/)

    return conversations.filter((conversation) => {
      const participantNames = conversation.participants
        .map((p) => p.user.toLowerCase())
        .join(' ')

      const lastMessage = conversation.lastMessage.toLowerCase()
      // 將參與者名稱和最後訊息合併為一個可搜尋的字串
      const searchableText = `${participantNames} ${lastMessage}`

      return searchTerms.some((term) => searchableText.includes(term))
    })
  }, [conversations, searchQuery])

  return (
    <div className="flex h-full w-full flex-col bg-secondary">
      <div className="border-b border-border px-6 py-4 bg-secondary">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar
              value={searchQuery}
              onChange={handleSearchChange}
              onClear={handleSearchClear}
            />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <ConversationList
        conversations={filteredConversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={onSelectConversation}
      />
    </div>
  )
})
