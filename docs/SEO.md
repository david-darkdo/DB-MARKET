# Search Engine Optimization (SEO) Strategy — DB Market (Vision V2)

## Overview
MetaBrain manages SEO centrally to position DB Market as the #1 search destination for building materials in **Abuja** and across **Nigeria**.

---

## Technical SEO Implementation

### 1. OpenAI Dynamic Metadata Generation
Upon product approval, OpenAI generates:
* **SEO Title Tag**: Max 60 chars (e.g. `Buy Carrara Polish Tiles 60x60 in Abuja | DB Market`).
* **Meta Description**: Max 155 chars (e.g. `Premium 60x60cm polished porcelain Carrara tiles in Abuja. Wholesale prices, fast on-site delivery. Request quote or order on DB Market.`).

### 2. Structured Data (JSON-LD)
Injected on product routes (`product.$slug.tsx`):
* **Product Schema**: Injects product name, brand, real photo URLs, price, currency (NGN), and availability.
* **BreadcrumbList Schema**: Injects 5-tier taxonomy hierarchy.
* **Organization Schema**: MetaBrain DB Market corporate details.

### 3. Dynamic Sitemap & Robots Configuration
* Dynamic sitemap endpoint (`/sitemap.xml`) streams all `published` products, categories, and landing pages.
* `robots.txt` exposes sitemap while restricting `/admin` and `/supplier` route spaces from crawler indexing.
