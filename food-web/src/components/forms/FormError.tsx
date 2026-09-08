interface FormErrorProps {
  message?: string
  id?: string
}

export function FormError({ message, id }: FormErrorProps) {
  if (!message) return null
  return (
    <p id={id} role="alert" className="mt-1 text-xs font-medium text-danger">
      {message}
    </p>
  )
}
