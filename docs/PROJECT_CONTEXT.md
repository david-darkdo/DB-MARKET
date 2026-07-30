# Project Context — DB Market (Vision V2)

## Executive Overview
**DB Market** is Nigeria’s nationwide **Building Materials Commerce Infrastructure**. Evolving beyond a visual digital catalog, DB Market is a full-scale commerce, procurement, and fulfillment platform connecting buyers (architects, builders, contractors, and homeowners) with verified building material suppliers across Nigeria, starting with **Abuja**.

DB Market provides an end-to-end commerce experience: discovering products, comparing technical specifications, adding items to a unified cart, checking out via online payments or managed WhatsApp fulfillment, and receiving consolidated on-site deliveries.

---

## MetaBrain Ownership & Operations
**MetaBrain** owns, operates, and scales the DB Market platform and underlying infrastructure.

### MetaBrain Operational Responsibilities
* **Platform Engineering & Maintenance**: Developing and maintaining web, mobile, and server infrastructure.
* **Merchant & Supplier Management**: Vetting, onboarding, and authorizing supplier accounts.
* **Product Quality & Publishing Control**: Reviewing, editing, pricing, and optimizing every product listing before it goes live.
* **Customer Support & Order Management**: Managing all customer inquiries, quote requests, and order fulfillments.
* **SEO & Growth Marketing**: Driving national and regional buyer acquisition through organic search, performance marketing, and industry partnerships.
* **Payment & Payout Coordination**: Processing customer payments securely and orchestrating supplier payouts and withdrawals.

### Relationship Model
* **Customers deal strictly with DB Market**: Customers interact with DB Market branding, checkout, and customer support. Customers do not negotiate directly with individual suppliers.
* **Suppliers deal strictly with DB Market**: Suppliers list inventory, receive purchase dispatches from MetaBrain Operations, and receive payouts directly from MetaBrain.

---

## Customer Journey & Experience
The customer experience is streamlined for trust, clarity, and speed:

```
[Customer Visits DB Market] 
       │
       ▼
[Browse & Search Building Materials (Abuja First)] 
       │
       ▼
[View Product Specifications & Real Photos] 
       │
       ▼
[Add Items to Unified Cart] 
       │
       ▼
[Proceed to Checkout] 
       ├───► Option A: Pay Online (Instant Card / Bank Transfer)
       ├───► Option B: Continue to WhatsApp (Fulfillment / Logistics Inquiry)
       └───► Option C: Request Architectural / Commercial Consultation
```

*Note: WhatsApp is not where shopping begins; WhatsApp is where specialized fulfillment, bulk logistics coordination, and customer care begin.*

---

## Order Fulfillment Architecture (Version 1 - Manual Workflow)
To ensure 100% quality control, logistics accuracy, and supplier reliability during initial rollout, **Version 1 uses an intentional manual fulfillment workflow**:

1. **Order Placement**: Customer completes checkout on DB Market.
2. **Operations Dispatch**: MetaBrain Operations receives the consolidated order notification.
3. **Supplier Coordination**: MetaBrain Operations contacts the respective suppliers for each item in the order.
4. **Preparation & Quality Check**: Suppliers prepare the ordered quantities; MetaBrain verifies specs and quality.
5. **Consolidation & Delivery**: MetaBrain Logistics consolidates items from multiple suppliers into a single delivery payload for on-site delivery in Abuja.
6. **Fulfillment Completion**: Customer inspects and receives materials on site.

*Automated supplier routing and dispatch software will be introduced in subsequent platform versions after manual operations are validated at scale.*

---

## Supplier Ecosystem & Single-App Architecture
Suppliers use the exact same DB Market application as customers. No separate application or domain is required.

1. **Registration**: A supplier creates a standard user account on DB Market.
2. **Authorization**: MetaBrain Operations authorizes the account, upgrading its role to a **Supplier Account**.
3. **Dashboard Access**: Upon authorization, the user gains access to the integrated **Supplier Dashboard**.

### Role-Based Supplier Permissions (Version 1)
DB Market enforces a strict, extensible permission structure with two initial tiers:

* **1. Management Access**:
  * View overall business performance and analytics.
  * Monitor total earnings and available balance.
  * Submit withdrawal and payout requests.
  * Configure bank account and payout details.
  * View MetaBrain system announcements and updates.
  * Manage company profile and business information.

* **2. Product Management Access**:
  * Upload new product listings (spec sheets, real photos, dimensions, wholesale pricing).
  * Edit existing inventory details and stock levels.
  * Track real-time product approval statuses (`Draft`, `Pending Review`, `Published`, `Rejected`).

---

## Product Ownership & Approval Workflow
* **Inventory Ownership**: Suppliers own their physical stock and inventory.
* **Presentation Ownership**: MetaBrain owns product presentation, copy optimization, pricing strategy, SKU allocation, SEO metadata, and customer experience.

### Approval Lifecycle
```
[Supplier Uploads / Edits Product] 
       │
       ▼
[Status: Pending Review] (Hidden from public catalog)
       │
       ▼
[MetaBrain Operations Review]
  • Optimizes product structure & specifications
  • Applies pricing strategy & margins
  • Generates luxury copy & SEO metadata via OpenAI
  • Assigns standardized SKU & categorization
       │
       ▼
[MetaBrain Approves & Publishes] 
       │
       ▼
[Status: Published] (Live in DB Market catalog)
```
*Rule: If a supplier edits a published product, it immediately reverts to `Pending Review` until MetaBrain re-approves the modifications.*

---

## AI & Email Architecture
* **Primary AI Engine**: **OpenAI** (`gpt-4o` / `gpt-4o-mini`) exclusively for text processing: catalog copy generation, SEO title/meta descriptions, search keyword extraction, category classification, and specification normalization. *All Gemini, Imagen, and AI image generation components have been completely removed.*
* **Primary Mail Engine**: **SendGrid** for transactional emails, order receipts, supplier fulfillment dispatches, and payout alerts. *All Resend components have been completely replaced.*
