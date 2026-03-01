<<<<<<< HEAD
# online-selling
=======
## Modern E‑Commerce Web App (Shoes, Bags & Electronics)

This project is a full‑stack e‑commerce application for **children’s shoes, women’s shoes, small bags, and electronics** with:

- **Frontend**: React, Vite, TypeScript, Tailwind CSS
- **Backend**: Fastify (Node.js), Supabase (PostgreSQL + Storage + Auth)
- **Docs**: Swagger (OpenAPI) at `/docs`

### Project structure

```text
online-selling/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Fastify app setup
│   │   ├── server.js              # Server entry
│   │   ├── config/                # env, supabase, swagger
│   │   ├── plugins/               # cors, swagger, multipart
│   │   ├── routes/                # auth, products, categories, orders
│   │   ├── controllers/           # HTTP layer
│   │   ├── services/              # Business logic + Supabase access
│   │   ├── middlewares/           # auth & admin guards
│   │   ├── utils/                 # response, upload, whatsapp helpers
│   │   └── schemas/               # shared + error schemas
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── App.tsx                # Routes layout
│   │   ├── pages/                 # Home, Products, Admin
│   │   ├── components/            # Layout, Auth, Products, Orders
│   │   └── styles/                # Tailwind + global styles
│   └── package.json
│
└── README.md
```

### High‑level architecture

```text
[ Browser / React UI ]
      │
      │  HTTP (via Vite proxy, /api/*)
      ▼
[ Fastify Backend ]
  ├─ Auth routes/controllers/services
  ├─ Products routes/controllers/services
  ├─ Categories routes/controllers/services
  ├─ Orders routes/controllers/services
  └─ Plugins (CORS, Swagger, Multipart)
      │
      │ Supabase JS SDK
      ▼
[ Supabase ]
  ├─ PostgreSQL (ecommerce)
  ├─ Auth (customers + admins)
  └─ Storage (product-images bucket)
```

---

## Backend (Fastify + Supabase)

### Install & run

```bash
cd backend
npm install
cp .env.example .env   # fill in your Supabase values
npm run dev
```

Server runs on **`http://localhost:4000`** by default.

### Environment variables (`backend/.env`)

- **`PORT`** – API port (default `4000`)
- **`SUPABASE_URL`** – e.g. `https://dfvgyiwtxyksbtxgpalz.supabase.co`
- **`SUPABASE_SERVICE_ROLE_KEY`** – Supabase **service role** key (keep secret, backend only)

### Swagger / API docs

- UI: `GET http://localhost:4000/docs`
- Base API prefix: `/api`

---

## Backend endpoints overview

Base URL in development: **`http://localhost:4000/api`**

### Auth

- **POST `/auth/register`**
  - Register a **customer** account.
  - Body:
    - `fullName` (string)
    - `contactNumber` (string)
    - `address` (string)
    - `email` (string, email)
    - `password` (string, min 6)
    - `confirmPassword` (string, must match)
  - Creates Supabase user with `role: 'customer'`.

- **POST `/auth/login`**
  - Login for **customers and admins**.
  - Body:
    - `email` (string)
    - `password` (string)
  - Response:
    - `accessToken` (string, Supabase access token)
    - `user`:
      - `id`, `email`, `role`, `fullName`

### Products

- **GET `/products`**
  - Query products for the shop.
  - Query params:
    - `category` (optional string; e.g. `children-shoes`, `women-shoes`, `small-bags`, `electronics`)
  - Returns active products.

- **POST `/products`** (admin only)
  - Create a new product.
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)
  - Body:
    - `name` (string)
    - `description` (string, optional)
    - `price` (number)
    - `category` (string)
    - `size` (string, optional)
    - `imageUrl` (string, optional)
    - `stock` (integer, optional)

- **PUT `/products/:id`** (admin only)
  - Update an existing product.
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)
  - Body: any subset of product fields.

- **DELETE `/products/:id`** (admin only)
  - Delete a product.
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)

- **POST `/products/upload-image`** (admin only)
  - Upload a product image to **Supabase Storage** (`product-images` bucket).
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)
    - `Content-Type: multipart/form-data`
  - Form data:
    - `file` – image file
  - Optional query:
    - `productId` – if provided, the product’s `imageUrl` will be updated automatically.
  - Response:
    - `imageUrl` – public image URL
    - `updatedProductId` – product id if updated, otherwise `null`

### Categories

- **GET `/categories`**
  - List all categories.

- **POST `/categories`** (admin only)
  - Create a new category.
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)
  - Body:
    - `name` (string)
    - `slug` (string)

### Orders

- **POST `/orders`**
  - Create a customer order (used by “Order without WhatsApp” form).
  - Body:
    - `name` (string)
    - `phone` (string)
    - `address` (string)
    - `productId` (string)
    - `notes` (string, optional)

- **GET `/orders`** (admin only)
  - List orders for the admin dashboard.
  - Headers:
    - `Authorization: Bearer <accessToken>` (admin)

---

## Frontend (React + Vite + Tailwind)

### Install & run

```bash
cd frontend
npm install
cp .env.example .env   # fill your values
npm run dev
```

Dev server runs on **`http://localhost:5173`**.

Vite proxy forwards `/api/*` requests to the backend (`http://localhost:4000`), so the React app can call the Fastify API without extra config.

### Frontend environment variables (`frontend/.env`)

- **`VITE_WHATSAPP_NUMBER`**
  - Your WhatsApp number for orders, e.g. `+250793093612`.
- **`VITE_SUPABASE_URL`** (optional)
- **`VITE_SUPABASE_ANON_KEY`** (optional)

These last two are only needed if you call Supabase directly from the frontend. All core flows already work via the backend API.

### Main pages & flows

- **Home page**
  - Hero section focused on children’s and women’s fashion.
  - Featured products grid.
- **Products page**
  - Grid of all products with category filtering (children shoes, women shoes, small bags, electronics).
  - Each product card:
    - WhatsApp order button.
    - “Order without WhatsApp” form.
- **Admin**
  - Admin login page (email + password, role must be `admin`).
  - Dashboard with:
    - Quick statistics (products, orders, categories).
    - Recent orders list.
    - Product list (read‑only stub, ready to expand into full CRUD).

---

## Typical development workflow

1. **Start backend**
   - Ensure `backend/.env` is configured.
   - Run `npm run dev` in `backend/`.
2. **Start frontend**
   - Ensure `frontend/.env` has `VITE_WHATSAPP_NUMBER`.
   - Run `npm run dev` in `frontend/`.
3. **Visit the app**
   - Shop UI: `http://localhost:5173`
   - API docs: `http://localhost:4000/docs`

You can now:

- Add products and categories via the API (or an admin UI extension).
- Let customers browse products, order via WhatsApp, or use the built‑in order form.
- Manage orders as an admin using the dashboard.

>>>>>>> 8430e54 (Initial commit: push local workspace to github.com/fred-cyber01/online-selling)
