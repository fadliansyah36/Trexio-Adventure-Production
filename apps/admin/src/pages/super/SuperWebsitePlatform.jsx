import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Crown,
  Globe,
  Palette,
  HardDrives,
  CheckCircle,
  XCircle,
  Sliders,
  Storefront,
  MagnifyingGlass,
  Plus,
  FloppyDisk,
  ShieldCheck,
  Code,
  Check,
  Layout,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeSlash,
  Sparkle,
  Trash,
  Lightning,
  DeviceMobile,
  Desktop,
  Mountains,
  Compass,
  Package,
  Megaphone,
  Question,
  Image,
  Images,
  DownloadSimple,
  GridFour,
  UploadSimple,
} from "@phosphor-icons/react";

function ImageFileUpload({ label, value, onChange, accept = "image/*", helpText, previewHeight = "h-20" }) {
  const [mode, setMode] = useState("file");

  const handleFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      toast.error("Ukuran file gambar maksimal 8MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(event.target.result);
      toast.success(`File gambar "${file.name}" berhasil diunggah!`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="font-bold text-neutral-300 block text-xs">{label}</label>
        <div className="flex items-center gap-1 bg-neutral-900 border border-white/10 p-0.5 rounded-lg text-[10px]">
          <button
            type="button"
            onClick={() => setMode("file")}
            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
              mode === "file" ? "bg-emerald-600 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Upload File
          </button>
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`px-2 py-0.5 rounded-md font-bold transition-all ${
              mode === "url" ? "bg-emerald-600 text-white shadow-xs" : "text-neutral-400 hover:text-neutral-200"
            }`}
          >
            Tempel URL
          </button>
        </div>
      </div>

      {value ? (
        <div className="relative group bg-neutral-900 border border-white/20 rounded-xl p-2.5 flex items-center justify-between gap-3 overflow-hidden shadow-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={`shrink-0 ${previewHeight} w-24 rounded-lg bg-black/80 border border-white/10 flex items-center justify-center p-1 overflow-hidden`}>
              <img src={value} alt="Preview" className="max-h-full max-w-full object-contain" />
            </div>
            <div className="truncate space-y-0.5">
              <span className="text-[11px] font-extrabold text-emerald-400 block truncate flex items-center gap-1">
                <CheckCircle size={12} weight="fill" /> Gambar Terpasang
              </span>
              <span className="text-[10px] text-neutral-400 block truncate font-mono">
                {value.startsWith("data:") ? "File lokal (Base64)" : value.slice(0, 35) + "..."}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {mode === "file" ? (
              <label className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1.5 border border-white/10">
                <UploadSimple size={14} /> Ganti File
                <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
              </label>
            ) : (
              <button
                type="button"
                onClick={() => onChange("")}
                className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition-all"
              >
                Ubah URL
              </button>
            )}
            <button
              type="button"
              onClick={() => onChange("")}
              className="px-2.5 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold transition-all cursor-pointer border border-rose-500/30"
              title="Hapus Gambar"
            >
              <Trash size={14} />
            </button>
          </div>
        </div>
      ) : mode === "file" ? (
        <label className="border-2 border-dashed border-white/20 hover:border-emerald-400/80 bg-neutral-900/60 hover:bg-neutral-900 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all group text-center">
          <UploadSimple size={24} className="text-neutral-400 group-hover:text-emerald-400 transition-colors mb-1" />
          <span className="text-xs font-bold text-neutral-200 group-hover:text-emerald-300">
            Klik untuk Unggah File Gambar
          </span>
          <span className="text-[10px] text-neutral-400 mt-0.5">
            {helpText || "Pilih file gambar (PNG, JPG, WEBP, SVG) dari perangkat Anda (Max 8MB)"}
          </span>
          <input type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        </label>
      ) : (
        <div className="space-y-1">
          <input
            type="url"
            placeholder="https://domain.com/logo.png (Tautan Direct Gambar)"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-neutral-900 border border-white/20 rounded-xl px-3 py-2 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-400"
          />
          <span className="text-[10px] text-neutral-400 block">
            Tempel tautan/URL langsung gambar logo transparan (.png / .svg / .jpg)
          </span>
        </div>
      )}
    </div>
  );
}

export default function SuperWebsitePlatform() {
  const [activeTab, setActiveTab] = useState("builder"); // 'builder' | 'storefronts' | 'templates' | 'global_settings'
  const [savingGlobal, setSavingGlobal] = useState(false);
  const [savingBuilder, setSavingBuilder] = useState(false);
  const [previewDevice, setPreviewDevice] = useState("desktop"); // 'desktop' | 'mobile'

  const [homepageConfig, setHomepageConfig] = useState({
    branding: {
      logoUrl: "",
      logoIcon: "Mountains",
      platformName: "TREXIO",
      tagline: "Track Every Journey",
      description: "Platform Open Trip & Marketplace Outdoor #1 Indonesia",
      faviconUrl: "",
    },
    seo: {
      metaTitle: "Trexio — Platform Adventure & Open Trip Indonesia",
      metaDescription: "Marketplace petualangan outdoor, open trip gunung, rental gear, dan komunitas outdoor.",
      keywords: "open trip, pendakian gunung, rental gear outdoor, Bromo, Rinjani, Raja Ampat",
    },
    hero: {
      badgeText: "Marketplace Outdoor & PWA App #1",
      titleMain: "Jelajahi Keindahan Nusantara",
      titleGradient: "Bromo · Rinjani · Raja Ampat",
      subtitle: "Bergabung dengan trip gabungan terpercaya, sewa peralatan pendakian, atau temukan pemandu gunung berpengalaman untuk petualangan Anda.",
      bgImageUrl: "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      searchPlaceholder: "Temukan trip, gunung, guide, basecamp...",
      buttonText: "Cari Trip",
    },
    banners: [
      {
        id: "b1",
        title: "Open Trip Bromo & Madakaripura 3D2N",
        subtitle: "Nikmati sunrise terbaik Bromo dengan jeep 4x4 terpercaya",
        tag: "PROMO DISKON 20%",
        bg: "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        link: "/explore?q=Bromo",
        badgeBg: "bg-amber-500 text-slate-950",
      },
      {
        id: "b2",
        title: "Pemandu Gunung APGI & BNSP",
        subtitle: "Jamin keselamatan pendakianmu dengan guide profesional terlisensi",
        tag: "SAFETY GUARANTEED",
        bg: "https://images.pexels.com/photos/1687514/pexels-photo-1687514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
        link: "/category/guide",
        badgeBg: "bg-emerald-500 text-white",
      },
      {
        id: "b3",
        title: "Sewa Alat Outdoor Steril & Siap Pakai",
        subtitle: "Tenda dome, carrier, sleeping bag, & cooking set gratis antar basecamp",
        tag: "OUTDOOR RENTAL",
        bg: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1200&q=80",
        link: "/rental",
        badgeBg: "bg-blue-500 text-white",
      },
      {
        id: "b4",
        title: "Bergabung Sebagai Mitra Trexio",
        subtitle: "Jangkau ribuan pendaki & traveler di seluruh Indonesia. Komisi 0%!",
        tag: "MITRA ORGANIZER",
        bg: "https://images.unsplash.com/photo-1533240332313-0db49b459ad6?auto=format&fit=crop&w=1200&q=80",
        link: "/partner/register",
        badgeBg: "bg-purple-700 text-white",
      },
    ],
    stats: {
      stat1_number: "50.000+",
      stat1_label: "Penjelajah Terdaftar",
      stat2_number: "120+",
      stat2_label: "Destinasi Gunung & Alam",
      stat3_number: "500+",
      stat3_label: "Guide APGI & BNSP",
      stat4_number: "4.9 ★",
      stat4_label: "Kepuasan Layanan",
    },
    sections: [
      { id: "hero_banners", name: "Promotional Banner Carousel (PWA Slider)", enabled: true },
      { id: "categories_grid", name: "12 Kategori Marketplace Layanan", enabled: true },
      { id: "best_trips", name: "Best Trip & Rekomendasi Unggulan", enabled: true },
      { id: "open_trips", name: "Open Trip Paling Diminati", enabled: true },
      { id: "private_trips", name: "Private Trip (Eksklusif & Kustom)", enabled: true },
      { id: "guides_apgi", name: "Guide Pilihan APGI & BNSP", enabled: true },
      { id: "porters_logistics", name: "Porter & Logistik Pendakian", enabled: true },
      { id: "basecamps", name: "Basecamp & Pos Registrasi Pendakian", enabled: true },
      { id: "rental_gear", name: "Sewa Peralatan Outdoor (Rental Gear)", enabled: true },
      { id: "become_partner", name: "Banner Tawarkan Layanan / Jadi Mitra", enabled: true },
      { id: "pwa_install", name: "Install Trexio PWA Mobile App", enabled: true },
      { id: "faq", name: "Pertanyaan Sering Diajukan (FAQ)", enabled: true },
      { id: "cta_banner", name: "Call to Action Banner Bottom", enabled: true },
    ],
    pwaInstall: {
      title: "Install Trexio PWA App",
      badge: "Mobile First",
      subtitle: "Akses Trexio lebih cepat langsung dari layar utama smartphone Anda. Buka katalog, pesan trip, dan akses e-ticket secara instan tanpa lag.",
      buttonText: "Install Trexio App",
    },
    becomePartner: {
      badge: "JADI MITRA TREXIO",
      title: "Tawarkan Layanan Petualangan Anda Kepada Ribuan Traveler",
      subtitle: "Bergabunglah sebagai Open Trip Organizer, Guide APGI, Porter, Pengelola Basecamp, atau Persewaan Alat Outdoor di Trexio.",
      buttonText: "Daftar Sebagai Mitra Sekarang",
      buttonLink: "/partner/register",
    },
    faq: {
      title: "Pertanyaan Sering Diajukan (FAQ)",
      subtitle: "Informasi penting seputar pemesanan, verifikasi guide & pembatalan trip di Trexio",
      items: [
        { q: "Bagaimana cara mendaftar Open Trip di Trexio?", a: "Pilih trip yang diinginkan, pilih tanggal keberangkatan, lalu lakukan checkout. Pembayaran melalui Trexio Dijamin Aman via QRIS & VA." },
        { q: "Apakah guide & mitra tour di Trexio terpercaya?", a: "Semua mitra vendor & guide di Trexio telah melewati proses verifikasi identitas (KYC) dan sertifikasi resmi APGI / BNSP." },
        { q: "Bagaimana jika terjadi cuaca buruk atau pembatalan?", a: "Trexio memiliki sistem mediasi sengketa & refund sesuai dengan syarat dan ketentuan yang disepakati dengan penyelenggara trip." },
      ],
    },
    ctaBanner: {
      title: "Siap Memulai Petualangan Anda?",
      subtitle: "Daftar sekarang dan temukan ribuan teman pendakian baru di seluruh gunung Indonesia!",
      buttonText: "Jelajahi Semua Trip Sekarang",
      buttonLink: "/explore",
    },
  });

  useEffect(() => {
    loadHomepageConfig();
    api.get("/super/tenants").then((res) => {
      if (Array.isArray(res.data)) {
        setTenants(res.data);
      }
    }).catch(() => {});
  }, []);

  async function loadHomepageConfig() {
    try {
      const res = await api.get("/super/homepage-config");
      if (res.data) {
        setHomepageConfig((prev) => ({
          ...prev,
          ...res.data,
          branding: { ...prev.branding, ...res.data.branding },
          seo: { ...prev.seo, ...res.data.seo },
          hero: { ...prev.hero, ...res.data.hero },
          stats: { ...prev.stats, ...res.data.stats },
          pwaInstall: { ...prev.pwaInstall, ...res.data.pwaInstall },
          becomePartner: { ...prev.becomePartner, ...res.data.becomePartner },
          banners: Array.isArray(res.data.banners) && res.data.banners.length ? res.data.banners : prev.banners,
          sections: Array.isArray(res.data.sections) && res.data.sections.length ? res.data.sections : prev.sections,
          faq: { ...prev.faq, ...res.data.faq, items: res.data.faq?.items || prev.faq.items },
          ctaBanner: { ...prev.ctaBanner, ...res.data.ctaBanner },
        }));
      }
    } catch (e) {
      // fallback to default
    }
  }

  async function handlePublishHomepage(e) {
    if (e) e.preventDefault();
    setSavingBuilder(true);
    try {
      await api.post("/super/homepage-config", homepageConfig);
      if (homepageConfig.branding) {
        try {
          localStorage.setItem("trexio_site_branding", JSON.stringify(homepageConfig.branding));
        } catch (err) {}
        window.dispatchEvent(new CustomEvent("trexio_branding_updated", { detail: homepageConfig.branding }));
      }
      toast.success("Konfigurasi Visual Website Homepage & Logo berhasil dipublikasikan LIVE!");
    } catch (err) {
      toast.error("Gagal menyimpan konfigurasi homepage: " + (err.message || ""));
    } finally {
      setSavingBuilder(false);
    }
  }

  // Section reordering helpers
  function moveSectionUp(index) {
    if (index === 0) return;
    const list = [...homepageConfig.sections];
    const temp = list[index - 1];
    list[index - 1] = list[index];
    list[index] = temp;
    setHomepageConfig({ ...homepageConfig, sections: list });
  }

  function moveSectionDown(index) {
    if (index === homepageConfig.sections.length - 1) return;
    const list = [...homepageConfig.sections];
    const temp = list[index + 1];
    list[index + 1] = list[index];
    list[index] = temp;
    setHomepageConfig({ ...homepageConfig, sections: list });
  }

  function toggleSectionEnabled(index) {
    const list = [...homepageConfig.sections];
    list[index].enabled = !list[index].enabled;
    setHomepageConfig({ ...homepageConfig, sections: list });
  }

  // FAQ Item helpers
  function addFaqItem() {
    const items = [...homepageConfig.faq.items, { q: "Pertanyaan Baru", a: "Jawaban penjelasan pertanyaan baru." }];
    setHomepageConfig({ ...homepageConfig, faq: { ...homepageConfig.faq, items } });
  }

  function updateFaqItem(index, field, val) {
    const items = [...homepageConfig.faq.items];
    items[index][field] = val;
    setHomepageConfig({ ...homepageConfig, faq: { ...homepageConfig.faq, items } });
  }

  function removeFaqItem(index) {
    const items = homepageConfig.faq.items.filter((_, i) => i !== index);
    setHomepageConfig({ ...homepageConfig, faq: { ...homepageConfig.faq, items } });
  }

  // Banner Helpers
  function addBannerItem() {
    const newBanner = {
      id: "b_" + Date.now(),
      title: "Promo Petualangan Baru",
      subtitle: "Deskripsi singkat penawaran atau destinasi baru",
      tag: "PROMO TERBARU",
      bg: "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
      link: "/explore",
      badgeBg: "bg-emerald-500 text-white",
    };
    setHomepageConfig({ ...homepageConfig, banners: [...homepageConfig.banners, newBanner] });
  }

  function updateBannerItem(index, field, val) {
    const banners = [...homepageConfig.banners];
    banners[index][field] = val;
    setHomepageConfig({ ...homepageConfig, banners });
  }

  function removeBannerItem(index) {
    const banners = homepageConfig.banners.filter((_, i) => i !== index);
    setHomepageConfig({ ...homepageConfig, banners });
  }

  const [globalConfig, setGlobalConfig] = useState({
    platformName: "Trexio Adventure Marketplace",
    tagline: "Track Every Journey",
    metaTitleDefault: "Trexio — Platform Adventure & Open Trip Indonesia",
    metaDescDefault: "Marketplace petualangan outdoor, open trip gunung, rental gear, dan komunitas outdoor.",
    enforceSsl: true,
    cdnCaching: true,
    allowTenantCustomDomain: true,
    defaultTemplateId: "Adventure Classic",
    securityHeaderUpgradeInsecure: true,
  });

  const [tenants, setTenants] = useState([]);

  const [templates, setTemplates] = useState([
    { id: "tmpl-1", name: "Adventure Classic", price: "Gratis", category: "Open Trip", usage: 48, active: true },
    { id: "tmpl-2", name: "Mountain Explorer", price: "Gratis", category: "Pendakian", usage: 32, active: true },
    { id: "tmpl-3", name: "Expedition Theme", price: "Rp 199.000", category: "Outdoor", usage: 19, active: true },
  ]);

  function toggleTenantStatus(id) {
    setTenants(
      tenants.map((t) => {
        if (t.id === id) {
          const next = t.status === "active" ? "suspended" : "active";
          toast.info(`Status website tenant "${t.name}" diubah menjadi ${next.toUpperCase()}`);
          return { ...t, status: next };
        }
        return t;
      })
    );
  }

  function toggleTemplateStatus(id) {
    setTemplates(
      templates.map((t) => {
        if (t.id === id) {
          const next = !t.active;
          toast.success(`Template "${t.name}" ${next ? "diaktifkan" : "dinonaktifkan"} untuk tenant`);
          return { ...t, active: next };
        }
        return t;
      })
    );
  }

  function handleSaveGlobalSettings(e) {
    e.preventDefault();
    setSavingGlobal(true);
    setTimeout(() => {
      setSavingGlobal(false);
      toast.success("Global Website & Platform Settings berhasil disimpan!");
    }, 400);
  }

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-black/40 border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown size={14} weight="fill" />
            <span>Platform Owner Visual Website Builder</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white">Visual Home Page & Branding Engine</h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Ubah konten, tata letak posisi block, logo, icon, SEO metadata, tagline, serta promo banner halaman depan (Home) tanpa menyentuh kode.
          </p>
        </div>

        {activeTab === "builder" && (
          <button
            onClick={handlePublishHomepage}
            disabled={savingBuilder}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 text-xs font-black shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <FloppyDisk size={18} weight="bold" />
            <span>{savingBuilder ? "Memublikasikan..." : "Publikasikan Live Ke Website"}</span>
          </button>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-white/10 gap-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab("builder")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "builder"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Layout size={16} weight="bold" /> Website Home Builder
        </button>
        <button
          onClick={() => setActiveTab("storefronts")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "storefronts"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Storefront size={16} /> Daftar Storefront Tenant
        </button>
        <button
          onClick={() => setActiveTab("templates")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "templates"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Palette size={16} /> Master Templates ({templates.length})
        </button>
        <button
          onClick={() => setActiveTab("global_settings")}
          className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 flex items-center gap-2 cursor-pointer shrink-0 ${
            activeTab === "global_settings"
              ? "border-amber-400 text-amber-400"
              : "border-transparent text-neutral-400 hover:text-white"
          }`}
        >
          <Sliders size={16} /> Platform SEO & Domain Config
        </button>
      </div>

      {/* TAB 0: VISUAL HOMEPAGE BUILDER */}
      {activeTab === "builder" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT EDITOR FORM (7 COLS) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 1. BRANDING & IDENTITAS */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Mountains size={18} className="text-amber-400" /> Identitas Platform, Logo & Tagline
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Nama Brand Platform</label>
                  <input
                    type="text"
                    value={homepageConfig.branding.platformName}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        branding: { ...homepageConfig.branding, platformName: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Tagline Utama</label>
                  <input
                    type="text"
                    value={homepageConfig.branding.tagline}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        branding: { ...homepageConfig.branding, tagline: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* UPLOAD FILE LOGO BRAND & UPLOAD FILE ICON BRAND */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <ImageFileUpload
                  label="Upload File Logo Brand (PNG / SVG / JPG)"
                  value={homepageConfig.branding.logoUrl}
                  onChange={(url) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      branding: { ...homepageConfig.branding, logoUrl: url },
                    })
                  }
                  helpText="File gambar logo transparan disarankan (Max 8MB)"
                  previewHeight="h-16"
                />

                <ImageFileUpload
                  label="Upload File Icon Brand / Favicon"
                  value={homepageConfig.branding.faviconUrl}
                  onChange={(url) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      branding: { ...homepageConfig.branding, faviconUrl: url },
                    })
                  }
                  helpText="File gambar icon / favicon persegi (Max 8MB)"
                  previewHeight="h-16"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Preset Icon (Jika tidak upload file icon)</label>
                <select
                  value={homepageConfig.branding.logoIcon}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      branding: { ...homepageConfig.branding, logoIcon: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  <option value="Mountains">Mountains (Gunung)</option>
                  <option value="Compass">Compass (Kompas)</option>
                  <option value="Sparkle">Sparkle (Bintang)</option>
                  <option value="Globe">Globe (Dunia)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Deskripsi Platform Singkat</label>
                <textarea
                  rows={2}
                  value={homepageConfig.branding.description}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      branding: { ...homepageConfig.branding, description: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            {/* 2. SEO META CONFIG */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Globe size={18} className="text-sky-400" /> SEO Metadata & Search Engine Indexing
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">SEO Title Page (`&lt;title&gt;`)</label>
                  <input
                    type="text"
                    value={homepageConfig.seo.metaTitle}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        seo: { ...homepageConfig.seo, metaTitle: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Meta Description Search Engine</label>
                  <textarea
                    rows={2}
                    value={homepageConfig.seo.metaDescription}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        seo: { ...homepageConfig.seo, metaDescription: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Target Meta Keywords (Pisahkan Koma)</label>
                  <input
                    type="text"
                    value={homepageConfig.seo.keywords}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        seo: { ...homepageConfig.seo, keywords: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-mono text-amber-300"
                  />
                </div>
              </div>
            </div>

            {/* 3. HERO BANNER EDITOR */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Sparkle size={18} className="text-emerald-400" /> Hero Section Banner & Search Widget
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Badge Text Atas</label>
                  <input
                    type="text"
                    value={homepageConfig.hero.badgeText}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        hero: { ...homepageConfig.hero, badgeText: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Headline Utama (Main Title)</label>
                  <input
                    type="text"
                    value={homepageConfig.hero.titleMain}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        hero: { ...homepageConfig.hero, titleMain: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Headline Highlight Gradient</label>
                  <input
                    type="text"
                    value={homepageConfig.hero.titleGradient}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        hero: { ...homepageConfig.hero, titleGradient: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-emerald-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Placeholder Input Pencarian</label>
                  <input
                    type="text"
                    value={homepageConfig.hero.searchPlaceholder}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        hero: { ...homepageConfig.hero, searchPlaceholder: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              {/* UPLOAD FILE BACKGROUND IMAGE COVER HERO */}
              <ImageFileUpload
                label="Upload File Background Image Cover Hero Banner"
                value={homepageConfig.hero.bgImageUrl}
                onChange={(url) =>
                  setHomepageConfig({
                    ...homepageConfig,
                    hero: { ...homepageConfig.hero, bgImageUrl: url },
                  })
                }
                helpText="Pilih file foto lanskap resolusi tinggi dari perangkat Anda (JPG, WEBP, PNG - Max 8MB)"
                previewHeight="h-28"
              />

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Subtitle Subheading Hero</label>
                <textarea
                  rows={2}
                  value={homepageConfig.hero.subtitle}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      hero: { ...homepageConfig.hero, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>
            </div>

            {/* 4. PROMOTIONAL BANNER CAROUSEL SLIDER EDITOR */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Images size={18} className="text-amber-400" /> Promo Banner Carousel Slider (Homepage PWA)
                </h3>
                <button
                  type="button"
                  onClick={addBannerItem}
                  className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 text-xs font-bold border border-amber-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Tambah Banner
                </button>
              </div>

              <div className="space-y-4">
                {homepageConfig.banners.map((banner, index) => (
                  <div key={banner.id || index} className="p-3.5 bg-neutral-900 border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-mono text-amber-400 font-extrabold">Slide Banner #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeBannerItem(index)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-300 block mb-1">Judul Promo Slide</label>
                        <input
                          type="text"
                          value={banner.title}
                          onChange={(e) => updateBannerItem(index, "title", e.target.value)}
                          placeholder="Judul Banner..."
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-300 block mb-1">Badge Tag Promo</label>
                        <input
                          type="text"
                          value={banner.tag}
                          onChange={(e) => updateBannerItem(index, "tag", e.target.value)}
                          placeholder="PROMO DISKON..."
                          className="w-full bg-black/50 border border-white/10 text-amber-300 rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="font-bold text-neutral-300 block mb-1 text-xs">Subtitle Deskripsi Promo</label>
                      <input
                        type="text"
                        value={banner.subtitle}
                        onChange={(e) => updateBannerItem(index, "subtitle", e.target.value)}
                        placeholder="Deskripsi promo..."
                        className="w-full bg-black/50 border border-white/10 text-neutral-200 rounded-lg px-2.5 py-1.5 text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="font-bold text-neutral-300 block mb-1">Target Link Navigation (`/link`)</label>
                        <input
                          type="text"
                          value={banner.link}
                          onChange={(e) => updateBannerItem(index, "link", e.target.value)}
                          placeholder="/explore"
                          className="w-full bg-black/50 border border-white/10 text-emerald-300 font-mono rounded-lg px-2.5 py-1.5 text-xs"
                        />
                      </div>

                      <div>
                        <label className="font-bold text-neutral-300 block mb-1">Warna Badge Tag</label>
                        <select
                          value={banner.badgeBg || "bg-amber-500 text-slate-950"}
                          onChange={(e) => updateBannerItem(index, "badgeBg", e.target.value)}
                          className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
                        >
                          <option value="bg-amber-500 text-slate-950">Amber Gold (Kuning Diskon)</option>
                          <option value="bg-emerald-500 text-white">Emerald Green (Hijau Terverifikasi)</option>
                          <option value="bg-blue-500 text-white">Blue Ocean (Biru Service)</option>
                          <option value="bg-purple-700 text-white">Purple Exclusive (Ungu Mitra)</option>
                          <option value="bg-rose-500 text-white">Rose Red (Merah Hot Deal)</option>
                        </select>
                      </div>
                    </div>

                    <ImageFileUpload
                      label="Upload File Background Image Cover Banner"
                      value={banner.bg}
                      onChange={(url) => updateBannerItem(index, "bg", url)}
                      helpText="Foto lanskap resolusi tinggi (1200x600 px)"
                      previewHeight="h-20"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 5. BECOME PARTNER BANNER CONFIG */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Storefront size={18} className="text-emerald-400" /> Banner Vendor Onboarding ("Jadi Mitra Trexio")
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Badge Tag Section</label>
                  <input
                    type="text"
                    value={homepageConfig.becomePartner?.badge || "JADI MITRA TREXIO"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        becomePartner: { ...homepageConfig.becomePartner, badge: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-emerald-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Judul Headline Banner</label>
                  <input
                    type="text"
                    value={homepageConfig.becomePartner?.title || "Tawarkan Layanan Petualangan Anda"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        becomePartner: { ...homepageConfig.becomePartner, title: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Subtitle Penjelasan Penawaran</label>
                <textarea
                  rows={2}
                  value={homepageConfig.becomePartner?.subtitle || "Bergabunglah sebagai Open Trip Organizer..."}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      becomePartner: { ...homepageConfig.becomePartner, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Label Tombol Pendaftaran</label>
                  <input
                    type="text"
                    value={homepageConfig.becomePartner?.buttonText || "Daftar Sebagai Mitra Sekarang"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        becomePartner: { ...homepageConfig.becomePartner, buttonText: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Link Target Tombol</label>
                  <input
                    type="text"
                    value={homepageConfig.becomePartner?.buttonLink || "/partner/register"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        becomePartner: { ...homepageConfig.becomePartner, buttonLink: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-amber-300 font-mono rounded-xl px-3 py-2 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* 6. PWA INSTALL APP BANNER CONFIG */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <DownloadSimple size={18} className="text-sky-400" /> Section Mobile PWA App Download Banner
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Judul Header App PWA</label>
                  <input
                    type="text"
                    value={homepageConfig.pwaInstall?.title || "Install Trexio PWA App"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        pwaInstall: { ...homepageConfig.pwaInstall, title: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Badge Tag Subheader</label>
                  <input
                    type="text"
                    value={homepageConfig.pwaInstall?.badge || "Mobile First"}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        pwaInstall: { ...homepageConfig.pwaInstall, badge: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-sky-300 rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Subtitle Deskripsi PWA</label>
                <textarea
                  rows={2}
                  value={homepageConfig.pwaInstall?.subtitle || "Akses Trexio lebih cepat langsung dari layar utama smartphone Anda."}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      pwaInstall: { ...homepageConfig.pwaInstall, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Label Tombol Install</label>
                <input
                  type="text"
                  value={homepageConfig.pwaInstall?.buttonText || "Install Trexio App"}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      pwaInstall: { ...homepageConfig.pwaInstall, buttonText: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>
            </div>

            {/* 7. SUSUNAN REORDER & POSISI BLOK KONTEN */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Layout size={18} className="text-purple-400" /> Rearrange Posisi & Visibilitas Block Halaman
                </h3>
                <span className="text-[11px] text-neutral-400">Atur urutan dari atas ke bawah</span>
              </div>

              <div className="space-y-2">
                {homepageConfig.sections.map((sec, idx) => (
                  <div
                    key={sec.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      sec.enabled
                        ? "bg-neutral-900 border-white/15 text-white"
                        : "bg-neutral-900/40 border-white/5 text-neutral-500 opacity-60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-6 w-6 rounded-full bg-white/10 flex items-center justify-center font-mono text-[10px] font-bold text-neutral-300">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-xs">{sec.name}</div>
                        <div className="text-[10px] font-mono text-neutral-400">ID: {sec.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveSectionUp(idx)}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 disabled:opacity-20 cursor-pointer"
                        title="Geser Ke Atas"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveSectionDown(idx)}
                        disabled={idx === homepageConfig.sections.length - 1}
                        className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-neutral-300 disabled:opacity-20 cursor-pointer"
                        title="Geser Ke Bawah"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleSectionEnabled(idx)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-extrabold flex items-center gap-1 cursor-pointer ml-2 ${
                          sec.enabled
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        }`}
                      >
                        {sec.enabled ? <Eye size={12} /> : <EyeSlash size={12} />}
                        <span>{sec.enabled ? "Tampil" : "Sembunyi"}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 8. FAQ EDITOR */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                  <Question size={18} className="text-indigo-400" /> FAQ (Pertanyaan Sering Diajukan)
                </h3>
                <button
                  type="button"
                  onClick={addFaqItem}
                  className="px-3 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 text-xs font-bold border border-indigo-500/30 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={14} /> Tambah FAQ
                </button>
              </div>

              <div className="space-y-3">
                {homepageConfig.faq.items.map((item, index) => (
                  <div key={index} className="p-3 bg-neutral-900 border border-white/10 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-indigo-400 font-bold">Item #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaqItem(index)}
                        className="text-rose-400 hover:text-rose-300 p-1 cursor-pointer"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    <input
                      type="text"
                      value={item.q}
                      onChange={(e) => updateFaqItem(index, "q", e.target.value)}
                      placeholder="Pertanyaan..."
                      className="w-full bg-black/50 border border-white/10 text-white rounded-lg px-2.5 py-1.5 text-xs font-bold"
                    />
                    <textarea
                      rows={2}
                      value={item.a}
                      onChange={(e) => updateFaqItem(index, "a", e.target.value)}
                      placeholder="Jawaban..."
                      className="w-full bg-black/50 border border-white/10 text-neutral-300 rounded-lg p-2.5 text-xs"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* 9. CTA BANNER EDITOR */}
            <div className="bg-black/40 border border-white/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2 border-b border-white/10 pb-3">
                <Megaphone size={18} className="text-amber-400" /> Bottom Call to Action (CTA) Banner
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Judul Banner CTA</label>
                  <input
                    type="text"
                    value={homepageConfig.ctaBanner.title}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        ctaBanner: { ...homepageConfig.ctaBanner, title: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="font-bold text-neutral-300 block mb-1">Label Tombol CTA</label>
                  <input
                    type="text"
                    value={homepageConfig.ctaBanner.buttonText}
                    onChange={(e) =>
                      setHomepageConfig({
                        ...homepageConfig,
                        ctaBanner: { ...homepageConfig.ctaBanner, buttonText: e.target.value },
                      })
                    }
                    className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-neutral-300 block mb-1 text-xs">Subtitle Deskripsi CTA</label>
                <textarea
                  rows={2}
                  value={homepageConfig.ctaBanner.subtitle}
                  onChange={(e) =>
                    setHomepageConfig({
                      ...homepageConfig,
                      ctaBanner: { ...homepageConfig.ctaBanner, subtitle: e.target.value },
                    })
                  }
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>
            </div>
          </div>

          {/* RIGHT LIVE INTERACTIVE PREVIEW (5 COLS) */}
          <div className="lg:col-span-5 sticky top-24 space-y-4">
            <div className="bg-neutral-900 border border-white/15 rounded-2xl p-4 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="font-extrabold text-xs text-white">Live Visual Marketplace PWA Preview</span>
                </div>

                <div className="flex items-center bg-black/60 p-1 rounded-lg border border-white/10">
                  <button
                    onClick={() => setPreviewDevice("desktop")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                      previewDevice === "desktop" ? "bg-emerald-500 text-black" : "text-neutral-400"
                    }`}
                  >
                    <Desktop size={14} /> Desktop
                  </button>
                  <button
                    onClick={() => setPreviewDevice("mobile")}
                    className={`px-2.5 py-1 rounded-md text-[10px] font-bold flex items-center gap-1 cursor-pointer ${
                      previewDevice === "mobile" ? "bg-emerald-500 text-black" : "text-neutral-400"
                    }`}
                  >
                    <DeviceMobile size={14} /> Mobile
                  </button>
                </div>
              </div>

              {/* SIMULATED DEVICE FRAME */}
              <div
                className={`mx-auto transition-all overflow-hidden border border-white/20 rounded-xl shadow-inner bg-slate-950 text-slate-100 ${
                  previewDevice === "mobile" ? "max-w-[320px] text-[11px]" : "w-full text-xs"
                }`}
              >
                {/* Simulated Header Bar */}
                <div className="bg-slate-900 px-3 py-2 border-b border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 shrink-0">
                    {homepageConfig.branding.logoUrl ? (
                      <img src={homepageConfig.branding.logoUrl} alt="Logo" className="h-5 object-contain" />
                    ) : (
                      <div className="h-6 w-6 rounded-lg bg-emerald-500 flex items-center justify-center font-black text-black text-xs shadow-xs">
                        T
                      </div>
                    )}
                    <div>
                      <span className="font-black text-white text-xs block leading-none">{homepageConfig.branding.platformName}</span>
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest block">{homepageConfig.branding.tagline || "Marketplace PWA"}</span>
                    </div>
                  </div>
                  <div className="bg-slate-800 px-2.5 py-1 rounded-full border border-white/10 text-[9px] text-slate-400 flex items-center gap-1 min-w-0 flex-1 max-w-[140px]">
                    <MagnifyingGlass size={10} />
                    <span className="truncate">{homepageConfig.hero.searchPlaceholder}</span>
                  </div>
                </div>

                {/* Render Sections dynamically according to sectionOrder */}
                <div className="max-h-[500px] overflow-y-auto space-y-3.5 p-3 font-sans">
                  {homepageConfig.sections
                    .filter((s) => s.enabled)
                    .map((sec) => {
                      if (sec.id === "hero_banners") {
                        const topBanner = homepageConfig.banners?.[0] || {
                          title: "Open Trip Bromo 3D2N",
                          subtitle: "Sunrise Bromo Jeep 4x4",
                          tag: "PROMO DISKON 20%",
                          bg: "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                          badgeBg: "bg-amber-500 text-slate-950",
                        };
                        return (
                          <div
                            key={sec.id}
                            className="relative rounded-2xl overflow-hidden p-3.5 text-left bg-slate-900 border border-white/10 space-y-1.5 shadow-md"
                            style={{
                              backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.4)), url(${topBanner.bg})`,
                              backgroundSize: "cover",
                            }}
                          >
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider ${topBanner.badgeBg || "bg-amber-500 text-slate-950"}`}>
                              {topBanner.tag}
                            </span>
                            <h4 className="font-black text-xs text-white leading-tight line-clamp-1">
                              {topBanner.title}
                            </h4>
                            <p className="text-[9px] text-slate-300 line-clamp-1">
                              {topBanner.subtitle}
                            </p>
                            <div className="pt-1">
                              <span className="bg-emerald-600 text-white font-black text-[9px] px-2.5 py-1 rounded-lg inline-block">
                                Jelajahi Sekarang →
                              </span>
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "categories_grid") {
                        return (
                          <div key={sec.id} className="bg-slate-900/80 p-2.5 rounded-2xl border border-white/10 space-y-2">
                            <div className="font-bold text-[10px] text-white flex items-center justify-between">
                              <span className="flex items-center gap-1"><GridFour size={12} className="text-emerald-400" /> 12 Kategori Layanan</span>
                              <span className="text-[8px] text-emerald-400">Lihat Semua →</span>
                            </div>
                            <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 text-[8px] text-center">
                              <div className="bg-emerald-600/30 border border-emerald-500/40 p-1.5 rounded-xl text-emerald-300 font-extrabold truncate">🔥 Open Trip</div>
                              <div className="bg-slate-800 p-1.5 rounded-xl text-slate-200 font-bold truncate">⛰️ Private Trip</div>
                              <div className="bg-slate-800 p-1.5 rounded-xl text-slate-200 font-bold truncate">👨‍🌾 Guide APGI</div>
                              <div className="bg-slate-800 p-1.5 rounded-xl text-slate-200 font-bold truncate">🎒 Porter</div>
                              <div className="bg-slate-800 p-1.5 rounded-xl text-slate-200 font-bold truncate">🏕️ Sewa Alat</div>
                              <div className="bg-slate-800 p-1.5 rounded-xl text-slate-200 font-bold truncate">🏡 Basecamp</div>
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "best_trips" || sec.id === "open_trips" || sec.id === "private_trips") {
                        return (
                          <div key={sec.id} className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/10 space-y-2">
                            <div className="font-extrabold text-[10px] text-white flex items-center justify-between">
                              <span>{sec.name}</span>
                              <span className="text-[8px] text-emerald-400">Katalog →</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="bg-slate-800 rounded-xl p-2 border border-white/5 space-y-1">
                                <div className="h-12 bg-slate-700 rounded-lg overflow-hidden relative">
                                  <span className="absolute top-1 left-1 bg-black/70 text-[7px] text-white px-1 rounded font-bold">⭐ 4.9</span>
                                </div>
                                <div className="font-bold text-[9px] text-white truncate">Trip Pendakian Rinjani</div>
                                <div className="text-[8px] text-emerald-400 font-black">Rp 1.850.000</div>
                              </div>
                              <div className="bg-slate-800 rounded-xl p-2 border border-white/5 space-y-1">
                                <div className="h-12 bg-slate-700 rounded-lg overflow-hidden relative">
                                  <span className="absolute top-1 left-1 bg-black/70 text-[7px] text-white px-1 rounded font-bold">⭐ 4.8</span>
                                </div>
                                <div className="font-bold text-[9px] text-white truncate">Open Trip Bromo</div>
                                <div className="text-[8px] text-emerald-400 font-black">Rp 450.000</div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "guides_apgi" || sec.id === "porters_logistics") {
                        return (
                          <div key={sec.id} className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/10 space-y-1.5">
                            <div className="font-extrabold text-[10px] text-emerald-400">
                              ✓ {sec.name}
                            </div>
                            <div className="bg-slate-800 p-2 rounded-xl flex items-center gap-2 border border-white/5">
                              <div className="w-8 h-8 rounded-full bg-emerald-600/40 flex items-center justify-center text-[10px] font-bold">
                                👨‍🌾
                              </div>
                              <div>
                                <div className="font-extrabold text-[9px] text-white">Guide APGI Terlisensi</div>
                                <div className="text-[8px] text-slate-400">Verified BNSP · Rp 350rb/hari</div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "basecamps" || sec.id === "rental_gear") {
                        return (
                          <div key={sec.id} className="bg-slate-900/60 p-2.5 rounded-2xl border border-white/10 space-y-1.5">
                            <div className="font-extrabold text-[10px] text-white">{sec.name}</div>
                            <div className="grid grid-cols-2 gap-1.5 text-[8px]">
                              <div className="bg-slate-800 p-1.5 rounded-xl border border-white/5">
                                <div className="font-bold text-slate-200">Basecamp Celo</div>
                                <div className="text-emerald-400 font-mono">Rp 25.000/pax</div>
                              </div>
                              <div className="bg-slate-800 p-1.5 rounded-xl border border-white/5">
                                <div className="font-bold text-slate-200">Tenda Dome 4P</div>
                                <div className="text-emerald-400 font-mono">Rp 45.000/hari</div>
                              </div>
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "become_partner") {
                        return (
                          <div key={sec.id} className="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 p-3 rounded-2xl border border-emerald-500/40 space-y-1 text-center">
                            <span className="text-[7px] bg-emerald-400/20 text-emerald-300 px-2 py-0.5 rounded-full font-black uppercase">
                              {homepageConfig.becomePartner?.badge || "JADI MITRA TREXIO"}
                            </span>
                            <div className="font-black text-[10px] text-white line-clamp-1">
                              {homepageConfig.becomePartner?.title || "Tawarkan Layanan Anda"}
                            </div>
                            <button className="bg-amber-400 text-slate-950 font-black text-[8px] px-2.5 py-1 rounded-lg">
                              {homepageConfig.becomePartner?.buttonText || "Daftar Sebagai Mitra"}
                            </button>
                          </div>
                        );
                      }

                      if (sec.id === "pwa_install") {
                        return (
                          <div key={sec.id} className="bg-slate-900 p-3 rounded-2xl border border-white/10 space-y-1.5 flex items-center justify-between">
                            <div>
                              <div className="font-black text-[10px] text-white flex items-center gap-1">
                                <span>📱 {homepageConfig.pwaInstall?.title || "Install Trexio PWA App"}</span>
                              </div>
                              <div className="text-[8px] text-slate-400 line-clamp-1">
                                {homepageConfig.pwaInstall?.subtitle}
                              </div>
                            </div>
                            <button className="bg-emerald-600 text-white font-bold text-[8px] px-2.5 py-1 rounded-lg shrink-0">
                              {homepageConfig.pwaInstall?.buttonText || "Install"}
                            </button>
                          </div>
                        );
                      }

                      if (sec.id === "faq") {
                        return (
                          <div key={sec.id} className="bg-slate-900/80 p-2.5 rounded-2xl border border-white/10 space-y-1.5">
                            <div className="font-bold text-[10px] text-white">{homepageConfig.faq.title}</div>
                            <div className="space-y-1">
                              {homepageConfig.faq.items.slice(0, 2).map((fq, i) => (
                                <div key={i} className="bg-slate-800/60 p-1.5 rounded-xl text-[8px]">
                                  <div className="font-bold text-emerald-300">Q: {fq.q}</div>
                                  <div className="text-slate-400 line-clamp-1">{fq.a}</div>
                                </div>
                              ))}
                            </div>
                          </div>
                        );
                      }

                      if (sec.id === "cta_banner") {
                        return (
                          <div key={sec.id} className="bg-gradient-to-r from-emerald-900 to-teal-950 p-3 rounded-2xl border border-emerald-500/40 text-center space-y-1">
                            <div className="font-extrabold text-[10px] text-white">{homepageConfig.ctaBanner.title}</div>
                            <div className="text-[8px] text-emerald-200 line-clamp-1">{homepageConfig.ctaBanner.subtitle}</div>
                            <button className="px-2.5 py-1 bg-emerald-400 text-slate-950 font-black text-[8px] rounded-lg">
                              {homepageConfig.ctaBanner.buttonText}
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div key={sec.id} className="bg-slate-900/40 p-2 rounded-xl border border-white/5 text-[9px] text-slate-400 flex items-center justify-between">
                          <span>Block Section: <strong>{sec.name}</strong></span>
                          <span className="text-[8px] font-mono text-emerald-400">OK</span>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 1: STOREFRONTS */}
      {activeTab === "storefronts" && (
        <div className="bg-black/40 border border-white/10 rounded-2xl overflow-hidden shadow-xl space-y-4 p-5">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Storefront size={18} className="text-amber-400" />
            <span>Daftar Storefront & Custom Domain Tenant</span>
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 border-b border-white/10 font-extrabold uppercase text-neutral-400 tracking-wider text-[10px]">
                <tr>
                  <th className="p-3">Nama Tenant</th>
                  <th className="p-3">Subdomain</th>
                  <th className="p-3">Custom Domain</th>
                  <th className="p-3">Template Active</th>
                  <th className="p-3">SaaS Plan</th>
                  <th className="p-3">Storage CDN</th>
                  <th className="p-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {tenants.map((t) => (
                  <tr key={t.id} className="hover:bg-white/5 transition-colors">
                    <td className="p-3 font-bold text-white">{t.name}</td>
                    <td className="p-3 font-mono text-neutral-300">{t.subdomain}</td>
                    <td className="p-3 font-mono text-amber-300">{t.customDomain}</td>
                    <td className="p-3 text-neutral-300">{t.template}</td>
                    <td className="p-3 font-semibold text-emerald-400">{t.plan}</td>
                    <td className="p-3 font-mono text-neutral-400">{t.storageUsed}</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => toggleTenantStatus(t.id)}
                        className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase transition-all cursor-pointer ${
                          t.status === "active"
                            ? "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30"
                            : "bg-red-500/20 text-red-300 hover:bg-red-500/30 border border-red-500/30"
                        }`}
                      >
                        {t.status}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MASTER TEMPLATES */}
      {activeTab === "templates" && (
        <div className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
              <Palette size={18} className="text-indigo-400" /> Kelola Master Preset Templates Platform
            </h3>
            <span className="text-xs text-neutral-400">
              Template yang diaktifkan di sini akan tersedia di Page Builder Tenant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {templates.map((tmpl) => (
              <div
                key={tmpl.id}
                className={`p-4 rounded-xl border transition-all ${
                  tmpl.active
                    ? "bg-neutral-900 border-white/15"
                    : "bg-neutral-900/40 border-white/5 opacity-50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-extrabold text-white text-sm">{tmpl.name}</div>
                    <div className="text-[10px] text-neutral-400 font-mono">
                      Kategori: {tmpl.category} · {tmpl.usage} Tenant Digunakan
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {tmpl.price}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    {tmpl.active ? "Tersedia untuk Tenant" : "Non-Aktif (Hidden)"}
                  </span>
                  <button
                    onClick={() => toggleTemplateStatus(tmpl.id)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold cursor-pointer transition-all ${
                      tmpl.active
                        ? "bg-rose-500/20 text-rose-300 hover:bg-rose-500/30"
                        : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30"
                    }`}
                  >
                    {tmpl.active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: GLOBAL WEBSITE SETTINGS */}
      {activeTab === "global_settings" && (
        <form onSubmit={handleSaveGlobalSettings} className="bg-black/40 border border-white/10 rounded-2xl p-6 space-y-6 text-xs">
          <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
            <Sliders size={18} className="text-amber-400" /> Pengaturan Global Website Platform
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="font-bold text-white block mb-1">Nama Identitas Platform</label>
                <input
                  type="text"
                  value={globalConfig.platformName}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, platformName: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Tagline Global</label>
                <input
                  type="text"
                  value={globalConfig.tagline}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, tagline: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Default Template Baru</label>
                <select
                  value={globalConfig.defaultTemplateId}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, defaultTemplateId: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs font-bold"
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.name}>
                      {t.name} ({t.category})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="font-bold text-white block mb-1">Default Title Meta SEO Global</label>
                <input
                  type="text"
                  value={globalConfig.metaTitleDefault}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, metaTitleDefault: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl px-3 py-2 text-xs"
                />
              </div>

              <div>
                <label className="font-bold text-white block mb-1">Default Meta Description SEO</label>
                <textarea
                  rows={3}
                  value={globalConfig.metaDescDefault}
                  onChange={(e) => setGlobalConfig({ ...globalConfig, metaDescDefault: e.target.value })}
                  className="w-full bg-neutral-900 border border-white/15 text-white rounded-xl p-3 text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

