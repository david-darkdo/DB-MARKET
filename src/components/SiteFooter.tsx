import { Link } from "@tanstack/react-router";
import { useAppSettings } from "@/lib/settings";
import { Facebook, Instagram, Mail, MapPin, Phone, ShieldCheck, ArrowUpRight } from "lucide-react";

export function SiteFooter() {
  const { data: s } = useAppSettings();

  return (
    <footer className="mt-20 border-t border-border bg-[#090909] text-foreground">
      <div className="border-b border-border/60 bg-gradient-to-r from-[#0D0D0D] via-[#141414] to-[#0D0D0D] py-8">
        <div className="container-app flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h3 className="font-display font-black text-lg text-white tracking-tight flex items-center justify-center md:justify-start gap-2">
              <ShieldCheck className="h-5 w-5 text-gold" />
              <span>DB MARKET PLATFORM INSIGHT</span>
            </h3>
            <p className="text-xs text-muted-foreground max-w-2xl">
              "We are not just a marketplace, we are building the future of building materials in Nigeria. Combining construction strength with digital confidence."
            </p>
          </div>
          <Link
            to="/auth"
            className="shrink-0 inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-5 py-2.5 text-xs font-bold text-gold hover:bg-gold hover:text-black transition duration-300 shadow-md"
          >
            <span>Become a Verified Supplier</span>
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      <div className="container-app grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[#0D47FF] to-[#0828A4] p-0.5">
              <span className="font-black text-sm text-white">DB</span>
            </div>
            <span className="font-display font-black text-xl text-white tracking-tight">DB MARKET</span>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Nigeria's digital marketplace for verified building materials. Owned and operated by MetaBrain Software.
          </p>
          <div className="pt-1">
            <span className="inline-block rounded border border-gold/30 bg-gold/10 px-2.5 py-1 text-[9px] font-bold text-gold tracking-widest uppercase">
              Abuja Commerce Hub
            </span>
          </div>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold">Explore Marketplace</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
            <li><Link to="/" className="hover:text-white transition">Showroom Feed</Link></li>
            <li><Link to="/search" search={{ q: "" }} className="hover:text-white transition">Building Materials Search</Link></li>
            <li><Link to="/collection" className="hover:text-white transition">My Curated Cart</Link></li>
            <li><Link to="/contact" className="hover:text-white transition">Architectural Consultation</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold">Abuja Fulfillment Operations</h4>
          <ul className="mt-4 space-y-2.5 text-xs text-muted-foreground">
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span>{s?.company_email || "support@dbmarket.ng"}</span>
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-primary shrink-0" />
              <span>{s?.support_whatsapp || "+234 800 DB MARKET"}</span>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 text-primary shrink-0" />
              <span>{s?.company_address || "Central Business District, Abuja, Nigeria"}</span>
            </li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-xs font-bold uppercase tracking-wider text-gold">Connect & Verify</h4>
          <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
            Follow official updates across social channels.
          </p>
          <ul className="mt-4 flex gap-3">
            {s?.facebook_url && (
              <li>
                <a href={s.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-[#141414] text-muted-foreground hover:border-gold hover:text-gold transition">
                  <Facebook className="h-4 w-4" />
                </a>
              </li>
            )}
            {s?.instagram_url && (
              <li>
                <a href={s.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full border border-border bg-[#141414] text-muted-foreground hover:border-gold hover:text-gold transition">
                  <Instagram className="h-4 w-4" />
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border/40 py-5 bg-[#070707] text-center text-[11px] text-muted-foreground">
        <div className="container-app flex flex-col sm:flex-row items-center justify-between gap-3">
          <span>© {new Date().getFullYear()} DB MARKET (Dark Brothers Market). All rights reserved.</span>
          <span className="font-mono text-[10px] text-gold/80">BUILDING NIGERIA. BUILDING TRUST.</span>
        </div>
      </div>
    </footer>
  );
}
