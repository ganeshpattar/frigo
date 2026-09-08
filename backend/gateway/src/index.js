import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import { createProxyMiddleware } from 'http-proxy-middleware'

const port = Number(process.env.PORT ?? 8080)
const authServiceUrl = process.env.AUTH_SERVICE_URL ?? 'http://localhost:4001'
const userServiceUrl = process.env.USER_SERVICE_URL ?? 'http://localhost:4002'
const platformServiceUrl = process.env.PLATFORM_SERVICE_URL ?? 'http://localhost:4003'

const app = express()
app.use(helmet())
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' })
})

function rewriteAuthPath(url) {
  const stripped = url
    .replace(/^\/api\/v1\/auth/, '')
    .replace(/^\/auth/, '')
  const suffix = stripped.startsWith('/') ? stripped : `/${stripped}`
  return `/auth${suffix === '/' ? '' : suffix}`
}

function createServiceProxy(target, rewrite) {
  return createProxyMiddleware({
    target,
    changeOrigin: true,
    pathRewrite: (_path, req) => rewrite(req.originalUrl ?? _path),
    on: {
      error: (err, req, res) => {
        console.error(
          `[gateway] proxy failed ${req.method} ${req.originalUrl} -> ${target}: ${err.message}`,
        )
        if (!res.headersSent) {
          res.status(502).json({
            message: 'Upstream service unavailable. Ensure all backend services are running.',
            path: req.originalUrl,
          })
        }
      },
    },
  })
}

const authProxy = createServiceProxy(authServiceUrl, rewriteAuthPath)

// Primary API path + legacy alias when clients omit /api/v1
app.use('/api/v1/auth', authProxy)
app.use('/auth', authProxy)

app.use(
  '/api/v1/users',
  createServiceProxy(authServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/users/, '')
    return `/auth/admin/users${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/roles',
  createServiceProxy(authServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/roles/, '')
    return `/auth/admin/roles${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/admin-customers',
  createServiceProxy(authServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/admin-customers/, '')
    return `/auth/admin/customers${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/customers',
  createServiceProxy(userServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/customers/, '')
    return `/customers${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/categories',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/categories/, '')
    return `/categories${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/products',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/products/, '')
    return `/products${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/inventory',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/inventory/, '')
    return `/inventory${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/orders',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/orders/, '')
    return `/orders${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/checkout',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/checkout/, '')
    return `/checkout${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/manager',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/manager/, '')
    return `/manager${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.use(
  '/api/v1/admin',
  createServiceProxy(platformServiceUrl, (url) => {
    const suffix = url.replace(/^\/api\/v1\/admin/, '')
    return `/admin${suffix.startsWith('/') ? suffix : `/${suffix}`}`
  }),
)

app.listen(port, () => {
  console.log(`API Gateway listening on :${port}`)
})
