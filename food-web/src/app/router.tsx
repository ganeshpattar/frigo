import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { CustomerLayout } from '@/layouts/CustomerLayout'
import { ManagerLayout } from '@/layouts/ManagerLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { ProtectedRoute } from '@/features/auth'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import { ROUTES } from '@/constants'

const HomePage = lazy(() =>
  import('@/pages/public/HomePage').then((m) => ({ default: m.HomePage })),
)
const ProductsPage = lazy(() =>
  import('@/pages/public/ProductsPage').then((m) => ({ default: m.ProductsPage })),
)
const ProductDetailPage = lazy(() =>
  import('@/pages/public/ProductDetailPage').then((m) => ({ default: m.ProductDetailPage })),
)
const CategoryPage = lazy(() =>
  import('@/pages/public/CategoryPage').then((m) => ({ default: m.CategoryPage })),
)
const SearchPage = lazy(() =>
  import('@/pages/public/SearchPage').then((m) => ({ default: m.SearchPage })),
)
const CartPage = lazy(() =>
  import('@/pages/public/CartPage').then((m) => ({ default: m.CartPage })),
)
const LoginPage = lazy(() =>
  import('@/pages/public/LoginPage').then((m) => ({ default: m.LoginPage })),
)
const RegisterPage = lazy(() =>
  import('@/pages/public/RegisterPage').then((m) => ({ default: m.RegisterPage })),
)
const ForgotPasswordPage = lazy(() =>
  import('@/pages/public/ForgotPasswordPage').then((m) => ({ default: m.ForgotPasswordPage })),
)
const ResetPasswordPage = lazy(() =>
  import('@/pages/public/ResetPasswordPage').then((m) => ({ default: m.ResetPasswordPage })),
)
const PlaceholderPage = lazy(() =>
  import('@/pages/PlaceholderPage').then((m) => ({ default: m.PlaceholderPage })),
)
const ManagerDashboardPage = lazy(() =>
  import('@/pages/manager/ManagerDashboardPage').then((m) => ({
    default: m.ManagerDashboardPage,
  })),
)
const ManagerOrdersPage = lazy(() =>
  import('@/pages/manager/ManagerOrdersPage').then((m) => ({
    default: m.ManagerOrdersPage,
  })),
)
const ManagerOrderDetailPage = lazy(() =>
  import('@/pages/manager/ManagerOrderDetailPage').then((m) => ({
    default: m.ManagerOrderDetailPage,
  })),
)
const ManagerCustomersPage = lazy(() =>
  import('@/pages/manager/ManagerCustomersPage').then((m) => ({
    default: m.ManagerCustomersPage,
  })),
)
const ManagerInventoryPage = lazy(() =>
  import('@/pages/manager/ManagerInventoryPage').then((m) => ({
    default: m.ManagerInventoryPage,
  })),
)
const AdminDashboardPage = lazy(() =>
  import('@/pages/admin/AdminDashboardPage').then((m) => ({ default: m.AdminDashboardPage })),
)
const CheckoutPage = lazy(() =>
  import('@/pages/customer/CheckoutPage').then((m) => ({ default: m.CheckoutPage })),
)
const OrdersPage = lazy(() =>
  import('@/pages/customer/OrdersPage').then((m) => ({ default: m.OrdersPage })),
)
const AdminUsersPage = lazy(() =>
  import('@/pages/admin/AdminUsersPage').then((m) => ({ default: m.AdminUsersPage })),
)
const AdminRolesPage = lazy(() =>
  import('@/pages/admin/AdminRolesPage').then((m) => ({ default: m.AdminRolesPage })),
)
const AdminCustomersPage = lazy(() =>
  import('@/pages/admin/AdminCustomersPage').then((m) => ({ default: m.AdminCustomersPage })),
)
const AdminCategoriesPage = lazy(() =>
  import('@/pages/admin/AdminCategoriesPage').then((m) => ({ default: m.AdminCategoriesPage })),
)
const AdminProductsPage = lazy(() =>
  import('@/pages/admin/AdminProductsPage').then((m) => ({ default: m.AdminProductsPage })),
)
const AdminProductFormPage = lazy(() =>
  import('@/pages/admin/AdminProductFormPage').then((m) => ({ default: m.AdminProductFormPage })),
)
const AdminInventoryPage = lazy(() =>
  import('@/pages/admin/AdminInventoryPage').then((m) => ({ default: m.AdminInventoryPage })),
)
const AdminOrdersPage = lazy(() =>
  import('@/pages/admin/AdminOrdersPage').then((m) => ({ default: m.AdminOrdersPage })),
)

function SuspensePage({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[40vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      }
    >
      {children}
    </Suspense>
  )
}

function placeholder(title: string) {
  return (
    <SuspensePage>
      <PlaceholderPage title={title} />
    </SuspensePage>
  )
}

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      {
        path: ROUTES.HOME,
        element: (
          <SuspensePage>
            <HomePage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.PRODUCTS,
        element: (
          <SuspensePage>
            <ProductsPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.PRODUCT_DETAIL,
        element: (
          <SuspensePage>
            <ProductDetailPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.CATEGORY,
        element: (
          <SuspensePage>
            <CategoryPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.SEARCH,
        element: (
          <SuspensePage>
            <SearchPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.CART,
        element: (
          <SuspensePage>
            <CartPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.LOGIN,
        element: (
          <SuspensePage>
            <LoginPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.REGISTER,
        element: (
          <SuspensePage>
            <RegisterPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.FORGOT_PASSWORD,
        element: (
          <SuspensePage>
            <ForgotPasswordPage />
          </SuspensePage>
        ),
      },
      {
        path: ROUTES.RESET_PASSWORD,
        element: (
          <SuspensePage>
            <ResetPasswordPage />
          </SuspensePage>
        ),
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['CUSTOMER', 'ADMIN', 'MANAGER']} />,
    children: [
      {
        element: <CustomerLayout />,
        children: [
          {
            path: ROUTES.CHECKOUT,
            element: (
              <SuspensePage>
                <CheckoutPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ORDERS,
            element: (
              <SuspensePage>
                <OrdersPage />
              </SuspensePage>
            ),
          },
          { path: ROUTES.ORDER_DETAIL, element: placeholder('Order details') },
          { path: ROUTES.PROFILE, element: placeholder('Profile') },
          { path: ROUTES.PROFILE_ADDRESSES, element: placeholder('Addresses') },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['MANAGER', 'ADMIN']} />,
    children: [
      {
        element: <ManagerLayout />,
        children: [
          {
            path: ROUTES.MANAGER,
            element: (
              <SuspensePage>
                <ManagerDashboardPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.MANAGER_ORDERS,
            element: (
              <SuspensePage>
                <ManagerOrdersPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.MANAGER_ORDER_DETAIL,
            element: (
              <SuspensePage>
                <ManagerOrderDetailPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.MANAGER_CUSTOMERS,
            element: (
              <SuspensePage>
                <ManagerCustomersPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.MANAGER_INVENTORY,
            element: (
              <SuspensePage>
                <ManagerInventoryPage />
              </SuspensePage>
            ),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute roles={['ADMIN']} />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          {
            path: ROUTES.ADMIN,
            element: (
              <SuspensePage>
                <AdminDashboardPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_USERS,
            element: (
              <SuspensePage>
                <AdminUsersPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_ROLES,
            element: (
              <SuspensePage>
                <AdminRolesPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_CUSTOMERS,
            element: (
              <SuspensePage>
                <AdminCustomersPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_CATEGORIES,
            element: (
              <SuspensePage>
                <AdminCategoriesPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_PRODUCTS,
            element: (
              <SuspensePage>
                <AdminProductsPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_PRODUCT_NEW,
            element: (
              <SuspensePage>
                <AdminProductFormPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_PRODUCT_EDIT,
            element: (
              <SuspensePage>
                <AdminProductFormPage />
              </SuspensePage>
            ),
          },
          { path: ROUTES.ADMIN_PRICING, element: placeholder('Pricing') },
          {
            path: ROUTES.ADMIN_INVENTORY,
            element: (
              <SuspensePage>
                <AdminInventoryPage />
              </SuspensePage>
            ),
          },
          {
            path: ROUTES.ADMIN_ORDERS,
            element: (
              <SuspensePage>
                <AdminOrdersPage />
              </SuspensePage>
            ),
          },
          { path: ROUTES.ADMIN_ORDER_DETAIL, element: placeholder('Order detail') },
          { path: ROUTES.ADMIN_PAYMENTS, element: placeholder('Payments') },
          { path: ROUTES.ADMIN_NOTIFICATIONS, element: placeholder('Notifications') },
          { path: ROUTES.ADMIN_AUDIT, element: placeholder('Audit log') },
        ],
      },
    ],
  },
  { path: '*', element: <Navigate to={ROUTES.HOME} replace /> },
])
