import { supabase } from "@/integrations/supabase/client";

export type ProductRow = {
  id: string;
  slug: string;
  name: string;
  code: string;
  price: number;
  brand: string | null;
  image_url: string | null;
  generated_studio_image: string | null;
  generated_installed_image: string | null;
  short_description: string | null;
  family_id: string | null;
  type_id: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  color: string | null;
  material: string | null;
  finish: string | null;
  app_keywords: string[] | null;
  featured_feed?: boolean | null;
  featured_homepage?: boolean | null;
};

export type TaxonomyNode = { id: string; name: string; slug: string };

const PRODUCT_FIELDS =
  "id,slug,name,code,price,brand,image_url,generated_studio_image,generated_installed_image,short_description,family_id,type_id,category_id,subcategory_id,color,material,finish,app_keywords,featured_feed,featured_homepage";

/** Customer-facing visibility: completed processing, published, not hidden, not soft-deleted. */
function applyPublicFilters<T extends { eq: Function; is: Function }>(q: T): T {
  return (q as any)
    .eq("processing_state", "completed")
    .eq("status", "published")
    .eq("hidden", false)
    .is("deleted_at", null);
}

export async function fetchTaxonomy() {
  const [types, categories, subcategories] = await Promise.all([
    supabase.from("product_types").select("id,name,slug").order("name"),
    supabase.from("categories").select("id,name,slug,type_id").order("name"),
    supabase.from("subcategories").select("id,name,slug,category_id").order("name"),
  ]);
  if (types.error) throw types.error;
  if (categories.error) throw categories.error;
  if (subcategories.error) throw subcategories.error;
  return {
    types: types.data ?? [],
    categories: categories.data ?? [],
    subcategories: subcategories.data ?? [],
  };
}

export type FeedFilters = {
  type?: string;
  category?: string;
  subcategory?: string;
  q?: string;
};

export async function fetchFeedProducts(filters: FeedFilters): Promise<ProductRow[]> {
  // Unified Search Path (ENREACH V2 Requirement 2: Manual Data + Hierarchy Metadata + AI Intelligence Union)
  if (filters.q && filters.q.trim()) {
    const term = filters.q.trim();
    const matchedIdSet = new Set<string>();

    // 1. TSVector search_products RPC
    const { data: ranked } = await supabase.rpc("search_products" as any, {
      _q: term,
      _limit: 60,
    } as any);
    if (ranked && Array.isArray(ranked)) {
      ranked.forEach((r: any) => { if (r?.product_id) matchedIdSet.add(r.product_id); });
    }

    // 2. Direct ILIKE search on manual product attributes (Name, Code, Brand, Short Description, Material, Finish, Color, Size)
    const { data: ilikeProducts } = await applyPublicFilters(
      supabase.from("products").select("id")
    ).or(`name.ilike.%${term}%,code.ilike.%${term}%,brand.ilike.%${term}%,short_description.ilike.%${term}%,material.ilike.%${term}%,finish.ilike.%${term}%,color.ilike.%${term}%,size.ilike.%${term}%`);

    if (ilikeProducts) {
      ilikeProducts.forEach((p: any) => matchedIdSet.add(p.id));
    }

    // 3. Hierarchy Metadata Search (Product Types, Categories, Subcategories, Family Groups matching query term)
    const [typeMatches, catMatches, subMatches, famMatches] = await Promise.all([
      supabase.from("product_types").select("id").ilike("name", `%${term}%`),
      supabase.from("categories").select("id").ilike("name", `%${term}%`),
      supabase.from("subcategories").select("id").ilike("name", `%${term}%`),
      supabase.from("family_groups").select("id").ilike("name", `%${term}%`),
    ]);

    const typeIds = (typeMatches.data || []).map((t: any) => t.id);
    const catIds = (catMatches.data || []).map((c: any) => c.id);
    const subIds = (subMatches.data || []).map((s: any) => s.id);
    const famIds = (famMatches.data || []).map((f: any) => f.id);

    const hierOrConditions: string[] = [];
    if (typeIds.length) hierOrConditions.push(`type_id.in.(${typeIds.join(",")})`);
    if (catIds.length) hierOrConditions.push(`category_id.in.(${catIds.join(",")})`);
    if (subIds.length) hierOrConditions.push(`subcategory_id.in.(${subIds.join(",")})`);
    if (famIds.length) hierOrConditions.push(`family_id.in.(${famIds.join(",")})`);

    if (hierOrConditions.length > 0) {
      const { data: hierProducts } = await applyPublicFilters(
        supabase.from("products").select("id")
      ).or(hierOrConditions.join(","));
      if (hierProducts) {
        hierProducts.forEach((p: any) => matchedIdSet.add(p.id));
      }
    }

    const finalIds = Array.from(matchedIdSet);
    if (finalIds.length === 0) return [];

    let byIdQuery = applyPublicFilters(
      supabase.from("products").select(PRODUCT_FIELDS),
    ).in("id", finalIds);

    // Apply explicit hierarchy dropdown filters if active
    if (filters.type) {
      const { data } = await supabase.from("product_types").select("id").eq("slug", filters.type).maybeSingle();
      if (data?.id) byIdQuery = byIdQuery.eq("type_id", data.id);
    }
    if (filters.category) {
      const { data } = await supabase.from("categories").select("id").eq("slug", filters.category).maybeSingle();
      if (data?.id) byIdQuery = byIdQuery.eq("category_id", data.id);
    }
    if (filters.subcategory) {
      const { data } = await supabase.from("subcategories").select("id").eq("slug", filters.subcategory).maybeSingle();
      if (data?.id) byIdQuery = byIdQuery.eq("subcategory_id", data.id);
    }

    const { data, error } = await byIdQuery;
    if (error) throw error;

    const rankOrder = new Map(finalIds.map((id, i) => [id, i] as const));
    return ((data ?? []) as ProductRow[]).sort(
      (a, b) => (rankOrder.get(a.id) ?? 0) - (rankOrder.get(b.id) ?? 0),
    );
  }

  let query = applyPublicFilters(
    supabase.from("products").select(PRODUCT_FIELDS),
  )
    .order("featured_feed", { ascending: false } as any)
    .order("created_at", { ascending: false })
    .limit(60);

  if (filters.type) {
    const { data } = await supabase
      .from("product_types")
      .select("id")
      .eq("slug", filters.type)
      .maybeSingle();
    if (data?.id) query = query.eq("type_id", data.id);
  }
  if (filters.category) {
    const { data } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.category)
      .maybeSingle();
    if (data?.id) query = query.eq("category_id", data.id);
  }
  if (filters.subcategory) {
    const { data } = await supabase
      .from("subcategories")
      .select("id")
      .eq("slug", filters.subcategory)
      .maybeSingle();
    if (data?.id) query = query.eq("subcategory_id", data.id);
  }
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export async function fetchHomepageFeatured(): Promise<ProductRow[]> {
  const { data, error } = await applyPublicFilters(
    supabase.from("products").select(PRODUCT_FIELDS),
  )
    .eq("featured_homepage", true)
    .order("created_at", { ascending: false })
    .limit(8);
  if (error) throw error;
  return (data ?? []) as ProductRow[];
}

export async function fetchProductBySlug(slug: string) {
  const { data, error } = await applyPublicFilters(
    supabase.from("products").select("*"),
  )
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchRelatedProducts(
  familyId: string | null,
  excludeId: string,
  similarIds?: string[] | null,
) {
  // Prefer pre-computed similar list when available.
  if (similarIds && similarIds.length) {
    const { data, error } = await applyPublicFilters(
      supabase.from("products").select(PRODUCT_FIELDS),
    )
      .in("id", similarIds)
      .neq("id", excludeId)
      .limit(8);
    if (error) throw error;
    if ((data ?? []).length) return data as ProductRow[];
  }
  if (!familyId) return [];
  const { data, error } = await applyPublicFilters(
    supabase.from("products").select(PRODUCT_FIELDS),
  )
    .eq("family_id", familyId)
    .neq("id", excludeId)
    .limit(8);
  if (error) throw error;
  return (data ?? []) as ProductRow[];
}
