'use client'

import { useEffect } from 'react'
import { useChatStore } from '@/stores/useChatStore'

/**
 * Hook：根據頁面可見性管理輪詢生命週期
 * 當頁面隱藏時停止輪詢，當頁面顯示時開始輪詢
 */
export function useVisibilityPolling() {
  const isInitialized = useChatStore(state => state.isInitialized)
  const startPolling = useChatStore(state => state.startPolling)
  const stopPolling = useChatStore(state => state.stopPolling)

  useEffect(() => {
    // ✅ 等待初始化完成後才啟動輪詢
    if (!isInitialized) return

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling()
      } else {
        startPolling()
      }
    }

    // ✅ 移除立即啟動輪詢的邏輯
    // 輪詢由 selectConversation 負責啟動，避免重複啟動

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      stopPolling()
    }
  }, [isInitialized, startPolling, stopPolling])
}
