import type { Conversation, Message, ChatData } from '@/lib/types'
import chatData from '@/lib/chatData.json'

// 模擬網路延遲
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// 將 JSON 資料轉換為正確的類型
const typedChatData = chatData as ChatData

// 模擬儲存的訊息（只存在記憶體中）
let mockMessages: Message[] = [...typedChatData.messages]
let mockConversations: Conversation[] = [...typedChatData.conversations]

// 追蹤每個訊息的反應最後更新時間
let mockReactionUpdateLog: Record<string, number> = {}

// 追蹤每個對話已經 reveal 的訊息數量
let revealedMessageCount: Record<number, number> = {}

/**
 * 取得所有對話列表
 */
export async function getConversations(): Promise<Conversation[]> {
  try {
    // 模擬網路延遲
    await delay(300)

    return mockConversations
  } catch (error) {
    console.error('Error fetching conversations:', error)
    throw error
  }
}

/**
 * 取得指定對話的訊息
 * @param conversationId 對話 ID
 */
export async function getMessages(conversationId: number): Promise<Message[]> {
  try {
    // 模擬網路延遲
    await delay(300)

    const messages = mockMessages.filter(
      msg => msg.conversationId === conversationId
    )

    return messages
  } catch (error) {
    console.error('Error fetching messages:', error)
    throw error
  }
}

/**
 * 在對話中新增訊息
 * @param conversationId 對話 ID
 * @param message 訊息內容
 */
export async function createMessage(
  conversationId: number,
  message: {
    userId: number
    message: string
    messageType?: 'text' | 'image' | 'system'
    user?: string
    avatar?: string
  }
): Promise<Message> {
  try {
    await delay(300)

    // 檢查對話是否存在
    const conversation = mockConversations.find(
      conv => conv.id === conversationId
    )

    if (!conversation) {
      throw new Error('Conversation not found')
    }

    // 找到發送者資訊
    let participant = conversation.participants.find(
      participant => participant.userId === message.userId
    )

    // 如果用戶不在對話中，且有提供 user 和 avatar，則自動加入
    if (!participant) {
      if (message.user && message.avatar) {
        participant = {
          userId: message.userId,
          user: message.user,
          avatar: message.avatar
        }
        // 將新用戶加入對話參與者列表
        conversation.participants.push(participant)
        console.log('✨ 新用戶加入對話:', participant.user)
      } else {
        throw new Error('User not in conversation and no user info provided')
      }
    }

    // 建立新訊息
    const newMessage: Message = {
      conversationId,
      userId: message.userId,
      user: participant.user,
      avatar: participant.avatar,
      messageType: message.messageType || 'text',
      message: message.message,
      reactions: {
        like: 0,
        love: 0,
        laugh: 0
      },
      timestamp: Date.now()
    }

    // 儲存到記憶體中
    // mockMessages.push(newMessage)

    // 更新對話的最後訊息
    conversation.lastMessage = message.message
    conversation.timestamp = newMessage.timestamp

    return newMessage
  } catch (error) {
    console.error('Error creating message:', error)
    throw error
  }
}

/**
 * 更新訊息的 reaction
 * @param messageId 訊息 ID (格式: "conversationId-timestamp")
 * @param reactionType reaction 類型
 * @param newValue 新的計數值
 */
export async function updateReaction(
  messageId: string,
  reactionType: 'like' | 'love' | 'laugh',
  newValue: number
): Promise<{ like: number; love: number; laugh: number }> {
  try {
    // 模擬網路延遲
    await delay(300)

    // 解析 messageId
    const [conversationIdStr, timestampStr] = messageId.split('-')
    const conversationId = parseInt(conversationIdStr)
    const timestamp = parseInt(timestampStr)

    // 找到對應的訊息
    const messageIndex = mockMessages.findIndex(
      msg => msg.conversationId === conversationId && msg.timestamp === timestamp
    )

    if (messageIndex === -1) {
      throw new Error('Message not found')
    }

    // 模擬 10% 的錯誤率（用於測試回滾機制）
    if (Math.random() < 0.1) {
      throw new Error('Network error: Failed to update reaction')
    }

    // 更新 reaction
    mockMessages[messageIndex].reactions[reactionType] = newValue

    // 記錄更新時間戳
    mockReactionUpdateLog[messageId] = Date.now()

    return mockMessages[messageIndex].reactions
  } catch (error) {
    console.error('Error updating reaction:', error)
    throw error
  }
}

/**
 * 長輪詢：取得訊息和反應更新（延遲 reveal 模式）
 * @param conversationId 對話 ID
 * @param sinceTimestamp 上次輪詢的時間戳
 * @param timeout 長輪詢逾時（毫秒）
 */
export async function getMessagesUpdates(
  conversationId: number,
  sinceTimestamp: number,
  timeout: number = 25000
): Promise<{
  newMessages: Message[]
  updatedReactions: Record<string, { like: number; love: number; laugh: number }>
}> {
  const startTime = Date.now()
  const checkInterval = 3000 // 每 3 秒檢查一次

  // 初始化：記錄該對話已經 reveal 的訊息數量
  if (revealedMessageCount[conversationId] === undefined) {
    // 初次進入，設為 3（loadMessages 已載入前 3 則）
    revealedMessageCount[conversationId] = 3
    console.log(`[Polling] 初始化對話 ${conversationId}，已 reveal 數量: 3`)
  }

  // 長輪詢循環
  while (Date.now() - startTime < timeout) {
    // 取得該對話的所有訊息（從 chatData）
    const allConversationMessages = mockMessages
      .filter(msg => msg.conversationId === conversationId)
      .sort((a, b) => a.timestamp - b.timestamp)

    const currentRevealCount = revealedMessageCount[conversationId]
    const totalMessages = allConversationMessages.length

    console.log(`[Polling] 對話 ${conversationId} - 已 reveal: ${currentRevealCount}, 總訊息: ${totalMessages}, sinceTimestamp: ${sinceTimestamp}`)

    // 檢查是否還有未 reveal 的訊息
    if (currentRevealCount < totalMessages) {
      // 每次 reveal 1-2 則訊息
      const revealAmount = Math.min(
        Math.floor(Math.random() * 2) + 1,
        totalMessages - currentRevealCount
      )

      const toReveal = allConversationMessages.slice(
        currentRevealCount,
        currentRevealCount + revealAmount
      )

      // 更新已 reveal 數量
      revealedMessageCount[conversationId] += revealAmount

      console.log(`[Polling] Revealing ${revealAmount} messages for conversation ${conversationId}`)

      // 只返回 timestamp 大於 sinceTimestamp 的訊息
      const newMessages = toReveal.filter(msg => msg.timestamp > sinceTimestamp)

      console.log(`[Polling] 過濾後的新訊息數量: ${newMessages.length} (原始 reveal 數量: ${toReveal.length})`)

      if (newMessages.length > 0) {
        return {
          newMessages,
          updatedReactions: {}
        }
      } else {
        console.log(`[Polling] 所有 revealed 訊息都被 timestamp 過濾掉了，繼續等待...`)
      }
    }

    // 檢查反應更新（保留原邏輯）
    const updatedReactions: Record<string, { like: number; love: number; laugh: number }> = {}

    mockMessages
      .filter(msg => msg.conversationId === conversationId)
      .forEach(msg => {
        const messageId = `${msg.conversationId}-${msg.timestamp}`
        const lastUpdate = mockReactionUpdateLog[messageId]

        if (lastUpdate && lastUpdate > sinceTimestamp) {
          updatedReactions[messageId] = msg.reactions
        }
      })

    if (Object.keys(updatedReactions).length > 0) {
      return {
        newMessages: [],
        updatedReactions
      }
    }

    // 沒有更新，等待後再檢查
    await delay(checkInterval)
  }

  // 逾時，返回空結果
  return {
    newMessages: [],
    updatedReactions: {}
  }
}

/**
 * 重置 reveal 計數（切換對話時使用）
 */
export function resetRevealCount(conversationId?: number) {
  if (conversationId !== undefined) {
    delete revealedMessageCount[conversationId]
  } else {
    revealedMessageCount = {}
  }
}

/**
 * 重置模擬資料（回到初始狀態）
 */
export function resetMockData() {
  mockMessages = [...typedChatData.messages]
  mockConversations = [...typedChatData.conversations]
  mockReactionUpdateLog = {}
}
