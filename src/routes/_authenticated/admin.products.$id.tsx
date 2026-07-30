import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Image, Layers, Cpu, ShieldCheck, Globe, Search, ChevronDown, ChevronUp } from "lucide-react";
import { runProductDetailsEngine } from "@/lib/product-details.functions";
import { runProductPipeline } from "@/lib/ai-pipeline.functions";
import { ImageUploader, ImageTile, publicImageUrl } from "@/components/ImageUploader";

export const Route = createFileRoute("/_authenticated/admin/products/$id")({
  head: () => ({ meta: [{ title: "Edit Product — Admin Panel" }] }),
  component: RebuiltEditProductPage,
});

type Tax = { id: string; name: string };
type Cat = Tax & { type_id: string };
type Sub = Tax & { category_id: string };
type Fam = Tax & { subcategory_id: string };

function RebuiltEditProductPage() {
  const { id } = Route.useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generatingDetails, setGeneratingDetails] = useState(false);
  const [runningPipeline, setRunningPipeline] = useState(false);

  // Taxonomy options
  const [types, setTypes] = useState<Tax[]>([]);
  const [cats, setCats] = useState<Cat[]>([]);
  const [subs, setSubs] = useState<Sub[]>([]);
  const [fams, setFams] = useState<Fam[]>([]);

  // Product Record Form State
  const [p, setP] = useState<any>(null);

  // Section Toggles
  const [showAdvancedAi, setShowAdvancedAi] = useState(false);
  const [showSeoSection, setShowSeoSection] = useState(false);

  const runDetailsFn = useServerFn(runProductDetailsEngine);
  const runPipelineFn = useServerFn(runProductPipeline);

  const load = async () => {
    setLoading(true);
    const [t, c, s, f, prod] = await Promise.all([
      supabase.from("product_types").select("id,name").order("name"),
      supabase.from("categories").select("id,name,type_id").order("name"),
      supabase.from("subcategories").select("id,name,category_id").order("name"),
      supabase.from("family_groups").select("id,name,subcategory_id").order("name"),
      supabase.from("products").select("*").eq("id", id).single(),
    ]);

    setTypes(t.data ?? []);
    setCats((c.data ?? []) as any);
    setSubs((s.data ?? []) as any);
    setFams((f.data ?? []) as any);

    if (prod.error || !prod.data) {
      toast.error("Product not found");
      navigate({ to: "/admin/products" });
      return;
    }

    setP(prod.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [id]);

  const filteredCats = useMemo(() => cats.filter((c) => c.type_id === p?.type_id), [cats, p?.type_id]);
  const filteredSubs = useMemo(() => subs.filter((s) => s.category_id === p?.category_id), [subs, p?.category_id]);
  const filteredFams = useMemo(() => fams.filter((f) => f.subcategory_id === p?.subcategory_id), [fams, p?.subcategory_id]);

  const setField = (key: string, val: any) => {
    setP((prev: any) => {
      const next = { ...prev, [key]: val };
      if (key === "seo_description" || key === "generated_description" || key === "short_description") {
        next.generated_description = val;
        next.short_description = val;
        next.seo_description = val;
      }
      return next;
    });
  };

  const handleGenerateDetails = async () => {
    setGeneratingDetails(true);
    try {
      const res = await runDetailsFn({ data: { productId: id } });
      if (res.ok) {
        toast.success("Universal Product AI Engine: Product details generated!");
        await load();
      } else {
        toast.error("Failed to generate product details.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setGeneratingDetails(false);
    }
  };

  const handleRunFullPipeline = async () => {
    setRunningPipeline(true);
    try {
      const res = await runPipelineFn({ data: { productId: id } });
      if (res.ok) {
        toast.success("Full AI pipeline completed!");
        await load();
      } else {
        toast.error("Pipeline run failed.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Pipeline run failed");
    } fontally {
      setRunningPipeline(false);
    }
  };

  const save = async () => {
    setSaving(true);
    const syncedDesc = p.seo_description || p.short_description || p.generated_description || null;
    const payload = {
      ...p,
      short_description: syncedDesc,
      generated_description: syncedDesc,
      seo_description: syncedDesc,
      is_published: p.status === "published",
      price: Number(p.price) || 0,
      processing_state: "completed",
    };
    delete payload.id;
    delete payload.created_at;
    delete payload.updated_at;
    delete payload.similar_product_ids;

    const { error } = await supabase.from("products").update(payload as any).eq("id", id);
    if (error) {
      setSaving(false);
      return toast.error(error.message);
    }

    await supabase.rpc("rebuild_search_index" as any, { _product_id: id } as any);

    setSaving(false);
    toast.success("Product changes saved & search index updated!");
    await load();
  };

  const arrToStr = (v: any) => (Array.isArray(v) ? v.join(", ") : v ?? "");
  const strToArr = (v: string) => v.split(",").map((s) => s.trim()).filter(Boolean);

  if (loading || !p) {
    return (
      <div className="container-app py-12 text-center text-xs text-muted-foreground font-mono">
        Loading product data for ID: {id}…
      </div>
    );
  }

  return (
    <div className="container-app py-6 max-w-5xl space-y-6">
      {/* Header Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <Link to="/admin/products" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-1">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to library
          </Link>
          <h1 className="font-display text-2xl font-bold tracking-tight text-foreground uppercase">{p.name || "Edit Product"}</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">ID: {id} · Code: {p.code}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={save}
            disabled={saving}
            className="rounded bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/95 transition shadow-sm"
          >
            {saving ? "Saving…" : "Save Changes"}
          </button>
        </div>
      </div>

      {/* SECTION 1: Product Information */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Layers className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Section 1 — Product Information</h2>
        </div>

        {/* Classification Hierarchy */}
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Type *</label>
            <select
              value={p.type_id || ""}
              onChange={(e) => setField("type_id", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            >
              <option value="">Select Type…</option>
              {types.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category *</label>
            <select
              value={p.category_id || ""}
              onChange={(e) => setField("category_id", e.target.value)}
              disabled={!p.type_id}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs disabled:opacity-50"
            >
              <option value="">Select Category…</option>
              {filteredCats.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Subcategory *</label>
            <select
              value={p.subcategory_id || ""}
              onChange={(e) => setField("subcategory_id", e.target.value)}
              disabled={!p.category_id}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs disabled:opacity-50"
            >
              <option value="">Select Subcategory…</option>
              {filteredSubs.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Family Group *</label>
            <select
              value={p.family_id || ""}
              onChange={(e) => setField("family_id", e.target.value)}
              disabled={!p.subcategory_id}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs disabled:opacity-50"
            >
              <option value="">Select Family…</option>
              {filteredFams.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Essential Fields */}
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="sm:col-span-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Name *</label>
            <input
              type="text"
              value={p.name || ""}
              onChange={(e) => setField("name", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Product Code</label>
            <input
              type="text"
              value={p.code || ""}
              onChange={(e) => setField("code", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Brand</label>
            <input
              type="text"
              value={p.brand || ""}
              onChange={(e) => setField("brand", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Price (NGN) *</label>
            <input
              type="number"
              value={p.price ?? 0}
              onChange={(e) => setField("price", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Size / Dimension</label>
            <input
              type="text"
              value={p.size || ""}
              onChange={(e) => setField("size", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Finish</label>
            <input
              type="text"
              value={p.finish_name || p.finish || ""}
              onChange={(e) => setField("finish_name", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Material</label>
            <input
              type="text"
              value={p.material || ""}
              onChange={(e) => setField("material", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Color</label>
            <input
              type="text"
              value={p.color || ""}
              onChange={(e) => setField("color", e.target.value)}
              className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
            />
          </div>
        </div>
      </section>

      {/* SECTION 2: Manual Product Images Upload */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <Image className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Section 2 — Product Images (Manual Upload)</h2>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Original Image */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Original Product Image *</label>
              <span className="text-[10px] text-muted-foreground">Catalog / Feed Image</span>
            </div>
            {p.image_url ? (
              <ImageTile url={publicImageUrl(p.image_url) || p.image_url} onDelete={() => setField("image_url", null)} badge="Original" />
            ) : (
              <ImageUploader multiple={false} onUploaded={(paths) => setField("image_url", paths[0])} label="Upload Original Product Image" />
            )}
          </div>

          {/* Installed Image (MANUAL UPLOAD ONLY) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-foreground">Installed Product Image (Optional)</label>
              <span className="text-[10px] text-muted-foreground">Real-World Installation</span>
            </div>
            {p.generated_installed_image ? (
              <ImageTile url={publicImageUrl(p.generated_installed_image) || p.generated_installed_image} onDelete={() => setField("generated_installed_image", null)} badge="Installed Product" />
            ) : (
              <ImageUploader multiple={false} onUploaded={(paths) => setField("generated_installed_image", paths[0])} label="Upload Installed Product Image" />
            )}
          </div>
        </div>
      </section>

      {/* SECTION 3: Publishing */}
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-2 border-b border-border pb-3">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Section 3 — Publishing Settings</h2>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setField("status", p.status === "published" ? "draft" : "published")}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${p.status === "published" ? "bg-primary" : "bg-muted"}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${p.status === "published" ? "translate-x-6" : "translate-x-1"}`} />
            </button>
            <span className="text-xs font-semibold text-foreground">
              {p.status === "published" ? "Status: Published" : "Status: Draft"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={save}
              disabled={saving}
              className="rounded bg-primary px-5 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/95 transition shadow-sm"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 4: Universal Product AI Operations */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowAdvancedAi(!showAdvancedAi)}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-muted/40 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Section 4 — Universal Product AI Engine</h2>
          </div>
          {showAdvancedAi ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showAdvancedAi && (
          <div className="p-5 border-t border-border space-y-4 bg-muted/10">
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={handleGenerateDetails}
                disabled={generatingDetails}
                className="flex items-center justify-center gap-2 rounded border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {generatingDetails ? "Generating Details…" : "Generate Descriptions & SEO"}
              </button>

              <button
                type="button"
                onClick={handleRunFullPipeline}
                disabled={runningPipeline}
                className="flex items-center justify-center gap-2 rounded bg-primary px-4 py-3 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/95 transition shadow-sm disabled:opacity-50"
              >
                <Sparkles className="h-4 w-4" />
                {runningPipeline ? "Running Pipeline…" : "Run Universal Product AI"}
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SECTION 5: SEO */}
      <section className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <button
          type="button"
          onClick={() => setShowSeoSection(!showSeoSection)}
          className="w-full flex items-center justify-between p-5 bg-card hover:bg-muted/40 transition text-left"
        >
          <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-primary" />
            <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Section 5 — Google SEO & Metadata</h2>
          </div>
          {showSeoSection ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </button>

        {showSeoSection && (
          <div className="p-5 border-t border-border space-y-4 bg-muted/10">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SEO Title</label>
              <input
                type="text"
                value={p.seo_title || ""}
                onChange={(e) => setField("seo_title", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SEO Description & Product Description (Synced)</label>
              </div>
              <textarea
                rows={3}
                value={p.seo_description || p.short_description || p.generated_description || ""}
                onChange={(e) => setField("seo_description", e.target.value)}
                className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs leading-relaxed"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">SEO Keywords (Comma Separated)</label>
                <input
                  type="text"
                  value={arrToStr(p.seo_keywords)}
                  onChange={(e) => setField("seo_keywords", strToArr(e.target.value))}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Canonical Slug</label>
                <input
                  type="text"
                  value={p.canonical_slug || p.slug || ""}
                  onChange={(e) => setField("canonical_slug", e.target.value)}
                  className="mt-1 w-full rounded-md border border-input bg-background p-2 text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
