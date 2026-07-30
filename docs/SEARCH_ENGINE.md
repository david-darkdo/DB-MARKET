# Search Engine Architecture — DB Market (Vision V2)

## Overview
DB Market's search engine is integrated directly into PostgreSQL using Supabase, enhanced with OpenAI keyword enrichment and normalized metric/imperial dimension aliasing.

---

## Technical Features

### 1. Vector Document Caching
Search vectors are cached in `public.search_index` to execute sub-50ms queries across thousands of building material SKUs.

### 2. Dimension & Size Normalization (`generate_size_aliases`)
Building materials searches often vary by measurement format. The search index normalizes dimensions automatically:
* `600x600 mm` ↔ `60x60 cm` ↔ `24x24 inch`
* `3x7 ft` ↔ `900x2100 mm`
* `50 kg` ↔ `50kg bag`

### 3. OpenAI Keyword Enrichment
During product publishing, OpenAI extracts technical synonyms, local trade terms used in Abuja/Nigeria (e.g., "POP cement", "granite tile", "Teak door"), and common misspellings, appending them to the search document.

### 4. Ranking & Relevance (`ts_rank_cd`)
Search results are ordered using `ts_rank_cd` with weighted priorities:
* **Weight A**: Product Name, SKU, Brand.
* **Weight B**: Category, Material, Finish.
* **Weight C**: OpenAI Copy, Search Keywords.
