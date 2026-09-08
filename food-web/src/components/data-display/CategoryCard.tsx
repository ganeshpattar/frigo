import { Link } from 'react-router-dom'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import type { Category } from '@/types'
import { categoryPath } from '@/constants/routes'
import { ProductImage } from './ProductImage'
import { fadeUp, springSoft } from '@/utils/motion'

interface CategoryCardProps {
  category: Category
}

export function CategoryCard({ category }: CategoryCardProps) {
  const reduceMotion = useReducedMotion()

  return (
    <motion.div
      variants={fadeUp}
      whileHover={reduceMotion ? undefined : { y: -4 }}
      transition={springSoft}
    >
      <Link
        to={categoryPath(category.id)}
        className="group relative block overflow-hidden rounded-[1.5rem] border border-border/70 bg-brand-800 shadow-sm"
      >
        <ProductImage src={category.imageUrl} alt={category.name} aspect="video" />
        <div className="absolute inset-0 bg-gradient-to-t from-brand-900/90 via-brand-900/30 to-transparent transition-opacity duration-500" />
        <div className="absolute inset-x-0 bottom-0 p-4 text-white sm:p-5">
          <h3 className="font-display text-lg font-semibold tracking-tight sm:text-xl">
            {category.name}
          </h3>
          {category.productCount != null ? (
            <p className="mt-1 text-sm text-white/75">{category.productCount} items</p>
          ) : null}
          <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-200 transition-transform duration-300 group-hover:translate-x-1">
            Browse <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </div>
      </Link>
    </motion.div>
  )
}
