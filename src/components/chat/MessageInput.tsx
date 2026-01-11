'use client'

import { useState } from 'react'
import { Send, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface MessageInputProps {
  onSendMessage: (message: string) => Promise<void>
  isSending?: boolean
  error?: string
  onClearError?: () => void
}

export function MessageInput({ onSendMessage, isSending = false, error, onClearError }: MessageInputProps) {
  const [message, setMessage] = useState('')

  const handleSend = async () => {
    if (!message.trim()) return

    try {
      await onSendMessage(message)
      setMessage('')
      onClearError?.()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value)
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    if (e.shiftKey) return

    e.preventDefault()
    handleSend()
  }

  return (
    <div className="border-t border-border px-6 py-4 bg-background">
      {error && (
        <div className="mb-3 flex items-center gap-2 rounded-md bg-red-50 dark:bg-red-950 p-3 text-sm text-red-700 dark:text-red-200">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
          <button
            onClick={onClearError}
            className="ml-auto text-xs font-semibold hover:underline"
          >
            清除
          </button>
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          placeholder="輸入訊息...（Shift+Enter 換行，Enter 發送）"
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1 resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
          rows={1}
          style={{ minHeight: '2rem', maxHeight: '6.5rem' }}
        />
        <Button
          onClick={handleSend}
          disabled={!message.trim() || isSending}
          size="icon"
          className="self-end"
        >
          {isSending ? (
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
