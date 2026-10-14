# Local setup — real Supabase

Full guide: **[SUPABASE-SETUP.md](./SUPABASE-SETUP.md)**

Quick path:

1. Create a project at https://supabase.com/dashboard  
2. Copy URL + **service_role** + **anon** keys into `backend/.env` and `frontend/.env`  
3. Run `supabase-schema.sql` in the Supabase SQL Editor  
4. Then:

```bash
cd backend
npm install
npm run check-db
npm run seed-admin
npm run seed-products
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

- Shop: http://localhost:5173  
- Health: http://localhost:4000/health  
- Admin: `admin@system.com` / `admin123@`  
- Or use **Sign up** to create a customer account  

WhatsApp orders include a **link to the product page**. Set `VITE_WHATSAPP_NUMBER` in `frontend/.env`.
