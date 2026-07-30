import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { ProductCard } from "@/components/ProductCard";
import { fetchProductBySlug, fetchRelatedProducts } from "@/lib/catalog";
import { ArrowLeft, Heart, ShoppingBag, X, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react";
import { AddToCollectionButton } from "@/components/AddToCollectionButton";
import { publicImageUrl } from "@/components/ImageUploader";
import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useFavorites } from "@/hooks/useFavorites";
import { supabase } from "@/integrations/supabase/client";

const productQuery = (slug: string) =>
  queryOptions({
    queryKey: ["product", slug],
    queryFn: async () => {
      const p = await fetchProductBySlug(slug);
      if (!p) throw notFound();
      return p;
    },
  });

const relatedQuery = (familyId: string | null, excludeId: string) =>
  queryOptions({
    queryKey: ["related", familyId, excludeId],
    queryFn: () => fetchRelatedProducts(familyId, excludeId),
    enabled: !!familyId,
  });

export const Route = createFileRoute("/product/$slug")({
  loader: async ({ context, params }) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://db-market-opal.vercel.app';
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    context.queryClient.ensureQueryData(relatedQuery(product.family_id, product.id));

    const [typeRes, categoryRes, subcategoryRes, familyRes] = await Promise.all([
      product.type_id ? supabase.from("product_types").select("name, slug").eq("id", product.type_id).maybeSingle() : Promise.resolve({ data: null }),
      product.category_id ? supabase.from("categories").select("name, slug").eq("id", product.category_id).maybeSingle() : Promise.resolve({ data: null }),
      product.subcategory_id ? supabase.from("subcategories").select("name, slug").eq("id", product.subcategory_id).maybeSingle() : Promise.resolve({ data: null }),
      product.family_id ? supabase.from("family_groups").select("name, slug").eq("id", product.family_id).maybeSingle() : Promise.resolve({ data: null }),
    ]);

    return {
      product,
      origin,
      taxonomy: {
        type: typeRes.data,
        category: categoryRes.data,
        subcategory: subcategoryRes.data,
        family: familyRes.data,
      }
    };
  },
  head: ({ loaderData }: any): any => {
    const product = loaderData?.product;
    const origin = loaderData?.origin || "https://db-market-opal.vercel.app";
    const title = product?.seo_title || `${product?.name || "Product"} — DB Market`;
    const desc = product?.seo_description || product?.short_description || "Premium building material details.";
    const imageUrl = product?.generated_studio_image || product?.image_url || "";
    const canonical = `${origin}/product/${product?.slug || ""}`;

    return {
      meta: [
        { title: title },
        { name: "description", content: desc },
        { property: "og:type", content: "product" },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:image", content: imageUrl ? publicImageUrl(imageUrl) : "" },
        { property: "og:url", content: canonical },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: desc },
        { name: "twitter:image", content: imageUrl ? publicImageUrl(imageUrl) : "" },
      ],
      links: [
        { rel: "canonical", href: canonical }
      ]
    };
  },
  component: ProductPage,

  notFoundComponent: () => (
    <AppShell>
      <div className="container-app py-16 text-center">
        <h1 className="font-display text-2xl">Product not found</h1>
        <Link to="/" className="mt-4 inline-block text-primary underline">
          Back to feed
        </Link>
      </div>
    </AppShell>
  ),
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="container-app py-16 text-center text-sm text-destructive">
        <h2 className="font-semibold text-lg">Failed to load product page</h2>
        <p className="mt-2 text-muted-foreground">{error.message}</p>
        <Link to="/" className="mt-4 inline-block text-primary underline">Back to feed</Link>
      </div>
    </AppShell>
  ),
});

function ProductPage() {
  const { product, origin, taxonomy } = Route.useLoaderData();
  const { data: related = [] } = useSuspenseQuery(
    relatedQuery(product.family_id, product.id),
  );

  const { user } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);
  const [recommendations, setRecommendations] = useState<any[]>([]);

  const [activeImgIndex, setActiveImgIndex] = useState(0);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [lightboxScale, setLightboxScale] = useState(1);

  const studio = publicImageUrl(product.generated_studio_image) || publicImageUrl(product.image_url);
  const installed = publicImageUrl(product.generated_installed_image) || publicImageUrl(product.image_url);

  const galleryImages = useMemo(() => {
    return [studio, installed].filter(Boolean) as string[];
  }, [studio, installed]);

  useEffect(() => {
    if (!product?.id) return;

    if (user?.id) {
      const trackEvent = async () => {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_id", user.id)
          .maybeSingle();
        if (!profile?.id) return;

        await supabase.from("customer_activity").insert({
          user_id: profile.id,
          activity_type: "product_viewed",
          metadata: { productId: product.id, name: product.name, category: (product as any).category || "Uncategorized" }
        });
      };
      void trackEvent();
    }

    const loadRecs = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("status" as any, "published")
        .neq("id", product.id)
        .limit(4);
      setRecommendations(data || []);
    };
    void loadRecs();
  }, [product?.id, user?.id]);

  const handleToggleFavorite = () => {
    void toggleFavorite(product.id, product);
  };

  const breadcrumbs = useMemo(() => {
    const list = [{ label: "Home", path: "/" }];
    if (taxonomy.type?.name) {
      list.push({ label: taxonomy.type.name, path: `/${taxonomy.type.slug}` });
    }
    if (taxonomy.category?.name) {
      list.push({ label: taxonomy.category.name, path: taxonomy.type?.slug ? `/${taxonomy.type.slug}/${taxonomy.category.slug}` : `/${taxonomy.category.slug}` });
    }
    if (taxonomy.subcategory?.name) {
      list.push({ label: taxonomy.subcategory.name, path: `/${taxonomy.type?.slug || "all"}/${taxonomy.category?.slug || "category"}/${taxonomy.subcategory.slug}` });
    }
    list.push({ label: product.name, path: `/product/${product.slug}` });
    return list;
  }, [taxonomy, product]);

  return (
    <AppShell>
      {lightboxImg && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur-md">
          <div className="absolute top-4 right-4 z-50 flex gap-2">
            <button
              onClick={() => setLightboxScale((s) => Math.min(s + 0.5, 3))}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ZoomIn className="h-5 w-5" />
            </button>
            <button
              onClick={() => setLightboxScale((s) => Math.max(s - 0.5, 1))}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <ZoomOut className="h-5 w-5" />
            </button>
            <button
              onClick={() => { setLightboxImg(null); setLightboxScale(1); }}
              className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          <div className="overflow-auto max-h-full max-w-full flex items-center justify-center">
            <img
              src={lightboxImg}
              alt="Fullscreen View"
              style={{ transform: `scale(${lightboxScale})` }}
              className="transition-transform duration-200 max-h-[85vh] max-w-[85vw] object-contain rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}

      <div className="container-app pt-4 pb-16">
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-3 text-[10px] uppercase tracking-wider text-gray-400 scrollbar-none">
          {breadcrumbs.map((b, index) => (
            <span key={index} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <span className="text-gray-600">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-white truncate max-w-[140px]">{b.label}</span>
              ) : (
                <Link to={b.path} className="hover:text-[#FFC107] transition">{b.label}</Link>
              )}
            </span>
          ))}
        </nav>

        <div className="mt-4 grid gap-6 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] aspect-square flex items-center justify-center p-2">
            {galleryImages[activeImgIndex] ? (
              <img
                src={galleryImages[activeImgIndex]}
                alt={product.name}
                onClick={() => setLightboxImg(galleryImages[activeImgIndex])}
                className="w-full h-full object-cover rounded-[10px] cursor-zoom-in hover:scale-[1.02] transition-transform duration-300"
              />
            ) : (
              <div className="text-xs text-gray-500 italic">No image asset</div>
            )}
          </div>

          <div className="space-y-6 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[10px] font-mono font-semibold text-[#FFC107] uppercase tracking-widest block">
                SKU · {product.code || "DBM-ABJ-101"}
              </span>

              <h1 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight">
                {product.name}
              </h1>

              <p className="text-xs text-gray-400 font-medium">
                Brand: <span className="text-white font-bold">{product.brand || "DB Market Select"}</span>
              </p>

              <div className="flex items-baseline gap-2 pt-2">
                <span className="font-display text-3xl font-black text-[#FFC107]">
                  ₦{Number(product.price).toLocaleString()}
                </span>
                <span className="text-xs text-gray-400 font-normal">
                  {product.color ? `/ ${product.color}` : "/ unit"}
                </span>
              </div>

              {product.short_description && (
                <div className="rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-xs text-gray-300 leading-relaxed mt-4">
                  {product.short_description}
                </div>
              )}

              <dl className="grid grid-cols-2 gap-3 pt-2 text-xs">
                {[
                  ["Material", product.material],
                  ["Finish", product.finish],
                ].map(([k, v]) =>
                  v ? (
                    <div key={k as string} className="rounded-[12px] border border-[#2A2A2A] bg-[#1A1A1A] p-3">
                      <dt className="text-[9.5px] font-bold uppercase tracking-wider text-gray-400">{k}</dt>
                      <dd className="mt-1 font-semibold text-white text-xs">{v}</dd>
                    </div>
                  ) : null
                )}
              </dl>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t border-[#2A2A2A]">
              <div className="flex-1">
                <AddToCollectionButton
                  productId={product.id}
                  className="h-12 w-full rounded-[12px] bg-[#0D47FF] hover:bg-[#0B3CDA] text-xs font-black uppercase tracking-wider text-white transition flex items-center justify-center gap-2 shadow-lg btn-glow-blue"
                />
              </div>

              <button
                onClick={handleToggleFavorite}
                className={`h-12 px-5 rounded-[12px] border text-xs font-bold transition flex items-center justify-center gap-2 ${
                  isFav
                    ? "border-[#FFC107] bg-[#FFC107]/10 text-[#FFC107]"
                    : "border-[#333333] bg-[#141414] text-white hover:border-[#FFC107]"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-[#FFC107] text-[#FFC107]" : "text-gray-300"}`} />
                <span>{isFav ? "Saved" : "Save"}</span>
              </button>
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-16 border-t border-[#2A2A2A] pt-8">
            <h2 className="font-display text-xs font-bold uppercase tracking-[0.18em] text-[#FFC107]">
              Related Building Materials
            </h2>
            <p className="font-display text-xl font-black text-white mt-1">From the same collection</p>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
