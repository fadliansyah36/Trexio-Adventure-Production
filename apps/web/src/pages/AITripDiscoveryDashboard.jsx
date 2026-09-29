import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import SEO from "@/components/site/SEO";
import { Button } from "@/components/ui/button";
import { useCompare } from "@/context/CompareContext";
import { toast } from "sonner";
import {
  Sparkle,
  Compass,
  MagnifyingGlass,
  Lightbulb,
  Calendar,
  CurrencyCircleDollar,
  ShieldCheck,
  CheckCircle,
  MapPin,
  SlidersHorizontal,
  ArrowRight,
  Star,
  UserCheck,
  Package,
  Scales,
  X,
  ShareNetwork,
  Share,
  UsersThree,
} from "@phosphor-icons/react";

const PROMPT_PRESETS = [
  {
    label: "⛰️ Pendakian Pemula Gunung Prau",
    prompt: "Saya pendaki pemula ingin naik Gunung Prau 2D1N bersama 2 teman, budget 1 juta per orang include tenda & guide.",
    category: "Gunung",
  },
  {
    label: "🌅 Bromo Sunrise & Jeep 4x4",
    prompt: "Open trip Bromo sunrise keberangkatan Malang/Surabaya 1 hari budget hemat include jeep, dokumentasi, & tiket.",
    category: "Open Trip",
  },
  {
    label: "⛵ Sailing Komodo 3D2N VIP",
    prompt: "Private trip Sailing Komodo Liveaboard 3 hari 2 malam untuk 4 orang dengan fasilitas kamar AC & alat snorkeling.",
    category: "Sailing",
  },
  {
    label: "⛺ Family Camping & Leisure Bogor",
    prompt: "Rekomendasi tempat camping keluarga ramah anak di Bogor dengan fasiltas toilet bersih, listrik, & sewa alat outdoor lengkap.",
    category: "Camping Ground",
  },
  {
    label: "🔥 Kawah Ijen Blue Fire",
    prompt: "Trip Kawah Ijen 2D1N nonton Blue Fire & Kawah Hijau include pendaftaran simaksi, porter, & sewa masker gas.",
    category: "Gunung",
  },
];

const DIFFICULTY_COLOR = {
  Pemula: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  Menengah: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  Sulit: "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/30",
  Ekstrem: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30",
};

export default function AITripDiscoveryDashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { addTrip, isInCompare } = useCompare();

  const initialQuery = searchParams.get("q") || searchParams.get("prompt") || "Pendakian pemula Gunung Prau 2D1N budget 1 juta include tenda & guide";
  const [promptInput, setPromptInput] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [discoveryData, setDiscoveryData] = useState(null);
  
  // Interactive filters & view options
  const [selectedDifficulty, setSelectedDifficulty] = useState("Semua");
  const [maxBudget, setMaxBudget] = useState(20000000);
  const [sortBy, setSortBy] = useState("match"); // 'match' | 'price_asc' | 'price_desc' | 'rating'

  useEffect(() => {
    if (!discoveryData) {
      const qToRun = initialQuery || promptInput || "Pendakian pemula Gunung Prau 2D1N budget 1 juta include tenda & guide";
      handleRunAIDiscovery(qToRun);
    }
  }, []);

  const handleRunAIDiscovery = async (queryText = promptInput) => {
    const cleanQ = (queryText || "").trim();
    if (!cleanQ) {
      toast.error("Mohon ketik kriteria atau rencana petualangan Anda.");
      return;
    }

    setPromptInput(cleanQ);
    setLoading(true);
    try {
      // Sync URL query
      setSearchParams({ q: cleanQ });

      const res = await api.post("/search/discovery", { query: cleanQ });
      if (res && res.data) {
        setDiscoveryData(res.data);
        toast.success("Rencana petualangan AI berhasil dihasilkan!");
      } else {
        toast.error("Gagal mendapatkan rekomendasi AI.");
      }
    } catch (err) {
      console.error("[AIDiscoveryDashboard] Error running discovery:", err);
      toast.error("Gagal menghubungi AI Discovery Engine.");
    } finally {
      setLoading(false);
    }
  };

  // Filter & Sort Logic
  const rawItems = discoveryData?.results || discoveryData?.items || [];
  const filteredItems = rawItems.filter((item) => {
    if (selectedDifficulty !== "Semua" && (item.difficulty || "").toLowerCase() !== selectedDifficulty.toLowerCase()) {
      return false;
    }
    if (item.price && Number(item.price) > maxBudget) {
      return false;
    }
    return true;
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (sortBy === "price_asc") return (a.price || 0) - (b.price || 0);
    if (sortBy === "price_desc") return (b.price || 0) - (a.price || 0);
    if (sortBy === "rating") return ((b.meta?.rating || b.rating || 5) - (a.meta?.rating || a.rating || 5));
    // Default: Match score
    return (b.search_score || 0) - (a.search_score || 0);
  });

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-foreground pb-20">
      <SEO
        title="AI Trip Discovery Dashboard — Trexio Smart Travel Planner"
        description="Rencanakan petualangan kustom Anda dengan kecerdasan AI. Dapatkan rekomendasi trip outdoor terverifikasi lengkap dengan estimasi harga, fasilitas, & timeline aktivitas."
      />

      {/* HERO DASHBOARD HEADER */}
      <section className="relative overflow-hidden bg-gradient-to-b from-slate-900 via-zinc-900 to-slate-950 text-white pt-12 pb-16 border-b border-zinc-800">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.15),transparent_50%)] pointer-events-none" />
        
        <div className="trx-container relative z-10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-2 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <Sparkle size={16} weight="fill" className="animate-spin text-emerald-400" />
                <span>AI Trip Discovery Workspace</span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Rencanakan Petualangan Kustom dengan AI
              </h1>
              <p className="text-sm text-zinc-300 leading-relaxed">
                Ketik kriteria liburan yang Anda harapkan. Sistem AI Trexio menganalisis anggaran, tingkat kesulitan, fasilitas, dan mencocokkannya dengan inventaris terverifikasi secara langsung.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-2xl p-3 backdrop-blur-md shrink-0">
              <ShieldCheck size={32} className="text-emerald-400 shrink-0" />
              <div className="text-xs">
                <div className="font-bold text-white">Grounded Inventory Matching</div>
                <div className="text-[11px] text-zinc-400">Garansi Penyelenggara & Kuota Resmi</div>
              </div>
            </div>
          </div>

          {/* AI QUERY INPUT BOX */}
          <div className="bg-zinc-900/90 border border-emerald-500/40 rounded-3xl p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-emerald-400 flex items-center justify-between">
                <span>Tulis Preferensi Petualangan Anda (Natural Language)</span>
                <span className="text-[10px] text-zinc-400 font-normal">Contoh: Budget, Lokasi, Durasi, Jumlah Orang</span>
              </label>

              <div className="relative">
                <textarea
                  rows={3}
                  value={promptInput}
                  onChange={(e) => setPromptInput(e.target.value)}
                  placeholder="Contoh: Saya pemula mau mendaki gunung 2 hari di Jawa Tengah bersama 3 teman, budget 1 juta per orang, termasuk peralatan tenda & guide..."
                  className="w-full p-4 rounded-2xl bg-slate-950 border border-zinc-700/80 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all resize-none shadow-inner"
                />
                {promptInput && (
                  <button
                    type="button"
                    onClick={() => setPromptInput("")}
                    className="absolute right-3 top-3 p-1 rounded-full hover:bg-zinc-800 text-zinc-400 hover:text-white"
                    title="Bersihkan input"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* PRESET CHIPS */}
            <div className="space-y-2">
              <div className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5">
                <Lightbulb size={14} className="text-amber-400" />
                <span>Inspirasi Prompt Cepat:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {PROMPT_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setPromptInput(preset.prompt);
                      handleRunAIDiscovery(preset.prompt);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-emerald-500/20 text-xs font-semibold text-zinc-200 border border-white/10 hover:border-emerald-500/40 transition-all flex items-center gap-1.5"
                  >
                    <span>{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BAR */}
            <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-800">
              <div className="text-xs text-zinc-400 flex items-center gap-2">
                <Compass size={16} className="text-emerald-400" />
                <span>Didukung Gemini 3.6 & Multi-Factor Ranking</span>
              </div>

              <Button
                onClick={() => handleRunAIDiscovery(promptInput)}
                disabled={loading || !promptInput.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-6 py-3 rounded-2xl shadow-lg shadow-emerald-600/30 flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>AI Menganalisis & Menyusun Itinerary...</span>
                  </>
                ) : (
                  <>
                    <Sparkle size={18} weight="fill" />
                    <span>Hasilkan Rencana Petualangan AI</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* DASHBOARD CONTENT BODY */}
      <section className="trx-container pt-8 space-y-8">
        {/* AI INSIGHTS & RECOMMENDATION SUMMARY CARD */}
        {discoveryData && (
          <div className="bg-gradient-to-r from-emerald-950/40 via-zinc-900 to-emerald-950/30 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-emerald-500/20 pb-4">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkle size={20} weight="fill" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Analisis Kriteria & Strategi Petualangan AI
                  </h3>
                  <p className="text-xs text-zinc-400">
                    Hasil pencarian terenkapsulasi dengan inventaris riil TREXIO
                  </p>
                </div>
              </div>

              {/* INTENT TAGS */}
              {discoveryData.intent_extracted && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {discoveryData.intent_extracted.destination && (
                    <span className="text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                      <MapPin size={12} /> {discoveryData.intent_extracted.destination}
                    </span>
                  )}
                  {discoveryData.intent_extracted.intent && (
                    <span className="text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30 px-2.5 py-1 rounded-lg">
                      Mode: {discoveryData.intent_extracted.intent}
                    </span>
                  )}
                  {discoveryData.intent_extracted.max_price && (
                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2.5 py-1 rounded-lg">
                      Maks. {formatRupiah(discoveryData.intent_extracted.max_price)}
                    </span>
                  )}
                </div>
              )}
            </div>

            <p className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-medium">
              {discoveryData.ai_summary || discoveryData.discovery_summary}
            </p>

            {/* TIPS LIST */}
            {(discoveryData.recommendation_tips || discoveryData.recommended_tips) && (
              <div className="bg-slate-950/60 rounded-2xl p-4 border border-white/5 space-y-2">
                <div className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                  <Lightbulb size={16} />
                  <span>Petunjuk Keselamatan & Persiapan Rekomendasi AI:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-zinc-300">
                  {(discoveryData.recommendation_tips || discoveryData.recommended_tips).map((tip, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle size={14} className="text-emerald-400 shrink-0 mt-0.5" />
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* CONTROLS BAR: FILTERS & SORT */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4 shadow-sm">
          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-slate-700 dark:text-zinc-300 flex items-center gap-1.5">
              <SlidersHorizontal size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span>Filter Hasil:</span>
            </div>

            {/* Difficulty Filter */}
            <div className="flex items-center gap-1">
              {["Semua", "Pemula", "Menengah", "Sulit"].map((diff) => (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedDifficulty === diff
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 hover:bg-slate-200"
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="text-xs font-bold text-slate-700 dark:text-zinc-300">
              Urutkan:
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-slate-100 dark:bg-zinc-800 border border-slate-300 dark:border-zinc-700 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
            >
              <option value="match">🌟 Skor AI Match Tertinggi</option>
              <option value="price_asc">💵 Harga Termurah</option>
              <option value="price_desc">💎 Harga Termahal</option>
              <option value="rating">⭐ Rating Tertinggi</option>
            </select>
          </div>
        </div>

        {/* RESULTS GRID / CARDS */}
        {loading ? (
          <div className="py-20 text-center space-y-4">
            <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Sedang Menyusun Rencana Petualangan Terbaik...
              </h3>
              <p className="text-xs text-muted-foreground">
                Mengintegrasikan kriteria Anda dengan ribuan inventaris trip terverifikasi TREXIO.
              </p>
            </div>
          </div>
        ) : sortedItems.length > 0 ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between text-xs font-bold text-muted-foreground">
              <span>Menampilkan {sortedItems.length} Paket Petualangan Rekomendasi AI</span>
              <span>Diperbarui Real-time</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedItems.map((trip) => {
                const matchScore = trip.search_score ? Math.min(99, Math.max(82, Math.round(trip.search_score * 100))) : 95;
                const rating = trip.meta?.rating || trip.rating || 4.9;
                const inCompare = isInCompare(trip.id);
                const isRental =
                  trip.type === "rental" ||
                  Boolean(trip.price_per_day) ||
                  (typeof trip.category === "string" &&
                    (trip.category.toLowerCase().includes("rental") ||
                      trip.category.toLowerCase().includes("sewa") ||
                      trip.category.toLowerCase().includes("gear")));

                const bookingLink = isRental ? `/rental/${trip.id}` : `/booking/${trip.id}`;
                const detailLink = isRental ? `/rental/${trip.id}` : `/trip/${trip.id}`;

                return (
                  <div
                    key={trip.id}
                    className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                  >
                    <div>
                      {/* CARD COVER IMAGE HEADER */}
                      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-zinc-800">
                        <img
                          src={trip.cover_image || trip.image || "https://images.pexels.com/photos/1687514/pexels-photo-1687514.jpeg"}
                          alt={trip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                        {/* MATCH SCORE BADGE */}
                        <div className="absolute top-3 left-3 bg-slate-950/90 text-emerald-400 border border-emerald-500/40 px-3 py-1 rounded-full text-[11px] font-black flex items-center gap-1 shadow-lg backdrop-blur-md">
                          <Sparkle size={12} weight="fill" />
                          <span>{matchScore}% AI Match</span>
                        </div>

                        {/* DIFFICULTY BADGE */}
                        {trip.difficulty && (
                          <div className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border backdrop-blur-md ${DIFFICULTY_COLOR[trip.difficulty] || "bg-zinc-900/80 text-white border-zinc-700"}`}>
                            {trip.difficulty}
                          </div>
                        )}

                        {/* LOCATION & DURATION OVERLAY */}
                        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs font-medium">
                          <div className="flex items-center gap-1 truncate font-bold drop-shadow-md">
                            <MapPin size={14} className="text-emerald-400 shrink-0" />
                            <span className="truncate">{trip.destination || trip.region || "Indonesia"}</span>
                          </div>

                          <div className="bg-black/60 px-2 py-0.5 rounded-md text-[10px] font-mono font-bold text-zinc-200 backdrop-blur-xs shrink-0">
                            {trip.duration || (isRental ? "Sewa Per Hari" : "2D1N")}
                          </div>
                        </div>
                      </div>

                      {/* CARD CONTENT BODY */}
                      <div className="p-5 space-y-4">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                              {trip.category || (isRental ? "Sewa Alat Outdoor" : "Open Trip")}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] font-extrabold text-amber-500">
                              <Star size={12} weight="fill" />
                              <span>{rating}</span>
                              <span className="text-muted-foreground font-normal">
                                ({trip.meta?.review_count || 12})
                              </span>
                            </div>
                          </div>

                          <h3 className="text-base font-extrabold text-slate-900 dark:text-white line-clamp-2 leading-snug">
                            {trip.title}
                          </h3>

                          {trip.vendor_name && (
                            <div className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                              <UserCheck size={14} className="text-blue-500" />
                              <span>By: {trip.vendor_name}</span>
                            </div>
                          )}
                        </div>

                        {/* CLEAR PRICING & QUOTA BLOCK */}
                        <div className="bg-slate-50 dark:bg-zinc-950/80 p-3.5 rounded-2xl border border-slate-200/80 dark:border-zinc-800 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                            <span>{isRental ? "Harga Sewa Terverifikasi" : "Harga Paket Terverifikasi"}</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-mono font-black">
                              {isRental
                                ? `${trip.seats_left || trip.stock || 10} Unit Tersedia`
                                : `${trip.available_quota ?? trip.seats_left ?? 8} Slot Tersisa`}
                            </span>
                          </div>

                          <div className="flex items-baseline justify-between gap-2">
                            <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                              {formatRupiah(trip.price || 0)}
                              <span className="text-[11px] text-muted-foreground font-normal ml-1">
                                {isRental ? "/ hari" : "/ orang"}
                              </span>
                            </div>

                            {trip.original_price && trip.original_price > trip.price && (
                              <div className="text-xs text-muted-foreground line-through font-mono">
                                {formatRupiah(trip.original_price)}
                              </div>
                            )}
                          </div>

                          <div className="flex flex-wrap gap-1.5 pt-0.5">
                            {isRental ? (
                              <>
                                <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                  <CheckCircle size={10} className="text-emerald-500" /> Siap Ambil / Kirim
                                </span>
                                <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                                  ✓ Alat Terawat & Bersih
                                </span>
                              </>
                            ) : (
                              <>
                                {trip.simaksi_included && (
                                  <span className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                                    <CheckCircle size={10} className="text-emerald-500" /> Free Simaksi
                                  </span>
                                )}
                                <span className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded font-bold">
                                  ✓ All-Inclusive
                                </span>
                                <span className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-300 px-2 py-0.5 rounded font-bold">
                                  ✓ Garansi Kuota
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        {/* MEETING POINT & LOCATION */}
                        {trip.meeting_point && (
                          <div className="text-xs bg-slate-100 dark:bg-zinc-800/80 p-2.5 rounded-xl border border-slate-200/60 dark:border-zinc-700/50 space-y-0.5">
                            <div className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 flex items-center gap-1">
                              <MapPin size={12} className="text-emerald-500" />
                              <span>{isRental ? "Lokasi Pickup / Basecamp:" : "Meeting Point Utama:"}</span>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {trip.meeting_point}
                            </div>
                          </div>
                        )}

                        {/* INCLUDED HIGHLIGHTS */}
                        <div className="space-y-1 text-xs text-slate-600 dark:text-zinc-300">
                          <div className="font-bold text-[11px] text-slate-900 dark:text-zinc-200">
                            {isRental ? "Layanan & Fasilitas Alat:" : "Fasilitas Termasuk Vendor:"}
                          </div>
                          <div className="flex flex-wrap gap-1 text-[11px]">
                            {(Array.isArray(trip.included) && trip.included.length > 0
                              ? trip.included.slice(0, 4)
                              : (isRental ? ["Kondisi Prima", "Sanitasi Steril", "Petunjuk Penggunaan", "Bisa COD Basecamp"] : ["Tiket Simaksi", "Guide Terlisensi", "Tenda & Logistik", "Makan Selama Trip"])
                            ).map((inc, i) => (
                              <span key={i} className="inline-flex items-center gap-1 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded text-[10px] font-medium text-slate-700 dark:text-zinc-300">
                                <CheckCircle size={10} className="text-emerald-500" /> {inc}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* VENDOR BATCH KEBERANGKATAN */}
                        {!isRental && (
                          <div className="space-y-1.5 text-xs text-slate-600 dark:text-zinc-300">
                            <div className="font-bold text-[11px] text-slate-900 dark:text-zinc-200 flex items-center gap-1.5">
                              <Calendar size={14} className="text-emerald-500" />
                              <span>Batch Keberangkatan Tersedia:</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5 text-[11px]">
                              {Array.isArray(trip.departure_dates) && trip.departure_dates.length > 0 ? (
                                <>
                                  {trip.departure_dates.slice(0, 4).map((dStr, idx) => (
                                    <span key={idx} className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                                      <CheckCircle size={10} className="text-emerald-500" />
                                      {typeof dStr === 'object' ? (dStr.date || dStr.label || JSON.stringify(dStr)) : String(dStr)}
                                    </span>
                                  ))}
                                  {trip.departure_dates.length > 4 && (
                                    <span className="bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400 px-2 py-1 rounded-lg text-[10px] font-bold">
                                      +{trip.departure_dates.length - 4} Batch
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="inline-flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                                  <CheckCircle size={10} className="text-emerald-500" /> Batch Setiap Weekend (Open Registration)
                                </span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* CARD FOOTER ACTIONS */}
                    <div className="p-5 pt-0 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* BOOK NOW PRIMARY ACTION */}
                        <Link to={bookingLink} className="col-span-2">
                          <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 rounded-2xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all">
                            {isRental ? <Package size={16} weight="bold" /> : <Compass size={16} weight="bold" />}
                            <span>{isRental ? "Sewa Sekarang (Book Gear)" : "Pesan Sekarang (Book Now)"}</span>
                          </Button>
                        </Link>

                        {/* SECONDARY DETAIL BUTTON */}
                        <Link to={detailLink} className="w-full">
                          <Button variant="outline" className="w-full text-xs font-bold rounded-xl h-10 border-slate-300 dark:border-zinc-700">
                            Detail {isRental ? "Peralatan" : "Paket"}
                          </Button>
                        </Link>

                        {/* COMPARE BUTTON */}
                        <Button
                          variant="ghost"
                          onClick={() => {
                            addTrip(trip);
                            toast.success(`Menambahkan ${trip.title} ke perbandingan.`);
                          }}
                          className={`w-full text-xs font-bold rounded-xl h-10 border ${
                            inCompare
                              ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/40"
                              : "border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400"
                          }`}
                        >
                          <Scales size={14} className="mr-1" />
                          <span>{inCompare ? "Tersimpan" : "Bandingkan"}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8 space-y-4 shadow-sm">
            <Compass size={48} className="mx-auto text-emerald-500 animate-bounce" />
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Belum Ada Hasil Yang Cocok Persis
              </h3>
              <p className="text-xs text-muted-foreground max-w-md mx-auto">
                Coba sederhanakan kata kunci atau pilih salah satu preset inspirasi kriteria pendakian & petualangan di atas.
              </p>
            </div>
            <Button
              onClick={() => {
                setPromptInput("Pendakian pemula Gunung Prau 2D1N budget 1 juta");
                handleRunAIDiscovery("Pendakian pemula Gunung Prau 2D1N budget 1 juta");
              }}
              className="bg-emerald-600 text-white font-bold text-xs px-5 py-2.5 rounded-xl"
            >
              Coba Contoh Prompt Rekomendasi
            </Button>
          </div>
        )}
      </section>
    </div>
  );
}
