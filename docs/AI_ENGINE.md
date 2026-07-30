# AI Pipeline Engine — DB Market (Vision V2)

## OpenAI System Architecture
DB Market uses **OpenAI** (`gpt-4o` and `gpt-4o-mini`) as its sole, primary AI engine.

All Gemini, Imagen 3, and AI image generation components have been completely removed. DB Market relies exclusively on authentic supplier product photos and technical specification sheets.

---

## AI Scope & Capabilities

OpenAI is utilized strictly for text processing, SEO optimization, and data normalization:

1. **Specification Analysis**: Parses uploaded raw specification sheets, extracting dimensions, finishes, unit measures, materials, and country of origin.
2. **Luxury Description Generation**: Drafts high-end, professional copy tailored to Nigerian architects, builders, and luxury homeowners.
3. **SEO Metadata Optimization**: Generates search-engine-optimized page titles, meta descriptions, and canonical slugs.
4. **Keyword Extraction**: Identifies technical synonyms, metric/imperial size aliases, and regional terminology to enrich the search engine.
5. **Taxonomy & Category Classification**: Suggests the optimal Product Type, Category, Subcategory, and Family Group placement.

---

## Pipeline Execution Stages

```
[Supplier Product Submission]
           │
           ▼
[Stage 1: Spec Analysis & Normalization]
  • Model: `gpt-4o-mini`
  • Input: Raw specs text / sheet upload
  • Output: Structured JSON (material, finish, normalized size, country)
           │
           ▼
[Stage 2: Luxury Copy Generation]
  • Model: `gpt-4o`
  • Input: Product name, brand, material, finish
  • Output: Professional catalog description
           │
           ▼
[Stage 3: SEO & Discovery Optimization]
  • Model: `gpt-4o-mini`
  • Input: Name, category, target location (Abuja / Nigeria)
  • Output: SEO Title (<60 chars), Meta Description (<160 chars), Keywords array
           │
           ▼
[Stage 4: Search Vector Sync]
  • PostgreSQL trigger executes `rebuild_search_index()`
```

---

## Error Handling & Recovery
* If OpenAI API calls fail due to network or rate limits, the task error is logged to `openai_logs`.
* The product remains in `pending_review` status.
* MetaBrain administrators can re-trigger OpenAI processing from the Admin OS dashboard (`/admin/pipeline`) or manually override generated text prior to publishing.
