import { User } from 'lucide-react'
import { cn } from '@/utils/cn'

interface UserAvatarProps {
  name?: string
  className?: string
}

export function UserAvatar({ name, className }: UserAvatarProps) {
  const initial = name?.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      className={cn(
        'inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-700',
        className,
      )}
      aria-hidden
    >
      {name ? initial : <User className="h-4 w-4" />}
    </span>
  )
}
