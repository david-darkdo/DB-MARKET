import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useInfiniteQuery, useSuspenseQuery, queryOptions, infiniteQueryOptions } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ProductCard, ProductCardSkeleton } from "@/components/ProductCard";
import { fetchFeedProductsPaginated, fetchTaxonomy, type FeedFilters, type CursorParam } from "@/lib/catalog";
import { Search, SlidersHorizontal, Loader2, User, ChevronDown } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

type FeedSearch = {
  type?: string;
  category?: string;
  subcategory?: string;
  q?: string;
};

function validateFeedSearch(s: Record<string, unknown>): FeedSearch {
  const pick = (k: string) => {
    const v = s[k];
    return typeof v === "string" && v.length > 0 ? v : undefined;
  };
  return {
    type: pick("type"),
    category: pick("category"),
    subcategory: pick("subcategory"),
    q: pick("q")
  };
}

const taxonomyQuery = queryOptions({
  queryKey: ["taxonomy"],
  queryFn: fetchTaxonomy,
  staleTime: 5 * 60_000,
});

const feedInfiniteQuery = (f: FeedFilters) =>
  infiniteQueryOptions({
    queryKey: ["feed_infinite", f],
    queryFn: ({ pageParam }) => fetchFeedProductsPaginated(f, pageParam as CursorParam | null, 24),
    initialPageParam: null as CursorParam | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

export const Route = createFileRoute("/")({
  validateSearch: validateFeedSearch,
  loaderDeps: ({ search }) => search,
  loader: ({ context, deps }) => {
    context.queryClient.ensureQueryData(taxonomyQuery);
    context.queryClient.ensureInfiniteQueryData(feedInfiniteQuery(deps));
  },
  head: () => ({
    meta: [
      { title: "DB Market — Building Nigeria. Building Trust." },
      {
        name: "description",
        content: "Discover curated tiles, security doors, sanitary wares, lighting, and architectural finishes.",
      },
    ],
  }),
  component: FeedPage,
  errorComponent: ({ error }) => {
    return (
      <div className="p-6 text-sm text-destructive font-mono">
        <div>Error loading feed: {error.message}</div>
      </div>
    );
  },
});

function FeedPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const { data: tax } = useSuspenseQuery(taxonomyQuery);
  const feedQuery = useInfiniteQuery(feedInfiniteQuery(search));
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState(search.q || "");

  const loadMoreRef = useRef<HTMLDivElement>(null);

  const setType = (slug?: string) =>
    navigate({ to: "/", search: { type: slug, category: undefined, subcategory: undefined, q: search.q } });

  const allProducts = feedQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const totalCount = feedQuery.data?.pages[0]?.totalCount ?? 0;
  const hasNextPage = feedQuery.hasNextPage;
  const isFetchingNextPage = feedQuery.isFetchingNextPage;

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void feedQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    const el = loadMoreRef.current;
    if (el) observer.observe(el);
    return () => {
      if (el) observer.unobserve(el);
    };
  }, [hasNextPage, isFetchingNextPage, feedQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/", search: { ...search, q: searchTerm.trim() || undefined } });
  };

  return (
    <AppShell>
      <div className="container-app pt-3 pb-16 space-y-4">
        <form onSubmit={handleSearchSubmit} className="relative w-full">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search products, brands..."
            className="w-full rounded-[14px] border border-[#2A2A2A] bg-[#1A1A1A] py-3 pl-11 pr-11 text-xs text-[#F5F7FA] placeholder:text-gray-400 outline-none transition focus:border-[#0D47FF] focus:ring-2 focus:ring-[#0D47FF]/20"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
            aria-label="Filter products"
          >
            <SlidersHorizontal className="h-4 w-4 text-[#FFC107]" />
          </button>
        </form>

        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setType(undefined)}
            className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition ${
              !search.type
                ? "bg-[#0D47FF] text-white shadow-md"
                : "bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#FFC107]/40"
            }`}
          >
            All
          </button>
          {tax.types.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setType(t.slug)}
              className={`shrink-0 rounded-full px-5 py-2 text-xs font-bold transition ${
                search.type === t.slug
                  ? "bg-[#0D47FF] text-white shadow-md"
                  : "bg-[#1A1A1A] border border-[#2A2A2A] text-white hover:border-[#FFC107]/40"
              }`}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between border-b border-[#2A2A2A] pb-2 pt-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">
            {search.type ? `Department · ${search.type}` : "All Verified Building Materials"}
          </span>
          {totalCount > 0 && (
            <span className="text-[10px] font-mono text-[#FFC107] font-semibold">
              {allProducts.length} of {totalCount} items
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 pt-1">
          {feedQuery.isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : allProducts.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {!feedQuery.isLoading && allProducts.length === 0 && (
          <div className="mt-10 rounded-[14px] border border-dashed border-[#2A2A2A] p-10 text-center bg-[#1A1A1A]">
            <p className="text-xs text-gray-400 font-medium">
              No products match your search filters right now.
            </p>
            <button
              onClick={() => {
                setSearchTerm("");
                setType(undefined);
              }}
              className="mt-4 inline-block rounded-full bg-[#0D47FF] px-6 py-2 text-xs font-bold text-white hover:bg-[#0B3CDA] transition shadow-md"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {hasNextPage && (
          <div ref={loadMoreRef} className="pt-8 text-center space-y-3">
            <button
              onClick={() => void feedQuery.fetchNextPage()}
              disabled={isFetchingNextPage}
              className="inline-flex items-center gap-2 rounded-full border border-[#2A2A2A] bg-[#1A1A1A] px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:border-[#FFC107] hover:text-[#FFC107] transition shadow-md disabled:opacity-50"
            >
              {isFetchingNextPage ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-[#FFC107]" />
                  <span>Loading Catalogue...</span>
                </>
              ) : (
                <>
                  <span>Load More Materials ({totalCount - allProducts.length} remaining)</span>
                  <ChevronDown className="h-4 w-4 text-[#FFC107]" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </AppShell>
  );
}
