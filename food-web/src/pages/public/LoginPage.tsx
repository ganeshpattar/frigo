import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ROUTES } from '@/constants'
import { useAuth, getAuthErrorMessage } from '@/context'
import { rhf } from '@/utils/validation'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { Card } from '@/components/common/Card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { DEMO_CREDENTIALS } from '@/services/api'

interface LoginFormValues {
  email: string
  password: string
}

export function LoginPage() {
  const { login, isAuthenticated, hasRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (!isAuthenticated) return
    const from = (location.state as { from?: string } | null)?.from
    if (from) navigate(from, { replace: true })
    else if (hasRole('ADMIN')) navigate(ROUTES.ADMIN, { replace: true })
    else if (hasRole('MANAGER')) navigate(ROUTES.MANAGER, { replace: true })
    else navigate(ROUTES.HOME, { replace: true })
  }, [isAuthenticated, hasRole, location.state, navigate])

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await login(values)
      const from = (location.state as { from?: string } | null)?.from
      navigate(from ?? ROUTES.HOME, { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    }
  })

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="flex justify-center">
          <BrandLogo size="lg" to={ROUTES.HOME} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">Welcome back</h1>
        <p className="mt-1 text-sm text-ink-muted">Sign in to checkout and manage your orders.</p>
      </div>
      <Card>
        <AlertModal
          open={Boolean(error)}
          onClose={() => setError(null)}
          variant="error"
          title="Sign in failed"
          description={error ?? undefined}
        />
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register('email', { validate: rhf.email })}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="current-password"
              invalid={Boolean(errors.password)}
              {...register('password', { validate: rhf.required('Password') })}
            />
          </FormField>
          <div className="flex justify-end">
            <Link
              to={ROUTES.FORGOT_PASSWORD}
              className="text-sm font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Forgot password?
            </Link>
          </div>
          <LoadingButton type="submit" fullWidth isLoading={isSubmitting} loadingText="Signing in...">
            Sign in
          </LoadingButton>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          New here?{' '}
          <Link
            to={ROUTES.REGISTER}
            className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Create an account
          </Link>
        </p>
      </Card>
      <p className="mt-4 text-center text-xs text-ink-muted">
        Demo: {DEMO_CREDENTIALS.customer.email} / {DEMO_CREDENTIALS.customer.password}
      </p>
    </div>
  )
}
