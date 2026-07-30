# Supplier Ecosystem & Dashboard — DB Market (Vision V2)

## Overview
Suppliers use the exact same application as customers. No separate application or portal domain is required.

---

## Onboarding & Account Authorization Workflow

```
[Supplier Registers Account on DB Market]
                   │
                   ▼
     [Standard Customer Account Created]
                   │
                   ▼
  [MetaBrain Reviews Supplier Verification]
                   │
                   ▼
 [MetaBrain Grants Supplier Role in `user_roles`]
                   │
                   ▼
[Supplier Dashboard Unlocked in User Navigation]
```

---

## Role-Based Access Tiers (Version 1)

Access within the Supplier Dashboard (`/supplier`) is controlled by two distinct role permissions:

### 1. Management Access (`supplier_management`)
Designed for business owners, finance managers, and company directors.
* **Business Analytics**: Monitor overall sales volume, total earnings, and popular inventory items.
* **Payout & Financial Controls**: View available balance, request earnings withdrawals, and configure settlement bank details.
* **MetaBrain Announcements**: View official platform announcements, policy updates, and operational alerts.
* **Company Profile**: Manage legal business name, tax identification numbers, and warehouse pickup locations in Abuja.

### 2. Product Management Access (`supplier_product_manager`)
Designed for inventory managers and catalog operators.
* **Product Uploads**: Submit new materials (real photos, raw spec sheets, unit dimensions, wholesale prices).
* **Stock Management**: Update stock levels and warehouse availability.
* **Approval Status Tracking**: Track real-time submission review status (`Draft` → `Pending Review` → `Published` / `Rejected`).
