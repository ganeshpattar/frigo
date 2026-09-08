import type { ReactNode } from 'react'

interface AdminPageShellProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

export function AdminPageShell({ title, description, actions, children }: AdminPageShellProps) {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-ink sm:text-[1.75rem]">{title}</h1>
          {description ? <p className="mt-1 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </div>
  )
}
