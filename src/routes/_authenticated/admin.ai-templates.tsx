import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { useServerFn } from "@tanstack/react-start";
import { runSandboxStage } from "@/lib/ai-pipeline.functions";
import {
  Sparkles,
  Save,
  RotateCcw,
  History,
  ToggleLeft,
  ToggleRight,
  Play,
  Clock,
  CheckCircle2,
  XCircle,
  Copy,
  Plus,
  Trash2,
  RefreshCw,
  Code,
  Terminal,
  FileCode,
  AlertTriangle,
} from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/ai-templates")({
  head: () => ({ meta: [{ title: "AI Prompt Management System — Admin" }] }),
  component: AdminAiTemplatesPage,
});

type PromptTemplate = {
  id: string;
  key: string;
  name: string;
  description: string | null;
  prompt_text: string;
  is_active: boolean;
  is_default: boolean;
  version: number;
  updated_at?: string;
};

type VersionHistory = {
  id: string;
  template_id: string;
  key: string;
  name: string;
  prompt_text: string;
  is_active: boolean;
  version: number;
  created_at: string;
  created_by?: string;
};

type SandboxResult = {
  compiledPrompt: string;
  aiResponse: string;
  executionMs: number;
  stageKey: string;
  providerName: string;
  productName: string;
  imageUrl: string | null;
  jsonValid?: boolean;
};

const DEFAULT_UNIVERSAL_PROMPT = `You are DB Market AI, an expert architectural product intelligence engine specializing in premium building materials, construction products, architectural finishes, luxury sanitary ware, plumbing systems, lighting, furniture, kitchens, doors, roofing, aluminium systems, engineering products, and professional construction solutions.

Your responsibility is to transform raw product information into world-class product intelligence suitable for:
- Architects
- Interior Designers
- Engineers
- Contractors
- Quantity Surveyors
- Developers
- Procurement Teams
- Retail Customers
- Luxury Home Owners

Always produce premium-quality content that is:
- Professional
- Trustworthy
- SEO Optimized
- Luxury
- Technical
- Easy to understand
- Architect-grade

For every product provided:
Return ONLY valid JSON.
Do not return markdown.
Do not return explanations.
Do not wrap JSON inside code blocks.

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

function AdminAiTemplatesPage() {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<string>("admin");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [selectedKey, setSelectedKey] = useState<string>("product_details");
  const [activeTab, setActiveTab] = useState<"editor" | "sandbox" | "history">("editor");
  const [historyLogs, setHistoryLogs] = useState<VersionHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // New prompt modal state
  const [showNewModal, setShowNewModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  // Sandbox state
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [sandboxResult, setSandboxResult] = useState<SandboxResult | null>(null);
  const [sandboxError, setSandboxError] = useState<string>("");
  const [testing, setTesting] = useState(false);

  const sandboxFn = useServerFn(runSandboxStage);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isSuperAdmin = userRole === "super_admin" || userRole === "admin";

  const fetchUserRole = async () => {
    if (!user?.id) return;
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (data?.role) setUserRole(data.role);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      await fetchUserRole();
      const [prodRes, promptsRes] = await Promise.all([
        supabase
          .from("products")
          .select("id, name, brand, image_url, processing_state")
          .order("created_at", { ascending: false })
          .limit(30),
        supabase.from("ai_prompt_templates").select("*").order("key"),
      ]);

      const allProds = prodRes.data ?? [];
      setProducts(allProds);
      if (allProds[0]?.id) setSelectedProductId(allProds[0].id);

      const dbTemplates: PromptTemplate[] = (promptsRes.data ?? []).map((p: any) => ({
        id: p.id,
        key: p.key || "product_details",
        name: p.name || p.key,
        description: p.description || p.purpose || "",
        prompt_text: p.prompt_text || "",
        is_active: p.is_active ?? true,
        is_default: p.is_default ?? false,
        version: p.version ?? 1,
        updated_at: p.updated_at,
      }));

      // Ensure product_details template exists
      if (!dbTemplates.some((t) => t.key === "product_details")) {
        dbTemplates.unshift({
          id: "default-details-id",
          key: "product_details",
          name: "Universal Architectural Product Intelligence Engine",
          description: "Universal AI prompt powering all building material categories in DB Market",
          prompt_text: DEFAULT_UNIVERSAL_PROMPT,
          is_active: true,
          is_default: true,
          version: 1,
        });
      }

      setTemplates(dbTemplates);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load AI Prompt Management System");
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (templateId: string) => {
    if (!templateId) return setHistoryLogs([]);
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from("ai_prompt_templates_history" as any)
        .select("*")
        .eq("template_id", templateId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      setHistoryLogs((data as any[]) ?? []);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to load version history");
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => { void loadData(); }, []);

  const currentTemplate = templates.find((t) => t.key === selectedKey) || templates[0];

  useEffect(() => {
    if (activeTab === "history" && currentTemplate?.id) {
      void loadHistory(currentTemplate.id);
    }
  }, [selectedKey, activeTab, currentTemplate?.id]);

  const handleFieldChange = (field: keyof PromptTemplate, value: any) => {
    setTemplates((prev) =>
      prev.map((t) => (t.key === selectedKey ? { ...t, [field]: value } : t))
    );
  };

  // 1. SAVE PROMPT & INCREMENT VERSION
  const handleSave = async () => {
    if (!isSuperAdmin) return toast.error("Access Denied: Only admins can save prompt templates.");
    if (!currentTemplate) return;

    setSaving(true);
    try {
      const nextVersion = (currentTemplate.version || 1) + 1;
      const payload = {
        name: currentTemplate.name,
        description: currentTemplate.description,
        prompt_text: currentTemplate.prompt_text,
        is_active: currentTemplate.is_active,
        version: nextVersion,
        updated_at: new Date().toISOString(),
        updated_by: user?.id,
      };

      const { error } = await supabase
        .from("ai_prompt_templates")
        .update(payload as any)
        .eq("id", currentTemplate.id);

      if (error) throw error;

      // Log Snapshot to History
      await supabase.from("ai_prompt_templates_history" as any).insert({
        template_id: currentTemplate.id,
        key: currentTemplate.key,
        name: currentTemplate.name,
        prompt_text: currentTemplate.prompt_text,
        is_active: currentTemplate.is_active,
        version: currentTemplate.version,
        created_at: new Date().toISOString(),
        created_by: user?.id,
      });

      toast.success(`✓ Prompt saved! Incremented to version v${nextVersion}`);
      void loadData();
    } catch (e: any) {
      toast.error(e.message ?? "Failed to save template");
    } finally {
      setSaving(false);
    }
  };

  // 2. RESET TO DEFAULT PROMPT
  const handleResetToDefault = () => {
    if (!currentTemplate) return;
    if (!confirm("Reset prompt directives to default architectural specification?")) return;
    handleFieldChange("prompt_text", DEFAULT_UNIVERSAL_PROMPT);
    toast.info("Prompt reset to default template text. Click Save to publish changes.");
  };

  // 3. DUPLICATE PROMPT
  const handleDuplicate = async () => {
    if (!currentTemplate) return;
    const dupKey = `${currentTemplate.key}_copy_${Math.random().toString(36).slice(2, 6)}`;
    const dupName = `${currentTemplate.name} (Copy)`;

    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("ai_prompt_templates")
        .insert({
          key: dupKey,
          name: dupName,
          description: currentTemplate.description,
          prompt_text: currentTemplate.prompt_text,
          is_active: false,
          is_default: false,
          version: 1,
          updated_by: user?.id,
        } as any)
        .select("*")
        .single();

      if (error) throw error;
      toast.success(`✓ Duplicated template as "${dupName}"`);
      await loadData();
      setSelectedKey(dupKey);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to duplicate template");
    } finally {
      setSaving(false);
    }
  };

  // 4. CREATE NEW PROMPT
  const handleCreateNew = async () => {
    if (!newKey.trim() || !newName.trim()) {
      return toast.error("Key and Name are required");
    }
    const cleanKey = newKey.toLowerCase().replace(/[^a-z0-9_]/g, "_");

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ai_prompt_templates")
        .insert({
          key: cleanKey,
          name: newName.trim(),
          description: newDesc.trim() || null,
          prompt_text: DEFAULT_UNIVERSAL_PROMPT,
          is_active: false,
          is_default: false,
          version: 1,
          updated_by: user?.id,
        } as any);

      if (error) throw error;
      toast.success(`✓ Created new prompt "${newName}"`);
      setShowNewModal(false);
      setNewKey("");
      setNewName("");
      setNewDesc("");
      await loadData();
      setSelectedKey(cleanKey);
    } catch (e: any) {
      toast.error(e.message ?? "Failed to create prompt");
    } finally {
      setSaving(false);
    }
  };

  // 5. DELETE PROMPT
  const handleDelete = async () => {
    if (!currentTemplate) return;
    if (currentTemplate.key === "product_details" || currentTemplate.is_default) {
      return toast.error("Cannot delete the primary active system prompt.");
    }
    if (!confirm(`Permanently delete prompt template "${currentTemplate.name}"?`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ai_prompt_templates")
        .delete()
        .eq("id", currentTemplate.id);

      if (error) throw error;
      toast.success("✓ Prompt template deleted");
      await loadData();
      setSelectedKey("product_details");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to delete template");
    } finally {
      setSaving(false);
    }
  };

  // 6. RESTORE HISTORIC VERSION
  const handleRestore = async (version: VersionHistory) => {
    if (!isSuperAdmin) return toast.error("Only admins can restore templates.");
    if (!confirm(`Restore template to version v${version.version}? This will become the active prompt.`)) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from("ai_prompt_templates")
        .update({
          name: version.name,
          prompt_text: version.prompt_text,
          is_active: version.is_active,
          updated_at: new Date().toISOString(),
          updated_by: user?.id,
        } as any)
        .eq("id", version.template_id);

      if (error) throw error;
      toast.success(`✓ Restored to version v${version.version}`);
      void loadData();
      setActiveTab("editor");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to restore version");
    } finally {
      setSaving(false);
    }
  };

  // 7. RUN SANDBOX TEST
  const runSandbox = async () => {
    if (!selectedProductId || !currentTemplate) return;
    setTesting(true);
    setSandboxResult(null);
    setSandboxError("");
    try {
      const res = await sandboxFn({
        data: { productId: selectedProductId, stageKey: currentTemplate.key },
      });
      if (res.ok) {
        const result = res as any;
        let jsonValid = false;
        if (result.aiResponse) {
          try {
            const m = result.aiResponse.match(/\{[\s\S]*\}/);
            if (m) {
              JSON.parse(m[0]);
              jsonValid = true;
            }
          } catch {}
        }
        setSandboxResult({ ...result, jsonValid });
      } else {
        setSandboxError((res as any).error ?? "Sandbox execution failed");
      }
    } catch (e: any) {
      setSandboxError(e.message ?? "Unexpected error running sandbox");
    } finally {
      setTesting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const lineCount = (currentTemplate?.prompt_text || "").split("\n").length;
  const wordCount = (currentTemplate?.prompt_text || "").trim().split(/\s+/).length;

  if (loading) {
    return (
      <div className="container-app py-10 flex items-center gap-3 text-sm text-muted-foreground">
        <Sparkles className="h-4 w-4 animate-pulse text-primary" />
        Loading AI Prompt Management System...
      </div>
    );
  }

  return (
    <div className="container-app py-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2 tracking-tight uppercase">
            <FileCode className="h-6 w-6 text-primary" /> AI Prompt Management System
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Universal Product AI Architecture — Prompt Editor, Versioning & Sandbox Testing
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowNewModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted cursor-pointer transition"
          >
            <Plus className="h-3.5 w-3.5" /> New Prompt
          </button>
          <button
            onClick={handleDuplicate}
            disabled={saving || !currentTemplate}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-xs font-semibold hover:bg-muted cursor-pointer transition disabled:opacity-50"
          >
            <Copy className="h-3.5 w-3.5" /> Duplicate
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isSuperAdmin || !currentTemplate}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold uppercase tracking-wider text-primary-foreground hover:bg-primary/95 disabled:opacity-50 cursor-pointer transition shadow-sm"
          >
            <Save className="h-3.5 w-3.5" />
            {saving ? "Saving..." : "Save Prompt"}
          </button>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[260px_1fr]">
        {/* Sidebar Selector */}
        <aside className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Prompt Templates ({templates.length})
            </h2>
          </div>

          <div className="space-y-1">
            {templates.map((t) => {
              const isSelected = selectedKey === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setSelectedKey(t.key);
                    setSandboxResult(null);
                    setSandboxError("");
                  }}
                  className={`w-full text-left rounded-lg px-3 py-3 text-xs font-medium transition flex items-center justify-between cursor-pointer group border ${
                    isSelected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm border-primary"
                      : "border-border hover:bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="min-w-0 pr-2">
                    <p className="truncate font-semibold text-xs">{t.name}</p>
                    <p className={`text-[10px] truncate font-mono mt-0.5 ${isSelected ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                      key: {t.key}
                    </p>
                  </div>
                  <span className={`text-[10px] rounded px-1.5 py-0.5 font-mono flex-shrink-0 ${
                    isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}>
                    v{t.version}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-border px-2">
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Updates saved to prompts take effect immediately across all product AI pipeline operations without code deployment.
            </p>
          </div>
        </aside>

        {/* Main Content Workspace */}
        <div className="space-y-0 bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          {/* Active Template Header */}
          {currentTemplate && (
            <div className="flex items-start justify-between px-6 py-4 border-b border-border bg-muted/20">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4 text-primary" />
                  <h2 className="text-sm font-bold text-foreground">{currentTemplate.name}</h2>
                  <span className="text-[10px] font-mono bg-muted border border-border text-muted-foreground rounded px-1.5 py-0.5">
                    v{currentTemplate.version}
                  </span>
                  <span className={`text-[10px] rounded px-2 py-0.5 font-medium ${
                    currentTemplate.is_active
                      ? "text-emerald-700 bg-emerald-500/10 border border-emerald-500/20"
                      : "text-amber-700 bg-amber-500/10 border border-amber-500/20"
                  }`}>
                    {currentTemplate.is_active ? "Active Prompt" : "Draft / Inactive"}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{currentTemplate.description || "No description provided."}</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToDefault}
                  className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground border border-border rounded px-2.5 py-1 transition cursor-pointer"
                >
                  <RefreshCw className="h-3 w-3" /> Reset Default
                </button>
                {!currentTemplate.is_default && (
                  <button
                    onClick={handleDelete}
                    className="inline-flex items-center gap-1 text-[11px] text-red-500 hover:text-red-600 border border-red-500/20 bg-red-500/5 rounded px-2.5 py-1 transition cursor-pointer"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Navigation Tab Bar */}
          <div className="flex border-b border-border px-4 bg-card">
            {(["editor", "sandbox", "history"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 pt-3 px-4 text-xs font-semibold border-b-2 transition cursor-pointer capitalize ${
                  activeTab === tab
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {tab === "history" ? `Version History (${historyLogs.length})` : tab === "sandbox" ? "Live Sandbox Test" : "Code Editor"}
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* ─────────────── PROMPT CODE EDITOR ─────────────── */}
            {currentTemplate && activeTab === "editor" && (
              <div className="space-y-4">
                {/* Active Toggle & Metadata Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 bg-muted/30 border border-border rounded-lg px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      disabled={!isSuperAdmin}
                      onClick={() => handleFieldChange("is_active", !currentTemplate.is_active)}
                      className={`inline-flex items-center text-xs font-bold gap-1.5 transition cursor-pointer ${
                        currentTemplate.is_active ? "text-emerald-600" : "text-amber-600"
                      } disabled:opacity-60`}
                    >
                      {currentTemplate.is_active ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                      {currentTemplate.is_active ? "Active System Prompt" : "Inactive Draft"}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
                    <span>Lines: {lineCount}</span>
                    <span>Words: {wordCount}</span>
                    <span>Chars: {currentTemplate.prompt_text.length}</span>
                    {currentTemplate.updated_at && (
                      <span>Updated: {new Date(currentTemplate.updated_at).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>

                {/* Main Code Editor Canvas */}
                <div className="relative border border-border rounded-xl bg-background overflow-hidden shadow-inner">
                  <div className="flex items-center justify-between bg-muted/40 border-b border-border px-4 py-2 text-[11px] font-mono text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <Terminal className="h-3.5 w-3.5 text-primary" /> prompt_template.json
                    </span>
                    <span>Syntax: Text / Liquid JSON Template</span>
                  </div>

                  <div className="relative flex">
                    {/* Line Number Counter */}
                    <div className="select-none py-4 px-3 bg-muted/20 border-r border-border text-[11px] font-mono text-muted-foreground/60 text-right space-y-0 leading-relaxed min-w-[40px]">
                      {Array.from({ length: lineCount }).map((_, i) => (
                        <div key={i}>{i + 1}</div>
                      ))}
                    </div>

                    <textarea
                      ref={textareaRef}
                      disabled={!isSuperAdmin}
                      rows={22}
                      value={currentTemplate.prompt_text}
                      onChange={(e) => handleFieldChange("prompt_text", e.target.value)}
                      placeholder="Enter AI prompt directives here..."
                      className="w-full text-xs font-mono bg-transparent text-foreground p-4 outline-none resize-y leading-relaxed disabled:opacity-70 border-none focus:ring-0"
                    />
                  </div>
                </div>

                {/* Available Interpolation Variables */}
                <div className="bg-muted/20 border border-border rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-muted-foreground mb-1.5">Dynamic Interpolation Placeholders</p>
                  <div className="flex flex-wrap gap-1">
                    {[
                      "{product_name}", "{code}", "{brand}", "{production_name}", "{finish}",
                      "{material}", "{color}", "{size}", "{price}", "{type}", "{category}",
                      "{subcategory}", "{family}"
                    ].map((v) => (
                      <code key={v} className="text-[10px] bg-background border border-border rounded px-1.5 py-0.5 text-foreground font-mono">
                        {v}
                      </code>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ─────────────── LIVE SANDBOX TEST ─────────────── */}
            {currentTemplate && activeTab === "sandbox" && (
              <div className="space-y-5">
                <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                    <Play className="h-4 w-4 text-primary" /> Live Prompt Testing Configuration
                  </h3>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Select Test Product</label>
                      <select
                        value={selectedProductId}
                        onChange={(e) => {
                          setSelectedProductId(e.target.value);
                          setSandboxResult(null);
                          setSandboxError("");
                        }}
                        className="w-full text-xs bg-background border border-border rounded-lg px-3 py-2 outline-none focus:border-primary"
                      >
                        <option value="">Choose a product...</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            {prod.name} {prod.brand ? `(${prod.brand})` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-muted-foreground">Target Prompt Key</label>
                      <div className="px-3 py-2 text-xs border border-border rounded-lg bg-background font-mono font-medium">
                        {currentTemplate.key} ({currentTemplate.name})
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={runSandbox}
                    disabled={testing || !selectedProductId}
                    className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 cursor-pointer transition shadow-sm"
                  >
                    <Play className="h-3.5 w-3.5" />
                    {testing ? "Executing AI Model..." : "Run Test Output"}
                  </button>
                </div>

                {sandboxError && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 flex gap-3">
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-semibold text-red-600">Sandbox Test Failed</p>
                      <p className="text-xs text-red-500/80 mt-1">{sandboxError}</p>
                    </div>
                  </div>
                )}

                {sandboxResult && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
                        <Clock className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs font-bold font-mono">{sandboxResult.executionMs.toLocaleString()}ms</p>
                        <p className="text-[10px] text-muted-foreground">Execution Latency</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
                        <Sparkles className="h-4 w-4 text-primary mx-auto mb-1" />
                        <p className="text-xs font-bold capitalize font-mono">{sandboxResult.providerName}</p>
                        <p className="text-[10px] text-muted-foreground">Active Provider</p>
                      </div>
                      <div className="bg-muted/30 border border-border rounded-lg p-3 text-center">
                        {sandboxResult.jsonValid ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mx-auto mb-1" />
                        ) : (
                          <AlertTriangle className="h-4 w-4 text-amber-500 mx-auto mb-1" />
                        )}
                        <p className="text-xs font-bold font-mono">
                          {sandboxResult.jsonValid ? "Valid JSON" : "Raw Output"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">JSON Validation</p>
                      </div>
                    </div>

                    {/* Formatted Output */}
                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
                      <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-xs font-semibold flex items-center gap-1.5">
                          <Terminal className="h-3.5 w-3.5 text-primary" /> AI Model Intelligence Output
                        </span>
                        <span className="text-[10px] text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded font-mono">
                          JSON Response
                        </span>
                      </div>
                      <pre className="text-xs font-mono bg-background text-foreground border border-border rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap leading-relaxed">
                        {(() => {
                          try {
                            const m = sandboxResult.aiResponse.match(/\{[\s\S]*\}/);
                            if (m) return JSON.stringify(JSON.parse(m[0]), null, 2);
                          } catch {}
                          return sandboxResult.aiResponse;
                        })()}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ─────────────── VERSION HISTORY & ROLLBACK ─────────────── */}
            {currentTemplate && activeTab === "history" && (
              <div className="space-y-4">
                {historyLoading ? (
                  <div className="text-xs text-muted-foreground py-8 flex items-center gap-2 font-mono">
                    <RotateCcw className="h-3.5 w-3.5 animate-spin" />
                    Loading version history snapshots...
                  </div>
                ) : historyLogs.length === 0 ? (
                  <div className="text-xs text-muted-foreground py-12 border border-dashed border-border rounded-xl text-center space-y-2">
                    <History className="h-8 w-8 mx-auto text-muted-foreground/40" />
                    <p className="font-medium">No version history yet</p>
                    <p className="text-[11px]">Save changes to prompt directives to record historic snapshots.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs text-muted-foreground">
                      {historyLogs.length} version snapshot{historyLogs.length !== 1 ? "s" : ""} recorded for this template.
                    </p>
                    {historyLogs.map((log, idx) => (
                      <div key={log.id} className="bg-muted/30 border border-border rounded-xl p-4 space-y-3">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <History className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-bold font-mono">Version v{log.version}</span>
                                {idx === 0 && (
                                  <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 rounded px-1.5 py-0.5">Previous Snapshot</span>
                                )}
                              </div>
                              <p className="text-[10px] text-muted-foreground font-mono mt-0.5">
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleRestore(log)}
                            disabled={saving || !isSuperAdmin}
                            className="text-[10px] text-primary border border-primary/20 bg-primary/5 hover:bg-primary/10 rounded px-2.5 py-1 font-semibold flex items-center gap-1 disabled:opacity-50 cursor-pointer transition"
                          >
                            <RotateCcw className="h-3 w-3" /> Restore Snapshot
                          </button>
                        </div>

                        <pre className="text-[10px] font-mono whitespace-pre-wrap bg-background text-muted-foreground rounded-lg border border-border p-3 max-h-36 overflow-y-auto leading-relaxed">
                          {log.prompt_text}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW PROMPT MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-card border border-border rounded-xl p-6 max-w-md w-full shadow-lg space-y-4">
            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" /> Create New AI Prompt Template
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground">Unique Identifier (Key)</label>
                <input
                  type="text"
                  placeholder="e.g. tile_intelligence"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="mt-1 w-full text-xs bg-background border border-border rounded-md p-2 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Prompt Name</label>
                <input
                  type="text"
                  placeholder="e.g. Custom Tile Specification Prompt"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="mt-1 w-full text-xs bg-background border border-border rounded-md p-2"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-muted-foreground">Description / Operational Purpose</label>
                <textarea
                  rows={2}
                  placeholder="Briefly state what this prompt optimizes..."
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="mt-1 w-full text-xs bg-background border border-border rounded-md p-2"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-3 py-1.5 text-xs border border-border rounded-md font-medium hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateNew}
                disabled={saving}
                className="px-4 py-1.5 text-xs bg-primary text-primary-foreground font-bold rounded-md hover:bg-primary/95"
              >
                Create Prompt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
