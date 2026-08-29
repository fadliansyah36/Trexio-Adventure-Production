import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api, safeArray } from "@/lib/api";
import {
  Browsers,
  Globe,
  Palette,
  Sparkle,
  ArrowSquareOut,
  PencilSimple,
  CheckCircle,
  Eye,
  ListChecks,
  TrendUp,
  ShieldCheck,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function AdminWebsiteOverview() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConfig() {
      try {
        const res = await api.get("/tenant/builder-config").catch(() => null);
        if (res?.data) {
          setConfig(res.data);
        } else {
          const local = localStorage.getItem("trexio-tenant-builder-config");
          if (local) setConfig(JSON.parse(local));
        }
      } catch (e) {
        console.warn(e);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const tenantName = config?.tenantInfo?.name || "Trexio Authorized Agency";
  const subdomain = config?.tenantInfo?.subdomain || "rinjani-adventure";
  const fullDomain = `${subdomain}.trexio.id`;
  const customDomain = config?.tenantInfo?.customDomain || "www.rinjaniadventure.com";

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Sparkle size={32} className="animate-spin text-emerald-500" />
        <p className="text-xs font-semibold text-muted-foreground">Memuat Overview Website Tenant...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 md:p-8 shadow-xl border border-emerald-500/20 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <Globe size={14} className="text-emerald-400" />
              <span>Trexio Storefront CMS</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight">{tenantName} Storefront</h1>
            <p className="text-xs md:text-sm text-emerald-100/80 max-w-xl leading-relaxed">
              Storefront publik yang terhubung langsung dengan katalog Open Trip, jadwal keberangkatan, dan sistem pembayaran Trexio.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href={`/storefront/${subdomain}`}
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold border border-white/20 flex items-center gap-1.5 transition-all"
            >
              <ArrowSquareOut size={16} />
              <span>Buka Storefront Live</span>
            </a>

            <Link
              to="/admin/website/builder"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold shadow-lg flex items-center gap-2 transition-all cursor-pointer"
            >
              <PencilSimple size={16} />
              <span>Edit via Page Builder</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Domain Quick Bar & Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Subdomain Trexio</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
              <CheckCircle size={14} weight="fill" /> Aktif
            </span>
          </div>
          <div className="font-mono font-bold text-base text-foreground truncate">{fullDomain}</div>
          <Link to="/admin/website/domain" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline block pt-1">
            Atur Subdomain & Slugs →
          </Link>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Custom Domain</span>
            <span className="flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
              <ShieldCheck size={14} weight="fill" /> SSL Active
            </span>
          </div>
          <div className="font-mono font-bold text-base text-foreground truncate">{customDomain}</div>
          <Link to="/admin/website/domain" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline block pt-1">
            Konfigurasi DNS Custom Domain →
          </Link>
        </div>

        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-2">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-semibold">Template Aktif</span>
            <span className="text-[10px] uppercase font-black bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded">
              {config?.templateId || "Template 1"}
            </span>
          </div>
          <div className="font-black text-base text-foreground">Adventure Classic</div>
          <Link to="/admin/website/templates" className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline block pt-1">
            Ganti dari 7 Preset Template →
          </Link>
        </div>
      </div>

      {/* Quick Navigation Cards to Website Modules */}
      <div>
        <h2 className="text-lg font-black tracking-tight mb-3">Modul Pengaturan Storefront</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickLinkCard
            to="/admin/website/builder"
            icon={Browsers}
            title="Page Builder"
            desc="Drag-and-drop section library, edit teks inline, dan live mobile preview."
            badge="Fitur Utama"
          />
          <QuickLinkCard
            to="/admin/website/templates"
            icon={Palette}
            title="Template Library"
            desc="Pilih 7 preset desain profesional khusus trip, outdoor, dan rental."
            badge="7 Preset"
          />
          <QuickLinkCard
            to="/admin/website/pages"
            icon={ListChecks}
            title="Kelola Halaman"
            desc="Atur halaman Home, Open Trip, Private Trip, About, FAQ, dan Kontak."
          />
          <QuickLinkCard
            to="/admin/website/navigation"
            icon={ListChecks}
            title="Navigasi Header"
            desc="Atur menu navigasi navbar dengan fitur reorder drag-and-drop."
          />
          <QuickLinkCard
            to="/admin/website/branding"
            icon={Palette}
            title="Identitas & Warna"
            desc="Ubah logo, favicon, warna utama, dan pilihan font typografi."
          />
          <QuickLinkCard
            to="/admin/website/domain"
            icon={Globe}
            title="Domain & Subdomain"
            desc="Kelola slug subdomain unik dan custom domain bersertifikat SSL."
          />
          <QuickLinkCard
            to="/admin/website/seo"
            icon={Sparkle}
            title="SEO & Social Cover"
            desc="Atur judul meta, deskripsi Google, dan thumbnail WhatsApp sharing."
          />
          <QuickLinkCard
            to="/admin/website/analytics"
            icon={TrendUp}
            title="Website Analytics"
            desc="Pantau jumlah visitor, views produk, checkout, dan conversion rate."
          />
        </div>
      </div>
    </div>
  );
}

function QuickLinkCard({ to, icon: Icon, title, desc, badge }) {
  return (
    <Link
      to={to}
      className="p-5 rounded-2xl bg-card border border-border hover:border-emerald-500/50 hover:shadow-md transition-all space-y-2 flex flex-col justify-between group"
    >
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Icon size={20} />
          </div>
          {badge && (
            <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/15 text-emerald-600 px-2 py-0.5 rounded border border-emerald-500/20">
              {badge}
            </span>
          )}
        </div>
        <h3 className="font-extrabold text-sm text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">{desc}</p>
      </div>

      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 pt-2 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
        <span>Buka Pengaturan</span> →
      </div>
    </Link>
  );
}
