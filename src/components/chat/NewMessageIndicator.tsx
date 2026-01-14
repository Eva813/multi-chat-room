'use client'

import { Button } from '@/components/ui/button'
import { ChevronDown } from 'lucide-react'

interface NewMessageIndicatorProps {
  count: number
  visible: boolean
  onScrollToNew: () => void
}

export function NewMessageIndicator({
  count,
  visible,
  onScrollToNew
}: NewMessageIndicatorProps) {
  if (!visible) return null

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20
                    animate-in slide-in-from-bottom-2 fade-in duration-300">
      <Button
        onClick={onScrollToNew}
        variant="default"
        size="sm"
        className="shadow-lg gap-2"
      >
        <ChevronDown className="h-4 w-4" />
        {count} 則新訊息
      </Button>
    </div>
  )
}
