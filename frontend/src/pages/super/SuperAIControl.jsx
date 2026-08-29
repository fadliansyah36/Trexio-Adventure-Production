import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import AIEvaluationDashboard from "./AIEvaluationDashboard";
import {
  Cpu,
  Brain,
  SlidersHorizontal,
  ToggleLeft,
  ToggleRight,
  CurrencyDollar,
  Lightning,
  ShieldCheck,
  FloppyDisk,
  Pulse,
  Database,
  ChartBar,
  CheckCircle,
  XCircle,
  Clock,
  Sparkle,
  Rocket,
  ListChecks,
} from "@phosphor-icons/react";

export default function SuperAIControl() {
  const [activeTab, setActiveTab] = useState("evaluation"); // Default to Evaluation & Quality tab
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [flags, setFlags] = useState({});
  const [usageSummary, setUsageSummary] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [savingFlags, setSavingFlags] = useState(false);

  // Recommendation Engine Config & Analytics States
  const [recConfig, setRecConfig] = useState({
    weights: {
      preference_match: 25,
      destination_match: 20,
      category_match: 15,
      rating_quality: 15,
      booking_popularity: 15,
      recency_boost: 10,
      vendor_quality: 10,
      cancellation_penalty: 15,
      cold_start_boost: 15,
    },
    diversity: {
      max_items_per_vendor: 2,
      enable_vendor_diversity: true,
      enable_category_diversity: true,
    },
  });
  const [savingRecConfig, setSavingRecConfig] = useState(false);

  // Phase 3 Homepage Ranking Config State
  const [homepageConfig, setHomepageConfig] = useState({
    time_decay_half_life_days: 7,
    vendor_max_per_section: 2,
    manual_curations: {
      pinned_product_ids: {},
      excluded_product_ids: [],
    },
  });
  const [savingHomepageConfig, setSavingHomepageConfig] = useState(false);

  // Phase 5 AI Smart Search Config & Analytics State
  const [searchConfig, setSearchConfig] = useState({
    weights: {
      keyword_relevance: 35,
      semantic_intent: 25,
      rating_quality: 15,
      popularity: 15,
      vendor_reputation: 10,
    },
    enable_typo_tolerance: true,
    enable_zero_result_recovery: true,
    enable_query_expansion: true,
    max_search_results: 50,
  });
  const [searchAnalytics, setSearchAnalytics] = useState(null);
  const [savingSearchConfig, setSavingSearchConfig] = useState(false);

  useEffect(() => {
    fetchAIData();
  }, []);

  async function fetchAIData() {
    setLoading(true);
    try {
      const [ovRes, flagsRes, usageRes, logsRes, recConfigRes, hpConfigRes, searchCfgRes, searchOvRes] = await Promise.all([
        api.get("/ai/super/overview").catch(() => null),
        api.get("/ai/super/flags").catch(() => null),
        api.get("/ai/super/usage?limit=50").catch(() => null),
        api.get("/ai/super/logs?limit=50").catch(() => null),
        api.get("/ai/super/recommendations/config").catch(() => null),
        api.get("/ai/super/homepage/config").catch(() => null),
        api.get("/super/ai/search/config").catch(() => null),
        api.get("/super/ai/search/overview").catch(() => null),
      ]);

      if (ovRes?.data?.overview) setOverview(ovRes.data.overview);
      if (flagsRes?.data?.flags) setFlags(flagsRes.data.flags);
      if (usageRes?.data?.summary) setUsageSummary(usageRes.data.summary);
      if (logsRes?.data?.logs) setRecentLogs(logsRes.data.logs);
      if (recConfigRes?.data?.config) setRecConfig(recConfigRes.data.config);
      if (hpConfigRes?.data?.config) setHomepageConfig(hpConfigRes.data.config);
      if (searchCfgRes?.data?.config) setSearchConfig(searchCfgRes.data.config);
      if (searchOvRes?.data?.analytics) setSearchAnalytics(searchOvRes.data.analytics);
    } catch (err) {
      toast.error("Gagal memuat data Trexio AI Control Center");
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveSearchConfig() {
    setSavingSearchConfig(true);
    try {
      const { data } = await api.post("/super/ai/search/config", searchConfig);
      toast.success(data.message || "Konfigurasi AI Smart Search berhasil disimpan!");
      if (data.config) setSearchConfig(data.config);
    } catch (err) {
      toast.error("Gagal menyimpan Konfigurasi AI Smart Search");
    } finally {
      setSavingSearchConfig(false);
    }
  }

  async function handleSaveHomepageConfig() {
    setSavingHomepageConfig(true);
    try {
      const { data } = await api.patch("/ai/super/homepage/config", homepageConfig);
      toast.success(data.message || "Konfigurasi Perangkingan Beranda AI berhasil disimpan!");
      if (data.config) setHomepageConfig(data.config);
    } catch (err) {
      toast.error("Gagal menyimpan Konfigurasi Beranda AI");
    } finally {
      setSavingHomepageConfig(false);
    }
  }

  function handleToggleFlag(key) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSaveFlags() {
    setSavingFlags(true);
    try {
      const { data } = await api.patch("/ai/super/flags", flags);
      toast.success(data.message || "Fitur AI berhasil disimpan!");
      if (data.flags) setFlags(data.flags);
    } catch (err) {
      toast.error("Gagal memperbarui AI Feature Flags");
    } finally {
      setSavingFlags(false);
    }
  }

  async function handleSaveRecConfig() {
    setSavingRecConfig(true);
    try {
      const { data } = await api.patch("/ai/super/recommendations/config", recConfig);
      toast.success(data.message || "Bobot Rekomendasi AI berhasil disimpan!");
      if (data.config) setRecConfig(data.config);
    } catch (err) {
      toast.error("Gagal menyimpan Bobot Rekomendasi AI");
    } finally {
      setSavingRecConfig(false);
    }
  }

  const flagMetadata = [
    { key: "AI_RECOMMENDATION", name: "AI Recommendation Engine", desc: "Rekomendasi trip & gear terpersonalisasi untuk traveler" },
    { key: "AI_HOMEPAGE", name: "AI Homepage Ranking", desc: "Sistem perangkingan dinamis untuk trip populer di beranda" },
    { key: "AI_SEARCH", name: "AI Smart Search & Discovery", desc: "Pencarian semantik & rekomendasi berdasarkan preferensi" },
    { key: "AI_ASSISTANT", name: "Trexio AI Assistant", desc: "Asisten virtual untuk rekomendasi dan bantuan petualangan" },
    { key: "AI_VENDOR_RANKING", name: "AI Vendor Quality Scoring", desc: "Skoring kualitas vendor berdasarkan review & tingkat pembatalan" },
    { key: "AI_SAFETY", name: "AI Safety & Content Guard", desc: "Filter keselamatan dan moderasi ulasan/deskripsi otomatis" },
    { key: "AI_FRAUD", name: "AI Fraud & Anomaly Detection", desc: "Deteksi transaksi mencurigakan & klaim garansi abnormal" },
    { key: "AI_ANALYTICS", name: "AI Marketplace Intelligence", desc: "Analitik tren permintaan trip & optimasi stok gear rental" },
  ];

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-emerald-950/40 to-neutral-900 border border-emerald-500/30 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Cpu size={14} weight="fill" />
            <span>Trexio AI Architecture Engine</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Centralized Trexio AI Control Center
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Pusat manajemen AI Foundation, pemantauan konsumsi token, estimasi biaya, audit keamanan data, serta kontrol runtime feature flags.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchAIData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <Pulse size={16} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleSaveFlags}
            disabled={savingFlags}
            className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{savingFlags ? "Menyimpan..." : "Simpan AI Flags"}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("evaluation")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "evaluation"
              ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
              : "bg-white/5 hover:bg-white/10 text-neutral-400"
          }`}
        >
          <ShieldCheck size={18} weight="fill" />
          <span>AI Evaluation, Quality & Observability</span>
        </button>
        <button
          onClick={() => setActiveTab("control")}
          className={`px-4 py-2.5 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === "control"
              ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
              : "bg-white/5 hover:bg-white/10 text-neutral-400"
          }`}
        >
          <SlidersHorizontal size={18} weight="fill" />
          <span>AI Feature Flags & Algorithm Tuning</span>
        </button>
      </div>

      {activeTab === "evaluation" ? (
        <AIEvaluationDashboard />
      ) : (
        <>
          {/* KPI & Status Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Provider Status */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>AI Provider Health</span>
            <Pulse size={18} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`h-3 w-3 rounded-full ${
                overview?.status === "operational" ? "bg-emerald-400 animate-pulse" : "bg-amber-400"
              }`}
            />
            <span className="text-lg font-black text-white capitalize">
              {overview?.status === "operational" ? "Operational (Gemini)" : "Degraded / Fallback"}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Model: <span className="font-mono text-emerald-300 font-bold">gemini-3.6-flash</span>
          </div>
        </div>

        {/* Card 2: Total Requests */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Total Operational Requests</span>
            <Brain size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {usageSummary?.total_requests || 0} <span className="text-xs text-neutral-500 font-normal">reqs</span>
          </div>
          <div className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
            <CheckCircle size={13} />
            <span>{usageSummary?.success_rate_percent || 100}% Tingkat Keberhasilan</span>
          </div>
        </div>

        {/* Card 3: Token Consumption */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Konsumsi Token AI</span>
            <ChartBar size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {((usageSummary?.total_tokens || 0) / 1000).toFixed(1)}k <span className="text-xs text-neutral-500 font-normal">tokens</span>
          </div>
          <div className="text-[11px] text-neutral-400">
            In: {(usageSummary?.total_input_tokens || 0).toLocaleString()} | Out: {(usageSummary?.total_output_tokens || 0).toLocaleString()}
          </div>
        </div>

        {/* Card 4: Estimated Cost */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Estimasi Biaya USD</span>
            <CurrencyDollar size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400">
            ${(usageSummary?.total_estimated_cost_usd || 0).toFixed(4)}
          </div>
          <div className="text-[11px] text-neutral-400">
            Avg Latency: <span className="text-white font-bold">{usageSummary?.avg_latency_ms || 0}ms</span>
          </div>
        </div>
      </div>

      {/* AI Homepage Ranking Configuration Section */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Rocket size={18} className="text-emerald-400" /> AI Homepage Ranking & Content Decay
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Atur peluruhan waktu (time-decay), keberagaman vendor beranda, dan kurasi manual produk marketplace.
            </p>
          </div>
          <button
            onClick={handleSaveHomepageConfig}
            disabled={savingHomepageConfig}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{savingHomepageConfig ? "Menyimpan..." : "Simpan Ranking Beranda"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Time Decay Half Life */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Time Decay Half-Life</span>
              <span className="text-emerald-400 font-mono font-black">{homepageConfig.time_decay_half_life_days || 7} Hari</span>
            </div>
            <input
              type="range"
              min="1"
              max="30"
              value={homepageConfig.time_decay_half_life_days || 7}
              onChange={(e) =>
                setHomepageConfig((prev) => ({
                  ...prev,
                  time_decay_half_life_days: Number(e.target.value),
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Kecepatan peluruhan tren lama (aktivitas baru memiliki bobot lebih tinggi).</p>
          </div>

          {/* Max Items per Vendor in Homepage Section */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Batas Produk per Vendor / Section</span>
              <span className="text-blue-400 font-mono font-black">{homepageConfig.vendor_max_per_section || 2} Produk</span>
            </div>
            <input
              type="number"
              min="1"
              max="5"
              value={homepageConfig.vendor_max_per_section || 2}
              onChange={(e) =>
                setHomepageConfig((prev) => ({
                  ...prev,
                  vendor_max_per_section: Number(e.target.value),
                }))
              }
              className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-white"
            />
            <p className="text-[10px] text-neutral-400">Mencegah dominasi 1 vendor pada seksi Best Trip & High Demand.</p>
          </div>

          {/* Organic / Sponsored Separation Badge */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2 flex flex-col justify-between">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Aturan Iklan Terpisah</span>
              <span className="text-emerald-400 text-[10px] font-black uppercase px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">ACTIVE</span>
            </div>
            <p className="text-[10px] text-neutral-400">Product Iklan/Sponsor ditempatkan pada slot khusus tanpa merusak skor organik.</p>
          </div>
        </div>
      </div>

      {/* AI Smart Search & Trip Discovery Engine Section */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Sparkle size={18} className="text-emerald-400" weight="fill" /> AI Smart Search & Trip Discovery Engine
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Atur bobot perankingan search (keyword, semantic, quality, popularity), fitur typo tolerance, dan zero-result recovery.
            </p>
          </div>
          <button
            onClick={handleSaveSearchConfig}
            disabled={savingSearchConfig}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{savingSearchConfig ? "Menyimpan..." : "Simpan Bobot Search AI"}</span>
          </button>
        </div>

        {/* Analytics Snapshot Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-white/5 p-3 rounded-xl border border-white/10 text-xs">
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono">Total Search Engine Queries</div>
            <div className="text-base font-black text-white">{searchAnalytics?.total_searches || 0}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono">Semantic Intent Extractions</div>
            <div className="text-base font-black text-emerald-400">{searchAnalytics?.semantic_intent_extractions || 0}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono">Typo Corrections Triggered</div>
            <div className="text-base font-black text-amber-400">{searchAnalytics?.typo_corrections || 0}</div>
          </div>
          <div>
            <div className="text-[10px] text-neutral-400 uppercase font-mono">Zero-Result Recoveries</div>
            <div className="text-base font-black text-blue-400">{searchAnalytics?.zero_result_recoveries || 0}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Keyword Relevance Weight */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Keyword Relevance Weight</span>
              <span className="text-emerald-400 font-mono font-black">{searchConfig.weights?.keyword_relevance || 35}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={searchConfig.weights?.keyword_relevance || 35}
              onChange={(e) =>
                setSearchConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, keyword_relevance: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Pencocokan persis kata kunci pada judul, destinasi, dan wilayah.</p>
          </div>

          {/* Semantic Intent Weight */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Semantic Intent Weight</span>
              <span className="text-emerald-400 font-mono font-black">{searchConfig.weights?.semantic_intent || 25}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={searchConfig.weights?.semantic_intent || 25}
              onChange={(e) =>
                setSearchConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, semantic_intent: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Pemahaman maksud natural language (contoh: "pemula murah").</p>
          </div>

          {/* Feature Toggles */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Typo Tolerance Engine</span>
              <button
                type="button"
                onClick={() =>
                  setSearchConfig((prev) => ({
                    ...prev,
                    enable_typo_tolerance: !prev.enable_typo_tolerance,
                  }))
                }
                className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                  searchConfig.enable_typo_tolerance ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {searchConfig.enable_typo_tolerance ? "ENABLED" : "DISABLED"}
              </button>
            </div>

            <div className="flex items-center justify-between text-xs font-bold text-white">
              <span>Zero-Result Recovery</span>
              <button
                type="button"
                onClick={() =>
                  setSearchConfig((prev) => ({
                    ...prev,
                    enable_zero_result_recovery: !prev.enable_zero_result_recovery,
                  }))
                }
                className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                  searchConfig.enable_zero_result_recovery ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {searchConfig.enable_zero_result_recovery ? "ENABLED" : "DISABLED"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Brain size={18} className="text-emerald-400" /> AI Recommendation Scoring & Diversity Rules
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              Atur bobot algoritma perangkingan rekomendasi marketplace secara realtime tanpa merusak stabilitas transaksi.
            </p>
          </div>
          <button
            onClick={handleSaveRecConfig}
            disabled={savingRecConfig}
            className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
          >
            <FloppyDisk size={16} weight="bold" />
            <span>{savingRecConfig ? "Menyimpan..." : "Simpan Bobot AI"}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Weight 1: Preference Match */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Preference Match Weight</span>
              <span className="text-emerald-400 font-mono font-black">{recConfig.weights?.preference_match || 25}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recConfig.weights?.preference_match || 25}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, preference_match: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Pencocokan histori destinasi & kategori pilihan traveler.</p>
          </div>

          {/* Weight 2: Destination Match */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Destination Context Weight</span>
              <span className="text-emerald-400 font-mono font-black">{recConfig.weights?.destination_match || 20}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recConfig.weights?.destination_match || 20}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, destination_match: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Relevansi geografis destinasi gunung/wilayah pendakian.</p>
          </div>

          {/* Weight 3: Rating Quality */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Rating & Review Quality</span>
              <span className="text-emerald-400 font-mono font-black">{recConfig.weights?.rating_quality || 15}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recConfig.weights?.rating_quality || 15}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, rating_quality: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Rating ulasan bintang & kepercayaan jumlah ulasan pendaki.</p>
          </div>

          {/* Weight 4: Booking Popularity */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Booking Popularity</span>
              <span className="text-emerald-400 font-mono font-black">{recConfig.weights?.booking_popularity || 15}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recConfig.weights?.booking_popularity || 15}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, booking_popularity: Number(e.target.value) },
                }))
              }
              className="w-full accent-emerald-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Tingkat permintaan & jumlah pemesanan sukses.</p>
          </div>

          {/* Weight 5: Cold Start Boost */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Cold Start Boost (Product)</span>
              <span className="text-amber-400 font-mono font-black">{recConfig.weights?.cold_start_boost || 15}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={recConfig.weights?.cold_start_boost || 15}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  weights: { ...prev.weights, cold_start_boost: Number(e.target.value) },
                }))
              }
              className="w-full accent-amber-500 bg-neutral-800 rounded-lg cursor-pointer"
            />
            <p className="text-[10px] text-neutral-400">Peluang awal bagi trip/produk rental baru agar tidak kalah bersaing.</p>
          </div>

          {/* Diversity Cap: Max Per Vendor */}
          <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-white">
              <span>Max Items / Vendor per Feed</span>
              <span className="text-blue-400 font-mono font-black">{recConfig.diversity?.max_items_per_vendor || 2} item</span>
            </div>
            <input
              type="number"
              min="1"
              max="10"
              value={recConfig.diversity?.max_items_per_vendor || 2}
              onChange={(e) =>
                setRecConfig((prev) => ({
                  ...prev,
                  diversity: { ...prev.diversity, max_items_per_vendor: Number(e.target.value) },
                }))
              }
              className="w-full bg-neutral-900 border border-white/10 rounded-lg px-3 py-1 text-xs text-white"
            />
            <p className="text-[10px] text-neutral-400">Batas maksimal produk dari 1 vendor untuk keberagaman marketplace.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Feature Flags Section */}
        <div className="lg:col-span-2 bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div>
              <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-emerald-400" /> Central AI Feature Flags (Runtime Toggles)
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Modul AI yang dinonaktifkan akan otomatis menggunakan algoritma fallback deterministik tanpa gangguan layanan.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {flagMetadata.map((item) => {
              const isEnabled = !!flags[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => handleToggleFlag(item.key)}
                  className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    isEnabled
                      ? "bg-emerald-950/20 border-emerald-500/40 text-white shadow-sm"
                      : "bg-neutral-900/40 border-white/10 text-neutral-400 opacity-60 hover:opacity-80"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold text-xs flex items-center gap-2">
                      <span>{item.name}</span>
                    </div>
                    <div className="text-[10px] text-neutral-400 leading-relaxed">{item.desc}</div>
                  </div>
                  <div className="shrink-0 ml-3 text-emerald-400">
                    {isEnabled ? <ToggleRight size={28} weight="fill" /> : <ToggleLeft size={28} className="text-neutral-500" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Security & Privacy Principles Card */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" /> AI Security & Privacy Guard
            </h3>
            <div className="space-y-3 text-xs text-neutral-300">
              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Backend-Only AI Execution
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Kunci API Gemini tersimpan aman di environment server dan tidak pernah terekspos ke browser.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Automatic PII & Credential Scrubbing
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Password, JWT token, nomor kartu, dan PIN pengguna difilter secara otomatis sebelum dikirim ke AI.
                </p>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/10 space-y-1">
                <div className="font-bold text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle size={14} /> Zero Point of Failure
                </div>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  Jika kuota AI habis atau koneksi terputus, sistem Trexio tetap berjalan normal dengan fallback deterministik.
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[11px] text-emerald-300">
            <Sparkle size={14} className="inline mr-1 text-emerald-400" />
            Trexio AI Data Layer memanfaatkan canonical database records tanpa duplikasi tabel.
          </div>
        </div>
      </div>

      {/* AI Safety & Adventure Intelligence Center */}
      <div className="bg-black/40 border border-emerald-500/30 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <ShieldCheck size={14} weight="fill" />
              <span>Adventure Intelligence Active Engine</span>
            </div>
            <h3 className="text-lg font-extrabold text-white mt-1 flex items-center gap-2">
              Super Admin Safety & Adventure Intelligence Center
            </h3>
            <p className="text-xs text-neutral-400">
              Pengawasan status cuaca Open-Meteo, status resmi jalur pendakian Balai TN, dan publikasi Peringatan Darurat.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Live Weather Model</span>
            <p className="text-sm font-bold text-emerald-400">Open-Meteo High-Resolution (Asia/Jakarta)</p>
            <p className="text-[10px] text-neutral-500">Auto Refresh Every 15 Minutes</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Master Trail Statuses</span>
            <p className="text-sm font-bold text-amber-300">Terintegrasi Dengan Balai Besar TNGGP & TNGR</p>
            <p className="text-[10px] text-neutral-500">Peringatan Jalur Ditutup Otomatis</p>
          </div>

          <div className="bg-white/5 border border-white/10 p-4 rounded-xl space-y-1">
            <span className="text-[10px] font-bold text-neutral-400 uppercase">Hotline Darurat Verified</span>
            <p className="text-sm font-bold text-rose-400">BASARNAS 115 & BNPB 117</p>
            <p className="text-[10px] text-neutral-500">SOP Hipotermia & Tersehat Terverifikasi</p>
          </div>
        </div>
      </div>

      {/* Operational Activity & Audit Log Stream */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Database size={18} className="text-amber-400" /> AI Event Log Stream & Activity Signals
            </h3>
            <p className="text-xs text-neutral-400">Stream aktivitas marketplace real-time yang dikumpulkan untuk sinyal personalisasi.</p>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-white/10 text-xs font-mono font-bold text-neutral-300">
            {recentLogs.length} events
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/5 uppercase text-[10px] font-mono text-neutral-400">
              <tr>
                <th className="p-3 rounded-l-lg">Timestamp</th>
                <th className="p-3">Event Type</th>
                <th className="p-3">User ID</th>
                <th className="p-3">Destination / Query</th>
                <th className="p-3 rounded-r-lg">Metadata Summary</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-500">
                    Belum ada riwayat AI activity log. Sinyal akan muncul seiring pengguna menjelajahi trip & gear.
                  </td>
                </tr>
              ) : (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/5 transition-all font-mono text-[11px]">
                    <td className="p-3 text-neutral-400">
                      {new Date(log.timestamp).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                    </td>
                    <td className="p-3 font-bold text-emerald-400">{log.event_type}</td>
                    <td className="p-3 text-neutral-300">{log.user_id}</td>
                    <td className="p-3 text-amber-300">{log.destination || log.search_query || "-"}</td>
                    <td className="p-3 text-neutral-400 truncate max-w-xs">{JSON.stringify(log.metadata || {})}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}
    </div>
  );
}
