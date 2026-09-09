import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, ShoppingBag, Sparkles } from 'lucide-react'
import { ROUTES } from '@/constants'
import { useAuth, useCart } from '@/context'
import { Breadcrumb } from '@/components/navigation/Breadcrumb'
import { Button } from '@/components/common/Button'
import { CartItemRow } from '@/components/data-display/CartItem'
import { PriceSummaryView } from '@/components/data-display/PriceSummary'
import { fadeUp, springSoft, staggerContainer, tweenOut, viewportOnce } from '@/utils/motion'

export function CartPage() {
  const { cart, priceSummary, updateQuantity, removeItem, itemCount } = useCart()
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()

  const handleCheckout = () => {
    if (!isAuthenticated) {
      navigate(ROUTES.LOGIN, { state: { from: ROUTES.CHECKOUT } })
      return
    }
    navigate(ROUTES.CHECKOUT)
  }

  return (
    <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-72 bg-[radial-gradient(ellipse_at_top,rgb(144_0_0/0.12),transparent_60%)]"
      />

      <Breadcrumb items={[{ label: 'Home', to: ROUTES.HOME }, { label: 'Cart' }]} />

      <motion.div
        className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
        initial={reduceMotion ? false : 'hidden'}
        animate="visible"
        variants={fadeUp}
        transition={tweenOut}
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">Checkout prep</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Your cart
          </h1>
          <p className="mt-2 text-ink-muted">
            {itemCount === 0
              ? 'Add pickles, chatni, rotti, or holige to get started.'
              : `${itemCount} item${itemCount === 1 ? '' : 's'} ready for checkout.`}
          </p>
        </div>
        {itemCount > 0 ? (
          <motion.span
            key={itemCount}
            initial={reduceMotion ? false : { scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springSoft}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-brand-50 px-3.5 py-1.5 text-sm font-semibold text-brand-700 ring-1 ring-brand-100"
          >
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            {itemCount} in bag
          </motion.span>
        ) : null}
      </motion.div>

      <AnimatePresence mode="wait">
        {itemCount === 0 ? (
          <motion.div
            key="empty"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={tweenOut}
            className="overflow-hidden rounded-[2rem] border border-border/80 bg-surface-elevated px-6 py-16 text-center shadow-[0_24px_60px_-40px_rgb(144_0_0/0.4)]"
          >
            <motion.div
              className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-50 text-brand-600"
              animate={reduceMotion ? undefined : { y: [0, -6, 0] }}
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ShoppingBag className="h-7 w-7" aria-hidden />
            </motion.div>
            <h2 className="font-display text-2xl font-semibold text-ink">Your cart is empty</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-muted">
              Browse mango pickle, senga chatni, jawar rotti, kai holige, and more.
            </p>
            <Button
              className="mt-7"
              size="lg"
              rightIcon={<ArrowRight className="h-4 w-4" />}
              onClick={() => navigate(ROUTES.PRODUCTS)}
            >
              Browse menu
            </Button>
          </motion.div>
        ) : (
          <motion.div
            key="filled"
            className="grid items-start gap-6 lg:grid-cols-[1.35fr_0.85fr] lg:gap-8"
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
          >
            <motion.section
              variants={fadeUp}
              transition={tweenOut}
              className="overflow-hidden rounded-[1.75rem] border border-border/80 bg-surface-elevated shadow-[0_18px_50px_-36px_rgb(61_8_8/0.28)]"
            >
              <div className="border-b border-border/70 px-5 py-4 sm:px-6">
                <h2 className="font-display text-lg font-semibold text-ink">Items</h2>
                <p className="text-sm text-ink-muted">Adjust quantities or remove anything you do not need.</p>
              </div>
              <ul className="divide-y divide-border/70 px-3 sm:px-4">
                <AnimatePresence initial={false}>
                  {cart.items.map((item, index) => (
                    <CartItemRow
                      key={item.id}
                      item={item}
                      index={index}
                      onQuantityChange={updateQuantity}
                      onRemove={removeItem}
                    />
                  ))}
                </AnimatePresence>
              </ul>
            </motion.section>

            <motion.aside
              variants={fadeUp}
              transition={tweenOut}
              className="overflow-hidden rounded-[1.75rem] border border-brand-100 bg-surface-elevated shadow-[0_24px_60px_-34px_rgb(144_0_0/0.45)] lg:sticky lg:top-24"
            >
              <div className="bg-gradient-to-br from-brand-500 to-brand-700 px-5 py-5 text-white sm:px-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/75">
                  Order summary
                </p>
                <p className="mt-1 font-display text-2xl font-semibold">Almost there</p>
                <p className="mt-1 text-sm text-white/80">
                  Free delivery once your subtotal reaches ₹500.
                </p>
              </div>
              <div className="px-5 py-5 sm:px-6">
                <PriceSummaryView summary={priceSummary} animated />
                <motion.div whileHover={reduceMotion ? undefined : { scale: 1.01 }} whileTap={reduceMotion ? undefined : { scale: 0.99 }}>
                  <Button
                    fullWidth
                    className="mt-6"
                    size="lg"
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                    onClick={handleCheckout}
                  >
                    {isAuthenticated ? 'Proceed to checkout' : 'Sign in to checkout'}
                  </Button>
                </motion.div>
                <Button
                  fullWidth
                  className="mt-2"
                  variant="ghost"
                  onClick={() => navigate(ROUTES.PRODUCTS)}
                >
                  Continue shopping
                </Button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>

      {itemCount > 0 ? (
        <motion.p
          className="mt-8 text-center text-xs text-ink-muted"
          initial={reduceMotion ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
        >
          Guest carts stay on this device until you sign in and merge at checkout.
        </motion.p>
      ) : null}
    </div>
  )
}
