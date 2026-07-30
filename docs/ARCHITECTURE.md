# Technical Architecture — DB Market (Vision V2)

## Architecture Overview
DB Market is engineered as an enterprise-grade, nationwide Building Materials Commerce Infrastructure. It features a unified single-application architecture supporting customers, MetaBrain administrators, and authorized suppliers.

```
+-----------------------------------------------------------------------------------+
|                                 Client Layer                                      |
|                                                                                   |
|  +---------------------------+  +---------------------------+  +---------------+  |
|  |  Customer Commerce Web    |  |    Supplier Dashboard     |  | MetaBrain Admin|  |
|  | (Cart / Checkout / Search)|  | (Management / Inventory)  |  |  Console (OS) |  |
|  +---------------------------+  +---------------------------+  +---------------+  |
|                                                                                   |
|                     React 19 SPA + TanStack Router (File-Based)                   |
+-----------------------------------------+-----------------------------------------+
                                          |
                                          v
+-----------------------------------------------------------------------------------+
|                                Application Server                                 |
|                                                                                   |
|                 TanStack Start SSR + Server Functions (`createServerFn`)          |
|                           Vite 8 + Nitro Server Engine                            |
|                               Deployed on Vercel                                  |
+----+------------------------------------+------------------------------------+----+
     |                                    |                                    |
     v                                    v                                    v
+-----------------------+   +---------------------------+   +-----------------------+
| Supabase PostgreSQL   |   | Cloudinary CDN            |   | OpenAI API Engine     |
| (NEW Project Database)|   |                           |   | (Text / SEO / Cats)   |
| • Auth & RLS Roles    |   | • Unsigned Client Uploads |   | • gpt-4o / gpt-4o-mini|
| • Inventory & Carts   |   |   (Real Photos/Specs)     |   | • No AI Image Gen     |
| • Orders & Payouts    |   | • Signed Server Deletions |   +-----------------------+
| • Vector Search Index |   | • On-the-Fly Image Resize |   | SendGrid API Engine   |
+-----------------------+   +---------------------------+   | • Transactional Mails |
                                                            +-----------------------+
```

---

## Technical Stack Summary

| Layer | Technology / Tool | Rationale / Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript | Core UI rendering with maximum performance |
| **Routing** | TanStack Router | Type-safe, file-based routing with loaders |
| **SSR & Server API** | TanStack Start + Nitro 3 | Server-side rendering and secure Node server functions |
| **Styling** | Tailwind CSS V4 + Lucide React | High-performance, luxury responsive design system |
| **State Management** | TanStack Query + React Context | Client data caching, cart management, and auth sessions |
| **Database & Auth** | New Supabase PostgreSQL | Auth, Row Level Security (RLS), full-text search, RPCs |
| **Media Assets** | Cloudinary CDN | High-resolution real photo hosting and transformations |
| **AI Optimization** | OpenAI REST API (`gpt-4o`) | Catalog copy, SEO metadata, and category classification |
| **Email Delivery** | SendGrid API Engine | Transactional emails, receipts, and operational alerts |
| **Deployment Platform**| Vercel | Production SSR hosting, edge caching, and serverless functions |

---

## Subsystem Interactions

### 1. Unified Single-App Authentication & Role Authorization
* User signs up via Supabase Auth (`customer` role by default).
* User requests supplier status or MetaBrain invites them.
* MetaBrain assigns `supplier_management` or `supplier_product_manager` role in `user_roles`.
* TanStack Router auth middleware (`auth-middleware.ts`) verifies JWT roles and grants access to `/supplier` or `/admin` route branches within the same app.

### 2. Product Upload & MetaBrain Approval Pipeline
```
[Supplier Uploads Specs & Photos] ──────► [Cloudinary Unsigned Upload]
                                                    │
                                                    ▼ (URL Array)
                                    [Insert into `products` (Status: `pending_review`)]
                                                    │
                                                    ▼
                                    [MetaBrain Admin Queue Notification]
                                                    │
                                                    ▼
                                    [Trigger OpenAI Copy & SEO Enrichment]
                                                    │
                                                    ▼
                                    [MetaBrain Adjusts Price/SKU & Clicks Approve]
                                                    │
                                                    ▼
                                    [Update Status to `published` & Sync Search Index]
```

### 3. Customer Cart & Multi-Option Checkout
* **Cart State**: Managed via TanStack Query and synced to `carts` / `cart_items` in Supabase for logged-in users (with `localStorage` fallback for guests).
* **Checkout Flow**:
  1. Customer selects delivery address in Abuja (or nationwide destination).
  2. Selects payment method: **Pay Online** (Stripe/Flutterwave/Paystack integration), **Continue to WhatsApp** (MetaBrain Ops chat link with formatted cart summary), or **Request Consultation**.
  3. Order committed to `orders` and `order_items` tables with status `pending_fulfillment`.

### 4. Manual V1 Order Consolidation & Fulfillment
* Order notification sent to MetaBrain Operations console (`/admin/orders`).
* MetaBrain contacts each item's supplier to verify stock and dispatch collection.
* Supplies gathered at Abuja central hub, quality-checked, and delivered to customer.
* MetaBrain marks order status as `fulfilled` and logs supplier earnings in `supplier_payout_logs`.

---

## Security & Isolation Controls
* **Row Level Security (RLS)**: Enforced on all database tables. Suppliers can only query and edit their own product submissions (`supplier_id = auth.uid()`).
* **Service Role Isolation**: Server functions (`client.server.ts`) execute administrative actions using the Supabase Service Role Key inside isolated server contexts.
* **API Secret Protection**: OpenAI API Keys (`OPENAI_API_KEY`), SendGrid Keys (`SENDGRID_API_KEY`), and Cloudinary Secret Keys are strictly contained in server-side environment variables and never leaked to the client bundle.
