import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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

interface RegisterFormValues {
  firstName: string
  lastName: string
  email: string
  phone: string
  password: string
}

export function RegisterPage() {
  const { register: registerUser, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({
    defaultValues: { firstName: '', lastName: '', email: '', phone: '', password: '' },
  })

  useEffect(() => {
    if (isAuthenticated) navigate(ROUTES.HOME, { replace: true })
  }, [isAuthenticated, navigate])

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    try {
      await registerUser({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      })
      navigate(ROUTES.HOME, { replace: true })
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
        <h1 className="mt-4 font-display text-2xl font-semibold">Create your account</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Save addresses, track orders, and checkout faster.
        </p>
      </div>
      <Card>
        <AlertModal
          open={Boolean(error)}
          onClose={() => setError(null)}
          variant="error"
          title="Registration failed"
          description={error ?? undefined}
        />
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <div className="grid grid-cols-2 gap-3">
            <FormField
              label="First name"
              htmlFor="firstName"
              required
              error={errors.firstName?.message}
            >
              <Input
                id="firstName"
                autoComplete="given-name"
                invalid={Boolean(errors.firstName)}
                {...register('firstName', { validate: rhf.required('First name') })}
              />
            </FormField>
            <FormField
              label="Last name"
              htmlFor="lastName"
              required
              error={errors.lastName?.message}
            >
              <Input
                id="lastName"
                autoComplete="family-name"
                invalid={Boolean(errors.lastName)}
                {...register('lastName', { validate: rhf.required('Last name') })}
              />
            </FormField>
          </div>
          <FormField label="Email" htmlFor="email" required error={errors.email?.message}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              invalid={Boolean(errors.email)}
              {...register('email', { validate: rhf.email })}
            />
          </FormField>
          <FormField label="Phone" htmlFor="phone" error={errors.phone?.message} hint="Optional">
            <Input
              id="phone"
              type="tel"
              autoComplete="tel"
              invalid={Boolean(errors.phone)}
              {...register('phone', { validate: rhf.phone })}
            />
          </FormField>
          <FormField label="Password" htmlFor="password" required error={errors.password?.message}>
            <PasswordInput
              id="password"
              autoComplete="new-password"
              invalid={Boolean(errors.password)}
              {...register('password', { validate: rhf.password })}
            />
          </FormField>
          <LoadingButton
            type="submit"
            fullWidth
            isLoading={isSubmitting}
            loadingText="Creating account..."
          >
            Create account
          </LoadingButton>
        </form>
        <p className="mt-4 text-center text-sm text-ink-muted">
          Already have an account?{' '}
          <Link
            to={ROUTES.LOGIN}
            className="font-semibold text-brand-700 hover:underline dark:text-brand-300"
          >
            Sign in
          </Link>
        </p>
      </Card>
    </div>
  )
}
