# AFROLUXO security model

Authorization is enforced on the **backend**. Opening the browser console cannot create admins or change roles.

## Admin bootstrap (your credentials)

| | |
|--|--|
| Email | `admin@system.com` |
| Password | `admin123@` |

Create / refresh this account only with the **server-side** command (never a public URL):

```bash
cd backend
npm run seed-admin
```

Optional overrides in `backend/.env` (server only — never `VITE_*`):

```env
ADMIN_EMAIL=admin@system.com
ADMIN_PASSWORD=admin123@
```

## What is blocked on the API

| Threat | Protection |
|--------|------------|
| Public admin signup | `POST /api/auth/register` always sets `app_metadata.role = customer`. Client `role` fields are ignored (`additionalProperties: false`). |
| Fake admin privileges | Product/order/admin routes use `authGuard` + `adminGuard` / `adminOnlyGuard`. Role is read from **app_metadata** (service-role only). |
| Create admin via console | `POST /api/auth/admins` requires a valid **admin** Bearer token **and** `currentAdminPassword` re-entry. |
| Promote user to admin | `PUT /api/auth/users/:id/role` is admin-only; promoting to `admin` requires password re-entry. Managers cannot change roles. |
| Brute-force login | Rate limit: 8 attempts / 15 min per IP+email → HTTP 429. |
| Signup spam | Rate limit: 5 signups / hour per IP. |
| Malicious uploads | MIME whitelist + size limits; randomized storage names. |
| Oversized JSON | 1 MB body limit; multipart separate limits. |
| XSS / clickjacking (API) | Security headers: CSP, `X-Frame-Options`, `nosniff`, HSTS in production. |
| Secret exposure | Service role key only in `backend/.env` / host secrets. Never in frontend `VITE_*`. |
| Audit trail | `audit_logs` table: register, login success/fail, role changes, staff create, password resets. |

## What you cannot block (and do not need to)

- Users opening DevTools or inspecting network traffic  
- Users calling your public APIs from their own scripts  

Those clients still **cannot** become admin without a stolen admin token + password.

## Stolen admin tokens

- Prefer HTTPS everywhere in production  
- Sign out clears local tokens; rotate passwords if compromised  
- Re-run `seed-admin` to reset the bootstrap admin password  
- Consider enabling Supabase MFA for admin users in the Supabase dashboard  

## Payments

Card UI is a checkout form; **do not trust client “paid” flags**. When you add a real provider (Stripe, etc.), verify status **server-side** and validate webhook signatures before marking orders paid.

## Schema

Run `supabase-schema.sql` (includes `audit_logs`). Prefer `npm run seed-admin` over relying only on the SQL auth insert block.
