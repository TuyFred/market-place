# Deploy AFROLUXO with GitHub + Namecheap domain (afroluxo.com)

Your **domain stays on Namecheap**. The **website files live on GitHub Pages**.  
Every push to `main` rebuilds and publishes the shop automatically.

---

## A. One-time: GitHub Pages

1. Open your GitHub repo → **Settings** → **Pages**
2. Under **Build and deployment** → **Source**: choose **GitHub Actions**
3. Wait for the **Deploy AFROLUXO to GitHub Pages** workflow to finish (Actions tab)
4. Settings → Pages → **Custom domain**: enter `afroluxo.com` → Save  
   (repo already includes a `CNAME` file for this)
5. Turn on **Enforce HTTPS** after DNS is verified (can take a few minutes to hours)

### Optional site variables (repo → Settings → Secrets and variables → Actions → Variables)

| Name | Example |
|------|---------|
| `VITE_API_URL` | `https://market-place-z0w0.onrender.com` (only if your API URL differs from the default) |
| `VITE_WHATSAPP_NUMBER` | `+13653369344` |
| `VITE_SUPABASE_URL` | your Supabase URL |
| `VITE_SUPABASE_ANON_KEY` | your anon key |

The production frontend defaults to the live Render API URL. The API must be deployed and healthy for customer login, product data, and reviews to work.

---

## B. Point afroluxo.com (Namecheap DNS) to GitHub

1. Namecheap → **Domain List** → **afroluxo.com** → **Manage** → **Advanced DNS**
2. Remove old hosting A / URL redirect records that conflict
3. Add these records:

| Type | Host | Value | TTL |
|------|------|-------|-----|
| A Record | `@` | `185.199.108.153` | Automatic |
| A Record | `@` | `185.199.109.153` | Automatic |
| A Record | `@` | `185.199.110.153` | Automatic |
| A Record | `@` | `185.199.111.153` | Automatic |
| CNAME Record | `www` | `YOUR_GITHUB_USERNAME.github.io` | Automatic |

Replace `YOUR_GITHUB_USERNAME` with your GitHub username (example: `jane.github.io`).

4. Save. DNS can take **5 minutes to 48 hours**.
5. Visit https://afroluxo.com and https://www.afroluxo.com

---

## C. Alternative: Namecheap cPanel hosting (manual upload)

If you bought **shared hosting** and prefer files on Namecheap:

```bash
cd frontend
npm install
npm run build
```

Upload **contents** of `frontend/dist/` into `public_html` (include `.htaccess`).  
You can still keep the code on GitHub; only the upload step is manual (or use FTP Action later).

---

## D. Verify

- https://afroluxo.com/
- https://afroluxo.com/products
- https://afroluxo.com/admin/dashboard

### Demo admin

- Email: `admin@system.com`
- Password: `admin123@`
