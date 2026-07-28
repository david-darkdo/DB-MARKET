import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

const STORAGE_KEY = "enreach_favorites_v2";
const EVENT_NAME = "enreach_favorites_changed";

function getGuestFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setGuestFavorites(ids: string[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(new Set(ids))));
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  } catch {}
}

export function useFavorites() {
  const { user } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => getGuestFavorites());
  const [loading, setLoading] = useState(false);

  // Sync favorites on user auth change or custom event
  const syncFavorites = useCallback(async () => {
    if (user?.id) {
      // Authenticated User
      setLoading(true);
      try {
        // 1. Sync guest local favorites to Supabase if any exist
        const guestIds = getGuestFavorites();
        if (guestIds.length > 0) {
          const insertPayloads = guestIds.map((prodId) => ({
            user_id: user.id,
            product_id: prodId,
          }));
          await supabase.from("favorites").upsert(insertPayloads as any, { onConflict: "user_id,product_id" } as any);
          localStorage.removeItem(STORAGE_KEY);
        }

        // 2. Fetch user's current favorites from Supabase
        const { data, error } = await supabase
          .from("favorites")
          .select("product_id")
          .eq("user_id", user.id);

        if (!error && data) {
          const ids = data.map((d: any) => d.product_id).filter(Boolean);
          setFavoriteIds(ids);
        }
      } catch (err: any) {
        console.error("Failed to sync favorites from Supabase:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // Guest User
      setFavoriteIds(getGuestFavorites());
    }
  }, [user?.id]);

  useEffect(() => {
    void syncFavorites();

    const handleEvent = () => {
      if (!user?.id) {
        setFavoriteIds(getGuestFavorites());
      }
    };

    window.addEventListener(EVENT_NAME, handleEvent);
    return () => window.removeEventListener(EVENT_NAME, handleEvent);
  }, [user?.id, syncFavorites]);

  const isFavorite = useCallback(
    (productId: string) => favoriteIds.includes(productId),
    [favoriteIds]
  );

  const toggleFavorite = useCallback(
    async (productId: string, productData?: any) => {
      const currentlyFav = favoriteIds.includes(productId);

      if (!user?.id) {
        // Guest Mode: LocalStorage
        let next: string[];
        if (currentlyFav) {
          next = favoriteIds.filter((id) => id !== productId);
          toast.success("Removed from local favorites");
        } else {
          next = [...favoriteIds, productId];
          toast.success("Saved to local favorites");
        }
        setFavoriteIds(next);
        setGuestFavorites(next);
        return;
      }

      // Authenticated Mode: Supabase DB + Optimistic Update
      const nextIds = currentlyFav
        ? favoriteIds.filter((id) => id !== productId)
        : [...favoriteIds, productId];

      setFavoriteIds(nextIds);
      window.dispatchEvent(new CustomEvent(EVENT_NAME));

      try {
        if (currentlyFav) {
          const { error } = await supabase
            .from("favorites")
            .delete()
            .eq("user_id", user.id)
            .eq("product_id", productId);

          if (error) throw error;
          toast.success("Removed from favorites");
        } else {
          const { error } = await supabase.from("favorites").upsert(
            {
              user_id: user.id,
              product_id: productId,
            } as any,
            { onConflict: "user_id,product_id" } as any
          );

          if (error) throw error;
          toast.success("Saved to favorites");
        }
      } catch (err: any) {
        // Revert on error
        setFavoriteIds(favoriteIds);
        toast.error(err.message || "Failed to update favorites");
      }
    },
    [user?.id, favoriteIds]
  );

  return {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    loading,
    refresh: syncFavorites,
  };
}
