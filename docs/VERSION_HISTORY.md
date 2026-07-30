# Architecture Decision Records (ADRs) & Version History — DB Market

## ADR 4: Vision V2 — Building Materials Commerce Infrastructure Pivot (July 2026)
* **Decision**: Evolve DB Market from a digital showroom catalog into a nationwide Building Materials Commerce Infrastructure starting in Abuja.
* **Rationale**: High-value building materials transactions require integrated procurement, unified checkout, supplier onboarding, and managed fulfillment.
* **Result**: Unified single-application codebase handling customers, suppliers, and MetaBrain operations.

## ADR 5: MetaBrain Ownership & Supplier Approval Lifecycle (July 2026)
* **Decision**: Suppliers own physical inventory; MetaBrain owns presentation, SKU, SEO, pricing strategy, publishing workflow, and customer experience.
* **Rationale**: Guarantees luxury copywriting, verified specs, search consistency, and trust across the platform.
* **Result**: Products uploaded by suppliers enter `pending_review` and require MetaBrain approval before publishing. Edits by suppliers revert products to `pending_review`.

## ADR 6: AI & Email Engine Consolidation (July 2026)
* **Decision**: Replace Gemini, Imagen 3, and Resend with **OpenAI** (for text/SEO copy) and **SendGrid** (for transactional emails).
* **Rationale**: Eliminates AI-generated fake product imagery in favor of real photos; streamlines AI integration to text/SEO normalization via OpenAI; standardizes mail delivery on SendGrid.
* **Result**: Clean environment configuration and zero AI image generation.

## ADR 7: Manual V1 Fulfillment Consolidation (July 2026)
* **Decision**: Implement a manual order fulfillment workflow managed by MetaBrain Operations for Version 1.
* **Rationale**: Ensures 100% quality control, logistics verification, and merchant onboarding validation in Abuja before automating routing software.
* **Result**: MetaBrain Ops consolidates supplier items and coordinates site delivery.
