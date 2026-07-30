import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/catalog";
import { publicImageUrl } from "./ImageUploader";
import { Heart, Eye } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] p-2.5 sm:p-3 select-none">
      <div className="aspect-[4/3] bg-[#141414] rounded-[10px] relative flex items-center justify-center overflow-hidden">
        <div className="animate-pulse">
          <div className="font-display font-black text-xl text-border">DB</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 pt-2.5">
        <div className="space-y-1">
          <div className="h-2.5 bg-border/40 rounded w-1/3 animate-pulse" />
          <div className="h-3.5 bg-border/40 rounded w-3/4 animate-pulse" />
          <div className="h-2.5 bg-border/30 rounded w-1/2 animate-pulse" />
        </div>
        <div className="h-4 bg-border/40 rounded w-1/3 mt-1 animate-pulse" />
        <div className="mt-auto pt-2 border-t border-[#2A2A2A]">
          <div className="w-full h-10 bg-border/30 rounded-[12px] animate-pulse" />
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

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(product.id, product);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] p-2.5 sm:p-3 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-[#FFC107]/40 hover:shadow-2xl select-none">
      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[10px] bg-[#141414]">
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        <button
          onClick={handleToggleFavorite}
          className="absolute top-2 right-2 z-10 grid h-8 w-8 place-items-center rounded-full border border-[#333333] bg-[#0D0D0D]/80 backdrop-blur text-white hover:bg-black transition focus:outline-none shadow-md"
          aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
        >
          <Heart className={`h-4 w-4 transition-colors duration-300 ${isFav ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-white"}`} />
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

        <div className="pt-2 border-t border-[#2A2A2A]">
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="h-10 w-full rounded-[12px] bg-[#0D47FF] hover:bg-[#0B3CDA] text-xs font-black text-white transition flex items-center justify-center gap-2 whitespace-nowrap shadow-md btn-glow-blue"
          >
            <Eye className="h-4 w-4 text-white shrink-0" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
