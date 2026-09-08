import { Link, useNavigate } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, Leaf, Sparkles, Truck } from 'lucide-react'
import { ROUTES, categoryPath, productPath } from '@/constants'
import { useCategories, useProducts } from '@/hooks'
import { Button } from '@/components/common/Button'
import { ProductGrid } from '@/components/data-display/ProductGrid'
import { ErrorState } from '@/components/common/ErrorState'
import { useCart, useUI } from '@/context'
import type { Product } from '@/types'
import { BrandLogo } from '@/components/brand/BrandLogo'
import { ProductImage } from '@/components/data-display/ProductImage'
import { fadeUp, staggerContainer, tweenOut, viewportOnce } from '@/utils/motion'
import { formatCurrency } from '@/utils/format'
import heroImage from '@/assets/Image_5.jpeg'

const highlights = [
  {
    icon: Leaf,
    title: 'Kitchen classics',
    text: 'Pickles, dry chatni, millet rotti, and festive holige.',
  },
  {
    icon: Sparkles,
    title: 'Fresh batches',
    text: 'Jawar, sajji, and ragi rotti prepared when you order.',
  },
  {
    icon: Truck,
    title: 'Guest checkout',
    text: 'Browse freely — sign in only when you are ready.',
  },
]

export function HomePage() {
  const navigate = useNavigate()
  const reduceMotion = useReducedMotion()
  const { categories, isLoading: catLoading, error: catError, refresh: refreshCats } =
    useCategories()
  const { products, isLoading, error, refresh } = useProducts({ pageSize: 8, sort: 'newest' })
  const { addItem } = useCart()
  const { pushToast } = useUI()

  const featured = products.find((p) => p.tags?.includes('popular')) ?? products[0]
  const handleAdd = (product: Product) => {
    addItem(product, 1)
    pushToast({ title: 'Added to cart', description: product.name, variant: 'success' })
  }

  return (
    <div>
      {/* Full-bleed hero — brand, headline, support, CTAs only */}
      <section className="relative isolate min-h-[min(92vh,860px)] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src={heroImage}
            alt=""
            aria-hidden
            className={`h-full w-full object-cover ${reduceMotion ? '' : 'animate-ken-burns'}`}
          />
          <div className="hero-scrim absolute inset-0" />
        </div>

        <div className="relative z-10 mx-auto flex min-h-[min(92vh,860px)] max-w-7xl flex-col justify-end px-4 pb-16 pt-28 sm:px-6 sm:pb-20 lg:justify-center lg:pb-24">
          <motion.div
            className="max-w-xl"
            initial={reduceMotion ? false : 'hidden'}
            animate="visible"
            variants={staggerContainer}
          >
            <motion.div variants={fadeUp} transition={tweenOut} className="mb-6">
              <BrandLogo size="xl" to={null} variant="onDark" />
            </motion.div>
            <motion.h1
              variants={fadeUp}
              transition={tweenOut}
              className="font-display text-3xl font-semibold leading-tight tracking-tight text-white text-balance sm:text-4xl lg:text-5xl"
            >
              Homestyle pickles, chatni, rotti &amp; holige — made fresh.
            </motion.h1>
            <motion.p
              variants={fadeUp}
              transition={tweenOut}
              className="mt-4 max-w-md text-base text-white/80 sm:text-lg"
            >
              North Karnataka favourites, ready for your table.
            </motion.p>
            <motion.div
              variants={fadeUp}
              transition={tweenOut}
              className="mt-8 flex flex-wrap gap-3"
            >
              <Button
                size="lg"
                rightIcon={<ArrowRight className="h-4 w-4" />}
                onClick={() => navigate(ROUTES.PRODUCTS)}
              >
                Explore menu
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="!border-white/35 !bg-white/10 !text-white backdrop-blur-sm hover:!bg-white/20"
                onClick={() => navigate(ROUTES.SEARCH)}
              >
                Search items
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Shop by category */}
      <section className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <motion.div
          initial={reduceMotion ? false : 'hidden'}
          whileInView="visible"
          viewport={viewportOnce}
          variants={staggerContainer}
        >
          <motion.div variants={fadeUp} transition={tweenOut} className="mb-8 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              Shop the kitchen
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
              Four essentials
            </h2>
            <p className="mt-2 text-ink-muted">
              Pickles, Chatni, Rotti, and Holige — tap a category to browse every item.
            </p>
          </motion.div>

          {catError ? (
            <ErrorState description={catError} onRetry={refreshCats} />
          ) : (
            <motion.div
              variants={staggerContainer}
              className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
            >
              {(catLoading ? [] : categories).map((category, index) => (
                <motion.div
                  key={category.id}
                  variants={fadeUp}
                  transition={{ ...tweenOut, delay: index * 0.05 }}
                >
                  <Link
                    to={categoryPath(category.id)}
                    className="group relative block aspect-[4/5] overflow-hidden rounded-[1.75rem] bg-brand-800"
                  >
                    <ProductImage
                      src={category.imageUrl}
                      alt={category.name}
                      aspect="fill"
                      className="absolute inset-0"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/25 to-transparent transition-opacity duration-500 group-hover:from-brand-900/95" />
                    <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                      <h3 className="font-display text-2xl font-semibold tracking-tight">
                        {category.name}
                      </h3>
                      <p className="mt-1 text-sm text-white/75 line-clamp-2">
                        {category.description}
                      </p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-200 transition-transform duration-300 group-hover:translate-x-1">
                        Browse
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </Link>
                </motion.div>
              ))}
              {catLoading
                ? Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="aspect-[4/5] animate-pulse rounded-[1.75rem] bg-border/70"
                    />
                  ))
                : null}
            </motion.div>
          )}
        </motion.div>
      </section>

      {/* Featured spotlight */}
      {featured ? (
        <section className="border-y border-border/70 bg-surface-elevated">
          <div className="mx-auto grid max-w-7xl gap-0 lg:grid-cols-2">
            <motion.div
              className="relative min-h-[320px] overflow-hidden lg:min-h-[480px]"
              initial={reduceMotion ? false : { opacity: 0, scale: 1.04 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={viewportOnce}
              transition={tweenOut}
            >
              <ProductImage
                src={
                  featured.images.find((i) => i.isPrimary)?.url ?? featured.images[0]?.url
                }
                alt={featured.name}
                aspect="fill"
                className="absolute inset-0"
              />
            </motion.div>
            <div className="flex flex-col justify-center px-6 py-14 sm:px-10 lg:px-16">
              <motion.div
                initial={reduceMotion ? false : 'hidden'}
                whileInView="visible"
                viewport={viewportOnce}
                variants={staggerContainer}
              >
                <motion.p
                  variants={fadeUp}
                  transition={tweenOut}
                  className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600"
                >
                  Kitchen favourite
                </motion.p>
                <motion.h2
                  variants={fadeUp}
                  transition={tweenOut}
                  className="mt-3 font-display text-3xl font-semibold text-ink sm:text-4xl"
                >
                  {featured.name}
                </motion.h2>
                <motion.p
                  variants={fadeUp}
                  transition={tweenOut}
                  className="mt-4 max-w-md text-base leading-relaxed text-ink-muted"
                >
                  {featured.description}
                </motion.p>
                <motion.div
                  variants={fadeUp}
                  transition={tweenOut}
                  className="mt-8 flex flex-wrap gap-3"
                >
                  <Button
                    size="lg"
                    onClick={() => handleAdd(featured)}
                    disabled={!featured.isAvailable}
                  >
                    Add to cart · {formatCurrency(featured.unitPrice, featured.currency)}
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() => navigate(productPath(featured.id))}
                  >
                    View details
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>
      ) : null}

      {/* Popular grid */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand-600">
              Order now
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">Popular right now</h2>
            <p className="mt-2 text-ink-muted">
              Guest-friendly browsing — checkout totals confirmed securely later.
            </p>
          </div>
          <Link
            to={ROUTES.PRODUCTS}
            className="hidden items-center gap-1 text-sm font-semibold text-brand-600 transition-colors hover:text-brand-700 sm:inline-flex"
          >
            View full menu
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        {error ? (
          <ErrorState description={error} onRetry={refresh} />
        ) : (
          <ProductGrid products={products} isLoading={isLoading} onAddToCart={handleAdd} />
        )}
      </section>

      {/* Promise strip — one purpose, no cards */}
      <section className="border-t border-border/70 bg-brand-800 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:grid-cols-3 sm:px-6 sm:py-16">
          {highlights.map(({ icon: Icon, title, text }, index) => (
            <motion.div
              key={title}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ ...tweenOut, delay: index * 0.08 }}
            >
              <Icon className="h-6 w-6 text-brand-300" aria-hidden />
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/70">{text}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
