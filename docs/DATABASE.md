# Database Architecture — DB Market (Vision V2)

## Overview
DB Market utilizes a **NEW Supabase PostgreSQL** database instance designed to scale into nationwide building materials commerce. The schema strictly enforces Row Level Security (RLS), supplier isolation, multi-tier permissions, product approval workflows, carts, and order fulfillment records.

---

## Core Relational Tables

### 1. User & Supplier Infrastructure
* **`profiles`**: User metadata, full name, phone number, default delivery city (e.g., Abuja), company name.
* **`user_roles`**: Maps `user_id` to system roles:
  * `customer`: Standard buyer.
  * `supplier_management`: Supplier executive access (earnings, payouts, announcements).
  * `supplier_product_manager`: Supplier catalog management access (uploads, inventory edits).
  * `admin`: MetaBrain Operations team.
  * `super_admin`: Executive platform owner.
* **`suppliers`**: Stores verified supplier business information, physical warehouse addresses in Abuja/Nigeria, tax IDs, approval status, and payout configuration.
* **`supplier_payout_settings`**: Stores verified bank account numbers, bank names, and settlement details.
* **`supplier_withdrawals`**: Logs supplier payout withdrawal requests, withdrawal amounts, processing status (`pending`, `approved`, `transferred`, `rejected`), and MetaBrain audit timestamps.
* **`supplier_announcements`**: System announcements published by MetaBrain for suppliers.

### 2. Product Information Management (PIM)
* **`products`**: Primary catalog table containing:
  * Basic fields: `id`, `supplier_id`, `name`, `sku`, `slug`, `brand`, `unit_of_measure` (sqm, pieces, bags, tons).
  * Pricing fields: `supplier_price` (wholesale), `retail_price` (selling price managed by MetaBrain), `discount_price`.
  * Classification: `product_type_id`, `category_id`, `subcategory_id`, `family_group_id`.
  * Review status: `approval_status` (`draft`, `pending_review`, `published`, `rejected`), `rejection_reason`.
  * Physical specs: `dimensions`, `weight`, `material`, `finish`, `origin_country`.
  * Content: `description` (OpenAI generated), `seo_title`, `seo_description`, `search_keywords`.
* **`product_assets`**: Stores real product photographs, technical spec PDFs, and gallery images hosted on Cloudinary (`url`, `public_id`, `is_primary`, `asset_type`).
* **`categories`**, **`subcategories`**, **`product_types`**, **`family_groups`**: 5-tier taxonomy nodes.

### 3. Commerce, Carts & Orders
* **`carts`**: Active shopping cart sessions (`id`, `user_id`, `session_token`, `updated_at`).
* **`cart_items`**: Line items inside customer carts (`cart_id`, `product_id`, `quantity`, `unit_price`).
* **`orders`**: Customer order headers:
  * `id`, `order_number` (e.g. `DBM-ABJ-2026-00812`), `customer_id`, `total_amount`, `delivery_fee`, `tax_amount`.
  * Delivery info: `delivery_address`, `city` (default: `Abuja`), `state`, `contact_phone`.
  * Status: `payment_status` (`unpaid`, `paid`), `fulfillment_status` (`pending_fulfillment`, `processing`, `consolidating`, `dispatched`, `delivered`, `cancelled`).
  * Checkout Channel: `checkout_method` (`online_payment`, `whatsapp_fulfillment`, `consultation`).
* **`order_items`**: Line items for completed orders (`order_id`, `product_id`, `supplier_id`, `quantity`, `unit_price`, `supplier_unit_price`, `item_status`).
* **`order_fulfillments`**: Tracks MetaBrain Operations manual consolidation log (`order_id`, `supplier_id`, `dispatch_status`, `pickup_timestamp`, `notes`).

### 4. AI & Search Optimizations
* **`ai_prompt_templates`**: DB-driven prompt templates for OpenAI copy generation.
* **`openai_logs`**: Logs prompt execution, tokens used, and response output.
* **`search_index`**: Materialized vector cache for search queries, storing normalized `tsvector` entries and metric/imperial size aliases.

---

## Schema Triggers & Functions

### `generate_product_code()`
Generates standardized, sequential SKUs based on Product Type prefixes (e.g., `TL-CER-0089`).

### `generate_size_aliases()`
Normalizes metric and imperial dimensions to map search queries (e.g. matching `600x600 mm` to `60x60 cm`).

### `rebuild_search_index()`
Combines product names, brand, finish, specs, and OpenAI keywords into a searchable `tsvector` document.

### `trg_product_approval_reset()`
Trigger that automatically resets a product's `approval_status` from `published` back to `pending_review` whenever a supplier modifies product attributes.

---

## Row Level Security (RLS) Policies

1. **Public Catalog Browsing**:
   * Anyone (`anon`, `authenticated`) can `SELECT` from `products` WHERE `approval_status = 'published'`.

2. **Supplier Product Isolation**:
   * Users with `supplier_product_manager` or `supplier_management` role can `SELECT`, `INSERT`, and `UPDATE` products WHERE `supplier_id = auth.uid()`.
   * Suppliers cannot set `approval_status = 'published'` directly (enforced by RLS constraint).

3. **Supplier Financial Isolation**:
   * Suppliers can only `SELECT` withdrawal logs and payout settings WHERE `supplier_id = auth.uid()`.

4. **MetaBrain Operational Access**:
   * Users with `admin` or `super_admin` role have full `ALL` permissions across all tables, order fulfillments, approval queues, and supplier accounts.
