import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { ArrowLeft, CheckCircle2, MapPin, Package } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useCart } from '@/context'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Button } from '@/components/common/Button'
import { LoadingButton } from '@/components/common/LoadingButton'
import { Card } from '@/components/common/Card'
import { AlertModal } from '@/components/common/AlertModal'
import { FormField } from '@/components/forms/FormField'
import { Input } from '@/components/forms/Input'
import { PriceSummaryView } from '@/components/data-display/PriceSummary'
import { ordersApi } from '@/services/api'
import { getUserFriendlyMessage } from '@/utils/apiError'
import { isProductUuid, formatCurrency } from '@/utils/format'
import { rhf } from '@/utils/validation'
import type { Order } from '@/types'

interface CheckoutFormValues {
  recipientName: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  postalCode: string
  notes: string
  paymentMethod: 'COD' | 'UPI' | 'CARD'
}

export function CheckoutPage() {
  const { cart, priceSummary, clearCart, itemCount } = useCart()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const [placedOrder, setPlacedOrder] = useState<Order | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CheckoutFormValues>({
    defaultValues: {
      recipientName: user ? `${user.firstName} ${user.lastName}`.trim() : '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: 'Karnataka',
      postalCode: '',
      notes: '',
      paymentMethod: 'COD',
    },
  })

  useEffect(() => {
    if (itemCount === 0 && !placedOrder) {
      navigate(ROUTES.CART, { replace: true })
    }
  }, [itemCount, navigate, placedOrder])

  const linePreview = useMemo(
    () =>
      cart.items.map((item) => ({
        id: item.id,
        name: item.productName,
        qty: item.quantity,
        amount: item.unitPrice * item.quantity,
      })),
    [cart.items],
  )

  const onSubmit = handleSubmit(async (values) => {
    setError(null)
    const validItems = cart.items.filter((item) => isProductUuid(item.productId))
    if (!validItems.length) {
      setError('Your cart has outdated products. Clear the cart, refresh the menu, and add items again.')
      clearCart()
      return
    }
    try {
      const order = await ordersApi.create({
        items: validItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        shippingAddress: {
          label: 'Home',
          recipientName: values.recipientName.trim(),
          phone: values.phone.trim(),
          line1: values.line1.trim(),
          line2: values.line2.trim() || undefined,
          city: values.city.trim(),
          state: values.state.trim(),
          postalCode: values.postalCode.trim(),
          country: 'IN',
        },
        customerName: values.recipientName.trim(),
        customerPhone: values.phone.trim(),
        paymentMethod: values.paymentMethod,
        notes: values.notes.trim() || undefined,
      })
      clearCart()
      setPlacedOrder(order)
    } catch (err) {
      setError(getUserFriendlyMessage(err))
    }
  })

  if (placedOrder) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Card className="text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <h1 className="font-display text-2xl font-semibold">Order placed</h1>
          <p className="mt-2 text-sm text-ink-muted">
            Order <span className="font-semibold text-ink">{placedOrder.orderNumber}</span> is
            confirmed. Pay on delivery ({placedOrder.paymentMethod || 'COD'}).
          </p>
          <p className="mt-1 text-sm text-ink-muted">
            Total: {formatCurrency(placedOrder.total, placedOrder.currency || 'INR')}
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Button onClick={() => navigate(ROUTES.ORDERS)}>View orders</Button>
            <Button variant="secondary" onClick={() => navigate(ROUTES.PRODUCTS)}>
              Continue shopping
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Breadcrumb
        items={[
          { label: 'Home', to: ROUTES.HOME },
          { label: 'Cart', to: ROUTES.CART },
          { label: 'Checkout' },
        ]}
      />

      <div className="mb-6 flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          leftIcon={<ArrowLeft className="h-4 w-4" />}
          onClick={() => navigate(ROUTES.CART)}
        >
          Cart
        </Button>
        <div>
          <h1 className="font-display text-3xl font-semibold">Checkout</h1>
          <p className="text-sm text-ink-muted">Delivery details and place your order.</p>
        </div>
      </div>

      <AlertModal
        open={Boolean(error)}
        onClose={() => setError(null)}
        variant="error"
        title="Checkout failed"
        description={error ?? undefined}
      />

      <form onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-4">
          <Card>
            <div className="mb-4 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-lg font-semibold">Delivery address</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Recipient name" required error={errors.recipientName?.message}>
                <Input {...register('recipientName', { validate: rhf.required('Name') })} />
              </FormField>
              <FormField label="Phone" required error={errors.phone?.message}>
                <Input
                  {...register('phone', {
                    validate: (v) =>
                      String(v).replace(/\D/g, '').length >= 10 || 'Enter a valid phone',
                  })}
                />
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Address line 1" required error={errors.line1?.message}>
                  <Input {...register('line1', { validate: rhf.required('Address') })} />
                </FormField>
              </div>
              <div className="sm:col-span-2">
                <FormField label="Address line 2">
                  <Input {...register('line2')} />
                </FormField>
              </div>
              <FormField label="City" required error={errors.city?.message}>
                <Input {...register('city', { validate: rhf.required('City') })} />
              </FormField>
              <FormField label="State" required error={errors.state?.message}>
                <Input {...register('state', { validate: rhf.required('State') })} />
              </FormField>
              <FormField label="Postal code" required error={errors.postalCode?.message}>
                <Input
                  {...register('postalCode', {
                    validate: (v) => String(v).trim().length >= 4 || 'Enter postal code',
                  })}
                />
              </FormField>
              <FormField label="Payment">
                <select
                  className="h-11 w-full rounded-xl border border-border bg-surface-elevated px-3 text-sm"
                  {...register('paymentMethod')}
                >
                  <option value="COD">Cash on delivery</option>
                  <option value="UPI">UPI (pay on delivery)</option>
                  <option value="CARD">Card (pay on delivery)</option>
                </select>
              </FormField>
              <div className="sm:col-span-2">
                <FormField label="Order notes">
                  <Input {...register('notes')} placeholder="Landmark, delivery preference…" />
                </FormField>
              </div>
            </div>
          </Card>

          <Card>
            <div className="mb-3 flex items-center gap-2">
              <Package className="h-4 w-4 text-brand-600" />
              <h2 className="font-display text-lg font-semibold">Items</h2>
            </div>
            <ul className="divide-y divide-border/70 text-sm">
              {linePreview.map((line) => (
                <li key={line.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="text-ink">
                    {line.qty}× {line.name}
                  </span>
                  <span className="font-medium text-ink-muted">
                    {formatCurrency(line.amount)}
                  </span>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <aside>
          <Card className="lg:sticky lg:top-24">
            <h2 className="mb-3 font-display text-lg font-semibold">Order summary</h2>
            <PriceSummaryView summary={{ ...priceSummary, isEstimated: false }} />
            <p className="mt-3 text-xs text-ink-muted">
              Final totals are confirmed by the server when you place the order.
            </p>
            <LoadingButton
              type="submit"
              isLoading={isSubmitting}
              fullWidth
              className="mt-5"
              size="lg"
            >
              Place order
            </LoadingButton>
            <Link
              to={ROUTES.CART}
              className="mt-3 block text-center text-sm font-semibold text-ink-muted hover:text-ink"
            >
              Back to cart
            </Link>
          </Card>
        </aside>
      </form>
    </div>
  )
}
