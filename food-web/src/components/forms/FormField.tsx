import { Children, cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react'
import { FormError } from './FormError'

interface FormFieldProps {
  label: string
  htmlFor?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

export function FormField({ label, htmlFor, error, hint, required, children }: FormFieldProps) {
  const generatedId = useId()
  const fieldId = htmlFor ?? generatedId
  const errorId = error ? `${fieldId}-error` : undefined

  const child = Children.only(children)
  const field = isValidElement(child)
    ? cloneElement(child as ReactElement<Record<string, unknown>>, {
        id: (child.props as { id?: string }).id ?? fieldId,
        'aria-describedby': errorId,
        invalid: Boolean(error) || (child.props as { invalid?: boolean }).invalid,
      })
    : children

  return (
    <div className="space-y-1.5">
      <label htmlFor={fieldId} className="block text-sm font-medium text-ink">
        {label}
        {required ? (
          <span className="text-danger" aria-hidden>
            {' '}
            *
          </span>
        ) : null}
      </label>
      {field}
      {hint && !error ? <p className="text-sm text-ink-muted">{hint}</p> : null}
      <FormError id={errorId} message={error} />
    </div>
  )
}
