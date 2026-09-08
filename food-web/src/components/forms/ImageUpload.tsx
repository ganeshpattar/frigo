import { useId, useRef, useState } from 'react'
import { ImagePlus, Trash2, Upload } from 'lucide-react'
import { cn } from '@/utils/cn'
import { IconButton } from '@/components/common/IconButton'

const MAX_BYTES = 1.5 * 1024 * 1024 // ~1.5MB file before resize
const MAX_EDGE = 960

async function fileToOptimizedDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose an image file (JPG, PNG, WebP, or GIF).')
  }
  if (file.size > MAX_BYTES * 2) {
    throw new Error('Image is too large. Use a file under 3MB.')
  }

  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image()
      el.onload = () => resolve(el)
      el.onerror = () => reject(new Error('Could not read that image.'))
      el.src = objectUrl
    })

    const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height))
    const width = Math.max(1, Math.round(img.width * scale))
    const height = Math.max(1, Math.round(img.height * scale))
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Could not process image.')
    ctx.drawImage(img, 0, 0, width, height)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}

interface ImageUploadProps {
  value?: string | null
  onChange: (dataUrl: string | null) => void
  disabled?: boolean
  className?: string
  label?: string
}

export function ImageUpload({
  value,
  onChange,
  disabled,
  className,
  label = 'Product image',
}: ImageUploadProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const onPick = async (file: File | null | undefined) => {
    if (!file) return
    setBusy(true)
    setError(null)
    try {
      const dataUrl = await fileToOptimizedDataUrl(file)
      onChange(dataUrl)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className={cn('space-y-2', className)}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="sr-only"
        disabled={disabled || busy}
        onChange={(e) => void onPick(e.target.files?.[0])}
      />

      {value ? (
        <div className="relative overflow-hidden rounded-xl border border-border bg-surface">
          <img
            src={value}
            alt={label}
            className="h-40 w-full object-cover"
          />
          <div className="absolute right-2 top-2 flex gap-1 rounded-lg bg-surface-elevated/90 p-0.5 shadow-sm">
            <IconButton
              label="Replace image"
              className="h-8 w-8"
              icon={<Upload className="h-4 w-4" />}
              disabled={disabled || busy}
              onClick={() => inputRef.current?.click()}
            />
            <IconButton
              label="Remove image"
              className="h-8 w-8 text-danger"
              icon={<Trash2 className="h-4 w-4" />}
              disabled={disabled || busy}
              onClick={() => onChange(null)}
            />
          </div>
        </div>
      ) : (
        <label
          htmlFor={inputId}
          className={cn(
            'flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-surface px-4 text-center transition hover:border-brand-400 hover:bg-brand-50/40',
            (disabled || busy) && 'pointer-events-none opacity-60',
          )}
        >
          <span className="rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40">
            <ImagePlus className="h-5 w-5" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-ink">
            {busy ? 'Processing…' : 'Upload product image'}
          </span>
          <span className="text-[11px] text-ink-muted">JPG, PNG, WebP · auto-compressed</span>
        </label>
      )}

      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  )
}
