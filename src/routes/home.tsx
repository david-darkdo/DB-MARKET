import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { useAppSettings, waLink } from "@/lib/settings";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  ArrowRight,
  Facebook,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Sparkles,
  Compass,
  Bookmark,
  ShieldCheck,
  Zap,
  Award,
  TrendingUp,
  Layers,
  DoorClosed,
  Bath,
  Lightbulb,
  Utensils,
  Wrench
} from "lucide-react";

export const Route = createFileRoute("/home")({
  head: () => ({
    meta: [
      { title: "DB Market — Everything Building. One Marketplace." },
      {
        name: "description",
        content:
          "DB Market is Nigeria's digital marketplace for premium building materials. Verified quality, transparent pricing, and managed fulfillment in Abuja.",
      },
      { property: "og:title", content: "DB Market — Building Materials Infrastructure" },
      {
        property: "og:description",
        content: "Everything building. One marketplace. Connecting architects, builders, and verified suppliers across Nigeria.",
      },
    ],
  }),
  component: HomePage,
});

function HomePage() {
  const { data: s } = useAppSettings();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  const [heroVideos, setHeroVideos] = useState<any[]>([]);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);

  useEffect(() => {
    const fetchVideos = async () => {
      const { data } = await supabase
        .from("hero_videos")
        .select("*")
        .eq("is_active", true)
        .order("order_index", { ascending: true });
      if (data && data.length > 0) {
        setHeroVideos(data);
      } else {
        setHeroVideos([
          { id: "1", url: "https://assets.mixkit.co/videos/preview/mixkit-modern-apartment-interior-design-39908-large.mp4" },
          { id: "2", url: "https://assets.mixkit.co/videos/preview/mixkit-architectural-model-design-details-39909-large.mp4" },
          { id: "3", url: "https://assets.mixkit.co/videos/preview/mixkit-spinning-architectural-plans-39910-large.mp4" }
        ]);
      }
    };
    void fetchVideos();
  }, []);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % heroVideos.length);
  };

  const submitCallback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s?.sales_whatsapp) {
      toast.error("Sales WhatsApp not configured yet");
      return;
    }
    setBusy(true);
    try {
      const msg = `Hi DB Market! My name is ${name}. Please reach me at ${phone} regarding a building project in Abuja.`;
      window.open(waLink(s.sales_whatsapp, msg), "_blank", "noopener,noreferrer");
      toast.success("Opening DB Market WhatsApp Fulfillment...");
      setName("");
      setPhone("");
    } finally {
      setBusy(false);
    }
  };

  const departments = [
    { title: "Tiles & Marble", slug: "tiles", icon: Layers, count: "120+ Materials", img: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80" },
    { title: "Security Doors", slug: "doors", icon: DoorClosed, count: "45+ Models", img: "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=800&q=80" },
    { title: "Sanitary Wares", slug: "sanitary-wares", icon: Bath, count: "80+ Fixtures", img: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80" },
    { title: "Lighting & Electrical", slug: "lighting", icon: Lightbulb, count: "60+ Designs", img: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80" },
    { title: "Kitchen Systems", slug: "kitchen", icon: Utensils, count: "35+ Countertops", img: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=800&q=80" },
    { title: "Plumbing & Piping", slug: "plumbing", icon: Wrench, count: "90+ Fittings", img: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=800&q=80" }
  ];

  return (
    <AppShell>
      <section className="relative w-full min-h-[75vh] flex items-center justify-center overflow-hidden bg-[#0D0D0D] border-b border-border">
        {heroVideos.length > 0 && (
          <div className="absolute inset-0 w-full h-full">
            <video
              key={heroVideos[currentVideoIndex]?.id || currentVideoIndex}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover opacity-35 filter brightness-90 transition-all duration-1000 scale-105"
              src={heroVideos[currentVideoIndex]?.url}
              preload="auto"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-[#0D0D0D]/60 to-black/80" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
          </div>
        )}

        <div className="container-app relative z-10 py-16 text-center md:text-left">
          <div className="max-w-3xl space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-4 py-1.5 backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5 text-gold animate-pulse" />
              <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-gold">
                NIGERIA'S BUILDING MATERIALS COMMERCE INFRASTRUCTURE
              </span>
            </div>

            <h1 className="font-display text-4xl sm:text-6xl lg:text-7xl font-black text-white leading-[1.05] tracking-tight">
              Everything Building. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gold to-primary">
                One Marketplace.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-gray-300 max-w-2xl leading-relaxed font-normal">
              DB Market connects Nigerian architects, contractors, and homeowners with verified building material suppliers across Abuja and nationwide. Verified quality, transparent pricing, and managed on-site fulfillment.
            </p>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-4">
              <Link
                to="/"
                className="btn-glow-blue inline-flex items-center gap-3 rounded-full bg-primary px-8 py-4 text-xs font-black uppercase tracking-widest text-white shadow-xl"
              >
                <Compass className="h-4 w-4 text-gold" />
                <span>Explore Marketplace</span>
                <ArrowRight className="h-4 w-4" />
              </Link>

              <Link
                to="/auth"
                className="btn-glow-gold inline-flex items-center gap-3 rounded-full border border-gold/60 bg-gold/10 backdrop-blur-md px-8 py-4 text-xs font-black uppercase tracking-widest text-gold hover:bg-gold hover:text-black shadow-lg"
              >
                <span>Become a Supplier</span>
              </Link>
            </div>
          </div>
        </div>

        {heroVideos.length > 1 && (
          <div className="absolute bottom-6 right-6 sm:right-12 flex gap-2 z-20">
            {heroVideos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentVideoIndex(i)}
                className={`h-2 rounded-full transition-all duration-500 ${
                  currentVideoIndex === i ? "w-8 bg-gold" : "w-2 bg-white/30"
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>
        )}
      </section>

      <section className="container-app py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6 space-y-3 card-hover-lift">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-gold">
              <ShieldCheck className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">TRUST</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A secure and verified platform you can rely on. 100% inspected materials in Abuja.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6 space-y-3 card-hover-lift">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-gold">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">SPEED</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fast experience from search to site delivery. Rapid dispatch to construction projects.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6 space-y-3 card-hover-lift">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-gold">
              <Award className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">QUALITY</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Premium products from top suppliers. Verified specifications and authentic photos.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-[#1A1A1A] p-6 space-y-3 card-hover-lift">
            <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/20 text-gold">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="font-display font-black text-sm text-white uppercase tracking-wider">GROWTH</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built for scale. Empowering local merchants and growing with Nigeria's building sector.
            </p>
          </div>
        </div>
      </section>

      <section className="container-app py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <span className="font-display text-xs uppercase tracking-[0.2em] text-gold font-bold">
              EXPLORE DEPARTMENTS
            </span>
            <h2 className="mt-1 font-display text-2xl sm:text-3xl font-black text-white tracking-tight">
              Curated Materials for Every Stage of Construction
            </h2>
          </div>
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-primary hover:text-gold transition uppercase tracking-wider"
          >
            <span>View All Categories</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {departments.map((dept) => {
            const Icon = dept.icon;
            return (
              <Link
                key={dept.slug}
                to="/"
                search={{ type: dept.slug }}
                className="group relative h-64 overflow-hidden rounded-2xl border border-border bg-[#1A1A1A] card-hover-lift block"
              >
                <img
                  src={dept.img}
                  alt={dept.title}
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110 opacity-60"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

                <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                  <div className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur px-3 py-1 text-[10px] font-bold text-gold uppercase tracking-wider">
                      <Icon className="h-3.5 w-3.5 text-gold" /> {dept.count}
                    </span>
                  </div>

                  <div>
                    <h3 className="font-display text-xl font-black text-white group-hover:text-gold transition-colors">
                      {dept.title}
                    </h3>
                    <p className="mt-1 text-xs text-gray-300 font-medium flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                      <span>Explore Department</span>
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="container-app py-16">
        <div className="rounded-3xl border border-border bg-gradient-to-br from-[#141414] via-[#1A1A1A] to-[#0D0D0D] p-8 md:p-12 shadow-2xl relative overflow-hidden">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
          
          <div className="grid gap-10 lg:grid-cols-2 items-center relative z-10">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-gold/10 border border-gold/30 px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-widest text-gold">
                ABUJA FULFILLMENT & SAMPLES
              </span>
              <h2 className="font-display text-2xl sm:text-4xl font-black text-white leading-tight tracking-tight">
                Request Sample Inspections & Architectural Consultation
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Need material samples delivered to your site in Abuja? Speak directly with DB Market Specialists for volume discounts, technical specs, and consolidated logistics coordination.
              </p>

              <div className="space-y-3 pt-2">
                {s?.support_whatsapp && (
                  <a
                    href={waLink(s.support_whatsapp, "Hi DB Market! I would like to request material samples in Abuja.")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3.5 rounded-xl border border-border bg-[#141414] p-4 hover:border-gold transition"
                  >
                    <MessageCircle className="h-5 w-5 text-gold shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-gold">
                        Support WhatsApp
                      </div>
                      <div className="text-xs font-semibold text-white">{s.support_whatsapp}</div>
                    </div>
                  </a>
                )}
                {s?.company_address && (
                  <div className="flex items-start gap-3.5 rounded-xl border border-border bg-[#141414] p-4">
                    <MapPin className="mt-0.5 h-5 w-5 text-primary shrink-0" />
                    <div>
                      <div className="text-[10px] font-bold uppercase tracking-wider text-primary">
                        Abuja Central Hub
                      </div>
                      <div className="text-xs font-semibold text-white">{s.company_address}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <form
              onSubmit={submitCallback}
              className="rounded-2xl border border-border bg-[#0D0D0D] p-6 sm:p-8 space-y-4 shadow-xl"
            >
              <div>
                <h3 className="font-display text-lg font-black text-white">Instant Project Callback</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Enter your details below to connect with a DB Market Procurement Officer.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Your Name / Company
                  </label>
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Arch. Emmanuel Japhet"
                    className="w-full rounded-xl border border-border bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+234 800 000 0000"
                    className="w-full rounded-xl border border-border bg-[#1A1A1A] px-4 py-3 text-xs text-white placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                  />
                </div>

                <button
                  disabled={busy}
                  className="btn-glow-blue w-full rounded-full bg-primary px-6 py-3.5 text-xs font-black uppercase tracking-widest text-white disabled:opacity-60 transition shadow-lg mt-2"
                >
                  {busy ? "Connecting..." : "Request Callback"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </AppShell>
  );
}
