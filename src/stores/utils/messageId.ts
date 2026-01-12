/**
 * 統一的 MessageId 生成與驗證工具
 * 
 * MessageId 格式: `${conversationId}-${timestamp}`
 * 範例: "1-1736697600000"
 */

import type { MessageId } from '@/lib/types'
export type { MessageId }

/**
 * 生成標準格式的 messageId
 */
export function generateMessageId(conversationId: number, timestamp: number): MessageId {
  return `${conversationId}-${timestamp}`
}

/**
 * 從 messageId 解析出 conversationId 和 timestamp
 */
export function parseMessageId(messageId: string): { conversationId: number; timestamp: number } | null {
  const parts = messageId.split('-')
  if (parts.length !== 2) return null

  const conversationId = parseInt(parts[0], 10)
  const timestamp = parseInt(parts[1], 10)

  if (isNaN(conversationId) || isNaN(timestamp)) return null

  return { conversationId, timestamp }
}

/**
 * 驗證 messageId 格式是否正確
 */
export function isValidMessageId(messageId: string): messageId is MessageId {
  return parseMessageId(messageId) !== null
}
