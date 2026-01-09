'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

interface ChatLayoutProps {
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function ChatLayout({ sidebar, children }: ChatLayoutProps) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden md:flex md:w-80 lg:w-96 border-r border-border">
        {sidebar}
      </aside>

      {/* 手機版抽屜側邊欄 */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent side="left" className="w-80 p-0">
          <div onClick={() => setIsMobileSidebarOpen(false)}>
            {sidebar}
          </div>
        </SheetContent>
      </Sheet>

      {/* 主要聊天區域 */}
      <main className="flex flex-1 flex-col overflow-hidden">
        {/* 手機版導覽列 */}
        <header className="flex items-center gap-3 border-b border-border px-4 py-3 md:hidden">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsMobileSidebarOpen(true)}
            className="h-9 w-9"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">Chat Room</h1>
        </header>

        {/* 聊天內容 */}
        {children}
      </main>
    </div>
  )
}
