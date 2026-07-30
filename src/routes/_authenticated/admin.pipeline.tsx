import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { RefreshCw, Play, AlertTriangle, CheckCircle2, Clock, Archive, Sparkles } from "lucide-react";
import { publicImageUrl } from "@/components/ImageUploader";
import { useServerFn } from "@tanstack/react-start";
import { runProductPipeline } from "@/lib/ai-pipeline.functions";
import { runProductDetailsEngine } from "@/lib/product-details.functions";
import { regenerateWithHashGuard, retryProductPipeline } from "@/lib/pipeline";

export const Route = createFileRoute("/_authenticated/admin/pipeline")({
  head: () => ({ meta: [{ title: "AI Operations Dashboard — Admin" }] }),
  component: PipelinePage,
});

type Bucket = "pending" | "processing" | "completed" | "needs_review" | "error" | "archived";

function PipelinePage() {
  const runPipeline = useServerFn(runProductPipeline);
  const runDetailsFn = useServerFn(runProductDetailsEngine);
  const [runningDetails, setRunningDetails] = useState<string | null>(null);

  const handleGenerateDetailsOnly = async (productId: string) => {
    setRunningDetails(productId);
    try {
      const res = await runDetailsFn({ data: { productId } });
      if (res.ok) {
        toast.success("Product intelligence & descriptions generated!");
      } else {
        toast.error("Failed to generate product details.");
      }
    } catch (e: any) {
      toast.error(e.message ?? "Generation failed");
    } finally {
      setRunningDetails(null);
      await loadRows(); await loadCounts();
    }
  };

  const [running, setRunning] = useState<string | null>(null);
  const [bucket, setBucket] = useState<Bucket>("processing");
  const [rows, setRows] = useState<any[]>([]);
  const [counts, setCounts] = useState<Record<Bucket, number>>({
    pending: 0, processing: 0, completed: 0, needs_review: 0, error: 0, archived: 0,
  });
  const [loading, setLoading] = useState(false);

  const loadCounts = useCallback(async () => {
    const states: Bucket[] = ["pending", "processing", "completed", "needs_review", "error", "archived"];
    const next: Record<Bucket, number> = { pending: 0, processing: 0, completed: 0, needs_review: 0, error: 0, archived: 0 };
    for (const s of states) {
      const { count } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("processing_state", s as any);
      next[s] = count ?? 0;
    }
    setCounts(next);
  }, []);

  const loadRows = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("products")
      .select("id,name,code,status,processing_state,retry_count,error_log,generation_version,last_processed_at,image_url,generation_hash")
      .eq("processing_state", bucket as any)
      .order("last_processed_at", { ascending: false, nullsFirst: false })
      .limit(100);
    setLoading(false);
    if (error) return toast.error(error.message);
    setRows(data ?? []);
  }, [bucket]);

  useEffect(() => { loadCounts(); }, [loadCounts]);
  useEffect(() => { loadRows(); }, [loadRows]);

  const handleRun = async (id: string) => {
    setRunning(id);
    try {
      const res = await runPipeline({ data: { productId: id } });
      if (res.ok) {
        toast.success("Pipeline executed successfully!");
      } else {
        toast.error(`Pipeline failed: ${(res as any).error}`);
      }
    } catch (e: any) {
      toast.error(e.message ?? "Pipeline call failed");
    } finally {
      setRunning(null);
      await loadRows();
      await loadCounts();
    }
  };

  const buckets: { key: Bucket; label: string; icon: any }[] = [
    { key: "processing", label: "Processing", icon: Clock },
    { key: "completed", label: "Completed", icon: CheckCircle2 },
    { key: "needs_review", label: "Needs Review", icon: AlertTriangle },
    { key: "error", label: "Error", icon: AlertTriangle },
    { key: "pending", label: "Pending", icon: Clock },
    { key: "archived", label: "Archived", icon: Archive },
  ];

  return (
    <div className="container-app py-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="font-display text-2xl font-bold uppercase tracking-tight">AI Operations Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-0.5 font-mono">
            Universal Product AI Architecture — Processing Queue & Health
          </p>
        </div>
        <button
          onClick={() => { void loadCounts(); void loadRows(); }}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-2 text-xs font-semibold hover:bg-card transition"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Refresh Queue
        </button>
      </div>

      {/* Bucket Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
        {buckets.map((b) => {
          const Icon = b.icon;
          const active = bucket === b.key;
          return (
            <button
              key={b.key}
              onClick={() => setBucket(b.key)}
              className={`flex flex-col items-center justify-center p-3 rounded-lg border text-xs font-semibold transition ${
                active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:text-foreground"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5" />
                <span>{b.label}</span>
              </div>
              <span className="font-mono text-sm mt-1">{counts[b.key]}</span>
            </button>
          );
        })}
      </div>

      {/* Main Queue Table */}
      <div className="rounded-xl border border-border bg-card overflow-hidden shadow-sm">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground">
            Queue: {bucket} ({rows.length})
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-muted-foreground font-mono">
            Loading queue records…
          </div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground">
            No products found in bucket state: <span className="font-mono">{bucket}</span>
          </div>
        ) : (
          <div className="divide-y divide-border overflow-x-auto">
            {rows.map((r) => (
              <div key={r.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3 min-w-0">
                  {r.image_url ? (
                    <img src={publicImageUrl(r.image_url) || r.image_url} alt="" className="h-10 w-10 rounded-md object-cover border border-border" />
                  ) : (
                    <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center text-[10px] text-muted-foreground">No img</div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-foreground truncate">{r.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Code: {r.code} · ID: {r.id}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleGenerateDetailsOnly(r.id)}
                    disabled={runningDetails === r.id}
                    className="inline-flex items-center gap-1.5 rounded bg-primary/10 border border-primary/20 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/20 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-3 w-3" />
                    {runningDetails === r.id ? "Generating…" : "Run Details AI"}
                  </button>

                  <button
                    onClick={() => handleRun(r.id)}
                    disabled={running === r.id}
                    className="inline-flex items-center gap-1.5 rounded bg-primary px-3 py-1.5 text-xs font-bold uppercase text-primary-foreground hover:bg-primary/90 transition shadow-sm disabled:opacity-50"
                  >
                    <Play className="h-3 w-3" />
                    {running === r.id ? "Running…" : "Run Full AI"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
