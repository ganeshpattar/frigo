import { Loader2 } from 'lucide-react'
import { Button, type ButtonProps } from './Button'

interface LoadingButtonProps extends ButtonProps {
  isLoading?: boolean
  loadingText?: string
}

export function LoadingButton({
  isLoading,
  loadingText,
  children,
  disabled,
  leftIcon,
  ...props
}: LoadingButtonProps) {
  return (
    <Button
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      leftIcon={isLoading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : leftIcon}
      {...props}
    >
      {isLoading ? (loadingText ?? children) : children}
    </Button>
  )
}
