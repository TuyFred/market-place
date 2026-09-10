# AFROLUXO BY ASI — Local run + Deploy (Render + Vercel)

## 1) Supabase (required)

Current project host: `dvhsydnoownpiaufeohc.supabase.co`

1. Open https://supabase.com/dashboard → your project
2. SQL Editor → run `supabase-schema.sql` (once)
3. Settings → API: copy **Project URL**, **anon** key, **service_role** key

### Local env

`backend/.env`:
```
PORT=4000
SUPABASE_URL=https://dvhsydnoownpiaufeohc.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
CORS_ORIGIN=*
```

`frontend/.env`:
```
VITE_WHATSAPP_NUMBER=+250XXXXXXXXX
VITE_SUPABASE_URL=https://dvhsydnoownpiaufeohc.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Verify + seed admin
```
cd backend
npm run check-db
npm run seed-admin
```
Admin login (after seed): `admin@system.com` / `admin123@`

---

## 2) Run locally

Terminal 1:
```
cd backend
npm install
npm run dev
```
Health must be: `{"status":"ok","database":"connected",...}` at http://localhost:4000/health

Terminal 2:
```
cd frontend
npm install
npm run dev
```
UI: http://localhost:5173 (Vite proxies `/api` → `:4000`)

---

## 3) Host backend on Render

1. Push repo to GitHub
2. Render → New → Blueprint (uses `render.yaml`) **or** Web Service:
   - Root Directory: `backend`
   - Build: `npm install`
   - Start: `npm start`
   - Health Check: `/health`
3. Set env vars on Render (Dashboard → Environment):
   - `SUPABASE_URL` = same as local
   - `SUPABASE_SERVICE_ROLE_KEY` = service_role key (never the anon key)
   - `CORS_ORIGIN` = your Vercel URL, e.g. `https://your-app.vercel.app` (comma-separate multiple)
   - `NODE_ENV` = `production`
   - `PORT` = `4000` (Render may override; app reads `process.env.PORT`)
4. After deploy, open `https://afroluxo-by-asi-api.onrender.com/health`  
   (exact hostname = service name; confirm in Render dashboard)
5. If the Render URL differs, update both:
   - `vercel.json`
   - `frontend/vercel.json`  
   rewrite destination from the placeholder to your real URL.

Free-tier note: Render spins down after idle; first request can take ~30–60s.

---

## 4) Host frontend on Vercel

**Recommended:** Root Directory = `frontend`

1. Import GitHub repo in Vercel
2. Root Directory: `frontend`
3. Framework: Vite
4. Build: `npm run build` · Output: `dist`
5. Environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_WHATSAPP_NUMBER` (optional)
6. Deploy

`frontend/vercel.json` rewrites `/api/*` → Render and SPA fallback to `index.html`.

Then set Render `CORS_ORIGIN` to the Vercel domain and redeploy/restart the API if needed.

### Alternative (repo root)
If you deploy from monorepo root, use root `vercel.json` (build + output already point at `frontend`).

---

## Checklist

- [x] Supabase URL resolves + `npm run check-db` OK
- [ ] Schema applied (8 categories expected)
- [ ] Local `/health` → `database":"connected"`
- [ ] `npm run seed-admin` if no admin yet
- [ ] Render API live + `/health` OK
- [ ] `vercel.json` points at real Render URL
- [ ] Vercel frontend live
- [ ] Render `CORS_ORIGIN` includes Vercel domain
