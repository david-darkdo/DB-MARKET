import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAIProvider, AIProviderError } from "./ai-providers";

async function callLLM(provider: any, prompt: string, system: string): Promise<string> {
  return provider.callLLM(prompt, system);
}

export const runProductPipeline = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string }) => {
    if (!data?.productId) throw new Error("productId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const productId = data.productId;

    const { data: product, error: pErr } = await supabase
      .from("products").select("*").eq("id", productId).maybeSingle();
    if (pErr || !product) throw new Error(pErr?.message ?? "Product not found");

    await supabase.from("products")
      .update({ processing_state: "processing", error_log: null, last_processed_at: new Date().toISOString() } as any)
      .eq("id", productId);

    try {
      const { runProductDetailsEngine } = await import("./product-details.functions");
      const detailsRes = await runProductDetailsEngine({ data: { productId } });
      
      if (!detailsRes.ok) {
        throw new Error("Universal Product AI Engine failed");
      }

      if (product.image_url) {
        const { generateStandaloneLifestyleImage } = await import("./lifestyle-image.functions");
        await generateStandaloneLifestyleImage({ data: { productId } }).catch((err) => {
          console.warn("Lifestyle image generation step non-critical warning:", err);
        });
      }

      await supabase.from("products").update({
        processing_state: "completed",
        is_published: true,
        generation_version: ((product as any).generation_version ?? 0) + 1,
        last_processed_at: new Date().toISOString(),
        error_log: null,
      } as any).eq("id", productId);

      return { ok: true as const };
    } catch (e: any) {
      await supabase.from("products").update({
        processing_state: "error",
        error_log: { message: e.message || String(e) },
        last_processed_at: new Date().toISOString(),
      } as any).eq("id", productId);
      return { ok: false as const, error: e.message || String(e) };
    }
  });

export const testLLMConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { prompt: string; systemPrompt: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let settingsRow: any = null;
    try {
      const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
      settingsRow = settings;
      const config = settings ? {
        activeProvider: settings.active_ai_provider || "openai",
        openaiLlmModel: settings.openai_llm_model,
        openaiImageModel: settings.openai_image_model,
        openaiImageSize: settings.openai_image_size || "1024x1024",
        geminiLlmModel: settings.gemini_llm_model,
        geminiImageModel: settings.gemini_image_model,
        geminiUseVertex: settings.gemini_use_vertex ?? false
      } : undefined;
      const provider = getAIProvider(config);
      const result = await provider.callLLM(data.prompt, data.systemPrompt);

      if (settingsRow?.id) {
        await supabase.from("app_settings").update({
          last_provider_call_success: true,
          last_provider_error: null
        } as any).eq("id", settingsRow.id);
      }

      return { ok: true, text: result };
    } catch (e: any) {
      if (settingsRow?.id) {
        await supabase.from("app_settings").update({
          last_provider_call_success: false,
          last_provider_error: `LLM test failed: ${e.message || String(e)}`
        } as any).eq("id", settingsRow.id);
      }
      return {
        ok: false,
        error: e.message || String(e),
        details: e instanceof AIProviderError || e?.name === "AIProviderError" ? {
          url: e.url,
          requestHeaders: e.requestHeaders,
          requestBody: e.requestBody,
          responseBody: e.responseBody,
          status: e.status
        } : null
      };
    }
  });

export const testImageConnection = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { prompt: string }) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let settingsRow: any = null;
    try {
      const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
      settingsRow = settings;
      const config = settings ? {
        activeProvider: settings.active_ai_provider || "openai",
        openaiLlmModel: settings.openai_llm_model,
        openaiImageModel: settings.openai_image_model,
        openaiImageSize: settings.openai_image_size || "1024x1024",
        geminiLlmModel: settings.gemini_llm_model,
        geminiImageModel: settings.gemini_image_model,
        geminiUseVertex: settings.gemini_use_vertex ?? false
      } : undefined;
      const provider = getAIProvider(config);
      const buf = await provider.generateImage(data.prompt);
      const b64 = buf.toString("base64");

      if (settingsRow?.id) {
        await supabase.from("app_settings").update({
          last_provider_call_success: true,
          last_provider_error: null
        } as any).eq("id", settingsRow.id);
      }

      return { ok: true, b64 };
    } catch (e: any) {
      if (settingsRow?.id) {
        await supabase.from("app_settings").update({
          last_provider_call_success: false,
          last_provider_error: `Image test failed: ${e.message || String(e)}`
        } as any).eq("id", settingsRow.id);
      }
      return {
        ok: false,
        error: e.message || String(e),
        details: e instanceof AIProviderError || e?.name === "AIProviderError" ? {
          url: e.url,
          requestHeaders: e.requestHeaders,
          requestBody: e.requestBody,
          responseBody: e.responseBody,
          status: e.status
        } : null
      };
    }
  });

export const getAIConfigDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();

    const activeProvider = settings?.active_ai_provider || "openai";
    const geminiKey = process.env.GEMINI_API_KEY || process.env.LOVABLE_API_KEY || "";
    const openAiKey = process.env.OPENAI_API_KEY || "";
    const anthropicKey = process.env.ANTHROPIC_API_KEY || "";

    const maskKey = (key: string) => {
      if (!key) return "MISSING";
      return `${key.slice(0, 6)}...${key.slice(-4)} (Length: ${key.length})`;
    };

    return {
      activeProvider,
      lastProviderCallSuccess: settings?.last_provider_call_success ?? null,
      lastProviderError: settings?.last_provider_error ?? null,
      openai: {
        apiKeyStatus: maskKey(openAiKey),
        llmModel: settings?.openai_llm_model || "gpt-4o-mini",
        imageModel: settings?.openai_image_model || "dall-e-3",
        imageSize: settings?.openai_image_size || "1024x1024",
      },
      gemini: {
        apiKeyStatus: maskKey(geminiKey),
        llmModel: settings?.gemini_llm_model || "gemini-1.5-flash",
        imageModel: settings?.gemini_image_model || "imagen-3.0-generate-002",
        geminiUseVertex: settings?.gemini_use_vertex ?? false,
        isVertex: settings?.gemini_use_vertex ?? geminiKey.startsWith("AQ"),
        projectId: process.env.GCP_PROJECT_ID || "de-enreach-gemini-api-key",
        region: process.env.GCP_REGION || "us-central1",
      },
      claude: {
        apiKeyStatus: maskKey(anthropicKey),
        llmModel: (settings as any)?.anthropic_llm_model || "claude-3-opus",
      }
    };
  });

export const updateAISettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: any) => data)
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { data: current } = await supabase.from("app_settings").select("id").limit(1).maybeSingle();
    if (!current?.id) {
      throw new Error("No settings record found to update");
    }
    const { error } = await supabase.from("app_settings").update({
      active_ai_provider: data.activeProvider,
      openai_llm_model: data.openaiLlmModel,
      openai_image_model: data.openaiImageModel,
      openai_image_size: data.openaiImageSize,
      gemini_llm_model: data.geminiLlmModel,
      gemini_image_model: data.geminiImageModel,
      gemini_use_vertex: data.geminiUseVertex
    } as any).eq("id", current.id);
    if (error) throw error;
    return { ok: true };
  });

export const getDiscoveryHealthDetails = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;

    const { data: allSlugs } = await supabase
      .from("products")
      .select("slug")
      .is("deleted_at", null);
    const slugCounts = new Map<string, number>();
    allSlugs?.forEach((p) => {
      if (p.slug) slugCounts.set(p.slug, (slugCounts.get(p.slug) ?? 0) + 1);
    });
    let duplicateSlugsCount = 0;
    slugCounts.forEach((c) => {
      if (c > 1) duplicateSlugsCount++;
    });

    const { count: missingMetaCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .or("seo_title.is.null,seo_description.is.null");

    const { count: missingImagesCount } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null)
      .is("image_url", null);

    const { count: totalProducts } = await supabase
      .from("products")
      .select("*", { count: "exact", head: true })
      .is("deleted_at", null);

    const { count: totalSearchIndex } = await supabase
      .from("search_index")
      .select("*", { count: "exact", head: true });

    const { count: countTypes } = await supabase.from("product_types").select("*", { count: "exact", head: true });
    const { count: countCats } = await supabase.from("categories").select("*", { count: "exact", head: true });
    const { count: countSubs } = await supabase.from("subcategories").select("*", { count: "exact", head: true });
    const { count: countFams } = await supabase.from("family_groups").select("*", { count: "exact", head: true });

    const { count: totalRedirects } = await supabase.from("redirects").select("*", { count: "exact", head: true });

    return {
      duplicateSlugsCount: duplicateSlugsCount || 0,
      missingMetaCount: missingMetaCount || 0,
      missingImagesCount: missingImagesCount || 0,
      totalProducts: totalProducts || 0,
      totalSearchIndex: totalSearchIndex || 0,
      totalRedirects: totalRedirects || 0,
      taxonomy: {
        types: countTypes || 0,
        categories: countCats || 0,
        subcategories: countSubs || 0,
        families: countFams || 0,
      },
      lastGeneratedTimestamp: new Date().toISOString(),
    };
  });

export const rebuildAllSearchIndexes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: products } = await supabase
      .from("products")
      .select("id")
      .is("deleted_at", null);

    if (products) {
      for (const p of products) {
        await supabase.rpc("rebuild_search_index" as any, { _product_id: p.id } as any);
      }
    }
    return { ok: true, count: products?.length || 0 };
  });

export const runSandboxStage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string; stageKey: string }) => {
    if (!data?.productId) throw new Error("productId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { productId } = data;
    const started = Date.now();

    const { data: product, error: pErr } = await supabase
      .from("products").select("*").eq("id", productId).maybeSingle();
    if (pErr || !product) throw new Error(pErr?.message ?? "Product not found");

    const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
    const config = settings ? {
      activeProvider: settings.active_ai_provider || "openai",
      openaiLlmModel: settings.openai_llm_model,
      openaiImageModel: settings.openai_image_model,
      openaiImageSize: settings.openai_image_size || "1024x1024",
      geminiLlmModel: settings.gemini_llm_model,
      geminiImageModel: settings.gemini_image_model,
      geminiUseVertex: settings.gemini_use_vertex ?? false
    } : undefined;

    const provider = getAIProvider(config as any);

    const { data: templateRow } = await supabase
      .from("ai_prompt_templates")
      .select("prompt_text")
      .eq("key", "product_details")
      .eq("is_active", true)
      .maybeSingle();

    const promptText = templateRow?.prompt_text || "You are DB Market AI. Output strict JSON for the product.";

    const prompt = `${promptText}\n\nProduct Name: ${product.name}\nBrand: ${product.brand || 'DB Market'}\nCode: ${product.code || ''}`;

    const response = await callLLM(
      provider,
      prompt,
      "You are DB Market AI. Output strict compact JSON."
    );

    const executionMs = Date.now() - started;

    return {
      ok: true,
      compiledPrompt: prompt,
      aiResponse: response,
      executionMs,
      stageKey: "product_details",
      providerName: provider.name,
      isImageStage: false,
      productName: product.name,
      imageUrl: product.image_url ?? null,
    };
  });
