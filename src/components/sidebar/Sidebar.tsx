'use client'

import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { Conversation } from '@/lib/types'

interface SidebarProps {
  conversations: Conversation[]
  selectedConversationId: number
  onSelectConversation: (conversationId: number) => void
}

export function Sidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
}: SidebarProps) {
  return (
    <div className="flex h-full w-full flex-col bg-secondary">
      <div className="border-b border-border px-6 py-4 bg-secondary">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <SearchBar />
          </div>
          <ThemeToggle />
        </div>
      </div>

      <ConversationList
        conversations={conversations}
        selectedConversationId={selectedConversationId}
        onSelectConversation={onSelectConversation}
      />
    </div>
  )
}
