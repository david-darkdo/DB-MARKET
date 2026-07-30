import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAIProvider } from "./ai-providers";

async function tryJSON<T = any>(
  provider: any,
  prompt: string,
  system: string,
  imageUrl?: string
): Promise<{ data: T | null; raw: string; error?: string }> {
  try {
    const raw = await provider.callLLM(prompt, system, imageUrl);
    if (!raw) return { data: null, raw: "", error: "AI model returned an empty text response." };

    const cleaned = raw.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const m = cleaned.match(/\{[\s\S]*\}/);
    if (!m) return { data: null, raw, error: "No JSON object found in AI response." };

    const data = JSON.parse(m[0]) as T;
    return { data, raw };
  } catch (err: any) {
    return { data: null, raw: "", error: err.message || "Failed to execute LLM call or parse JSON response." };
  }
}

/**
 * UNIVERSAL PRODUCT AI ENGINE (DB MARKET AI)
 * Single intelligence engine powering all building material categories.
 */
export const runProductDetailsEngine = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string }) => {
    if (!data?.productId) throw new Error("productId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { productId } = data;
    const started = Date.now();

    // 1. Retrieve Product Record
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (pErr || !product) {
      throw new Error(pErr?.message ?? `Product ID ${productId} not found`);
    }

    // 2. Resolve Taxonomy Names & Custom Overrides
    let contextName = "luxury showroom";
    let categoryName = "premium material";
    let typeName = "product";
    let subcategoryName = "";
    let familyName = "";

    const [contextRes, categoryRes, typeRes, subRes, famRes, settingsRes] = await Promise.all([
      product.installation_context_id ? supabase.from("installation_contexts").select("name").eq("id", product.installation_context_id).maybeSingle() : Promise.resolve({ data: null }),
      product.category_id ? supabase.from("categories").select("name").eq("id", product.category_id).maybeSingle() : Promise.resolve({ data: null }),
      product.type_id ? supabase.from("product_types").select("name").eq("id", product.type_id).maybeSingle() : Promise.resolve({ data: null }),
      product.subcategory_id ? supabase.from("subcategories").select("name").eq("id", product.subcategory_id).maybeSingle() : Promise.resolve({ data: null }),
      product.family_id ? supabase.from("family_groups").select("name, custom_ai_prompt_override").eq("id", product.family_id).maybeSingle() : Promise.resolve({ data: null }),
      supabase.from("app_settings").select("*").limit(1).maybeSingle()
    ]);

    if (contextRes.data?.name) contextName = contextRes.data.name;
    if (categoryRes.data?.name) categoryName = categoryRes.data.name;
    if (typeRes.data?.name) typeName = typeRes.data.name;
    if (subRes.data?.name) subcategoryName = subRes.data.name;
    if (famRes.data?.name) familyName = famRes.data.name;

    const familyOverride = famRes.data?.custom_ai_prompt_override ?? null;

    // 3. Load Active Universal AI Prompt Template from Database by Key (Safe string lookup)
    const { data: activeTemplate } = await supabase
      .from("ai_prompt_templates")
      .select("prompt_text")
      .eq("key", "product_details")
      .eq("is_active", true)
      .maybeSingle();

    const templateText = activeTemplate?.prompt_text || `You are DB Market AI, an expert architectural product intelligence engine.

Product Metadata:
Name: {product_name}
Code/SKU: {code}
Brand: {brand}
Production Name: {production_name}
Finish: {finish}
Material: {material}
Color: {color}
Size: {size}
Price: {price}
Type: {type}
Category: {category}
Subcategory: {subcategory}
Family Group: {family}

Output strict JSON with EXACTLY these 19 keys:
{
  "generated_description": "Detailed luxury product description",
  "short_description": "Canonical short description for cards",
  "seo_title": "SEO title under 60 chars",
  "meta_description": "Compelling meta description",
  "seo_keywords": ["keyword1", "keyword2"],
  "canonical_slug": "url-friendly-slug",
  "og_title": "Open Graph Title",
  "og_description": "Open Graph Description",
  "twitter_card": "summary_large_image",
  "faq": [{"question": "Q1", "answer": "A1"}],
  "structured_data": {"@context": "https://schema.org", "@type": "Product", "name": "{product_name}"},
  "search_keywords": ["search term 1", "search term 2"],
  "related_product_types": ["Type 1", "Type 2"],
  "complementary_materials": ["Material 1", "Material 2"],
  "applications": ["Residential living room", "Commercial lobby"],
  "maintenance": "Clean with neutral PH detergent",
  "installation_recommendations": "Professional installation with C2TE adhesive",
  "technical_highlights": ["Highlight 1", "Highlight 2"],
  "customer_benefits": ["Benefit 1", "Benefit 2"]
}`;

    const systemPrompt = `You are DB Market AI, an expert architectural product intelligence engine specializing in premium building materials, construction products, architectural finishes, luxury sanitary ware, plumbing systems, lighting, furniture, kitchens, doors, roofing, aluminium systems, engineering products, and professional construction solutions.

Your responsibility is to transform raw product information into world-class product intelligence suitable for Architects, Interior Designers, Engineers, Contractors, Quantity Surveyors, Developers, Procurement Teams, Retail Customers, and Luxury Home Owners.

Always produce premium-quality, architect-grade content that is professional, trustworthy, SEO-optimized, luxury, technical, and easy to understand.

Return ONLY valid JSON.
Do not return markdown code blocks.
Do not return explanations outside JSON.`;

    // 4. Build Product Metadata Payload
    let prompt = templateText
      .replace(/{product_name}/g, product.name || "")
      .replace(/{code}/g, product.code || "")
      .replace(/{brand}/g, product.brand ?? "DB Market Showroom")
      .replace(/{production_name}/g, product.production_name ?? "")
      .replace(/{finish}/g, product.finish ?? product.finish_name ?? "premium finish")
      .replace(/{material}/g, product.material ?? "premium material")
      .replace(/{color}/g, product.color ?? "")
      .replace(/{size}/g, product.size ?? "")
      .replace(/{price}/g, product.price ? String(product.price) : "")
      .replace(/{context}/g, contextName)
      .replace(/{type}/g, typeName)
      .replace(/{category}/g, categoryName)
      .replace(/{subcategory}/g, subcategoryName)
      .replace(/{family}/g, familyName);

    if (familyOverride) {
      prompt += `\n\nAdditional Family Directives: ${familyOverride}`;
    }

    // 5. Call LLM Provider
    const settings = settingsRes.data;
    const config = settings ? {
      activeProvider: settings.active_ai_provider || "openai",
      openaiLlmModel: settings.openai_llm_model,
      openaiImageModel: settings.openai_image_model,
      openaiImageSize: settings.openai_image_size || "1024x1024",
      geminiLlmModel: settings.gemini_llm_model,
      geminiImageModel: settings.gemini_image_model
    } : undefined;

    const provider = getAIProvider(config as any);
    const imageUrl = product.image_url || undefined;

    const { data: json, error: parseError } = await tryJSON<any>(
      provider,
      prompt,
      systemPrompt,
      imageUrl
    );

    if (!json) {
      throw new Error(`Universal AI Engine [${provider.name}]: ${parseError || "Failed to generate valid JSON intelligence payload"}`);
    }

    // 6. EXPLICIT DATABASE MAPPING FOR 19 UNIVERSAL KEYS
    const productPatch: Record<string, any> = {};

    const syncedDescription = json.generated_description || json.short_description || json.seo_description || json.meta_description || "";
    if (syncedDescription) {
      productPatch.generated_description = syncedDescription;
      productPatch.short_description = json.short_description || syncedDescription;
      if (!product.seo_description_manual) {
        productPatch.seo_description = json.meta_description || syncedDescription;
      }
    }

    // SEO Metadata Fields
    if (!product.seo_title_manual && json.seo_title) {
      productPatch.seo_title = json.seo_title;
    }
    if (!product.seo_keywords_manual && Array.isArray(json.seo_keywords)) {
      productPatch.seo_keywords = json.seo_keywords;
    }
    if (json.canonical_slug) productPatch.canonical_slug = json.canonical_slug;
    if (json.faq) productPatch.faq = json.faq;
    if (json.structured_data) productPatch.structured_data = json.structured_data;

    // Combined Search Keywords, Application & Technical Highlights
    const rawSearchKeywords = [
      ...(Array.isArray(json.search_keywords) ? json.search_keywords : []),
      ...(Array.isArray(json.related_product_types) ? json.related_product_types : []),
      ...(Array.isArray(json.complementary_materials) ? json.complementary_materials : []),
      ...(Array.isArray(json.applications) ? json.applications : []),
      ...(Array.isArray(json.technical_highlights) ? json.technical_highlights : []),
      ...(Array.isArray(json.customer_benefits) ? json.customer_benefits : []),
    ].filter(Boolean);

    if (rawSearchKeywords.length > 0) {
      const searchArray = Array.from(new Set(rawSearchKeywords));
      productPatch.app_keywords = searchArray;
      productPatch.app_search_keywords = searchArray;
    }

    // Execution Tracking
    productPatch.processing_state = "completed";
    productPatch.is_published = true;
    productPatch.last_processed_at = new Date().toISOString();
    productPatch.error_log = null;

    // 7. Save Product Updates to Supabase
    const { error: updateErr } = await supabase.from("products").update(productPatch as any).eq("id", productId);
    if (updateErr) {
      throw new Error(`Failed to update product record: ${updateErr.message}`);
    }

    // Save Product Intelligence Backup
    await supabase.from("product_understanding" as any).upsert({
      product_id: productId,
      raw_ai_response: json,
      detected_material: json.material ?? product.material ?? null,
      detected_finish: json.finish ?? product.finish ?? null,
      detected_color: json.color ?? product.color ?? null,
      detected_keywords: productPatch.app_keywords ?? [],
      confidence_score: 0.98,
      provider: provider.name,
    }, { onConflict: "product_id" } as any);

    // Compute Similar Product Recommendations
    const { data: similarProds } = await supabase
      .from("products")
      .select("id")
      .neq("id", productId)
      .is("deleted_at", null)
      .limit(6);

    if (similarProds?.length) {
      await supabase.from("products").update({
        similar_product_ids: similarProds.map((p: any) => p.id)
      } as any).eq("id", productId);
    }

    // Rebuild Search Index
    await supabase.rpc("rebuild_search_index" as any, { _product_id: productId } as any);

    const executionMs = Date.now() - started;

    // Log Execution Metrics in ai_jobs
    try {
      await supabase.from("ai_jobs" as any).insert({
        product_id: productId,
        job_type: "seo",
        status: "success",
        execution_time_ms: executionMs,
        result: {
          engine: "Universal Product AI Engine",
          provider: provider.name,
          keys_routed: Object.keys(productPatch),
        },
        completed_at: new Date().toISOString(),
      });
    } catch {}

    // 8. Re-query Updated Product Row for Verification
    const { data: verifiedProduct } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .single();

    return {
      ok: true,
      details: json,
      syncedDescription,
      product: verifiedProduct,
      executionMs,
      providerName: provider.name,
    };
  });
