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
VITE_WHATSAPP_NUMBER=+13653369344
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
   - `CORS_ORIGIN` = `https://www.afroluxo.com,https://afroluxo.com` (comma-separate; include www)
   - `FRONTEND_URL` = `https://www.afroluxo.com`
   - `NODE_ENV` = `production`
   - `PORT` = `4000` (Render may override; app reads `process.env.PORT`)
4. After deploy, open `https://afroluxo-by-asi-api.onrender.com/health` and confirm it returns a healthy response. The frontend uses this Render service by default in production; set `VITE_API_URL` if your Render service has a different URL.
5. If you rely on the Vercel same-origin API rewrite instead of `VITE_API_URL`, update the destination in both `vercel.json` and `frontend/vercel.json` to your actual Render URL.

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

### Custom domain not opening

The repository includes a GitHub Pages workflow and a `frontend/public/CNAME` for `afroluxo.com`. If the custom domain refuses connections, confirm the GitHub Pages deployment succeeded, the domain is configured under **Settings → Pages**, and the Namecheap DNS records point to GitHub Pages as listed in `frontend/DEPLOY-NAMECHEAP.md`. DNS changes can take up to 48 hours to propagate.

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
