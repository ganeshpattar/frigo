import { cn } from '@/utils/cn'

interface ProductImageProps {
  src?: string
  alt: string
  className?: string
  aspect?: 'square' | 'video' | 'wide' | 'fill'
}

const aspects = {
  square: 'aspect-square',
  video: 'aspect-video',
  wide: 'aspect-[4/3]',
  fill: 'h-full w-full',
}

export function ProductImage({ src, alt, className, aspect = 'wide' }: ProductImageProps) {
  return (
    <div
      className={cn(
        'overflow-hidden bg-brand-50 dark:bg-brand-900/40',
        aspects[aspect],
        className,
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm text-ink-muted">
          No image
        </div>
      )}
    </div>
  )
}
