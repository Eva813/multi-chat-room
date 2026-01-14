'use client'

import { memo } from 'react'
import { SearchBar } from './SearchBar'
import { ConversationList } from './ConversationList'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import { clearAllData } from '@/stores/useChatStore'
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

      {/* 清除資料按鈕（只在開發環境顯示） */}
      {process.env.NODE_ENV === 'development' && (
        <div className="p-4 border-t border-border">
          <button
            onClick={clearAllData}
            className="w-full px-4 py-2 text-sm font-medium text-red-600 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900 transition-colors"
          >
            🗑️ 清除測試的新增資料
          </button>
        </div>
      )}
    </div>
  )
})
