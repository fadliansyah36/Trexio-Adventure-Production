import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import TripCard from "@/components/site/TripCard";
import SEO from "@/components/site/SEO";
import SearchBarWithAutocomplete from "@/components/site/SearchBarWithAutocomplete";
import CatalogFilterSidebar from "@/components/site/CatalogFilterSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MagnifyingGlass, Funnel, X, SlidersHorizontal, Sparkle, Compass, Lightbulb, WarningCircle } from "@phosphor-icons/react";

const CATEGORIES = [
  "Trexio Backpacker",
  "Open Trip",
  "Private Trip",
  "Guide",
  "Porter",
  "Rental Gear",
  "Basecamp",
  "Camping Ground",
  "Homestay",
  "Shuttle",
  "Transportasi",
  "Wisata Alam",
  "Event",
  "Gunung",
  "Pantai",
  "Cultural",
  "Ekspedisi"
];
const DIFFICULTIES = ["Pemula", "Menengah", "Sulit", "Ekstrem"];
const REGIONS = [
  "Jawa Timur",
  "Jawa Tengah",
  "Banten",
  "Nusa Tenggara Barat",
  "Papua Barat",
];

export default function Explore() {
  const [params, setParams] = useSearchParams();
  const [trips, setTrips] = useState([]);
  const [searchMeta, setSearchMeta] = useState(null);
  const [loading, setLoading] = useState(true);

  const q = params.get("q") || "";
  const category = params.get("category") || "";
  const region = params.get("region") || "";
  const difficulty = params.get("difficulty") || "";
  const sort = params.get("sort") || "popular";
  const minPrice = Number(params.get("min_price") || 0);
  const maxPrice = Number(params.get("max_price") || 10000000);

  const [searchInput, setSearchInput] = useState(q);
  const [priceRange, setPriceRange] = useState([minPrice, maxPrice]);
  const [showFilters, setShowFilters] = useState(false);

  // AI Trip Discovery Modal State
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryPrompt, setDiscoveryPrompt] = useState("");
  const [discoveryLoading, setDiscoveryLoading] = useState(false);
  const [discoveryResult, setDiscoveryResult] = useState(null);

  useEffect(() => {
    setLoading(true);
    const query = { smart: "true" };
    if (q) query.q = q;
    if (category) query.category = category;
    if (region) query.region = region;
    if (difficulty) query.difficulty = difficulty;
    if (sort) query.sort = sort;
    if (minPrice > 0) query.min_price = minPrice;
    if (maxPrice < 10000000) query.max_price = maxPrice;

    api.get("/search/smart", { params: query })
      .then((r) => {
        if (r.data && Array.isArray(r.data.results)) {
          setTrips(r.data.results);
          setSearchMeta({
            isZeroResultRecovery: r.data.is_zero_result_recovery,
            originalQuery: r.data.original_query,
            correctedQuery: r.data.corrected_query,
            intent: r.data.extracted_intent,
            searchTips: r.data.search_tips,
          });
        } else if (Array.isArray(r.data)) {
          setTrips(r.data);
          setSearchMeta(null);
        } else {
          setTrips([]);
          setSearchMeta(null);
        }
      })
      .catch(() => {
        // Fallback to basic endpoint if smart search fails
        api.get("/trips", { params: query })
          .then((res) => {
            setTrips(Array.isArray(res.data) ? res.data : []);
            setSearchMeta(null);
          })
          .catch(() => setTrips([]));
      })
      .finally(() => setLoading(false));
  }, [q, category, region, difficulty, sort, minPrice, maxPrice]);

  function updateParam(key, value) {
    const p = new URLSearchParams(params);
    if (value == null || value === "" || value === "all") p.delete(key);
    else p.set(key, value);
    setParams(p);
  }

  function clearAll() {
    setParams({});
    setSearchInput("");
    setPriceRange([0, 10000000]);
    setSearchMeta(null);
  }

  async function handleRunDiscovery(e) {
    if (e) e.preventDefault();
    if (!discoveryPrompt.trim()) return;

    setDiscoveryLoading(true);
    setDiscoveryResult(null);
    try {
      const res = await api.post("/search/discovery", { query: discoveryPrompt.trim() });
      if (res.data) {
        setDiscoveryResult(res.data);
      }
    } catch (err) {
      console.error("Gagal menjalankan AI Discovery", err);
    } finally {
      setDiscoveryLoading(false);
    }
  }

  return (
    <div className="pb-20 bg-slate-50/50 dark:bg-zinc-950 min-h-screen">
      <SEO
        title="Eksplorasi Trip & AI Smart Search"
        description="Cari dan temukan ribuan paket open trip, guide pendakian, sewa peralatan camping, dan homestay outdoor di seluruh Indonesia."
        keywords="eksplorasi trip, open trip indonesia, pendakian gunung, rental gear, guide pendakian, trexio"
      />
      {/* HEADER BANNER */}
      <section className="bg-gradient-to-b from-emerald-950 via-slate-900 to-slate-900 text-white pt-10 pb-14 border-b border-emerald-900/30">
        <div className="trx-container">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-semibold border border-emerald-500/30 mb-3">
                <Sparkle size={14} className="text-emerald-400" /> Marketplace Open Trip & AI Smart Search
              </div>
              <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
                Eksplorasi Semua Paket Trip
              </h1>
              <p className="mt-2 text-slate-300 text-sm sm:text-base max-w-2xl">
                Cari destinasi pendakian, trip laut, budaya, dan paket liburan terbaik dengan pencarian pintar AI.
              </p>
            </div>

            <Link
              to="/ai-discovery"
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black text-xs sm:text-sm font-extrabold shadow-lg hover:shadow-emerald-500/25 transition-all shrink-0 cursor-pointer"
            >
              <Sparkle size={18} weight="fill" />
              <span>✨ AI Trip Discovery Dashboard</span>
            </Link>
          </div>

          <div className="mt-6 max-w-2xl bg-white dark:bg-zinc-900 p-2 rounded-2xl shadow-xl border border-white/20">
            <SearchBarWithAutocomplete
              placeholder="Cari destinasi, trip, sewa alat, atau vendor (contoh: Bromo, Rinjani)..."
              onSearch={(searchTerm) => updateParam("q", searchTerm)}
            />
          </div>

          {/* Quick Category Pills */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => updateParam("category", "")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                !category
                  ? "bg-emerald-500 text-black shadow-md"
                  : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
              }`}
            >
              Semua Layanan
            </button>
            {CATEGORIES.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => updateParam("category", cat)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 ${
                  category === cat
                    ? "bg-emerald-500 text-black shadow-md"
                    : "bg-white/10 hover:bg-white/20 text-slate-200 border border-white/10"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* AI DISCOVERY MODAL */}
      {showDiscoveryModal && (
        <div className="fixed inset-0 z-[120] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-zinc-900 border border-emerald-500/40 text-white rounded-3xl p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <Sparkle size={14} weight="fill" />
                  <span>Interactive AI Discovery Engine</span>
                </div>
                <h3 className="text-xl font-black text-white">Rencanakan Petualangan Spesifik Anda</h3>
                <p className="text-xs text-zinc-400">
                  Ketik keinginan liburan Anda dalam bahasa sehari-hari (budget, durasi, jumlah anggota, lokasi).
                </p>
              </div>
              <button
                onClick={() => setShowDiscoveryModal(false)}
                className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleRunDiscovery} className="space-y-3">
              <div className="relative">
                <textarea
                  rows={3}
                  value={discoveryPrompt}
                  onChange={(e) => setDiscoveryPrompt(e.target.value)}
                  placeholder="Contoh: Saya pemula mau mendaki gunung 2 hari di Jawa Tengah bersama 3 teman, budget 1 juta per orang, termasuk peralatan tenda..."
                  className="w-full p-3.5 rounded-2xl bg-black/50 border border-white/15 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 transition-all resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Open trip Bromo murah",
                    "Pendakian Rinjani 3D2N",
                    "Sewa alat camping Bogor",
                    "Private trip Sailing Komodo"
                  ].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setDiscoveryPrompt(preset)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-[11px] text-zinc-300 border border-white/10 transition-colors"
                    >
                      {preset}
                    </button>
                  ))}
                </div>

                <Button
                  type="submit"
                  disabled={discoveryLoading || !discoveryPrompt.trim()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md shrink-0"
                >
                  {discoveryLoading ? "Menganalisis..." : "Cari dengan AI"}
                </Button>
              </div>
            </form>

            {/* Discovery Results */}
            {discoveryLoading && (
              <div className="py-12 text-center space-y-2">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
                <p className="text-xs text-zinc-400 font-medium">
                  Sistem AI Trexio sedang mengekstraksi kriteria & mencocokkan persediaan marketplace...
                </p>
              </div>
            )}

            {discoveryResult && (
              <div className="space-y-4 pt-2 border-t border-white/10">
                <div className="p-4 rounded-2xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                    <Lightbulb size={18} className="text-emerald-400" />
                    <span>Analisis AI & Rekomendasi Petualangan</span>
                  </div>
                  <p className="text-xs text-zinc-300 leading-relaxed">
                    {discoveryResult.ai_summary || discoveryResult.discovery_summary || "Berikut adalah rekomendasi trip terverifikasi yang cocok dengan kriteria Anda."}
                  </p>

                  {(discoveryResult.recommendation_tips || discoveryResult.recommended_tips) && (
                    <ul className="list-disc list-inside text-[11px] text-emerald-200/80 space-y-1 pt-1">
                      {(discoveryResult.recommendation_tips || discoveryResult.recommended_tips).map((tip, idx) => (
                        <li key={idx}>{tip}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {(discoveryResult.results || discoveryResult.items) && (discoveryResult.results || discoveryResult.items).length > 0 ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-zinc-300">
                      Ditemukan {(discoveryResult.results || discoveryResult.items).length} Pilihan Sesuai:
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-1">
                      {(discoveryResult.results || discoveryResult.items).map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setShowDiscoveryModal(false);
                            updateParam("q", item.title);
                          }}
                          className="p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer transition-all flex items-center gap-3"
                        >
                          <img
                            src={item.cover_image || "https://images.pexels.com/photos/1687514/pexels-photo-1687514.jpeg"}
                            alt={item.title}
                            className="w-14 h-14 object-cover rounded-lg shrink-0"
                          />
                          <div className="min-w-0 space-y-0.5">
                            <div className="text-xs font-bold text-white truncate">{item.title}</div>
                            <div className="text-[11px] text-emerald-400 font-extrabold">
                              {formatRupiah(item.price)}
                            </div>
                            <div className="text-[10px] text-zinc-400 truncate">{item.destination || item.region}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-xs text-zinc-400">
                    Tidak ada paket spesifik yang cocok persis. Coba longgarkan kata kunci atau ganti lokasi.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <section className="trx-container mt-8 grid grid-cols-1 lg:grid-cols-[290px_1fr] gap-8 items-start">
        {/* DESKTOP SIDEBAR FILTER */}
        <div className="hidden lg:block sticky top-24">
          <CatalogFilterSidebar
            priceRange={priceRange}
            setPriceRange={(range) => {
              setPriceRange(range);
              updateParam("min_price", range[0]);
              updateParam("max_price", range[1]);
            }}
            selectedDifficulty={difficulty || "Semua"}
            setSelectedDifficulty={(diff) => updateParam("difficulty", diff === "Semua" ? "" : diff)}
            selectedLocation={region || "Semua"}
            setSelectedLocation={(loc) => updateParam("region", loc === "Semua" ? "" : loc)}
            difficultyOptions={["Semua", ...DIFFICULTIES]}
            locationOptions={["Semua", ...REGIONS]}
            sortBy={sort === "price_asc" ? "termurah" : sort === "price_desc" ? "termahal" : "populer"}
            setSortBy={(s) => {
              if (s === "termurah") updateParam("sort", "price_asc");
              else if (s === "termahal") updateParam("sort", "price_desc");
              else updateParam("sort", "popular");
            }}
            resetFilters={clearAll}
            activeFiltersCount={
              (minPrice > 0 || maxPrice < 10000000 ? 1 : 0) +
              (difficulty ? 1 : 0) +
              (region ? 1 : 0) +
              (category ? 1 : 0)
            }
          />
        </div>

        {/* MOBILE DRAWER / OVERLAY FILTER */}
        {showFilters && (
          <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex justify-end lg:hidden animate-in fade-in duration-200">
            <div className="w-full max-w-xs sm:max-w-sm bg-background h-full overflow-y-auto p-4 pb-24 shadow-2xl">
              <CatalogFilterSidebar
                priceRange={priceRange}
                setPriceRange={(range) => {
                  setPriceRange(range);
                  updateParam("min_price", range[0]);
                  updateParam("max_price", range[1]);
                }}
                selectedDifficulty={difficulty || "Semua"}
                setSelectedDifficulty={(diff) => updateParam("difficulty", diff === "Semua" ? "" : diff)}
                selectedLocation={region || "Semua"}
                setSelectedLocation={(loc) => updateParam("region", loc === "Semua" ? "" : loc)}
                difficultyOptions={["Semua", ...DIFFICULTIES]}
                locationOptions={["Semua", ...REGIONS]}
                sortBy={sort === "price_asc" ? "termurah" : sort === "price_desc" ? "termahal" : "populer"}
                setSortBy={(s) => {
                  if (s === "termurah") updateParam("sort", "price_asc");
                  else if (s === "termahal") updateParam("sort", "price_desc");
                  else updateParam("sort", "popular");
                }}
                resetFilters={clearAll}
                activeFiltersCount={
                  (minPrice > 0 || maxPrice < 10000000 ? 1 : 0) +
                  (difficulty ? 1 : 0) +
                  (region ? 1 : 0) +
                  (category ? 1 : 0)
                }
                isCollapsed={false}
                setIsCollapsed={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}

        {/* RESULTS GRID */}
        <div>
          {/* Zero-Result Recovery Notice Banner */}
          {searchMeta?.isZeroResultRecovery && (
            <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-200 flex items-start gap-3">
              <WarningCircle size={22} className="text-amber-500 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <div className="font-extrabold text-sm">
                  Rekomendasi Alternatif Terdekat
                </div>
                <p>
                  Sistem tidak menemukan hasil yang cocok persis dengan kata kunci{" "}
                  <span className="font-bold underline">"{searchMeta.originalQuery}"</span>. Berikut adalah pilihan alternatif yang mendekati kriteria Anda.
                </p>
                {searchMeta.searchTips && (
                  <p className="text-[11px] text-amber-700 dark:text-amber-300 italic pt-1">
                    💡 Tip: {searchMeta.searchTips[0]}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
            <div className="text-xs sm:text-sm text-muted-foreground font-medium">
              Menampilkan{" "}
              <span data-testid="explore-count" className="font-extrabold text-foreground">
                {trips.length}
              </span>{" "}
              paket trip
            </div>
            <div className="flex items-center gap-2">
              <button
                className="lg:hidden inline-flex items-center gap-1.5 border border-border bg-card rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-emerald-500/10"
                onClick={() => setShowFilters(!showFilters)}
                data-testid="mobile-filter-toggle"
              >
                <SlidersHorizontal size={16} className="text-emerald-600" /> Filter
                {minPrice > 0 || maxPrice < 10000000 || difficulty || region || category ? (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-emerald-700 text-white">
                    !
                  </span>
                ) : null}
              </button>
              <Select value={sort} onValueChange={(v) => updateParam("sort", v)}>
                <SelectTrigger data-testid="sort-select" className="w-[160px] sm:w-[180px] rounded-xl text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="popular">Terpopuler</SelectItem>
                  <SelectItem value="price_asc">Termurah</SelectItem>
                  <SelectItem value="price_desc">Termahal</SelectItem>
                  <SelectItem value="newest">Terbaru</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {loading ? (
            <div className="py-20 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
              <p className="mt-3 text-xs text-muted-foreground font-medium">
                Pencarian pintar AI sedang memuat hasil...
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="mt-8 border border-dashed border-border rounded-2xl p-12 text-center bg-card">
              <div className="text-lg font-bold">Belum Ada Trip Ditemukan</div>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                Coba sesuaikan kata kunci atau atur ulang filter pencarian Anda.
              </p>
              <Button
                onClick={clearAll}
                className="mt-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl"
              >
                Reset Filter
              </Button>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-2.5 sm:gap-4 md:gap-5">
              {trips.map((t) => (
                <TripCard key={t.id} trip={t} testIdPrefix="explore-trip" />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

