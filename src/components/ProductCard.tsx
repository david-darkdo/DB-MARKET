import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/catalog";
import { publicImageUrl } from "./ImageUploader";
import { Heart, ShieldCheck, Eye, Bookmark } from "lucide-react";
import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] p-2.5 sm:p-3.5 select-none">
      <div className="aspect-[4/3] bg-[#141414] rounded-[10px] relative flex items-center justify-center overflow-hidden">
        <div className="animate-pulse">
          <div className="font-display font-black text-xl text-border">DB</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-2.5">
        <div className="space-y-1.5">
          <div className="h-2.5 bg-border/40 rounded w-1/3 animate-pulse" />
          <div className="h-3.5 bg-border/40 rounded w-3/4 animate-pulse" />
          <div className="h-2.5 bg-border/30 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-4 bg-border/40 rounded w-1/3 mt-1 animate-pulse" />
        <div className="mt-auto flex gap-2 pt-2 border-t border-[#2A2A2A]">
          <div className="w-9 h-9 bg-border/30 rounded-[12px] animate-pulse" />
          <div className="flex-1 h-9 bg-border/30 rounded-[12px] animate-pulse" />
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product }: { product: ProductRow }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const isFav = isFavorite(product.id);

  const img =
    publicImageUrl(product.generated_studio_image) ||
    publicImageUrl(product.image_url) ||
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";

  const isNew = useMemo(() => {
    const createdAt = (product as any).created_at;
    if (!createdAt) return true;
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30;
  }, [(product as any).created_at]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(product.id, product);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] p-2.5 sm:p-3.5 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#FFC107]/40 hover:shadow-2xl select-none">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[#141414]">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 items-start">
          {isNew && (
            <span className="bg-[#0D47FF] text-white px-2 py-0.5 rounded-full text-[8px] font-black tracking-wider uppercase shadow-md">
              NEW ARRIVAL
            </span>
          )}
          <span className="bg-[#0D0D0D]/85 backdrop-blur border border-[#FFC107]/60 text-[#FFC107] px-2 py-0.5 rounded-full text-[7.5px] font-extrabold tracking-wider uppercase flex items-center gap-1 shadow-sm">
            <ShieldCheck className="h-2.5 w-2.5 text-[#FFC107]" />
            <span>VERIFIED</span>
          </span>
        </div>

        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 z-10 grid h-7.5 w-7.5 place-items-center rounded-full border border-[#333333] bg-[#0D0D0D]/80 backdrop-blur text-white hover:bg-black transition focus:outline-none shadow-md"
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={`h-3.5 w-3.5 transition-colors duration-300 ${isFav ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-white"}`} />
        </button>
      </div>

      <div className="flex flex-1 flex-col justify-between gap-1.5 pt-2.5">
        <div className="space-y-1">
          <span className="text-[9px] font-mono font-semibold text-gray-400 uppercase tracking-wider block leading-none">
            SKU · {product.code || "DBM-ABJ-101"}
          </span>

          <h3 className="font-display text-xs sm:text-sm font-bold text-white leading-tight line-clamp-1 group-hover:text-[#FFC107] transition-colors">
            {product.name}
          </h3>

          <p className="text-[10.5px] text-gray-400 font-medium leading-none">
            Brand: <span className="text-gray-200 font-semibold">{product.brand || "DB Market Select"}</span>
          </p>
        </div>

        <div className="flex items-baseline gap-1 pt-0.5">
          <span className="font-display text-sm sm:text-base font-black text-[#FFC107] tracking-tight">
            ₦{Number(product.price).toLocaleString()}
          </span>
          <span className="text-[9.5px] font-normal text-gray-400">
            {product.color ? `/ ${product.color}` : "/ unit"}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pt-2 border-t border-[#2A2A2A]">
          <button
            onClick={handleToggleFavorite}
            aria-label={isFav ? "Saved" : "Save to favorites"}
            className={`h-9 w-9 shrink-0 rounded-[10px] border grid place-items-center transition ${
              isFav
                ? "border-[#FFC107] bg-[#FFC107]/15 text-[#FFC107]"
                : "border-[#333333] bg-[#141414] text-white hover:border-[#FFC107]"
            }`}
          >
            <Bookmark className={`h-3.5 w-3.5 ${isFav ? "fill-[#FFC107]" : ""}`} />
          </button>

          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="h-9 flex-1 rounded-[10px] bg-[#0D47FF] hover:bg-[#0B3CDA] text-[11px] font-black text-white transition flex items-center justify-center gap-1.5 whitespace-nowrap px-2 shadow-md btn-glow-blue"
          >
            <Eye className="h-3.5 w-3.5 text-white shrink-0" />
            <span className="truncate">View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
