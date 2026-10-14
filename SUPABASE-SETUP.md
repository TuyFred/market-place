# Connect AFROLUXO to real Supabase

Your shop already talks to Supabase for **products, categories, orders, login, and signup**.  
You only need to paste your project keys once.

## 1. Create a Supabase project

1. Open [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. **New project** → wait until it is ready
3. **Project Settings → API** → copy:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon** `public` key
   - **service_role** `secret` key (keep private)

## 2. Paste keys into `.env` files

### `backend/.env`

```env
PORT=4000
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...your_service_role_key
CORS_ORIGIN=*
```

### `frontend/.env` (local)

```env
VITE_WHATSAPP_NUMBER=+250784017000
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...your_anon_key
# Leave empty locally so Vite proxies /api to localhost:4000
VITE_API_URL=
```

Replace `xxxxx` and the keys with yours. WhatsApp number = the shop number that receives orders.

## 3. Create tables

1. Supabase → **SQL Editor** → New query  
2. Paste the full file **`supabase-schema.sql`** → **Run**

## 4. Seed admin + products

```bash
cd backend
npm run check-db
npm run seed-admin
npm run seed-products
npm run dev
```

```bash
cd frontend
npm run dev
```

- Shop: http://localhost:5173  
- API health: http://localhost:4000/health (must say database connected)  
- Admin login: `admin@system.com` / `admin123@` (created only by `npm run seed-admin`)  
- Public **Sign up** always creates a **customer** (cannot self-assign admin)  
- Security model: see **SECURITY.md**

## 5. What works after this

| Feature | How |
|--------|-----|
| Real products | From Supabase `products` table (seeded or added in admin) |
| Sign up / Sign in | Supabase Auth via backend `/api/auth/*` |
| Place order (checkout) | Saved in Supabase `orders` |
| WhatsApp order | Opens WhatsApp with product name, price, **and product page link** |

## 6. Production (Render + GitHub Pages / Namecheap)

- Put the same `SUPABASE_*` values on your **Render** backend env  
- Set frontend production vars (`VITE_API_URL` = your Render URL, WhatsApp, Supabase anon) before build  
- Set `CORS_ORIGIN=https://afroluxo.com,https://www.afroluxo.com`

## Troubleshoot

- `check-db` DNS fail → wrong or deleted project URL  
- Tables missing → run `supabase-schema.sql` again  
- Login fails → run `npm run seed-admin`  
- Empty shop → run `npm run seed-products` or add products in admin  
