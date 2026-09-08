import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ROUTES } from '@/constants'
import { getAuthErrorMessage } from '@/context'
import { rhf } from '@/utils/validation'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { Card } from '@/components/common/Card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { authApi } from '@/services/api'

interface ResetFormValues {
  email: string
  code: string
  password: string
  confirmPassword: string
}

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state as { email?: string; demoCode?: string } | null
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ResetFormValues>({
    defaultValues: {
      email: state?.email ?? '',
      code: state?.demoCode ?? '',
      password: '',
      confirmPassword: '',
    },
  })

  const password = watch('password')

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await authApi.resetPassword({
        email: values.email.trim(),
        code: values.code.trim(),
        password: values.password,
      })
      setDone(true)
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
        <h1 className="mt-4 font-display text-2xl font-semibold">Reset password</h1>
        <p className="mt-1 text-sm text-ink-muted">Enter the code from your email and a new password.</p>
      </div>
      <Card>
        {done ? (
          <p className="text-center text-sm text-ink-muted">Your password has been updated.</p>
        ) : (
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
            <FormField label="Reset code" htmlFor="code" required error={errors.code?.message}>
              <Input
                id="code"
                inputMode="numeric"
                autoComplete="one-time-code"
                invalid={Boolean(errors.code)}
                {...register('code', { validate: rhf.required('Reset code') })}
              />
            </FormField>
            <FormField
              label="New password"
              htmlFor="password"
              required
              error={errors.password?.message}
            >
              <PasswordInput
                id="password"
                autoComplete="new-password"
                invalid={Boolean(errors.password)}
                {...register('password', { validate: rhf.password })}
              />
            </FormField>
            <FormField
              label="Confirm password"
              htmlFor="confirmPassword"
              required
              error={errors.confirmPassword?.message}
            >
              <PasswordInput
                id="confirmPassword"
                autoComplete="new-password"
                invalid={Boolean(errors.confirmPassword)}
                {...register('confirmPassword', {
                  validate: (value) =>
                    value === password || 'Passwords do not match',
                })}
              />
            </FormField>
            <LoadingButton
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              loadingText="Updating..."
            >
              Update password
            </LoadingButton>
            <p className="text-center text-sm text-ink-muted">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                Request a new code
              </Link>
            </p>
          </form>
        )}
      </Card>

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Reset failed"
        description={error ?? undefined}
      />
      <AlertModal
        open={done}
        onClose={() => navigate(ROUTES.LOGIN)}
        variant="success"
        title="Password updated"
        description="You can sign in with your new password."
        confirmLabel="Go to sign in"
      />
    </div>
  )
}
