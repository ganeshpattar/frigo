# Frigo Backend — Auth APIs

Node.js (ESM JavaScript) microservices aligned with `Food_Microservices_ERD.md`. Uses real PostgreSQL via the `pg` driver.

## Services

| Service | Port | Database | Responsibility |
|---------|------|----------|----------------|
| API Gateway | `8080` | — | Routes `/api/v1/*` |
| Auth Service | `4001` | `frigo` | Sign up, sign in, forgot/reset password, tokens, RBAC, admin users |
| User Service | `4002` | `frigo` | Customer profiles (first/last name, phone) |
| Platform Service | `4003` | `frigo` | Categories, products, inventory, orders, admin dashboard |

## Auth endpoints (via gateway)

```http
POST /api/v1/auth/register
POST /api/v1/auth/login
POST /api/v1/auth/forgot-password
POST /api/v1/auth/reset-password
POST /api/v1/auth/refresh
POST /api/v1/auth/logout
GET  /api/v1/auth/me
```

### Example bodies

**Register**
```json
{
  "email": "new@frigo.test",
  "password": "Customer123!",
  "firstName": "New",
  "lastName": "User",
  "phone": "9876543210"
}
```

**Login**
```json
{ "email": "customer@frigo.test", "password": "Customer123!" }
```

**Forgot password**
```json
{ "email": "customer@frigo.test" }
```

**Reset password**
```json
{
  "email": "customer@frigo.test",
  "code": "123456",
  "password": "Customer123!"
}
```

## Prerequisites

- Node.js 22+
- **Local PostgreSQL 18** on `127.0.0.1:5432` (recommended), **or** Docker Compose Postgres

## Setup (local Postgres)

```bash
cd backend
cp services/auth-service/.env.example services/auth-service/.env
cp services/user-service/.env.example services/user-service/.env
cp gateway/.env.example gateway/.env

npm install

# Create database `frigo` (default: postgres / root)
npm run db:setup

# Create all tables inside `frigo`
npm run db:migrate

# Optional demo users (user-service must be running for profiles)
npm run db:seed
npm run seed:platform

# Start all services (user :4002, auth :4001, platform :4003, gateway :8080)
npm run dev
```

Or start one service at a time:

```bash
npm run dev:user
npm run dev:auth
npm run dev:platform
npm run dev:gateway
```

Connection string (all services):

- `postgresql://postgres:root@127.0.0.1:5432/frigo`

Admin login: `admin@frigo.test` / `Admin123!`

### Admin / catalog APIs (via gateway)

```http
GET  /api/v1/admin/dashboard
GET  /api/v1/users
GET  /api/v1/products
POST /api/v1/products
PATCH /api/v1/products/:id
DELETE /api/v1/products/:id
GET  /api/v1/inventory
PATCH /api/v1/inventory/:productId
GET  /api/v1/orders
PATCH /api/v1/orders/:id/status
GET  /api/v1/categories
```

Override admin URL if needed:

```bash
set PG_ADMIN_URL=postgresql://postgres:root@127.0.0.1:5432/postgres
npm run db:setup
```

## Setup (optional Docker PostgreSQL)

Single container with database `frigo` on host port **5432**:

```bash
npm run db:up
# DATABASE_URL already points at postgresql://postgres:root@127.0.0.1:5432/frigo
```

## Demo users (after seed)

| Email | Password | Role |
|-------|----------|------|
| `customer@frigo.test` | `Customer123!` | CUSTOMER |
| `manager@frigo.test` | `Manager123!` | MANAGER |
| `admin@frigo.test` | `Admin123!` | ADMIN |

Forgot-password returns `demoCode` when `EXPOSE_DEMO_RESET_CODE=true` (local only).

## Schema notes

- Auth tables follow ERD §3 (`users`, `roles`, `permissions`, `role_permissions`, `user_roles`, `refresh_tokens`, `auth_outbox`).
- `password_reset_tokens` is an Auth-owned extension for forgot/reset.
- User profiles live in `frigo.customer_profiles` (ERD §4). Auth calls User Service over HTTP on register/login enrichment.
- All tables live in one database: **`frigo`**.

## Point web/mobile at the API

Set:

```env
VITE_API_BASE_URL=http://localhost:8080/api/v1
VITE_USE_MOCKS=false
```

Mobile:

```js
USE_MOCKS: false
API_BASE_URL: 'http://10.0.2.2:8080/api/v1' // Android emulator
```
