# Master Development Roadmap — DB Market (Vision V2)

## Phase 1 — Vision V2 Documentation & Architecture Realignment (Current)
* [x] Audit and rewrite all 18 markdown documents in `/docs`.
* [x] Realign architecture to Nationwide Building Materials Commerce Infrastructure (Abuja First).
* [x] Establish MetaBrain operational ownership model and supplier approval workflow.
* [x] Purge Gemini/Imagen specifications; set OpenAI as sole text/SEO engine.
* [x] Replace Resend with SendGrid mail engine architecture.
* [x] Define single-application supplier system with 2-tier role permissions.
* [x] Complete production build verification (`npm run build`).

## Phase 2 — Database Setup & Infrastructure Migration
* [ ] Provision NEW Supabase Project (`DB Market Production`).
* [ ] Apply updated schema migrations (Tables, RLS policies, roles, triggers, RPCs).
* [ ] Provision Cloudinary unsigned preset (`products`) and signed API keys.
* [ ] Configure Vercel deployment project with new environment variables.

## Phase 3 — Core Commerce & Manual V1 Fulfillment Engine
* [ ] Implement cart state (`carts`, `cart_items`) with `localStorage` guest fallback.
* [ ] Build multi-option checkout page (Pay Online, Continue to WhatsApp, Request Consultation).
* [ ] Implement MetaBrain Manual Order Fulfillment Console (`/admin/orders`).
* [ ] Implement pre-formatted WhatsApp fulfillment message deep-links.

## Phase 4 — Supplier Ecosystem & Role-Based Dashboard
* [ ] Build unified single-app Supplier Portal (`/supplier`).
* [ ] Implement `supplier_management` view (earnings, withdrawal requests, bank settings, announcements).
* [ ] Implement `supplier_product_manager` view (product upload, real photos, stock edits).
* [ ] Build MetaBrain Product Approval & Pricing Control Queue (`/admin/products`).

## Phase 5 — OpenAI Copy/SEO Pipeline & SendGrid Mail Integration
* [ ] Connect OpenAI API (`gpt-4o-mini` / `gpt-4o`) for automated luxury copy & SEO tag generation.
* [ ] Connect SendGrid API for order confirmations, supplier dispatches, and withdrawal alerts.
* [ ] Implement search vector aliasing and metric/imperial size normalizer (`generate_size_aliases`).
