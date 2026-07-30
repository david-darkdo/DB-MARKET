import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getAIProvider } from "./ai-providers";

/**
 * Universal Lifestyle Image Generation Module
 * Generates an installed/lifestyle architectural rendering from the manufacturer product image.
 */
export const generateStandaloneLifestyleImage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .validator((data: { productId: string }) => {
    if (!data?.productId) throw new Error("productId required");
    return data;
  })
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    const { productId } = data;
    const started = Date.now();

    // 1. Retrieve Original Product Record
    const { data: product, error: pErr } = await supabase
      .from("products")
      .select("*")
      .eq("id", productId)
      .maybeSingle();

    if (pErr || !product) {
      throw new Error(pErr?.message ?? "Product not found");
    }

    if (!product.image_url || typeof product.image_url !== "string" || product.image_url.trim() === "") {
      throw new Error("Original product image is required before generating an installed image.");
    }

    // 2. Retrieve Prompt Template from AI Control Center by Key
    const { data: template } = await supabase
      .from("ai_prompt_templates")
      .select("prompt_text, is_active")
      .eq("key", "product_details")
      .eq("is_active", true)
      .maybeSingle();

    const rawTemplateText = template?.prompt_text || "Render product in an architectural installation scene.";

    // Resolve Taxonomy
    let typeName = "product";
    let categoryName = "material";

    const [typeRes, catRes] = await Promise.all([
      product.type_id ? supabase.from("product_types").select("name").eq("id", product.type_id).maybeSingle() : Promise.resolve({ data: null }),
      product.category_id ? supabase.from("categories").select("name").eq("id", product.category_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    if (typeRes.data?.name) typeName = typeRes.data.name;
    if (catRes.data?.name) categoryName = catRes.data.name;

    const prompt = `Render the ${product.name} (${typeName}, ${categoryName}, brand: ${product.brand || 'DB Market'}) in a high-end luxury architectural installation scene. ${rawTemplateText}`;

    // 3. Provider Config
    const { data: settings } = await supabase.from("app_settings").select("*").limit(1).maybeSingle();
    const config = settings ? {
      activeProvider: settings.active_ai_provider || "openai",
      openaiLlmModel: settings.openai_llm_model,
      openaiImageModel: settings.openai_image_model,
      openaiImageSize: settings.openai_image_size || "1024x1024",
      geminiLlmModel: settings.gemini_llm_model,
      geminiImageModel: settings.gemini_image_model,
    } : undefined;

    const provider = getAIProvider(config as any);

    let origBuffer: Buffer | undefined;
    try {
      const imgRes = await fetch(product.image_url);
      if (imgRes.ok) {
        const arrBuf = await imgRes.arrayBuffer();
        origBuffer = Buffer.from(arrBuf);
      }
    } catch {}

    let installedBuf: Buffer;
    try {
      if (typeof provider.generateLifestyleImage === "function") {
        installedBuf = await provider.generateLifestyleImage(prompt, origBuffer);
      } else {
        installedBuf = await provider.generateImage(prompt);
      }
    } catch (genErr: any) {
      throw new Error(`Lifestyle image generation failed: ${genErr.message || String(genErr)}`);
    }

    // 4. Save Image to Cloudinary or Supabase Storage
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    let installedUrl = "";

    if (cloudName && apiKey && apiSecret) {
      try {
        const crypto = await import("crypto");
        const timestamp = Math.round(Date.now() / 1000);
        const folder = `products/${productId}`;
        const paramString = `folder=${folder}&timestamp=${timestamp}`;
        const signature = crypto
          .createHash("sha1")
          .update(paramString + apiSecret)
          .digest("hex");

        const formData = new URLSearchParams();
        formData.append("file", `data:image/png;base64,${installedBuf.toString("base64")}`);
        formData.append("api_key", apiKey);
        formData.append("timestamp", String(timestamp));
        formData.append("folder", folder);
        formData.append("signature", signature);

        const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
          method: "POST",
          body: formData,
        });

        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          installedUrl = uploadData.secure_url;
        }
      } catch (e) {
        console.warn("Cloudinary upload failed, falling back to Supabase storage:", e);
      }
    }

    if (!installedUrl) {
      const BUCKET = "product-images";
      const filePath = `${productId}/${Date.now()}_installed.png`;
      const { data: stData, error: stErr } = await supabase.storage.from(BUCKET).upload(filePath, installedBuf, {
        contentType: "image/png",
        upsert: true
      });
      if (stErr) throw new Error(`Failed to upload installed image: ${stErr.message}`);
      const { data: pubUrlData } = supabase.storage.from(BUCKET).getPublicUrl(stData.path);
      installedUrl = pubUrlData.publicUrl;
    }

    // Update Product Record
    await supabase.from("products").update({
      generated_installed_image: installedUrl,
      last_processed_at: new Date().toISOString(),
    } as any).eq("id", productId);

    return {
      ok: true,
      imageUrl: installedUrl,
      executionMs: Date.now() - started,
      providerName: provider.name,
    };
  });
