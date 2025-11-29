# Infomaniak-style Marketplace — Starter

This is a starter multi-vendor marketplace inspired by Infomaniak's suite-style approach.
It is an opinionated scaffold (MVP) with core features: vendors, products, orders, admin, and simple auth stubs.

Generated: 2025-11-29T00:10:28.404780Z

## What's included
- Next.js (App Router) scaffold
- TailwindCSS config
- Frontend pages: Home, Shop, Product, Vendor Dashboard, Admin, Cart, Checkout
- Components: Navbar, Footer, ProductCard, VendorForm, FileUploader, AdminPanel
- API routes: /api/products, /api/vendors, /api/orders, /api/auth (jwt simple)
- DB layer for Neon/Postgres (`lib/db.ts`) and MongoDB variant (`variants/mongodb/lib/mongodb.js`)
- Migration and seed scripts for both Postgres and MongoDB
- README with deploy instructions (GitHub + Vercel)

## Quick start (local)
1. copy `.env.local.example` to `.env.local` and set `DATABASE_URL` (Postgres) or `MONGODB_URI` for Mongo variant.
2. npm install
3. npm run seed   # seeds both Postgres and Mongo examples
4. npm run dev
5. Open http://localhost:3000

## Deploy
Push to GitHub and import in Vercel. Add environment variables on Vercel:
- DATABASE_URL (Neon Postgres)
- MONGODB_URI (optional)

