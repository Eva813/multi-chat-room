'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ImageOff } from 'lucide-react'

interface MessageImageProps {
  src: string
  alt: string
  priority?: boolean
}

export function MessageImage({ src, alt, priority = false }: MessageImageProps) {
  const [imageError, setImageError] = useState(false)

  if (imageError) {
    return (
      <div className="flex flex-col items-center justify-center w-[300px] h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700">
        <ImageOff className="h-12 w-12 text-gray-400 mb-2" />
        <span className="text-sm text-gray-500 dark:text-gray-400">
          無法載入圖片
        </span>
      </div>
    )
  }

  return (
    <div className="relative max-w-xs">
      <Image
        src={src}
        alt={alt}
        width={300}
        height={300}
        className="rounded-lg object-cover"
        priority={priority}
        unoptimized={src.startsWith('blob:') || src.startsWith('data:')}
        onError={() => setImageError(true)}
      />
    </div>
  )
}
