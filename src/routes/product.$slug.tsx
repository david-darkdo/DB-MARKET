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
import { toast } from "sonner";

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
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://showroom.enreach.concepts';
    const product = await context.queryClient.ensureQueryData(productQuery(params.slug));
    context.queryClient.ensureQueryData(relatedQuery(product.family_id, product.id));

    // Fetch taxonomy parents
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
    const origin = loaderData?.origin || "https://showroom.enreach.concepts";
    const title = product?.seo_title || `${product?.name || "Product"} — Enreach Concepts`;
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

  // Gallery slider states
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
      // Track page views
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

    // Load recommendations
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

  // Breadcrumbs config
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

  // Structured Data (JSON-LD)
  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: galleryImages,
    description: product.short_description || product.seo_description || "Premium architectural building material.",
    sku: product.code,
    mpn: product.code,
    brand: {
      "@type": "Brand",
      name: product.brand || "Enreach Concepts",
    },
    offers: {
      "@type": "Offer",
      url: `${origin}/product/${product.slug}`,
      priceCurrency: "NGN",
      price: product.price,
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: breadcrumbs.map((b, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: b.label,
      item: `${origin}${b.path}`,
    })),
  };

  const faqSchema = product.faq && Array.isArray(product.faq) && (product.faq as any[]).length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: (product.faq as any[]).map((f) => ({
      "@type": "Question",
      name: f.question || f.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer || f.a,
      },
    })),
  } : null;

  return (
    <AppShell>
      {/* Lightbox Modal */}
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

      {/* JSON-LD Structured Data */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}
      {product.structured_data && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(product.structured_data) }} />
      )}

      <div className="container-app pt-2 pb-10">
        {/* Breadcrumb Row */}
        <nav className="flex items-center gap-1.5 overflow-x-auto pb-3 text-[10px] uppercase tracking-wider text-muted-foreground scrollbar-none">
          {breadcrumbs.map((b, index) => (
            <span key={index} className="flex items-center gap-1.5 shrink-0">
              {index > 0 && <span className="text-muted-foreground/30">/</span>}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-foreground truncate max-w-[120px]">{b.label}</span>
              ) : (
                <Link to={b.path} className="hover:text-primary transition">{b.label}</Link>
              )}
            </span>
          ))}
        </nav>

        {/* Gallery Grid */}
        <div className="mt-3 grid gap-4 md:grid-cols-2">
          {/* Main Studio View */}
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm aspect-square flex items-center justify-center">
            {galleryImages[activeImgIndex] ? (
              <img
                src={galleryImages[activeImgIndex]}
                alt={product.name}
                onClick={() => setLightboxImg(galleryImages[activeImgIndex])}
                className="w-full h-full object-cover cursor-zoom-in hover:scale-[1.01] transition-transform duration-300"
              />
            ) : (
              <div className="text-xs text-muted-foreground italic">No image assets</div>
            )}
          </div>

          {/* Installed Lifestyle Reference - Full Frame Cover */}
          {installed ? (
            <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm aspect-square md:aspect-auto h-full flex flex-col justify-end p-6">
              <img
                src={installed}
                alt={`${product.name} installed view`}
                onClick={() => setLightboxImg(installed)}
                className="absolute inset-0 w-full h-full object-cover cursor-zoom-in hover:scale-[1.02] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />
              <div className="relative z-10 text-white space-y-1">
                <span className="inline-block px-2.5 py-0.5 rounded bg-primary/90 text-[9px] font-bold uppercase tracking-wider text-primary-foreground backdrop-blur">
                  Installed Reference
                </span>
                <h4 className="font-display text-sm font-bold tracking-tight">Real-World Installation Preview</h4>
                <p className="text-[10px] text-gray-200 line-clamp-2">
                  Visualize this finish scaled inside modern luxury interiors and architectural projects.
                </p>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-dashed border-border p-8 flex items-center justify-center text-xs text-muted-foreground">
              No installed lifestyle preview uploaded yet.
            </div>
          )}
        </div>

        {/* Product Info & Specs */}
        <div className="mt-8 space-y-6">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary font-bold">
              {product.brand || "Enreach Concepts"} · Code {product.code}
            </p>
            <h1 className="mt-1 font-display text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight uppercase">
              {product.name}
            </h1>
            <p className="mt-1.5 font-display text-2xl font-bold text-primary">
              ₦{Number(product.price).toLocaleString()}
              <span className="ml-1 text-sm font-normal text-muted-foreground">/sqm</span>
            </p>
          </div>

          {product.short_description && (
            <div className="rounded-xl border border-border/80 bg-card p-4 text-xs leading-relaxed text-muted-foreground max-w-prose shadow-sm">
              {product.short_description}
            </div>
          )}

          {/* FAQ Accordion Section */}
          {product.faq && Array.isArray(product.faq) && (product.faq as any[]).length > 0 && (
            <div className="rounded-xl border border-border/80 bg-card p-4 text-xs space-y-3 max-w-prose shadow-sm">
              <h3 className="font-display text-sm font-semibold uppercase tracking-wider text-foreground border-b border-border/40 pb-2">Frequently Asked Questions</h3>
              <div className="space-y-4">
                {(product.faq as any[]).map((f, i) => (
                  <div key={i} className="space-y-1">
                    <h4 className="font-semibold text-xs text-foreground flex gap-1.5 items-start">
                      <span className="text-primary font-bold">Q:</span>
                      <span>{f.question || f.q}</span>
                    </h4>
                    <p className="pl-4 text-xs text-muted-foreground leading-relaxed">{f.answer || f.a}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Technical Specifications & Subcategory Identity */}
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs max-w-xl">
            {taxonomy.subcategory?.name && (
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 shadow-sm">
                <dt className="text-[9px] font-bold uppercase tracking-wider text-primary">Subcategory</dt>
                <dd className="mt-1 font-semibold text-foreground text-xs">{taxonomy.subcategory.name}</dd>
              </div>
            )}
            {[
              ["Color", product.color],
              ["Material", product.material],
              ["Finish", product.finish],
            ].map(([k, v]) =>
              v ? (
                <div key={k as string} className="rounded-lg border border-border bg-card p-3 shadow-sm">
                  <dt className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">{k}</dt>
                  <dd className="mt-1 font-semibold text-foreground text-xs">{v}</dd>
                </div>
              ) : null,
            )}
          </dl>

          {/* Actions Bar */}
          <div className="flex gap-2.5 max-w-md pt-2">
            <AddToCollectionButton
              productId={product.id}
              className="flex flex-1 items-center justify-center gap-2 rounded bg-primary px-5 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/95 transition shadow-sm"
            />
            <button
              onClick={handleToggleFavorite}
              className={`rounded px-5 py-3 border text-xs font-bold uppercase tracking-wider transition flex items-center justify-center gap-2 ${
                isFav
                  ? "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                  : "border-border text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Heart className={`h-4 w-4 text-red-500 hover:text-red-600 ${isFav ? "fill-red-500" : ""}`} />
              {isFav ? "Saved" : "Favorite"}
            </button>
          </div>
        </div>

        {/* RELATED PRODUCTS */}
        {related.length > 0 && (
          <section className="mt-12 border-t border-border/50 pt-8">
            <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              From the same design family
            </h2>
            <p className="font-display text-lg font-extrabold text-foreground uppercase tracking-tight">Related materials</p>
            <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {related.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}

        {/* RECOMMENDED PRODUCTS */}
        {recommendations.length > 0 && (
          <section className="mt-12 border-t border-border pt-8">
            <h2 className="font-display text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
              Tailored for your design style
            </h2>
            <p className="font-display text-lg font-extrabold text-foreground uppercase tracking-tight">Recommended for you</p>
            <div className="mt-3.5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {recommendations.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  );
}
