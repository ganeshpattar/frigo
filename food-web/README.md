# Tirumal Foods Web Application

React + TypeScript + Vite storefront for the Food Ordering Platform.

## Stack

- React 19 + TypeScript (strict)
- Vite
- Tailwind CSS v4
- React Router
- Axios (API Gateway client)
- React Hook Form
- Lucide React

## Getting started

```bash
cp .env.example .env
npm install
npm run dev
```

## Scripts

- `npm run dev` — local development
- `npm run build` — production build
- `npm run type-check` — TypeScript project references check
- `npm run lint` — ESLint
- `npm test` — Vitest unit tests

## Demo accounts (mock mode)

| Role | Email | Password |
|------|-------|----------|
| Customer | customer@frigo.test | Customer123! |
| Manager | manager@frigo.test | Manager123! |
| Admin | admin@frigo.test | Admin123! |

Mocks are enabled when `VITE_USE_MOCKS` is not `false`. Catalog and auth use local mock data until the API Gateway is available.
