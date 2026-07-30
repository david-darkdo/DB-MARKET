# Admin Operating System (MetaBrain Console) — DB Market (Vision V2)

## Overview
The **Admin Operating System** (`/admin`) is the central operational environment where MetaBrain manages the DB Market infrastructure, vets products, orchestrates manual order fulfillments, onboard suppliers, and monitors business growth.

---

## Core Administrative Modules

### 1. Product Approval & Quality Control Queue (`/admin/products`)
* **Review Pending Submissions**: Inspect product uploads submitted by suppliers.
* **Content & Specs Editing**: Refine product specifications, adjust wholesale vs retail pricing, and set SKUs.
* **OpenAI Auto-Enrichment**: Trigger or override OpenAI luxury copy and SEO metadata generation.
* **Publish / Reject Controls**: Approve products for live discovery (`published`) or reject with feedback (`rejected`).

### 2. Manual Order Fulfillment & Logistics Desk (`/admin/orders`)
* **Order Monitoring**: Live feed of incoming customer orders (Paid Online or WhatsApp Fulfillment Requests).
* **Supplier Coordination Console**: Displays items broken down by supplier for each order.
* **Fulfillment Status Tracking**: Track progress through `pending_fulfillment` → `supplier_notified` → `consolidated_at_hub` → `dispatched` → `delivered`.
* **Abuja On-Site Dispatch**: Manage local delivery routing and logistics in Abuja.

### 3. Supplier Management & Authorization (`/admin/suppliers`)
* **Supplier Onboarding**: Authorize user accounts into **Supplier Accounts**.
* **Role Assignment**: Assign `supplier_management` or `supplier_product_manager` permissions.
* **Payout & Withdrawal Requests**: Review supplier earnings withdrawal requests, verify bank accounts, and approve payouts.
* **System Announcements**: Broadcast announcements to supplier dashboards.

### 4. CRM & Consultation Desk (`/admin/customers`)
* Customer profile database, purchase history, saved Lookbooks, and architectural consultation requests.

### 5. OpenAI & System Diagnostics (`/admin/diagnostics`)
* Monitor OpenAI API health, Cloudinary storage usage, and SendGrid email delivery logs.

---

## Access & Security Rules
* Admin routes are guarded by Supabase Auth middleware (`auth-middleware.ts`).
* Route access requires `admin` or `super_admin` role in `public.user_roles`.
* Unauthenticated or unauthorized attempts automatically redirect to `/auth`.
