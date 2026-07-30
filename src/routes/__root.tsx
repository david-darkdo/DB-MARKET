import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import "@fontsource/space-grotesk/400.css";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/dm-sans/400.css";
import "@fontsource/dm-sans/500.css";
import "@fontsource/dm-sans/600.css";

import appCss from "../styles.css?url";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 text-white">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-7xl font-black text-[#FFC107]">404</h1>
        <h2 className="text-xl font-bold">Page not found</h2>
        <p className="text-xs text-gray-400">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-full bg-[#0D47FF] px-6 py-2.5 text-xs font-bold text-white shadow-lg"
          >
            Return to Marketplace
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0D0D0D] px-4 text-white">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-xl font-bold tracking-tight">
          Page loading encountered an issue
        </h1>
        <p className="text-xs text-gray-400">
          Something went wrong loading this view. Try refreshing the page.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-full bg-[#0D47FF] px-6 py-2.5 text-xs font-bold text-white shadow-lg"
          >
            Try Again
          </button>
          <a
            href="/"
            className="rounded-full border border-[#333333] bg-[#141414] px-6 py-2.5 text-xs font-bold text-white"
          >
            Return Home
          </a>
        </div>
      </div>
    </div>
  );
}

import { fetchAppSettings } from "@/lib/settings";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  loader: async () => {
    try {
      const settings = await fetchAppSettings();
      return { settings };
    } catch {
      return { settings: null };
    }
  },
  head: ({ loaderData }) => {
    const settings = loaderData?.settings;
    const googleVerify = settings?.google_site_verification;
    const bingVerify = settings?.bing_site_verification;

    const meta = [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1, viewport-fit=cover" },
      { name: "theme-color", content: "#0D0D0D" },
      { title: "DB Market — Building Materials Commerce Infrastructure" },
      {
        name: "description",
        content: "Discover verified tiles, security doors, plumbing, lighting and architectural finishes at DB Market Abuja.",
      },
      { property: "og:title", content: "DB Market — Building Nigeria. Building Trust." },
      {
        property: "og:description",
        content: "Nigeria's digital marketplace for verified building materials.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "DB Market — Building Nigeria. Building Trust." },
      { name: "twitter:description", content: "Nigeria's digital marketplace for verified building materials." },
    ];

    if (googleVerify) {
      meta.push({ name: "google-site-verification", content: googleVerify });
    }
    if (bingVerify) {
      meta.push({ name: "msvalidate.01", content: bingVerify });
    }

    return {
      meta,
      links: [
        { rel: "stylesheet", href: appCss },
        { rel: "manifest", href: "/manifest.webmanifest" },
        { rel: "apple-touch-icon", href: "/icon-512.png" },
        { rel: "icon", href: "/icon-512.png", type: "image/png" },
      ],
    };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootAppWrapper />
        <Toaster richColors position="top-center" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

function RootAppWrapper() {
  const { user } = useAuth();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isPending = useRouterState({ select: (s) => s.status === "pending" });
  const [showLoader, setShowLoader] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    setInitialLoading(false);
  }, []);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPending) {
      timer = setTimeout(() => setShowLoader(true), 150);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timer);
  }, [isPending]);

  useEffect(() => {
    if (!user?.id) return;

    const trackView = async () => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_id", user.id)
        .maybeSingle();
      if (!profile?.id) return;

      await supabase.from("customer_activity").insert({
        user_id: profile.id,
        activity_type: pathname === "/" ? "homepage_viewed" : "page_viewed",
        metadata: { path: pathname, timestamp: new Date().toISOString() }
      });
    };
    void trackView();
  }, [user?.id, pathname]);

  const loaderData = Route.useLoaderData();
  const settings = loaderData?.settings;
  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "DB Market",
    "url": typeof window !== "undefined" ? window.location.origin : "https://db-market-opal.vercel.app",
    "logo": typeof window !== "undefined" ? `${window.location.origin}/icon-512.png` : "https://db-market-opal.vercel.app/icon-512.png",
    "contactPoint": {
      "@type": "ContactPoint",
      "telephone": settings?.support_whatsapp || "",
      "contactType": "sales & customer support"
    }
  };

  return (
    <div className="relative min-h-screen bg-[#0D0D0D] text-white">
      <script 
        type="application/ld+json" 
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }} 
      />
      {/* Full Page Breathing DB Market Emblem Loading Screen */}
      {(() => {
        const isApiRoute = pathname === "/robots.txt" || pathname === "/sitemap.xml" || pathname.startsWith("/api/");
        const showGlobalLoader = (showLoader || initialLoading) && !isApiRoute;
        if (!showGlobalLoader) return null;
        return (
          <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0D0D0D] backdrop-blur-md transition-all duration-300 animate-fade-in">
            <style>{`
              @keyframes breathing {
                0%, 100% { transform: scale(0.95); opacity: 0.5; }
                50% { transform: scale(1.05); opacity: 1; }
              }
              .animate-breathing {
                animation: breathing 1.8s ease-in-out infinite;
              }
            `}</style>
            <div className="flex flex-col items-center gap-3 animate-breathing">
              <div className="grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-[#0D47FF] to-[#0828A4] p-0.5 shadow-2xl shadow-[#0D47FF]/30">
                <div className="flex h-full w-full items-center justify-center rounded-[14px] bg-[#0D0D0D]">
                  <span className="font-display font-black text-2xl tracking-tighter text-white">
                    D<span className="text-[#FFC107]">B</span>
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="font-display text-base font-black tracking-tight text-white">
                  DB MARKET
                </span>
                <span className="text-[8px] font-bold tracking-widest text-[#FFC107] uppercase mt-0.5">
                  BUILDING NIGERIA. BUILDING TRUST.
                </span>
              </div>
            </div>
          </div>
        );
      })()}

      <Outlet />
    </div>
  );
}
