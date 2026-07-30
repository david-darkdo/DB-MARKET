import { Link } from "@tanstack/react-router";
import type { ProductRow } from "@/lib/catalog";
import { AddToCollectionButton } from "./AddToCollectionButton";
import { publicImageUrl } from "./ImageUploader";
import { Heart, ShieldCheck, Eye } from "lucide-react";
import { useMemo } from "react";
import { useFavorites } from "@/hooks/useFavorites";

export function ProductCardSkeleton() {
  return (
    <div className="relative flex flex-col overflow-hidden rounded-2xl border border-border bg-[#1A1A1A] shadow-xs select-none">
      <div className="aspect-square bg-[#141414] relative flex items-center justify-center overflow-hidden">
        <div className="animate-pulse">
          <div className="font-display font-black text-xl text-border">DB</div>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="space-y-2">
          <div className="h-3.5 bg-border/40 rounded-md w-3/4 animate-pulse" />
          <div className="h-2.5 bg-border/30 rounded-md w-1/2 animate-pulse" />
        </div>
        <div className="h-4 bg-border/30 rounded-md w-1/3 mt-2 animate-pulse" />
        <div className="mt-auto flex gap-2 pt-3 border-t border-border/40">
          <div className="flex-1 h-8 bg-border/30 rounded-full animate-pulse" />
          <div className="flex-1 h-8 bg-border/30 rounded-full animate-pulse" />
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
    "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80";

  const isNew = useMemo(() => {
    const createdAt = (product as any).created_at;
    if (!createdAt) return false;
    const createdDate = new Date(createdAt);
    const diffTime = Math.abs(new Date().getTime() - createdDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 14;
  }, [(product as any).created_at]);

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    void toggleFavorite(product.id, product);
  };

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-[#1A1A1A] card-hover-lift select-none">
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 items-start">
        {isNew && (
          <span className="bg-primary/95 backdrop-blur px-2.5 py-0.5 rounded-full text-[8.5px] font-black text-white tracking-widest uppercase shadow-md">
            NEW ARRIVAL
          </span>
        )}
        <span className="bg-black/75 backdrop-blur border border-gold/40 px-2 py-0.5 rounded-full text-[8px] font-bold text-gold tracking-wider uppercase flex items-center gap-1 shadow">
          <ShieldCheck className="h-3 w-3 text-gold" /> VERIFIED
        </span>
      </div>

      <button
        onClick={handleToggleFavorite}
        className="absolute top-3 right-3 z-10 rounded-full p-2 bg-[#0D0D0D]/80 backdrop-blur hover:bg-black text-foreground transition border border-border focus:outline-none shadow-md"
        aria-label={isFav ? "Remove from favorites" : "Save to favorites"}
      >
        <Heart className={`h-3.5 w-3.5 transition-colors duration-300 ${isFav ? "fill-red-500 text-red-500" : "text-gray-300 hover:text-white"}`} />
      </button>

      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        className="block aspect-square overflow-hidden bg-[#141414] relative"
      >
        <img
          src={img}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-108"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A1A] via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
      </Link>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <div>
          <span className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest block mb-1">
            SKU · {product.code || "DBM-ABJ-101"}
          </span>
          <h3 className="font-display text-sm font-bold leading-tight text-white line-clamp-1 group-hover:text-gold transition-colors">
            {product.name}
          </h3>
          {product.brand && (
            <p className="mt-0.5 text-[10px] text-muted-foreground font-medium">
              Brand: <span className="text-gray-300 font-semibold">{product.brand}</span>
            </p>
          )}
        </div>

        <div className="mt-1 flex items-baseline gap-1">
          <span className="font-display text-lg font-black text-gold">
            ₦{Number(product.price).toLocaleString()}
          </span>
          <span className="text-[9.5px] font-medium text-muted-foreground">
            {product.color ? `/ ${product.color}` : "/ unit"}
          </span>
        </div>

        <div className="mt-auto flex items-center gap-2 pt-3 border-t border-border/50">
          <div className="shrink-0">
            <AddToCollectionButton productId={product.id} compact />
          </div>
          <Link
            to="/product/$slug"
            params={{ slug: product.slug }}
            className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-3 py-2 text-[10px] font-black uppercase tracking-wider text-white hover:bg-primary/90 btn-glow-blue transition shadow-md"
          >
            <Eye className="h-3.5 w-3.5" />
            <span>View Details</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
