# Changelog — DB Market

## [2.0.0] - 2026-07-30 (Vision V2 Architectural Pivot)
### Added
*   Complete documentation rewrite across all 18 `/docs` files to establish Vision V2 as the single source of truth.
*   Nationwide Building Materials Commerce Infrastructure architecture (Abuja launch focus).
*   MetaBrain operational ownership model and product approval workflow (`draft` → `pending_review` → `published`).
*   Single-application Supplier Ecosystem with 2-tier role permissions (`supplier_management` and `supplier_product_manager`).
*   Manual V1 Order Fulfillment Workflow & WhatsApp post-checkout fulfillment deep-linking.
*   SendGrid mail engine architecture.
*   OpenAI (`gpt-4o` / `gpt-4o-mini`) text, SEO metadata, and category classification integration specs.

### Removed
*   Removed Gemini and Imagen 3 AI image generation dependencies.
*   Removed Resend email engine references.
*   Deprecating legacy Supabase project credentials in favor of NEW DB Market Supabase project.
*   Removed standalone e-commerce catalog limitations.

### Verified
*   Verified clean production compile (`npm run build`) with React 19, TanStack Start, and Nitro.
