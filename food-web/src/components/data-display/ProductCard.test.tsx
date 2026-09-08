import { MemoryRouter } from 'react-router-dom'
import { render, screen } from '@testing-library/react'
import { ProductCard } from '@/components/data-display/ProductCard'
import type { Product } from '@/types'

const product: Product = {
  id: 'prod_1',
  name: 'Test Burger',
  slug: 'test-burger',
  description: 'A tasty test burger',
  shortDescription: 'Tasty burger',
  categoryId: 'cat_1',
  categoryName: 'Burgers',
  status: 'ACTIVE',
  unitPrice: 12.5,
  currency: 'INR',
  isAvailable: true,
  images: [
    {
      id: 'img_1',
      url: 'https://example.com/burger.jpg',
      altText: 'Test Burger',
      isPrimary: true,
      sortOrder: 0,
    },
  ],
}

describe('ProductCard', () => {
  it('renders product name and price', () => {
    render(
      <MemoryRouter>
        <ProductCard product={product} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Test Burger')).toBeInTheDocument()
    expect(screen.getByText(/₹12\.5/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /add test burger to cart/i })).toBeEnabled()
  })
})
