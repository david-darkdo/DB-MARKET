import { useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { UploadCloud, Loader2, X, Star, Download, RefreshCw } from "lucide-react";
import { deleteCloudinaryImage } from "@/lib/cloudinary";

export function publicImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  
  // Public URL from Supabase storage product-images bucket
  const BUCKET = "product-images";
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

async function uploadOne(file: File, productId?: string): Promise<string> {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET;

  // 1. Try Cloudinary Upload if credentials exist
  if (cloudName && uploadPreset) {
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", uploadPreset);
      if (productId) {
        formData.append("folder", `products/${productId}`);
      }

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (data.secure_url) {
          console.log("[Cloudinary] Direct upload success:", data.secure_url);
          return data.secure_url;
        }
      } else {
        const text = await res.text();
        console.warn("[Cloudinary] Upload response error, falling back to Supabase Storage:", text);
      }
    } catch (err) {
      console.warn("[Cloudinary] Exception during upload, falling back to Supabase Storage:", err);
    }
  }

  // 2. Direct Fallback to Supabase Storage product-images bucket
  console.log("[Supabase Storage] Uploading image to product-images bucket...");
  const BUCKET = "product-images";
  const fileExt = file.name.split('.').pop() || 'jpg';
  const filePath = `${productId ? `${productId}/` : ''}${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

  const { data, error } = await supabase.storage.from(BUCKET).upload(filePath, file, {
    cacheControl: "3600",
    upsert: true
  });

  if (error) {
    console.error("[Supabase Storage] Upload failed:", error);
    throw new Error(`Storage upload failed: ${error.message}`);
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET).getPublicUrl(data.path);
  console.log("[Supabase Storage] Successfully uploaded:", publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
}

/**
 * Reusable uploader — supports drag/drop, click, multi-file, and mobile
 * camera/gallery. Calls onUploaded(paths[]) after successful upload.
 */
export function ImageUploader({
  productId,
  multiple = true,
  onUploaded,
  label = "Upload images",
  compact = false,
}: {
  productId?: string;
  multiple?: boolean;
  onUploaded: (paths: string[]) => void | Promise<void>;
  label?: string;
  compact?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
      if (list.length === 0) return;
      setBusy(true);
      const uploaded: string[] = [];
      for (const f of list) {
        try {
          const url = await uploadOne(f, productId);
          uploaded.push(url);
        } catch (e: any) {
          toast.error(`Upload failed: ${e.message || e}`);
        }
      }
      setBusy(false);
      if (uploaded.length) {
        await onUploaded(uploaded);
        toast.success(`Uploaded ${uploaded.length} image${uploaded.length > 1 ? "s" : ""}`);
      }
    },
    [productId, onUploaded],
  );

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
      }}
      className={`rounded-xl border-2 border-dashed transition ${
        dragging ? "border-[#0D47FF] bg-[#0D47FF]/10" : "border-[#2A2A2A] bg-[#141414]"
      } ${compact ? "p-3" : "p-5"}`}
    >
      <div className="flex flex-col items-center justify-center gap-2 text-center">
        {busy ? (
          <Loader2 className="h-6 w-6 animate-spin text-[#FFC107]" />
        ) : (
          <UploadCloud className="h-6 w-6 text-gray-400" />
        )}
        <div className="text-xs font-bold text-white uppercase tracking-wider">{label}</div>
        <div className="text-[11px] text-gray-400">
          Drag & drop, or use the buttons below
        </div>
        <div className="mt-1 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-[#333333] bg-[#1A1A1A] px-4 py-2 text-xs font-bold text-white hover:border-[#FFC107] disabled:opacity-50 transition"
          >
            Choose files
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-[#333333] bg-[#1A1A1A] px-4 py-2 text-xs font-bold text-white hover:border-[#FFC107] disabled:opacity-50 md:hidden transition"
          >
            Take photo
          </button>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
        />
      </div>
    </div>
  );
}

/** Small badge/actions bar for an image tile. */
export function ImageTile({
  url,
  onDelete,
  onSetPrimary,
  onReplace,
  onRegenerate,
  isPrimary,
  badge,
}: {
  url: string;
  onDelete?: () => void;
  onSetPrimary?: () => void;
  onReplace?: () => void;
  onRegenerate?: () => void;
  isPrimary?: boolean;
  badge?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
      <img src={url} alt="" className="aspect-square w-full object-cover" />
      {badge && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/80 px-2 py-0.5 text-[9px] uppercase tracking-wider text-[#FFC107] font-bold">
          {badge}
        </span>
      )}
      {isPrimary && (
        <span className="absolute right-1.5 top-1.5 inline-flex items-center gap-1 rounded-full bg-[#0D47FF] px-2 py-0.5 text-[9px] font-extrabold text-white">
          <Star className="h-2.5 w-2.5 fill-white" /> Primary
        </span>
      )}
      <div className="flex flex-wrap gap-1 border-t border-[#2A2A2A] bg-[#141414] p-1.5">
        {onSetPrimary && !isPrimary && (
          <button onClick={onSetPrimary} className="rounded border border-[#333333] p-1 text-[10px] text-gray-300 hover:border-[#FFC107] hover:text-[#FFC107]" title="Set as Primary">
            <Star className="h-3 w-3" />
          </button>
        )}
        {onReplace && (
          <button onClick={onReplace} className="rounded border border-[#333333] p-1 text-[10px] text-gray-300 hover:border-[#FFC107] hover:text-white" title="Replace">
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
        <a href={url} download target="_blank" rel="noreferrer" className="rounded border border-[#333333] p-1 text-[10px] text-gray-300 hover:border-[#FFC107] hover:text-white" title="Download">
          <Download className="h-3 w-3" />
        </a>
        {onRegenerate && (
          <button onClick={onRegenerate} className="rounded border border-[#0D47FF]/40 p-1 text-[10px] text-[#0D47FF] hover:bg-[#0D47FF]/10" title="Regenerate">
            <RefreshCw className="h-3 w-3" />
          </button>
        )}
        {onDelete && (
          <button onClick={onDelete} className="ml-auto rounded border border-red-500/40 p-1 text-[10px] text-red-400 hover:bg-red-500/10" title="Delete">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}

export async function deleteStorageObject(path: string) {
  if (!path) return;
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      await deleteCloudinaryImage({ data: { url: path } });
    } catch (e) {
      console.warn("Failed to delete image from Cloudinary, trying Supabase storage:", e);
    }
  } else {
    const BUCKET = "product-images";
    await supabase.storage.from(BUCKET).remove([path]);
  }
}
