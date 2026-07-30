# Product Information Architecture (PIM) — DB Market (Vision V2)

## Product Ownership Principles
* **Inventory Ownership**: Suppliers own their physical stock, warehouse inventory, and original product photographs.
* **Presentation Ownership**: MetaBrain owns product presentation, copywriting, SEO optimization, retail pricing strategy, SKU allocation, and publishing control.

---

## 5-Tier Product Taxonomy

```
1. Product Type      (Root classification e.g. Tiles, Doors, Plumbing, Structural)
   └─► 2. Category         (e.g. Porcelain Tiles, Security Doors, Faucets)
        └─► 3. Subcategory     (e.g. Large Format 60x120, Double Leaf Doors)
             └─► 4. Family Group   (e.g. Carrara Luxury Series)
                  └─► 5. Product       (Individual catalog item listed by Supplier)
```

---

## Product Approval & Publishing Lifecycle

```
[Supplier Submission / Edit] ──► [Status: `pending_review`]
                                          │
                                          ▼
                         [MetaBrain Quality & SEO Audit]
                          • OpenAI luxury copy generation
                          • Metric/Imperial size normalization
                          • Retail pricing & margin calculation
                          • SKU allocation (`TL-CER-0042`)
                                          │
                        ┌─────────────────┴─────────────────┐
                        ▼                                   ▼
              [MetaBrain Approves]                [MetaBrain Rejects]
                        │                                   │
                        ▼                                   ▼
             [Status: `published`]               [Status: `rejected`]
             (Live in Public Feed)              (Returned to Supplier)
                        │
                        ▼
           (If Supplier Edits Again)
                        │
                        └────────► Reverts to `pending_review`
```

---

## Standardized SKU Generator
Products receive a unique sequential SKU assigned upon MetaBrain approval:
`[TYPE_PREFIX]-[CAT_PREFIX]-[SEQUENTIAL_NUMBER]` (e.g. `TL-POR-0142` for Porcelain Tiles).
