import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ROUTES } from '@/constants'
import { getAuthErrorMessage } from '@/context'
import { rhf } from '@/utils/validation'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { Card } from '@/components/common/Card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { authApi } from '@/services/api'

interface ForgotFormValues {
  email: string
}

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ message: string; demoCode?: string; email: string } | null>(
    null,
  )
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotFormValues>({
    defaultValues: { email: '' },
  })

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    setSuccess(null)
    try {
      const result = await authApi.forgotPassword({ email: values.email.trim() })
      setSuccess({
        message: result.message,
        demoCode: result.demoCode,
        email: values.email.trim(),
      })
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
        <h1 className="mt-4 font-display text-2xl font-semibold">Forgot password</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Enter your email and we will send a reset code.
        </p>
      </div>
      <Card>
        {success ? (
          <div className="space-y-4">
            {success.demoCode ? (
              <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 ring-1 ring-brand-100">
                Demo code: <span className="font-bold tracking-widest">{success.demoCode}</span>
              </p>
            ) : null}
            <LoadingButton
              type="button"
              fullWidth
              onClick={() =>
                navigate(ROUTES.RESET_PASSWORD, {
                  state: { email: success.email, demoCode: success.demoCode },
                })
              }
            >
              Continue to reset password
            </LoadingButton>
            <p className="text-center text-sm text-ink-muted">
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                Back to sign in
              </Link>
            </p>
          </div>
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
            <LoadingButton
              type="submit"
              fullWidth
              isLoading={isSubmitting}
              loadingText="Sending..."
            >
              Send reset code
            </LoadingButton>
            <p className="text-center text-sm text-ink-muted">
              Remembered it?{' '}
              <Link
                to={ROUTES.LOGIN}
                className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
              >
                Sign in
              </Link>
            </p>
          </form>
        )}
      </Card>

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Request failed"
        description={error ?? undefined}
      />
      <AlertModal
        open={Boolean(success)}
        onClose={() => setSuccess(null)}
        variant="success"
        title="Check your email"
        description={success?.message}
      />
    </div>
  )
}
