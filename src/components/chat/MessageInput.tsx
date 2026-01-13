'use client'

import { useState, useRef, useEffect } from 'react'
import { Send, AlertCircle, ImagePlus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Image from 'next/image'

interface MessageInputProps {
  onSendMessage: (content: string, type?: 'text' | 'image') => Promise<void>
  isSending?: boolean
  error?: string
  onClearError?: () => void
}

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp']

export function MessageInput({ onSendMessage, isSending = false, error, onClearError }: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 清理 blob URL
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 驗證檔案類型
    if (!ALLOWED_TYPES.includes(file.type)) {
      onClearError?.()
      console.error('圖片格式僅支援 PNG/JPG/WEBP')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // 驗證檔案大小
    if (file.size > MAX_FILE_SIZE) {
      onClearError?.()
      console.error('圖片大小不可超過 5MB')
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      return
    }

    // 清理舊的 URL
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }

    // 建立新的預覽 URL
    const url = URL.createObjectURL(file)
    setSelectedImage(file)
    setPreviewUrl(url)

    // 清空 input 以允許選擇相同檔案
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleRemoveImage = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedImage(null)
    setPreviewUrl('')
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const handleSend = async () => {
    if (!message.trim() && !selectedImage) return

    try {
      // 先發送文字訊息（如果有）
      if (message.trim()) {
        await onSendMessage(message.trim(), 'text')
      }

      // 再發送圖片訊息（如果有）
      if (selectedImage && previewUrl) {
        await onSendMessage(previewUrl, 'image')
      }

      // 清空狀態
      setMessage('')
      handleRemoveImage()
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
    <div className="border-t border-border bg-background">
      {/* 錯誤提示 */}
      {error && (
        <div className="px-6 pt-4 pb-2">
          <div className="flex items-center gap-2 rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
            <button
              onClick={onClearError}
              className="ml-auto text-xs font-semibold hover:underline"
            >
              清除
            </button>
          </div>
        </div>
      )}

      <div className="px-6 pb-4 pt-2">
        <div className="flex gap-2">
          {/* 檔案選擇器 */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />

          <div className="flex-1 flex flex-col gap-1">
            {/* 上方工具列 - 上傳按鈕 + 預覽標籤 */}
            <div className="flex items-center gap-1 min-h-[35px]">
              <button
                type="button"
                onClick={handleUploadClick}
                disabled={isSending}
                className="p-1 hover:bg-secondary/80 rounded-md transition-colors text-muted-foreground hover:text-foreground cursor-pointer"
                aria-label="上傳圖片"
                title="上傳圖片"
              >
                <ImagePlus className="h-5 w-5" />
              </button>

              {/* 圖片預覽標籤 */}
              {selectedImage && previewUrl && (
                <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-secondary/80 text-secondary-foreground">
                  <div className="relative w-5 h-5 rounded-sm overflow-hidden shrink-0">
                    <Image
                      src={previewUrl}
                      alt="待發送的圖片預覽"
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span className="text-xs truncate max-w-[120px]">
                    {selectedImage.name}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="hover:bg-secondary rounded-sm p-0.5 transition-colors"
                    aria-label="移除圖片"
                    title="移除圖片"
                  >
                    <X className="h-3 w-3 cursor-pointer" />
                  </button>
                </div>
              )}
            </div>

            {/* 文字輸入框 */}
            <textarea
              placeholder="輸入訊息...（Shift+Enter 換行，Enter 發送）"
              value={message}
              onChange={handleChange}
              onKeyDown={handleKeyDown}
              disabled={isSending}
              className="w-full resize-none overflow-y-auto rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              rows={1}
              style={{ minHeight: '2rem', maxHeight: '6.5rem' }}
            />
          </div>

          {/* 發送按鈕 */}
          <Button
            onClick={handleSend}
            disabled={(!message.trim() && !selectedImage) || isSending}
            size="icon"
            className="self-end shrink-0"
          >
            {isSending ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
