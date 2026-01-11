'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'

interface ConversationItemProps {
  name: string
  lastMessage: string
  timestamp: string
  avatars: string[]
  names: string[]
  isActive?: boolean
  onClick?: () => void
}

// 單個頭像渲染組件
function AvatarCell({
  src,
  name,
  avatarClass = 'h-12 w-12',
  fallbackClass = '',
}: {
  src: string
  name: string
  avatarClass?: string
  fallbackClass?: string
}) {
  return (
    <Avatar className={avatarClass}>
      <AvatarImage src={src} alt={name} className="object-cover" />
      <AvatarFallback className={fallbackClass}>{name?.[0] || '?'}</AvatarFallback>
    </Avatar>
  )
}

// 處理多參與者頭像
function AvatarGroup({ avatars, names }: { avatars: string[]; names: string[] }) {
  const count = avatars.length

  if (count === 1) {
    return <AvatarCell src={avatars[0]} name={names[0]} />
  }

  if (count === 2) {
    // 2 位參與者：左右切分
    return (
      <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative overflow-hidden">
            <AvatarCell
              src={avatars[0]}
              name={names[0]}
              avatarClass="h-12 w-12 rounded-none"
              fallbackClass="rounded-none text-xs"
            />
          </div>
          <div className="relative overflow-hidden">
            <AvatarCell
              src={avatars[1]}
              name={names[1]}
              avatarClass="h-12 w-12 rounded-none"
              fallbackClass="rounded-none text-xs"
            />
          </div>
        </div>
      </div>
    )
  }

  if (count === 3) {
    // 3 位參與者：左 1 大 + 右 2 小
    return (
      <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
        <div className="absolute inset-0 grid grid-cols-2">
          <div className="relative overflow-hidden">
            <AvatarCell
              src={avatars[0]}
              name={names[0]}
              avatarClass="h-12 w-12 rounded-none"
              fallbackClass="rounded-none text-xs"
            />
          </div>
          <div className="grid grid-rows-2">
            <div className="relative overflow-hidden">
              <AvatarCell
                src={avatars[1]}
                name={names[1]}
                avatarClass="h-6 w-6 rounded-none"
                fallbackClass="rounded-none text-[8px]"
              />
            </div>
            <div className="relative overflow-hidden">
              <AvatarCell
                src={avatars[2]}
                name={names[2]}
                avatarClass="h-6 w-6 rounded-none"
                fallbackClass="rounded-none text-[8px]"
              />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 4 位或更多參與者：2x2 網格
  return (
    <div className="relative h-12 w-12 rounded-full overflow-hidden shrink-0">
      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2">
        {avatars.slice(0, 4).map((avatar, index) => (
          <div key={index} className="relative overflow-hidden">
            <AvatarCell
              src={avatar}
              name={names[index]}
              avatarClass="h-6 w-6 rounded-none"
              fallbackClass="rounded-none text-[8px]"
            />
          </div>
        ))}
      </div>
    </div>
  )
}

export function ConversationItem({
  name,
  lastMessage,
  timestamp,
  avatars,
  names,
  isActive,
  onClick,
}: ConversationItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg p-3 text-left transition-colors',
        'hover:bg-accent hover:shadow-sm',
        isActive && 'bg-primary/15 border-l-4 border-primary shadow-sm'
      )}
    >
      <AvatarGroup avatars={avatars} names={names} />

      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-2">
          <span className={cn(
            "font-semibold text-sm truncate",
            isActive && "text-primary"
          )}>
            {name}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">{timestamp}</span>
        </div>

        <p className="truncate text-sm text-muted-foreground mt-0.5">
          {lastMessage}
        </p>
      </div>
    </button>
  )
}
