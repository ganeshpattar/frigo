import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ROUTES } from '@/constants'
import { useAuth, getAuthErrorMessage } from '@/context'
import { rhf } from '@/utils/validation'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { OtpInput } from '@/components/forms/OtpInput'
import { PasswordInput } from '@/components/forms/PasswordInput'
import { LoadingButton } from '@/components/common/LoadingButton'
import { AlertModal } from '@/components/common/AlertModal'
import { Card } from '@/components/common/Card'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { authApi } from '@/services/api'

interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

export function RegisterPage() {
  const { establishSession, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<{ email: string; demoCode?: string; message: string } | null>(
    null,
  )
  const [otp, setOtp] = useState('')
  const [otpError, setOtpError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [resendBusy, setResendBusy] = useState(false)

  const registerForm = useForm<RegisterFormValues>({
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  })

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.HOME, { replace: true })
  }, [isAuthenticated, navigate])

  const onRegister = registerForm.handleSubmit(async (values) => {
    setError(null)
    try {
      const result = await authApi.register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      })
      setPending({
        email: result.email,
        demoCode: result.demoCode,
        message: result.message,
      })
      setOtp(result.demoCode ?? '')
      setOtpError(null)
    } catch (err) {
      setError(getAuthErrorMessage(err))
    }
  })

  const onVerify = async (event: FormEvent) => {
    event.preventDefault()
    if (!pending) return
    const code = otp.replace(/\D/g, '')
    if (code.length !== 6) {
      setOtpError('Enter the 6-digit verification code')
      return
    }
    setError(null)
    setOtpError(null)
    setVerifying(true)
    try {
      const { user, tokens } = await authApi.verifyEmail({
        email: pending.email,
        code,
      })
      establishSession(user, tokens)
      navigate(ROUTES.HOME, { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setVerifying(false)
    }
  }

  const onResend = async () => {
    if (!pending) return
    setError(null)
    setOtpError(null)
    setResendBusy(true)
    try {
      const result = await authApi.resendSignupOtp({ email: pending.email })
      setPending({
        email: result.email,
        demoCode: result.demoCode,
        message: result.message,
      })
      setOtp(result.demoCode ?? '')
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setResendBusy(false)
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 text-center">
        <div className="flex justify-center">
          <BrandLogo size="lg" to={ROUTES.HOME} />
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold">
          {pending ? 'Verify your email' : 'Create your account'}
        </h1>
        <p className="mt-1 text-sm text-ink-muted">
          {pending
            ? `Enter the 6-digit code we sent to ${pending.email}.`
            : 'Save addresses, track orders, and checkout faster.'}
        </p>
      </div>
      <Card>
        <AlertModal
          open={Boolean(error)}
          onClose={() => setError(null)}
          variant="error"
          title={pending ? 'Verification failed' : 'Registration failed'}
          description={error ?? undefined}
        />
        {pending ? (
          <form onSubmit={(e) => void onVerify(e)} className="space-y-4" noValidate>
            {pending.demoCode ? (
              <p className="rounded-xl bg-brand-50 px-3 py-2 text-sm text-brand-800 ring-1 ring-brand-100 dark:bg-brand-950/40 dark:text-brand-100 dark:ring-brand-900">
                Demo code: <span className="font-bold tracking-widest">{pending.demoCode}</span>
              </p>
            ) : (
              <p className="text-sm text-ink-muted">{pending.message}</p>
            )}
            <FormField label="Verification code" htmlFor="otp" required error={otpError ?? undefined}>
              <OtpInput
                id="otp"
                value={otp}
                onChange={(next) => {
                  setOtp(next)
                  if (otpError) setOtpError(null)
                }}
                invalid={Boolean(otpError)}
                autoFocus
                disabled={verifying}
              />
            </FormField>
            <LoadingButton type="submit" fullWidth isLoading={verifying} loadingText="Verifying...">
              Verify and continue
            </LoadingButton>
            <button
              type="button"
              className="w-full text-sm font-semibold text-brand-700 hover:underline disabled:opacity-60 dark:text-brand-300"
              onClick={() => void onResend()}
              disabled={resendBusy || verifying}
            >
              {resendBusy ? 'Sending…' : 'Resend code'}
            </button>
            <p className="text-center text-sm text-ink-muted">
              <button
                type="button"
                className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
                onClick={() => {
                  setPending(null)
                  setOtp('')
                  setOtpError(null)
                }}
              >
                Back to registration
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={onRegister} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <FormField
                label="First name"
                htmlFor="firstName"
                required
                error={registerForm.formState.errors.firstName?.message}
              >
                <Input
                  id="firstName"
                  autoComplete="given-name"
                  invalid={Boolean(registerForm.formState.errors.firstName)}
                  {...registerForm.register('firstName', { validate: rhf.required('First name') })}
                />
              </FormField>
              <FormField
                label="Last name"
                htmlFor="lastName"
                required
                error={registerForm.formState.errors.lastName?.message}
              >
                <Input
                  id="lastName"
                  autoComplete="family-name"
                  invalid={Boolean(registerForm.formState.errors.lastName)}
                  {...registerForm.register('lastName', { validate: rhf.required('Last name') })}
                />
              </FormField>
            </div>
            <FormField
              label="Email"
              htmlFor="email"
              required
              error={registerForm.formState.errors.email?.message}
            >
              <Input
                id="email"
                type="email"
                autoComplete="email"
                invalid={Boolean(registerForm.formState.errors.email)}
                {...registerForm.register('email', { validate: rhf.email })}
              />
            </FormField>
            <FormField
              label="Phone"
              htmlFor="phone"
              error={registerForm.formState.errors.phone?.message}
              hint="Optional"
            >
              <Input
                id="phone"
                type="tel"
                autoComplete="tel"
                invalid={Boolean(registerForm.formState.errors.phone)}
                {...registerForm.register('phone', { validate: rhf.phone })}
              />
            </FormField>
            <FormField
              label="Password"
              htmlFor="password"
              required
              error={registerForm.formState.errors.password?.message}
            >
              <PasswordInput
                id="password"
                autoComplete="new-password"
                invalid={Boolean(registerForm.formState.errors.password)}
                {...registerForm.register('password', { validate: rhf.password })}
              />
            </FormField>
            <LoadingButton
              type="submit"
              fullWidth
              isLoading={registerForm.formState.isSubmitting}
              loadingText="Creating account..."
            >
              Create account
            </LoadingButton>
          </form>
        )}
        {!pending ? (
          <p className="mt-4 text-center text-sm text-ink-muted">
            Already have an account?{' '}
            <Link
              to={ROUTES.LOGIN}
              className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
            >
              Sign in
            </Link>
          </p>
        ) : null}
      </Card>
    </div>
  )
}
