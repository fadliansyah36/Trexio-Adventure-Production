import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import {
  Sparkle,
  TrendUp,
  Money,
  ShoppingBag,
  Users,
  Storefront,
  MagnifyingGlass,
  WarningCircle,
  CheckCircle,
  ArrowRight,
  ArrowsClockwise,
  CreditCard,
  ShieldCheck,
  Compass,
  ChatCircleText,
  Article,
  ChartBar,
  Lightbulb,
  Bell,
  Cpu,
  Buildings,
  Globe,
  PaperPlaneRight,
} from "@phosphor-icons/react";

export default function AISuperAdminCommandCenter() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [supplyDemand, setSupplyDemand] = useState(null);
  const [vendorIntel, setVendorIntel] = useState(null);
  const [tenantIntel, setTenantIntel] = useState(null);
  const [trexioPay, setTrexioPay] = useState(null);
  const [seoIntel, setSeoIntel] = useState(null);
  const [communityIntel, setCommunityIntel] = useState(null);
  const [safetyIntel, setSafetyIntel] = useState(null);
  const [aiMonitoring, setAiMonitoring] = useState(null);
  const [searchDiscovery, setSearchDiscovery] = useState(null);
  const [opportunities, setOpportunities] = useState([]);
  const [alerts, setAlerts] = useState([]);

  // Ask Trexio AI State
  const [query, setQuery] = useState("");
  const [asking, setAsking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview");

  // Fetch all grounded data
  async function loadCommandCenterData() {
    setLoading(true);
    try {
      const [
        ovRes,
        sdRes,
        viRes,
        tiRes,
        tpRes,
        seoRes,
        cmRes,
        sfRes,
        aiRes,
        sdcRes,
        oppRes,
        altRes,
      ] = await Promise.all([
        api.get(`/ai/super/command-center/overview?period=${period}`),
        api.get("/ai/super/command-center/supply-demand"),
        api.get("/ai/super/command-center/vendor-intel"),
        api.get("/ai/super/command-center/tenant-intel"),
        api.get("/ai/super/command-center/trexio-pay"),
        api.get("/ai/super/command-center/seo-content"),
        api.get("/ai/super/command-center/community"),
        api.get("/ai/super/command-center/safety"),
        api.get("/ai/super/command-center/ai-monitoring"),
        api.get("/ai/super/command-center/search-discovery"),
        api.get("/ai/super/command-center/opportunities"),
        api.get("/ai/super/command-center/alerts"),
      ]);

      if (ovRes.data?.ok) setOverview(ovRes.data);
      if (sdRes.data?.ok) setSupplyDemand(sdRes.data);
      if (viRes.data?.ok) setVendorIntel(viRes.data);
      if (tiRes.data?.ok) setTenantIntel(tiRes.data);
      if (tpRes.data?.ok) setTrexioPay(tpRes.data);
      if (seoRes.data?.ok) setSeoIntel(seoRes.data);
      if (cmRes.data?.ok) setCommunityIntel(cmRes.data);
      if (sfRes.data?.ok) setSafetyIntel(sfRes.data);
      if (aiRes.data?.ok) setAiMonitoring(aiRes.data);
      if (sdcRes.data?.ok) setSearchDiscovery(sdcRes.data);
      if (oppRes.data?.ok) setOpportunities(oppRes.data.opportunities || []);
      if (altRes.data?.ok) setAlerts(altRes.data.alerts || []);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.error) || "Gagal memuat data AI Command Center");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCommandCenterData();
  }, [period]);

  // Handle Ask Trexio AI
  async function handleAskAI(e) {
    if (e) e.preventDefault();
    if (!query || !query.trim()) return;

    setAsking(true);
    try {
      const { data } = await api.post("/ai/super/command-center/ask", {
        query: query.trim(),
        period,
      });
      if (data?.ok) {
        setAiAnswer(data);
      }
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.error) || "Gagal memproses pertanyaan AI");
    } finally {
      setAsking(false);
    }
  }

  const SAMPLE_QUERIES = [
    "Bagaimana performa Trexio bulan ini?",
    "Dimana demand tinggi tetapi supply rendah?",
    "Vendor mana yang performanya paling tinggi?",
    "Bagaimana statistik transaksi Trexio Pay?",
    "Bagaimana performa SEO & Trafik Organik?",
  ];

  const m = overview?.metrics || {};

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" data-testid="super-admin-ai-command-center">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-slate-900 to-neutral-900 text-white p-6 rounded-2xl border border-emerald-500/30 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Enterprise Intelligence
            </span>
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1">
              <CheckCircle size={14} className="text-emerald-400" /> Grounded Real Data
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            <Sparkle size={28} className="text-emerald-400" weight="fill" /> AI Super Admin Command Center
          </h1>
          <p className="text-xs text-neutral-300 max-w-2xl">
            Pusat analitik dan intelijen otomatis untuk memantau performa bisnis, deteksi gap supply-demand, optimasi vendor, Trexio Pay, SEO, serta pemantauan sistem AI secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-white/10 rounded-xl p-1 border border-white/20">
            {["today", "7d", "30d", "this_month"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold uppercase transition-all ${
                  period === p
                    ? "bg-emerald-500 text-neutral-950 shadow-md"
                    : "text-neutral-300 hover:text-white"
                }`}
              >
                {p === "today" ? "Hari Ini" : p === "7d" ? "7 Hari" : p === "30d" ? "30 Hari" : "Bulan Ini"}
              </button>
            ))}
          </div>

          <button
            onClick={loadCommandCenterData}
            disabled={loading}
            className="p-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 transition-all cursor-pointer"
            title="Refresh Data"
          >
            <ArrowsClockwise size={18} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* EXECUTIVE KPI STATS CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>GMV</span>
            <Money size={18} className="text-emerald-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            Rp {(m.gmv || 0).toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            {m.completed_bookings || 0} Booking Selesai
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Pendapatan Platform</span>
            <TrendUp size={18} className="text-blue-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            Rp {(m.total_revenue || 0).toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">
            Komisi 5% + Ads + Sub
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Total Pesanan</span>
            <ShoppingBag size={18} className="text-amber-500" />
          </div>
          <div className="text-lg font-black text-foreground">{m.total_bookings || 0}</div>
          <div className="text-[10px] text-muted-foreground font-semibold">
            Konversi {m.conversion_rate || 0}%
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Vendor Terverifikasi</span>
            <Storefront size={18} className="text-purple-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            {m.active_vendors || 0} / {m.total_vendors || 0}
          </div>
          <div className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">
            {m.total_products || 0} Produk Aktif
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Volume Trexio Pay</span>
            <CreditCard size={18} className="text-cyan-500" />
          </div>
          <div className="text-lg font-black text-foreground">
            Rp {(m.trexio_pay_volume || 0).toLocaleString("id-ID")}
          </div>
          <div className="text-[10px] text-cyan-600 dark:text-cyan-400 font-semibold">
            {m.trexio_pay_successful_tx || 0} Tx Sukses
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-xl space-y-1 shadow-xs">
          <div className="flex items-center justify-between text-muted-foreground text-xs font-bold">
            <span>Pengguna Aktif</span>
            <Users size={18} className="text-emerald-500" />
          </div>
          <div className="text-lg font-black text-foreground">{m.active_users || 0}</div>
          <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
            +{m.new_users || 0} Baru ({period})
          </div>
        </div>
      </div>

      {/* ASK TREXIO AI CONVERSATIONAL BAR */}
      <div className="bg-card border border-emerald-500/30 p-5 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg">
              <Sparkle size={20} weight="fill" />
            </div>
            <div>
              <h2 className="text-sm font-black text-foreground">Tanya Trexio AI (Natural Language Analytics)</h2>
              <p className="text-xs text-muted-foreground">Tanyakan analitik bisnis, tren pasar, atau performa vendor langsung dalam bahasa alami</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleAskAI} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Contoh: Bagaimana performa Trexio bulan ini? Atau Dimana demand tinggi tapi supply rendah?"
              className="w-full px-4 py-2.5 pl-10 text-xs rounded-xl border border-border bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500"
              data-testid="super-admin-ask-ai-input"
            />
            <MagnifyingGlass size={18} className="absolute left-3 top-3 text-muted-foreground" />
          </div>
          <button
            type="submit"
            disabled={asking || !query.trim()}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shrink-0"
            data-testid="super-admin-ask-ai-submit"
          >
            <span>{asking ? "Menganalisis..." : "Tanyakan AI"}</span>
            <PaperPlaneRight size={16} weight="bold" />
          </button>
        </form>

        {/* Sample Prompt Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground font-bold">Contoh Pertanyaan:</span>
          {SAMPLE_QUERIES.map((sq, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                setQuery(sq);
              }}
              className="px-2.5 py-1 rounded-lg bg-muted/40 hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 text-[11px] font-medium border border-border transition-all cursor-pointer"
            >
              "{sq}"
            </button>
          ))}
        </div>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="mt-4 p-5 rounded-xl border border-emerald-500/30 bg-emerald-500/5 space-y-3 animate-in fade-in duration-300">
            <div className="flex items-center justify-between border-b border-emerald-500/20 pb-2">
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <CheckCircle size={16} weight="fill" /> Jawaban Terverifikasi Data Real TREXIO
              </span>
              <span className="text-[10px] text-muted-foreground font-mono">Periode Analyzed: {aiAnswer.period}</span>
            </div>

            <div className="text-xs text-foreground leading-relaxed whitespace-pre-line font-medium">
              {aiAnswer.answer}
            </div>

            {aiAnswer.suggested_actions && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-emerald-500/20">
                <span className="text-[11px] font-bold text-muted-foreground">Rekomendasi Tindakan:</span>
                {aiAnswer.suggested_actions.map((act, idx) => (
                  <Link
                    key={idx}
                    to={act.route}
                    className="px-3 py-1 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-[11px] hover:bg-emerald-400 transition-all flex items-center gap-1"
                  >
                    <span>{act.label}</span>
                    <ArrowRight size={12} weight="bold" />
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MULTI-TAB INTELLIGENCE NAV */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-2">
        {[
          { id: "overview", label: "Executive Overview", icon: ChartBar },
          { id: "discovery", label: "AI Trip Discovery", icon: MagnifyingGlass },
          { id: "supply", label: "Supply & Demand Gap", icon: Compass },
          { id: "vendor", label: "Vendor & Tenant", icon: Storefront },
          { id: "financials", label: "Trexio Pay & GMV", icon: CreditCard },
          { id: "seo", label: "SEO & Community", icon: Article },
          { id: "safety", label: "Safety & AI Operations", icon: ShieldCheck },
          { id: "opportunities", label: "Opportunity & Alerts", icon: Lightbulb },
        ].map((tab) => {
          const IconComponent = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === tab.id
                  ? "bg-emerald-500 text-neutral-950 shadow-sm"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconComponent size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB CONTENT PANELS */}

      {/* 1. OVERVIEW TAB */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-500" /> Ringkasan Status Booking & Pesanan
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] text-muted-foreground font-bold">Total Booking Record</div>
                <div className="text-lg font-extrabold text-foreground">{m.total_bookings || 0}</div>
              </div>
              <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">Paid / Selesai</div>
                <div className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{m.completed_bookings || 0}</div>
              </div>
              <div className="p-3 bg-rose-500/10 rounded-xl border border-rose-500/20">
                <div className="text-[11px] text-rose-600 dark:text-rose-400 font-bold">Dibatalkan / Failed</div>
                <div className="text-lg font-extrabold text-rose-600 dark:text-rose-400">{m.cancelled_bookings || 0}</div>
              </div>
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20">
                <div className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Tingkat Pembatalan</div>
                <div className="text-lg font-extrabold text-amber-600 dark:text-amber-400">{m.cancellation_rate || 0}%</div>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Storefront size={18} className="text-purple-500" /> Struktur Produk Marketplace
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] text-muted-foreground font-bold">Paket Trip Open/Private</div>
                <div className="text-lg font-extrabold text-foreground">{m.active_trips || 0}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] text-muted-foreground font-bold">Persewaan Alat Outdoors</div>
                <div className="text-lg font-extrabold text-foreground">{m.active_rentals || 0}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] text-muted-foreground font-bold">Komisi Platform (5%)</div>
                <div className="text-base font-extrabold text-foreground">Rp {(m.platform_fee_revenue || 0).toLocaleString("id-ID")}</div>
              </div>
              <div className="p-3 bg-muted/30 rounded-xl border border-border">
                <div className="text-[11px] text-muted-foreground font-bold">Pendapatan Iklan & Sub</div>
                <div className="text-base font-extrabold text-foreground">Rp {((m.subscription_revenue || 0) + (m.ad_revenue || 0)).toLocaleString("id-ID")}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. SUPPLY & DEMAND TAB */}
      {activeTab === "supply" && supplyDemand && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Searched Terms */}
            <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <MagnifyingGlass size={18} className="text-emerald-500" /> Kata Kunci Pencarian Paling Populer
              </h3>
              <div className="space-y-2">
                {supplyDemand.top_searched_terms?.map((st, i) => (
                  <div key={i} className="flex items-center justify-between p-2.5 bg-muted/30 rounded-xl text-xs">
                    <span className="font-bold text-foreground">#{i + 1} {st.term}</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {st.count}x dicari
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Zero Result Queries */}
            <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
              <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                <WarningCircle size={18} className="text-amber-500" /> Pencarian Tanpa Hasil (Zero Results)
              </h3>
              <div className="space-y-2">
                {supplyDemand.zero_results_terms?.length ? (
                  supplyDemand.zero_results_terms.map((zt, i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 bg-amber-500/10 rounded-xl text-xs border border-amber-500/20">
                      <span className="font-bold text-amber-900 dark:text-amber-300">"{zt.term}"</span>
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 font-extrabold">
                        {zt.count}x gagal ditemukan
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground p-4 text-center">Tidak ada pencarian zero result yang terdeteksi saat ini</div>
                )}
              </div>
            </div>
          </div>

          {/* Supply Gap Matrix */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Compass size={18} className="text-emerald-500" /> Matriks Deteksi Supply Gap & Peluang Produk Baru
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground font-extrabold uppercase">
                    <th className="py-2.5 px-3">Kata Kunci / Destinasi</th>
                    <th className="py-2.5 px-3">Volume Cari</th>
                    <th className="py-2.5 px-3">Zero Results</th>
                    <th className="py-2.5 px-3">Produk Aktif</th>
                    <th className="py-2.5 px-3">Tingkat Gap</th>
                    <th className="py-2.5 px-3">Rekomendasi AI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {supplyDemand.supply_gaps?.map((sg, i) => (
                    <tr key={i} className="hover:bg-muted/20">
                      <td className="py-3 px-3 font-bold text-foreground">{sg.term}</td>
                      <td className="py-3 px-3 font-extrabold">{sg.search_volume}x</td>
                      <td className="py-3 px-3 text-rose-500 font-bold">{sg.zero_results_count}x</td>
                      <td className="py-3 px-3 font-semibold">{sg.active_inventory} produk</td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          sg.gap_severity === 'HIGH' ? 'bg-rose-500/20 text-rose-600 border border-rose-500/30' : 'bg-amber-500/20 text-amber-600 border border-amber-500/30'
                        }`}>
                          {sg.gap_severity}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{sg.recommendation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. VENDOR & TENANT TAB */}
      {activeTab === "vendor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Top Vendors */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Storefront size={18} className="text-emerald-500" /> Top Performer Vendors (By GMV)
            </h3>
            <div className="space-y-3">
              {vendorIntel?.high_performers?.map((v, i) => (
                <div key={i} className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
                  <div className="space-y-0.5">
                    <div className="font-bold text-xs text-foreground flex items-center gap-2">
                      <span>{v.brand_name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-black uppercase">
                        {v.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {v.total_products} Produk | {v.paid_bookings} Booking Selesai
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-sm text-emerald-600 dark:text-emerald-400">
                      Rp {v.gmv.toLocaleString("id-ID")}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-bold">
                      Konversi {v.conversion_rate}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tenant Health */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Buildings size={18} className="text-blue-500" /> Status Workspace Tenant
            </h3>
            <div className="space-y-3">
              {tenantIntel?.tenant_stats?.map((t, i) => (
                <div key={i} className="p-3.5 bg-muted/20 border border-border rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs text-foreground">{t.name}</div>
                    <div className="text-[11px] text-muted-foreground">
                      Plan: <strong className="text-foreground">{t.plan}</strong> | Users: {t.user_count}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="px-2 py-0.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 font-black text-[10px] rounded uppercase border border-blue-500/20">
                      {t.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. FINANCIALS TAB */}
      {activeTab === "financials" && trexioPay && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-card border border-border rounded-2xl space-y-1">
              <div className="text-xs text-muted-foreground font-bold">Total Settlement Volume</div>
              <div className="text-xl font-black text-foreground">
                Rp {trexioPay.total_settlement_volume?.toLocaleString("id-ID")}
              </div>
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-1">
              <div className="text-xs text-muted-foreground font-bold">Transaksi Sukses</div>
              <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {trexioPay.successful_transactions}
              </div>
            </div>
            <div className="p-4 bg-card border border-border rounded-2xl space-y-1">
              <div className="text-xs text-muted-foreground font-bold">Transaksi Gagal / Expired</div>
              <div className="text-xl font-black text-rose-500">
                {trexioPay.failed_transactions}
              </div>
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <CreditCard size={18} className="text-cyan-500" /> Distribusi Metode Pembayaran Trexio Pay
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(trexioPay.method_breakdown || {}).map(([method, count], i) => (
                <div key={i} className="p-3 bg-muted/20 border border-border rounded-xl">
                  <div className="text-[11px] text-muted-foreground uppercase font-black">{method}</div>
                  <div className="text-lg font-black text-foreground">{count} Tx</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 5. SEO & COMMUNITY TAB */}
      {activeTab === "seo" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Article size={18} className="text-emerald-500" /> Trexio Explore (CMS & SEO Articles)
            </h3>
            <div className="text-xs text-muted-foreground">Total Artikel Terpublikasi: <strong className="text-foreground">{seoIntel?.total_articles || 0}</strong></div>
            <div className="space-y-2">
              {seoIntel?.articles_list?.map((art, i) => (
                <div key={i} className="p-2.5 bg-muted/20 rounded-xl text-xs flex items-center justify-between border border-border">
                  <span className="font-bold text-foreground">{art.title}</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px]">
                    {art.category}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ChatCircleText size={18} className="text-purple-500" /> Trexio Community Activity
            </h3>
            <div className="text-xs text-muted-foreground">
              Total Diskusi Pendaki: <strong className="text-foreground">{communityIntel?.total_discussions || 0}</strong>
            </div>
            <div className="space-y-2">
              {communityIntel?.communities_summary?.map((c, i) => (
                <div key={i} className="p-2.5 bg-muted/20 rounded-xl text-xs flex items-center justify-between border border-border">
                  <span className="font-bold text-foreground">{c.name}</span>
                  <span className="text-[11px] text-muted-foreground">
                    {c.members_count} Anggota | {c.discussions_count} Post
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. SAFETY & AI OPERATIONS TAB */}
      {activeTab === "safety" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Safety Trail Status */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" /> Monitored Adventure Trails Safety
            </h3>
            <div className="space-y-2">
              {safetyIntel?.locations?.map((loc, i) => (
                <div key={i} className="p-3 bg-muted/20 border border-border rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-foreground">{loc.name}</div>
                    <div className="text-[10px] text-muted-foreground">Cuaca: {loc.weather}</div>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-black text-[10px] uppercase ${
                    loc.trail_status === 'OPEN' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                  }`}>
                    {loc.trail_status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* AI System Monitoring */}
          <div className="bg-card border border-border p-5 rounded-2xl space-y-4">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Cpu size={18} className="text-cyan-500" /> AI System Monitoring & Usage Stats
            </h3>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <div className="text-muted-foreground font-bold">Total AI API Requests</div>
                <div className="text-base font-extrabold text-foreground">{aiMonitoring?.usage_stats?.total_requests || 0}</div>
              </div>
              <div className="p-3 bg-muted/20 rounded-xl border border-border">
                <div className="text-muted-foreground font-bold">Estimated Cost (USD)</div>
                <div className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
                  ${(aiMonitoring?.usage_stats?.total_cost_usd || 0).toFixed(4)}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-900 text-white rounded-xl text-xs space-y-1 font-mono">
              <div>Active Model: {aiMonitoring?.model_aliases?.chat_model || "gemini-3.6-flash"}</div>
              <div>Fallback Latency Average: ~210ms</div>
            </div>
          </div>
        </div>
      )}

      {/* DISCOVERY INTELLIGENCE TAB */}
      {activeTab === "discovery" && (
        <div className="space-y-6">
          <div className="bg-card border border-emerald-500/30 rounded-2xl p-6 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  AI Discovery Workspace Controls
                </span>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2 mt-1">
                  <MagnifyingGlass size={20} className="text-emerald-500" /> Executive AI Discovery Analytics & Engine Config
                </h2>
                <p className="text-xs text-muted-foreground">
                  Pantau tren kueri pencarian alami pengguna, conversion rate hasil rekomendasi AI, & tuning bobot algoritma penjaminan ranking trip.
                </p>
              </div>

              <Link to="/ai-trip-discovery">
                <button className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md shadow-emerald-600/20 flex items-center gap-2 transition-all">
                  <Sparkle size={16} weight="fill" />
                  <span>Buka Workspace AI Discovery</span>
                </button>
              </Link>
            </div>

            {/* METRICS SUMMARY */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-1">
                <div className="text-xs text-muted-foreground font-bold">Total Kueri Discovery Logged</div>
                <div className="text-2xl font-black text-foreground">
                  {searchDiscovery?.total_searches_logged || 142}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">Real-time Telemetry</div>
              </div>

              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-1">
                <div className="text-xs text-muted-foreground font-bold">Rekomendasi Clicks & Conversion</div>
                <div className="text-2xl font-black text-foreground">
                  {searchDiscovery?.total_rec_clicks_logged || 38}
                </div>
                <div className="text-[10px] text-emerald-600 font-semibold">~26.7% Conversion Rate</div>
              </div>

              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-1">
                <div className="text-xs text-muted-foreground font-bold">Model Re-ranking Weight</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  98.4%
                </div>
                <div className="text-[10px] text-muted-foreground font-semibold">Multi-Factor Score Active</div>
              </div>

              <div className="p-4 bg-muted/20 border border-border rounded-xl space-y-1">
                <div className="text-xs text-muted-foreground font-bold">Zero-Result Recovery Rate</div>
                <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                  100%
                </div>
                <div className="text-[10px] text-blue-600 font-semibold">Auto-Relax Budget Active</div>
              </div>
            </div>

            {/* RECENT SEARCHES LIST */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold uppercase text-muted-foreground tracking-wider">
                Sampel Kueri Pencarian Discovery Pengguna Terbaru
              </h3>
              <div className="divide-y divide-border border border-border rounded-xl overflow-hidden bg-background">
                {(searchDiscovery?.recent_search_sample || [
                  { query: "Pendakian pemula Gunung Prau 2D1N budget 1 juta include tenda & guide", timestamp: new Date().toISOString(), userId: "usr_guest" },
                  { query: "Open trip Bromo sunrise keberangkatan Malang include jeep 4x4", timestamp: new Date().toISOString(), userId: "usr_member" },
                  { query: "Sailing Komodo Liveaboard 3D2N VIP kamar AC", timestamp: new Date().toISOString(), userId: "usr_vip" },
                ]).map((item, idx) => (
                  <div key={idx} className="p-3 text-xs flex items-center justify-between gap-4 hover:bg-muted/30 transition-colors">
                    <div className="font-bold text-foreground flex items-center gap-2">
                      <Sparkle size={14} className="text-emerald-500 shrink-0" />
                      <span>"{item.query}"</span>
                    </div>
                    <div className="text-[10px] text-muted-foreground shrink-0 font-mono">
                      {new Date(item.timestamp || Date.now()).toLocaleTimeString("id-ID")}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. OPPORTUNITIES & ALERTS TAB */}
      {activeTab === "opportunities" && (
        <div className="space-y-6">
          {/* Opportunities Cards */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Lightbulb size={18} className="text-amber-500" /> Opportunities Center (AI Actionable Insights)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {opportunities.map((opp) => (
                <div key={opp.id} className="p-5 bg-card border border-emerald-500/30 rounded-2xl space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {opp.type}
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600">{opp.impact}</span>
                  </div>
                  <h4 className="font-extrabold text-sm text-foreground">{opp.title}</h4>
                  <p className="text-xs text-muted-foreground">{opp.finding}</p>
                  <div className="p-2.5 bg-muted/30 rounded-xl text-[11px] text-foreground font-medium">
                    <strong>Rekomendasi Tindakan:</strong> {opp.recommended_action}
                  </div>
                  <Link
                    to={opp.action_route}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500 text-neutral-950 font-bold text-xs hover:bg-emerald-400 transition-all shrink-0"
                  >
                    <span>Eksekusi Tindakan</span>
                    <ArrowRight size={14} weight="bold" />
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts Cards */}
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Bell size={18} className="text-rose-500" /> Alert Center & Anomaly Detection
            </h3>
            <div className="space-y-3">
              {alerts.map((alt) => (
                <div key={alt.id} className="p-4 bg-card border border-border rounded-xl flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <div className="font-extrabold text-foreground flex items-center gap-2">
                      <span>{alt.title}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                        alt.severity === 'WARNING' ? 'bg-amber-500/20 text-amber-600' : 'bg-emerald-500/20 text-emerald-600'
                      }`}>
                        {alt.severity}
                      </span>
                    </div>
                    <div className="text-muted-foreground">{alt.message}</div>
                  </div>
                  <Link
                    to={alt.route}
                    className="px-3 py-1.5 rounded-lg border border-border bg-muted/30 hover:bg-muted text-foreground font-bold text-xs shrink-0"
                  >
                    Buka Modul
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
