# Deploy Frigo Backend to Render + Neon

Your backend has **4 services** on Render plus **Neon PostgreSQL** (already set up).

| Service | Render name | Public URL (example) |
|---------|-------------|----------------------|
| API Gateway | `frigo-gateway` | `https://frigo-gateway.onrender.com` |
| Auth | `frigo-auth` | internal + public |
| User | `frigo-user` | internal + public |
| Platform | `frigo-platform` | internal + public |

The **gateway URL** is what the frontend uses:  
`https://frigo-gateway.onrender.com/api/v1`

---

## Step 1 — Push code to GitHub

### 1.1 Create a GitHub repository

1. Go to [github.com/new](https://github.com/new)
2. Name it e.g. `frigo` (or `frigo-backend`)
3. **Do not** add README, .gitignore, or license (we already have them)
4. Click **Create repository**

### 1.2 Push your local project

Open PowerShell in `D:\Frigo`:

```powershell
cd D:\Frigo

git init
git add .
git commit -m "Initial commit: Frigo food platform"

git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/frigo.git
git push -u origin main
```

Replace `YOUR_USERNAME/frigo` with your actual GitHub repo.

> **Important:** `.env` files are gitignored. Secrets stay on your machine and in Render dashboard only.

---

## Step 2 — Connect GitHub to Render

1. Sign up / log in at [render.com](https://render.com)
2. Click **New +** → **Blueprint**
3. Click **Connect account** → authorize **GitHub**
4. Select your `frigo` repository
5. Render detects `render.yaml` at the repo root — click **Apply**

---

## Step 3 — Set environment variables in Render

During blueprint setup (or after, in each service’s **Environment** tab):

### All 3 database services (`frigo-auth`, `frigo-user`, `frigo-platform`)

Set the **same** Neon connection string on each:

| Key | Value |
|-----|--------|
| `DATABASE_URL` | Your Neon URL (see below) |

**Neon URL format** (use the **pooler** host, `sslmode=require`):

```
postgresql://USER:PASSWORD@ep-xxxx-pooler.region.aws.neon.tech/neondb?sslmode=require
```

Do **not** include `channel_binding=require` — Node `pg` works better without it.

### `frigo-auth` only

Render auto-generates `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` from the blueprint.  
`USER_SERVICE_URL` is wired automatically from `frigo-user`.

Also set these **SMTP** values (required for signup OTP email):

| Key | Value |
|-----|--------|
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` (set by blueprint) |
| `SMTP_SECURE` | `false` (set by blueprint) |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASS` | Gmail App Password |
| `SMTP_FROM` | `Tirumala Foods <support@tirumalafoods.com>` (set by blueprint) |

`EXPOSE_DEMO_RESET_CODE` is `false` in production (OTP only via email).

For `support@tirumalafoods.com` as From, add that address under Gmail **Settings → Accounts → Send mail as**.

### `frigo-platform` only

`JWT_ACCESS_SECRET` is copied from `frigo-auth` automatically.

### `frigo-gateway`

`AUTH_SERVICE_URL`, `USER_SERVICE_URL`, and `PLATFORM_SERVICE_URL` are wired automatically.

---

## Step 4 — Deploy

1. Click **Apply** on the blueprint
2. Wait for all 4 services to show **Live** (first deploy can take 5–10 minutes)
3. Open `frigo-gateway` → copy the URL, e.g. `https://frigo-gateway.onrender.com`

### Test the API

```text
GET https://frigo-gateway.onrender.com/health
```

Should return: `{"status":"ok","service":"api-gateway"}`

---

## Step 5 — Seed demo data (one time)

After the first successful deploy:

1. In Render, open **frigo-auth** → **Shell**
2. Run:

```bash
npm run seed -w @frigo/auth-service
```

3. Open **frigo-platform** → **Shell**

```bash
npm run seed -w @frigo/platform-service
```

This creates demo users (`admin@frigo.test` / `Admin123!`) and products.

---

## Step 6 — Point the frontend to Render

In `food-web/.env` (or Vercel env vars):

```env
VITE_API_BASE_URL=https://frigo-gateway.onrender.com/api/v1
VITE_USE_MOCKS=false
VITE_USE_AUTH_MOCKS=false
```

Restart / redeploy the frontend.

---

## Deploy order (automatic)

`render.yaml` deploys services in dependency order:

1. `frigo-user`
2. `frigo-auth` (needs user URL)
3. `frigo-platform` (needs auth JWT secret)
4. `frigo-gateway` (needs all three URLs)

Migrations run automatically on each DB service start (`migrate && start`), which works on Render free tier.

---

## Free tier notes

- Services **sleep after ~15 minutes** of no traffic; first request may take 30–60 seconds
- Neon free tier: 0.5 GB storage — fine for demos
- Rotate Neon password if it was ever shared in chat

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Build fails `npm install` | Ensure `rootDir` is `backend` in Render service settings |
| `Missing env DATABASE_URL` | Add Neon URL to auth, user, and platform services |
| 502 from gateway | Check auth/user/platform are **Live**; open their logs |
| Register/login 500 | Run seeds; check Neon migrations completed in deploy logs |
| OTP email not sending | Set `SMTP_HOST` / `SMTP_USER` / `SMTP_PASS` on **frigo-auth**; confirm App Password |
| From shows Gmail not support@ | Add `support@tirumalafoods.com` in Gmail “Send mail as” |
| CORS errors from Vercel | Gateway already allows all origins; redeploy gateway if needed |

---

## Manual deploy (without Blueprint)

If you prefer creating services one by one:

| Service | Root directory | Start command |
|---------|----------------|---------------|
| frigo-auth | `backend` | `npm run start -w @frigo/auth-service` |
| frigo-user | `backend` | `npm run start -w @frigo/user-service` |
| frigo-platform | `backend` | `npm run start -w @frigo/platform-service` |
| frigo-gateway | `backend` | `npm run start -w @frigo/gateway` |

Build command for all: `npm install`
