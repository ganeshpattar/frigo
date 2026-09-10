import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react'
import { cn } from '@/utils/cn'

const OTP_LENGTH = 6

export interface OtpInputProps {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  invalid?: boolean
  autoFocus?: boolean
  id?: string
}

function normalizeDigits(raw: string) {
  return raw.replace(/\D/g, '').slice(0, OTP_LENGTH)
}

export function OtpInput({
  value,
  onChange,
  disabled,
  invalid,
  autoFocus,
  id = 'otp',
}: OtpInputProps) {
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])
  const digits = Array.from({ length: OTP_LENGTH }, (_, i) => value[i] ?? '')

  useEffect(() => {
    if (autoFocus) inputsRef.current[0]?.focus()
  }, [autoFocus])

  const setDigitAt = (index: number, digit: string) => {
    const next = digits.map((d, i) => (i === index ? digit : d))
    onChange(next.join(''))
  }

  const focusIndex = (index: number) => {
    const el = inputsRef.current[Math.max(0, Math.min(OTP_LENGTH - 1, index))]
    el?.focus()
    el?.select()
  }

  const handleChange = (index: number, raw: string) => {
    const cleaned = normalizeDigits(raw)
    if (!cleaned) {
      setDigitAt(index, '')
      return
    }
    if (cleaned.length > 1) {
      const merged = normalizeDigits(value.slice(0, index) + cleaned + value.slice(index + cleaned.length))
      onChange(merged)
      focusIndex(Math.min(OTP_LENGTH - 1, index + cleaned.length))
      return
    }
    setDigitAt(index, cleaned)
    if (index < OTP_LENGTH - 1) focusIndex(index + 1)
  }

  const handleKeyDown = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault()
      if (digits[index]) {
        setDigitAt(index, '')
      } else if (index > 0) {
        setDigitAt(index - 1, '')
        focusIndex(index - 1)
      }
      return
    }
    if (event.key === 'ArrowLeft') {
      event.preventDefault()
      focusIndex(index - 1)
    }
    if (event.key === 'ArrowRight') {
      event.preventDefault()
      focusIndex(index + 1)
    }
  }

  const handlePaste = (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault()
    const pasted = normalizeDigits(event.clipboardData.getData('text'))
    if (!pasted) return
    onChange(pasted)
    focusIndex(Math.min(OTP_LENGTH - 1, pasted.length))
  }

  return (
    <div className="flex justify-between gap-2" role="group" aria-label="Verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el
          }}
          id={index === 0 ? id : `${id}-${index}`}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          value={digit}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          aria-label={`Digit ${index + 1} of ${OTP_LENGTH}`}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          className={cn(
            'h-12 w-11 rounded-xl border border-border bg-surface-elevated text-center text-lg font-semibold tracking-widest text-ink transition-colors sm:h-12 sm:w-12',
            'hover:border-brand-300 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500/20',
            invalid && 'border-danger focus:border-danger',
          )}
        />
      ))}
    </div>
  )
}
