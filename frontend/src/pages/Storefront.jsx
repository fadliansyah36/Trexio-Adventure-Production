import { useEffect, useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatRupiah, safeArray } from "@/lib/api";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import SEO from "@/components/site/SEO";
import {
  Storefront as StoreIcon,
  MapPin,
  Globe,
  Package,
  ArrowLeft,
  Star,
  ShieldCheck,
  CheckCircle,
  Users,
  IdentificationCard,
  Medal,
  ShareNetwork,
  MagnifyingGlass,
  Funnel,
  CalendarBlank,
  Compass,
  ChatTeardropText,
  Copy,
  Briefcase,
  Check,
} from "@phosphor-icons/react";

const TYPE_LABEL = {
  organizer: "Open Trip Organizer",
  guide: "Pemandu / Guide APGI",
  merchant: "Merchant Peralatan",
  rental: "Sewa Alat Outdoor",
  community: "Komunitas Pendaki",
  event_org: "Event Organizer",
};

export default function Storefront() {
  const params = useParams();
  const rawHandle = params.handle || params.vendorSlug || params.identifier || params["*"] || "";
  const slug = rawHandle.replace(/^@/, "").replace(/^vendor\//, "").replace(/\/$/, "");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Product Filter States
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all"); // 'all' | 'trip' | 'rental'
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("popular"); // 'popular' | 'price_low' | 'price_high' | 'rating'

  useEffect(() => {
    if (!slug) {
      setError("Slug vendor tidak valid");
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    api.get(`/public/vendors/${encodeURIComponent(slug)}`)
      .then((r) => {
        setData(r.data);
      })
      .catch((e) => {
        setError(e?.response?.status === 404 ? "Storefront vendor tidak ditemukan" : "Gagal memuat data storefront");
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    toast.success("Link Storefront berhasil disalin!", {
      description: "Bagikan link ini ke calon peserta & pelanggan.",
    });
  };

  const filteredProducts = useMemo(() => {
    if (!data?.products) return [];
    let list = [...data.products];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          (p.title || p.name || "").toLowerCase().includes(q) ||
          (p.destination || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q)
      );
    }

    if (selectedType !== "all") {
      list = list.filter((p) => p.product_type === selectedType);
    }

    if (selectedCategory !== "all") {
      list = list.filter(
        (p) => (p.category || "").toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    if (sortBy === "price_low") {
      list.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
    } else if (sortBy === "price_high") {
      list.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
    } else if (sortBy === "rating") {
      list.sort((a, b) => (Number(b.rating) || 5) - (Number(a.rating) || 5));
    }

    return list;
  }, [data?.products, searchQuery, selectedType, selectedCategory, sortBy]);

  const categories = useMemo(() => {
    if (!data?.products) return [];
    const set = new Set();
    data.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [data?.products]);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-bold text-muted-foreground">Memuat Official Storefront Mitra...</p>
      </div>
    );
  }

  if (error || !data?.vendor) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4 max-w-md mx-auto">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
          <StoreIcon size={36} />
        </div>
        <h1 className="text-2xl font-black text-foreground">Storefront Tidak Tersedia</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error || "Storefront vendor tidak ditemukan di TREXIO."}</p>
        <Link
          to="/explore"
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2.5 text-xs font-bold transition-all shadow-md"
        >
          <ArrowLeft size={16} /> Kembali Jelajahi Trip & Vendor
        </Link>
      </div>
    );
  }

  const { vendor, reviews = [] } = data;
  const isVerified = vendor.verified || vendor.status === "verified";

  return (
    <div className="min-h-screen bg-background pb-20" data-testid="storefront-page">
      <SEO
        title={`${vendor.brand_name} — Official Storefront TREXIO`}
        description={vendor.tagline || vendor.description || `Profil resmi dan katalog perjalanan outdoor ${vendor.brand_name} di TREXIO Outdoor Marketplace.`}
        image={vendor.logo || vendor.cover_image}
        keywords={`${vendor.brand_name}, mitra open trip, sewa alat outdoor, guide apgi, trexio`}
      />

      {/* HERO BANNER & COVER */}
      <div className="relative h-56 sm:h-72 md:h-88 bg-slate-900 overflow-hidden">
        {vendor.cover_image ? (
          <img
            src={vendor.cover_image}
            alt={vendor.brand_name}
            className="w-full h-full object-cover opacity-80"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-emerald-900 via-slate-900 to-emerald-950 opacity-90" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-black/40 to-black/20" />

        {/* Top Back & Share Navigation */}
        <div className="absolute top-4 left-4 right-4 max-w-7xl mx-auto flex items-center justify-between z-10">
          <Link
            to="/explore"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md px-3.5 py-2 text-xs font-bold transition-all border border-white/20"
          >
            <ArrowLeft size={16} /> Explore
          </Link>
          <button
            onClick={copyShareLink}
            data-testid="storefront-share-btn"
            className="inline-flex items-center gap-1.5 rounded-xl bg-slate-950/70 hover:bg-slate-900 text-white backdrop-blur-md px-3.5 py-2 text-xs font-bold transition-all border border-white/20 cursor-pointer"
          >
            <ShareNetwork size={16} /> Bagikan Storefront
          </button>
        </div>
      </div>

      {/* HEADER BRAND & PROFILE OVERLAP */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 sm:-mt-24 relative z-20">
        <div className="bg-card border border-border/80 rounded-3xl p-5 sm:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-background border-4 border-card shadow-xl overflow-hidden flex items-center justify-center shrink-0"
                data-testid="storefront-logo"
              >
                {vendor.logo ? (
                  <img src={vendor.logo} alt={vendor.brand_name} className="w-full h-full object-cover" />
                ) : (
                  <StoreIcon size={48} className="text-emerald-500" />
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center flex-wrap gap-2.5">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-foreground" data-testid="storefront-brand">
                    {vendor.brand_name}
                  </h1>
                  <VendorVerifiedBadge
                    verified={isVerified}
                    status={vendor.status}
                    showUnverified={true}
                    dataTestId="storefront-verified-badge"
                  />
                </div>

                {vendor.tagline && (
                  <p className="text-sm sm:text-base font-semibold text-emerald-600 dark:text-emerald-400">
                    {vendor.tagline}
                  </p>
                )}

                <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1 font-medium">
                    <MapPin size={14} className="text-emerald-500" />
                    {vendor.public_address || vendor.city || "Indonesia"}
                  </span>
                  {vendor.website && (
                    <a
                      href={vendor.website.startsWith("http") ? vendor.website : `https://${vendor.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1 hover:text-emerald-500 hover:underline transition-colors"
                    >
                      <Globe size={14} className="text-blue-500" /> {vendor.website.replace(/^https?:\/\//, "")}
                    </a>
                  )}
                  <span className="font-mono text-muted-foreground/80">@{vendor.slug}</span>
                </div>
              </div>
            </div>

            {/* Quick Action & Contact */}
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              <button
                onClick={copyShareLink}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-3 text-xs font-extrabold transition-all shadow-md cursor-pointer"
              >
                <ShareNetwork size={16} /> Bagikan
              </button>
            </div>
          </div>

          {/* SERVICE CATEGORIES BADGES */}
          {safeArray(vendor.types).length > 0 && (
            <div className="mt-6 pt-5 border-t border-border flex flex-wrap gap-2 items-center">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-2">
                Layanan Mitra:
              </span>
              {safeArray(vendor.types).map((t) => (
                <span
                  key={t}
                  data-testid={`storefront-type-${t}`}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-3 py-1 text-xs font-bold"
                >
                  <Check size={12} weight="bold" /> {TYPE_LABEL[t] || t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* STATS STRIP & METRICS */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <StatCard
            icon={Star}
            iconColor="text-amber-500"
            label="Rating & Ulasan"
            value={`${vendor.rating || 5.0}`}
            subtext={`${vendor.review_count || 0} ulasan pendaki`}
          />
          <StatCard
            icon={Package}
            iconColor="text-emerald-500"
            label="Katalog Produk"
            value={`${vendor.product_count || 0}`}
            subtext={`${vendor.trip_count || 0} Trip • ${vendor.rental_count || 0} Alat`}
          />
          <StatCard
            icon={Users}
            iconColor="text-blue-500"
            label="Tim Guide APGI/BNSP"
            value={`${vendor.guide_count || 0}`}
            subtext="Pemandu terlisensi"
          />
          <StatCard
            icon={Briefcase}
            iconColor="text-purple-500"
            label="Porter Logistik"
            value={`${vendor.porter_count || 0}`}
            subtext="Tim pendukung tim"
          />
          <StatCard
            icon={Medal}
            iconColor="text-amber-600"
            label="Sertifikasi Resmi"
            value={`${(vendor.certifications || []).length || 2}`}
            subtext="Tersertifikasi BNSP/APGI"
          />
          <StatCard
            icon={CheckCircle}
            iconColor="text-teal-500"
            label="Trip Selesai"
            value={`${vendor.completed_service_count || 0}`}
            subtext="Pengalaman tervisit"
          />
        </div>

        {/* STOREFRONT CONTENT TABS / SECTIONS */}
        <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN COLUMN: PRODUCTS & CATALOG */}
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Compass size={22} className="text-emerald-500" /> Katalog Layanan & Trip
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pilih paket pendakian atau persewaan alat outdoor dari {vendor.brand_name}.
                  </p>
                </div>
                <div className="text-xs font-extrabold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-xl border border-emerald-500/20">
                  {filteredProducts.length} Produk Tersedia
                </div>
              </div>

              {/* SEARCH & FILTER CONTROLS */}
              <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <MagnifyingGlass size={16} className="absolute left-3.5 top-3 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Cari trip, gunung, atau alat outdoor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 text-xs rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>

                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="px-3 py-2.5 text-xs rounded-xl border border-border bg-background font-bold text-foreground focus:outline-none"
                  >
                    <option value="popular">Terpopuler</option>
                    <option value="price_low">Harga Terendah</option>
                    <option value="price_high">Harga Tertinggi</option>
                    <option value="rating">Rating Tertinggi</option>
                  </select>
                </div>

                {/* TYPE & CATEGORY CHIPS */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={() => { setSelectedType("all"); setSelectedCategory("all"); }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedType === "all" && selectedCategory === "all"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Semua ({data.products?.length || 0})
                  </button>

                  <button
                    onClick={() => setSelectedType("trip")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedType === "trip"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Open Trip ({vendor.trip_count || 0})
                  </button>

                  <button
                    onClick={() => setSelectedType("rental")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedType === "rental"
                        ? "bg-emerald-600 text-white shadow-xs"
                        : "bg-muted text-muted-foreground hover:bg-muted/80"
                    }`}
                  >
                    Sewa Alat ({vendor.rental_count || 0})
                  </button>

                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(selectedCategory === cat ? "all" : cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        selectedCategory === cat
                          ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* PRODUCTS GRID */}
              {filteredProducts.length === 0 ? (
                <div
                  className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center space-y-2"
                  data-testid="storefront-products-empty"
                >
                  <Package size={40} className="mx-auto text-muted-foreground/60" />
                  <p className="text-sm font-bold text-foreground">Tidak Ada Produk Ditemukan</p>
                  <p className="text-xs text-muted-foreground">
                    Coba sesuaikan kata kunci pencarian atau ganti filter kategori.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredProducts.map((p) => {
                    const isRental = p.product_type === "rental";
                    const targetLink = isRental ? `/rental/${p.id}` : `/trip/${p.id}`;

                    return (
                      <Link
                        key={p.id}
                        to={targetLink}
                        data-testid={`storefront-product-${p.id}`}
                        className="group bg-card rounded-2xl overflow-hidden border border-border hover:border-emerald-500/50 hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                      >
                        <div>
                          <div className="relative aspect-[16/10] bg-muted overflow-hidden">
                            {p.cover_image ? (
                              <img
                                src={p.cover_image}
                                alt={p.title || p.name}
                                loading="lazy"
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Package size={32} className="text-muted-foreground" />
                              </div>
                            )}

                            <div className="absolute top-3 left-3 flex items-center gap-1">
                              <span className="bg-slate-950/80 backdrop-blur-md text-emerald-400 font-extrabold text-[10px] px-2.5 py-1 rounded-lg uppercase tracking-wider">
                                {isRental ? "Sewa Alat" : p.category || "Open Trip"}
                              </span>
                            </div>

                            <div className="absolute bottom-2.5 left-3 text-white text-[11px] font-bold flex items-center gap-1 drop-shadow">
                              <MapPin size={12} className="text-emerald-400" />
                              {p.destination || "Basecamp Mitra"}
                            </div>
                          </div>

                          <div className="p-4 space-y-2">
                            <h3 className="font-bold text-sm text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 line-clamp-2 transition-colors">
                              {p.title || p.name}
                            </h3>

                            {p.features && Array.isArray(p.features) && (
                              <div className="flex flex-wrap gap-1">
                                {p.features.slice(0, 2).map((feat, idx) => (
                                  <span key={idx} className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                                    ✓ {feat}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="p-4 pt-0 border-t border-border/50 flex items-center justify-between mt-2">
                          <div>
                            <div className="text-[10px] font-bold text-muted-foreground uppercase">
                              {isRental ? "Harga / Hari" : "Mulai Dari"}
                            </div>
                            <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(p.price || p.price_per_day)}
                            </div>
                          </div>
                          <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-3 py-1.5 text-xs font-extrabold group-hover:bg-emerald-600 group-hover:text-white transition-all">
                            Pesan
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>

            {/* VERIFIED REVIEWS SECTION */}
            <section className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-5" data-testid="storefront-reviews-block">
              <div className="flex items-center justify-between pb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <ChatTeardropText size={22} className="text-amber-500" /> Ulasan Pendaki Terverifikasi
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Pengalaman nyata dari pendaki yang telah menyelesaikan trip dengan {vendor.brand_name}.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-black text-foreground text-sm bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-xl">
                  <Star size={16} weight="fill" className="text-amber-500" />
                  <span>{vendor.rating || 5.0} / 5.0</span>
                </div>
              </div>

              {reviews.length === 0 ? (
                <div className="p-8 text-center bg-muted/20 rounded-2xl border border-dashed border-border space-y-2">
                  <Star size={32} className="mx-auto text-amber-500/60" />
                  <p className="text-sm font-bold text-foreground">Belum Ada Ulasan Publik</p>
                  <p className="text-xs text-muted-foreground">
                    Ulasan & rating akan muncul secara otomatis setelah peserta menyelesaikan perjalanan trip.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((r) => (
                    <div key={r.id} className="p-4 rounded-2xl border border-border bg-muted/10 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center">
                            {(r.user_name || "P")[0]}
                          </div>
                          <div>
                            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
                              {r.user_name || "Pendaki Terverifikasi"}
                              <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-md font-extrabold">
                                ✓ Finisher
                              </span>
                            </div>
                            <div className="text-[10px] text-muted-foreground">
                              {new Date(r.created_at).toLocaleDateString("id-ID", { year: 'numeric', month: 'short', day: 'numeric' })}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              size={14}
                              weight={i < r.rating ? "fill" : "regular"}
                              className={i < r.rating ? "text-amber-500" : "text-muted-foreground/30"}
                            />
                          ))}
                        </div>
                      </div>

                      {r.comment && (
                        <p className="text-xs text-foreground/90 pl-10 italic">
                          "{r.comment}"
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>

          {/* SIDEBAR COLUMN: ABOUT, CERTIFICATIONS, TIM GUIDE */}
          <div className="space-y-8">
            {/* ABOUT VENDOR BLOCK */}
            <section className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4" data-testid="storefront-about-block">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <StoreIcon size={20} className="text-emerald-500" /> Tentang {vendor.brand_name}
              </h3>
              <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-line">
                {vendor.description || `${vendor.brand_name} adalah penyedia layanan pemanduan pendakian gunung dan rental peralatan outdoor profesional terverifikasi di platform TREXIO.`}
              </p>

              <div className="pt-3 border-t border-border space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Handle Publik:</span>
                  <span className="font-mono font-bold text-foreground">@{vendor.slug}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Domisili Utama:</span>
                  <span className="font-bold text-foreground">{vendor.city || vendor.public_address || "Indonesia"}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground font-medium">Bergabung Sejak:</span>
                  <span className="font-bold text-foreground">
                    {new Date(vendor.joined_at).toLocaleDateString("id-ID", { year: "numeric", month: "long" })}
                  </span>
                </div>
              </div>
            </section>

            {/* CERTIFICATIONS BLOCK */}
            <section className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4" data-testid="storefront-certifications-block">
              <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" /> Sertifikasi Usaha & Lisensi
              </h3>

              {safeArray(vendor.certifications).length === 0 ? (
                <div className="p-4 bg-muted/20 rounded-xl text-center text-xs text-muted-foreground">
                  Dokumen kelayakan usaha terverifikasi oleh tim auditor TREXIO.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {safeArray(vendor.certifications).map((cert) => (
                    <div key={cert.id} className="p-3.5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-foreground">{cert.name}</span>
                        <span className="text-[10px] font-extrabold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                          ✓ Verified
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground">Penerbit: {cert.issuing_organization}</p>
                      {cert.valid_until && (
                        <p className="text-[10px] font-mono text-muted-foreground">Berlaku s/d {cert.valid_until}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* GUIDE & PORTER ROSTER SECTION */}
            <section className="bg-card border border-border rounded-3xl p-6 shadow-xs space-y-4" data-testid="storefront-guides-block">
              <div className="flex items-center justify-between">
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <Users size={20} className="text-blue-500" /> Tim Guide APGI & Porter
                </h3>
                <span className="text-xs font-bold text-muted-foreground">
                  {safeArray(vendor.guides).length} Guide
                </span>
              </div>

              {safeArray(vendor.guides).length === 0 ? (
                <div className="p-4 bg-muted/20 rounded-xl text-center text-xs text-muted-foreground">
                  Seluruh pemandu terdaftar memegang lisensi keselamatan pendakian resmi.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {safeArray(vendor.guides).map((guide) => (
                    <div key={guide.id} className="p-3.5 rounded-2xl border border-border bg-muted/10 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 font-extrabold text-xs flex items-center justify-center shrink-0">
                          <IdentificationCard size={20} />
                        </div>
                        <div>
                          <div className="text-xs font-bold text-foreground">{guide.name}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {guide.apgi_level || "Guide Terlisensi"} • {guide.cert_type || "APGI/BNSP"}
                          </div>
                        </div>
                      </div>
                      <span className="text-[10px] font-extrabold bg-blue-500/10 text-blue-600 px-2.5 py-1 rounded-lg">
                        Terdaftar
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, iconColor, label, value, subtext }) {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-xl sm:text-2xl font-black text-foreground">{value}</div>
      <div className="text-[10px] text-muted-foreground font-medium truncate">{subtext}</div>
    </div>
  );
}
