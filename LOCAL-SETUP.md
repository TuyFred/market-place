# Fix local database connection

## Why you see degraded / fetch failed

Your app code is fine. The **Supabase project URL in .env is dead**.

DNS: dfvgyiwtxyksbtxgpalz.supabase.co -> Non-existent domain

The project was deleted or the URL is wrong. Local code cannot talk to a missing cloud database.

## Do this once

1. Create a project at https://supabase.com/dashboard
2. Project Settings -> API -> copy Project URL, anon key, service_role key
3. Update backend/.env and frontend/.env with those values
4. Supabase SQL Editor -> run supabase-schema.sql
5. In backend folder:
   npm run check-db
   npm run seed-admin
   npm run dev
6. In frontend folder:
   npm run dev

Site: http://localhost:5173
Health: http://localhost:4000/health (must show database connected)
Admin: admin@system.com / admin123@

After you paste new keys into .env, run npm run check-db again.
