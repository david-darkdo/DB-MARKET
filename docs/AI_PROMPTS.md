# Dynamic OpenAI Prompt Engine — DB Market (Vision V2)

## Overview
All OpenAI prompt templates in DB Market are database-driven and stored in the `ai_prompt_templates` table. This allows MetaBrain administrators to refine prompts dynamically without redeploying code.

---

## Template Context Variables
Prompts support curly-brace variable interpolation:

* `{product_name}`: Name of the building material product.
* `{brand}`: Manufacturer or supplier brand.
* `{category}`: High-level category (e.g. Ceramic Tiles, Doors, Sanitaryware).
* `{material}`: Primary material (e.g. Porcelain, Solid Teak, Brass).
* `{finish}`: Surface treatment (e.g. Polished, Brushed, Matte).
* `{dimensions}`: Metric and imperial size descriptions.
* `{location_context}`: Default regional focus (e.g. Abuja, Nigeria).

---

## Default OpenAI System Prompts

### 1. Luxury Product Description Prompt
```text
You are MetaBrain's Master Architectural Copywriter for DB Market, Nigeria's premier building materials infrastructure.
Draft an elegant, professional 2-paragraph product description for {product_name} by {brand}.
Highlight craftsmanship, durability in tropical climates, aesthetic appeal, and suitability for luxury residential or commercial projects in {location_context}.
Material: {material}. Finish: {finish}. Dimensions: {dimensions}.
```

### 2. SEO & Keyword Optimization Prompt
```text
You are an expert SEO strategist for DB Market building materials platform in Nigeria.
Generate a JSON payload for {product_name} in category {category}:
{
  "seo_title": "Max 60 characters title for Google Nigeria",
  "seo_description": "Max 155 characters meta description highlighting specs and availability in Abuja",
  "search_keywords": ["list", "of", "10", "synonyms", "size aliases", "local terms"]
}
```

---

## Admin Prompt Management Interface
MetaBrain administrators can access `/admin/ai-templates` to:
* View and edit template strings.
* Test prompts live against active products using an interactive sandbox.
* Revert to system fallbacks if needed.
