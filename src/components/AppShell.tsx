import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Home,
  Search,
  Compass,
  Bookmark,
  User,
  LogOut,
  Shield,
  Bell,
  X,
  AlertCircle,
  Trash2,
  Truck,
  CreditCard,
  Headphones,
  HelpCircle,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { FloatingWhatsApp } from "./FloatingWhatsApp";
import { syncOfflineActions, getUserCollectionItems, getGuestCollection } from "@/lib/collection";
import { toast } from "sonner";
import { SiteFooter } from "./SiteFooter";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [trustFeatures, setTrustFeatures] = useState<any[]>([]);

  useEffect(() => {
    const fetchTrust = async () => {
      const { data } = await supabase
        .from("trust_features")
        .select("*")
        .order("order_index", { ascending: true });
      if (data && data.length > 0) {
        setTrustFeatures(data);
      } else {
        setTrustFeatures([
          { id: "1", icon_name: "Shield", title: "VERIFIED TRUST", description: "100% inspected building materials in Abuja" },
          { id: "2", icon_name: "Truck", title: "RAPID DISPATCH", description: "Direct warehouse delivery to site" },
          { id: "3", icon_name: "CreditCard", title: "SECURE PAYOUTS", description: "Encrypted checkout & escrow coordination" },
          { id: "4", icon_name: "Headphones", title: "24/7 METABRAIN SUPPORT", description: "Dedicated architectural consultation" }
        ]);
      }
    };
    void fetchTrust();
  }, []);

  useEffect(() => {
    const handleOnline = () => {
      toast.success("Connection restored! Syncing offline actions...");
      void syncOfflineActions();
    };
    const handleOffline = () => {
      toast.warning("Connection lost. Running in offline resilience mode.");
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    if (navigator.onLine) {
      void syncOfflineActions();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground selection:bg-primary selection:text-white">
      <TopBar />
      <main className="flex-1 pb-28 md:pb-16">{children}</main>

      {/* Seamless Marquee Trust Ticker Belt */}
      {trustFeatures.length > 0 && (
        <section className="fixed bottom-12 md:bottom-0 left-0 right-0 z-20 border-t border-border bg-[#0D0D0D]/95 py-2.5 shadow-2xl overflow-hidden backdrop-blur-md select-none">
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .animate-marquee {
              display: flex;
              width: max-content;
              animation: marquee 35s linear infinite;
            }
          `}</style>
          
          <div className="animate-marquee flex items-center gap-16 px-4">
            {trustFeatures.map((t) => {
              const IconComponent =
                t.icon_name === "Shield" ? Shield :
                t.icon_name === "Truck" ? Truck :
                t.icon_name === "CreditCard" ? CreditCard :
                t.icon_name === "Headphones" ? Headphones : HelpCircle;
              return (
                <div key={`${t.id}-1`} className="flex gap-2.5 items-center shrink-0">
                  <div className="rounded-full bg-primary/20 p-1.5 text-gold shrink-0">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex items-baseline gap-2">
                    <h4 className="font-bold text-[10px] text-gold tracking-widest uppercase">{t.title}</h4>
                    <span className="text-[10px] text-border font-bold">|</span>
                    <p className="text-[9.5px] text-muted-foreground whitespace-nowrap">{t.description}</p>
                  </div>
                </div>
              );
            })}
            
            {trustFeatures.map((t) => {
              const IconComponent =
                t.icon_name === "Shield" ? Shield :
                t.icon_name === "Truck" ? Truck :
                t.icon_name === "CreditCard" ? CreditCard :
                t.icon_name === "Headphones" ? Headphones : HelpCircle;
              return (
                <div key={`${t.id}-2`} className="flex gap-2.5 items-center shrink-0">
                  <div className="rounded-full bg-primary/20 p-1.5 text-gold shrink-0">
                    <IconComponent className="h-3.5 w-3.5" />
                  </div>
                  <div className="min-w-0 flex items-baseline gap-2">
                    <h4 className="font-bold text-[10px] text-gold tracking-widest uppercase">{t.title}</h4>
                    <span className="text-[10px] text-border font-bold">|</span>
                    <p className="text-[9.5px] text-muted-foreground whitespace-nowrap">{t.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      <SiteFooter />
      <FloatingWhatsApp />
      <BottomNav />
    </div>
  );
}

function TopBar() {
  const navigate = useNavigate();
  const search = useRouterState({ select: (s) => s.location.search as { q?: string } });
  const { user, isAdmin } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from("communication_queue")
      .select("*")
      .eq("user_id", user.id)
      .eq("channel_type", "push")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) {
      setNotifications(data);
      const pending = data.filter(n => n.status === "PENDING").length;
      setUnreadCount(pending);
    }
  };

  useEffect(() => {
    if (!user?.id) return;
    void loadNotifications();

    const channel = supabase
      .channel(`user-notifications-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "communication_queue",
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          void loadNotifications();
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const openNotifications = async () => {
    setShowNotifications(!showNotifications);
    setMenuOpen(false);
    if (!showNotifications && user?.id) {
      await supabase
        .from("communication_queue")
        .update({ status: "DELIVERED" })
        .eq("user_id", user.id)
        .eq("channel_type", "push")
        .eq("status", "PENDING");
      setUnreadCount(0);
    }
  };

  const clearNotification = async (id: string) => {
    await supabase.from("communication_queue").delete().eq("id", id);
    void loadNotifications();
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setMenuOpen(false);
    navigate({ to: "/" });
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-[#0D0D0D]/95 backdrop-blur-md">
      <div className="container-app flex items-center gap-4 py-3">
        <Link to="/" className="flex items-center gap-3 shrink-0 group">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-[#0D47FF] to-[#0828A4] p-0.5 shadow-lg shadow-[#0D47FF]/20 group-hover:scale-105 transition-transform">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-[#0D0D0D]">
              <span className="font-display font-black text-lg tracking-tighter text-white">
                D<span className="text-gold">B</span>
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-baseline gap-1">
              <span className="font-display text-lg font-black tracking-tight text-white group-hover:text-gold transition-colors">
                DB MARKET
              </span>
            </div>
            <span className="text-[8.5px] font-bold tracking-widest text-gold/90 uppercase">
              BUILDING NIGERIA. BUILDING TRUST.
            </span>
          </div>
        </Link>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const data = new FormData(e.currentTarget);
            const q = String(data.get("q") || "").trim();
            navigate({ to: "/search", search: { q } });
          }}
          className="relative flex-1 max-w-xl mx-auto"
        >
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/80" />
          <input
            name="q"
            defaultValue={search?.q ?? ""}
            placeholder="Search tiles, security doors, faucets, lighting..."
            className="w-full rounded-full border border-border bg-[#141414] py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-muted-foreground outline-none transition duration-300 focus:border-primary focus:bg-[#1A1A1A] focus:ring-2 focus:ring-primary/20"
          />
        </form>

        <div className="flex items-center gap-3 shrink-0">
          {user && (
            <div className="relative">
              <button
                onClick={openNotifications}
                className="relative grid h-10 w-10 place-items-center rounded-full border border-border bg-[#1A1A1A] text-foreground transition hover:border-gold hover:text-gold"
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[9px] font-black text-black shadow-md animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <>
                  <div 
                    onClick={() => setShowNotifications(false)}
                    className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 md:hidden"
                  />
                  
                  <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-[340px] rounded-xl border border-border bg-[#1A1A1A] shadow-2xl p-4 text-xs space-y-3 z-50 md:absolute md:top-auto md:left-auto md:right-0 md:translate-x-0 md:translate-y-0 md:mt-2 md:w-80">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <span className="font-bold text-white text-xs">Notifications</span>
                      <button onClick={() => setShowNotifications(false)} className="text-muted-foreground hover:text-white p-1 rounded-full"><X className="h-4 w-4" /></button>
                    </div>

                    <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                      {notifications.map((notif) => (
                        <div key={notif.id} className="p-2.5 border border-border rounded-lg bg-[#141414] flex gap-2.5 relative group text-left">
                          <AlertCircle className="h-4 w-4 text-gold shrink-0 mt-0.5" />
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-white truncate">{notif.subject || "Operational Update"}</div>
                            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{notif.body}</p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); clearNotification(notif.id); }}
                            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-red-400 transition"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-muted-foreground italic text-center py-4">No notifications yet.</div>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          <div className="relative">
            <button
              onClick={() => {
                setMenuOpen((o) => !o);
                setShowNotifications(false);
              }}
              aria-label="Account menu"
              className="grid h-10 w-10 place-items-center rounded-full border border-border bg-[#1A1A1A] hover:border-primary transition"
            >
              <User className="h-4 w-4 text-gold" />
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-[#1A1A1A] py-2 shadow-2xl z-50 divide-y divide-border/50">
                <div className="px-4 py-2 text-xs">
                  <div className="font-bold text-white truncate">{user?.email || "Guest User"}</div>
                  <div className="text-[9px] text-gold uppercase tracking-wider mt-0.5">DB Market Account</div>
                </div>
                <div className="py-1">
                  <Link
                    to="/favorites"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-foreground hover:bg-primary/20 hover:text-white transition"
                  >
                    <Bookmark className="h-4 w-4 text-gold" />
                    <span>My Favorites</span>
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs text-gold font-bold hover:bg-gold/20 transition"
                    >
                      <Shield className="h-4 w-4 text-gold" />
                      <span>Admin OS Center</span>
                    </Link>
                  )}
                </div>
                <div className="pt-1">
                  {user ? (
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2.5 px-4 py-2 text-left text-xs text-red-400 hover:bg-red-500/10 transition"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Sign out</span>
                    </button>
                  ) : (
                    <Link
                      to="/auth"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-bold text-primary hover:bg-primary/10 transition"
                    >
                      <User className="h-4 w-4" />
                      <span>Sign in / Register</span>
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

function BottomNav() {
  const { user } = useAuth();
  const searchState = useRouterState({ select: (s) => s.location.pathname });
  const [collectionCount, setCollectionCount] = useState(0);

  const loadCollectionCount = useCallback(async () => {
    if (user?.id) {
      try {
        const { items } = await getUserCollectionItems(user.id);
        setCollectionCount(items.length);
      } catch (err) {
        // ignore
      }
    } else {
      setCollectionCount(getGuestCollection().length);
    }
  }, [user?.id]);

  useEffect(() => {
    void loadCollectionCount();
    window.addEventListener("collection:change", loadCollectionCount);
    return () => {
      window.removeEventListener("collection:change", loadCollectionCount);
    };
  }, [loadCollectionCount]);

  const nav = [
    { to: "/home" as const, label: "Home", icon: Home, active: searchState === "/home" },
    { to: "/search" as const, label: "Search", icon: Search, active: searchState.startsWith("/search") },
    { to: "/" as const, label: "Feed", icon: Compass, active: searchState === "/" },
    { to: "/collection" as const, label: "Cart", icon: Bookmark, active: searchState.startsWith("/collection") },
    { to: user ? ("/account" as const) : ("/auth" as const), label: "Account", icon: User, active: searchState.startsWith("/account") || searchState.startsWith("/auth") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-[#0D0D0D]/95 py-2 backdrop-blur-md md:hidden">
      <div className="flex justify-around">
        {nav.map((t) => (
          <Link
            key={t.label}
            to={t.to}
            className={`flex flex-col items-center gap-1 text-[9.5px] font-bold tracking-wider uppercase transition ${
              t.active ? "text-gold" : "text-muted-foreground hover:text-white"
            }`}
          >
            <div className="relative">
              <t.icon className={`h-5 w-5 ${t.active ? "text-gold" : ""}`} />
              {t.label === "Cart" && collectionCount > 0 && (
                <span className="absolute -top-1.5 -right-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-gold text-[8.5px] font-black text-black shadow-md animate-cart-bounce">
                  {collectionCount}
                </span>
              )}
            </div>
            <span>{t.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
