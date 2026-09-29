import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { useNavigate } from "react-router-dom";
import {
  TrendingUp,
  Sparkles,
  MapPin,
  Tag,
  Users,
  Search,
  Filter,
  RefreshCw,
  ArrowRight,
  BarChart2,
  DollarSign,
  PieChart,
  Send,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Briefcase,
  Layers,
  ShoppingBag,
} from "lucide-react";

export default function AIGrowthIntelligence() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Data states
  const [overview, setOverview] = useState(null);
  const [gaps, setGaps] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [conversion, setConversion] = useState(null);
  const [gapMap, setGapMap] = useState([]);

  // Ask Growth AI state
  const [query, setQuery] = useState("");
  const [aiResponse, setAiResponse] = useState(null);
  const [asking, setAsking] = useState(false);

  const fetchGrowthData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        resOverview,
        resGaps,
        resDests,
        resCats,
        resConv,
        resMap,
      ] = await Promise.all([
        api.get("/ai/super/growth/overview").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/growth/gaps").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/growth/destinations").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/growth/categories").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/growth/conversion").then((r) => r.data).catch(() => ({ ok: false })),
        api.get("/ai/super/growth/gap-map").then((r) => r.data).catch(() => ({ ok: false })),
      ]);

      if (resOverview.ok) setOverview(resOverview);
      if (resGaps.ok) setGaps(resGaps.gaps || []);
      if (resDests.ok) setDestinations(resDests.destinations || []);
      if (resCats.ok) setCategories(resCats.categories || []);
      if (resConv.ok) setConversion(resConv);
      if (resMap.ok) setGapMap(resMap.matrix || []);
    } catch (err) {
      console.error("Error fetching growth data:", err);
      setError("Gagal memuat data Intelijen Pertumbuhan Marketplace.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGrowthData();
  }, []);

  const handleAskGrowthAI = async (customQuery = null) => {
    const q = customQuery || query;
    if (!q.trim()) return;

    setAsking(true);
    try {
      const res = await api.post("/ai/super/growth/ask", { query: q });
      if (res.data?.ok) {
        setAiResponse(res.data);
      }
    } catch (err) {
      console.error("Error asking Growth AI:", err);
    } finally {
      setAsking(false);
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "HIGH":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
      case "MEDIUM":
        return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      default:
        return "bg-slate-500/10 text-slate-600 border-slate-500/20";
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm mb-1">
            <TrendingUp className="w-5 h-5" />
            <span>TREXIO MARKETPLACE INTELLIGENCE</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            AI Growth & Marketplace Intelligence
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            Pusat analisis peluang pertumbuhan, kesenjangan supply-demand, optimasi konversi, dan peta gap pasar real-time.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchGrowthData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            <span>Segarkan Analisis</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto pb-1">
        {[
          { id: "overview", label: "Peluang Utama", icon: Sparkles },
          { id: "gaps", label: "Kesenjangan Supply-Demand", icon: Layers },
          { id: "gapmap", label: "Peta Gap Pasar (Matrix)", icon: BarChart2 },
          { id: "destinations", label: "Intelijen Destinasi", icon: MapPin },
          { id: "funnel", label: "Corong Konversi & GMV", icon: DollarSign },
          { id: "ask", label: "Tanya Growth AI", icon: HelpCircle },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 font-medium text-sm rounded-t-xl border-b-2 transition whitespace-nowrap ${
                active
                  ? "border-emerald-600 text-emerald-700 bg-emerald-50/50"
                  : "border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {loading ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium text-sm">
            Menganalisis sinyal pencarian, transaksi, dan kesenjangan marketplace...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-sm">
          {error}
        </div>
      ) : (
        <>
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Summary KPIs */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Kesenjangan Supply Kritis</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {overview?.top_supply_gaps_count || 0}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">
                    Siap direkrut mitra vendor
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Destinasi Aktif Berkontribusi</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {overview?.top_destinations_count || 0}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Lokasi petualangan unggulan
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Rate Konversi Keseluruhan</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {overview?.overall_conversion_rate || "0%"}
                  </p>
                  <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">
                    Selesai bayar / Pencarian
                  </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                  <span className="text-xs text-slate-500 font-medium">Total Rekomendasi Peluang</span>
                  <p className="text-3xl font-extrabold text-slate-900 mt-1">
                    {overview?.active_opportunities_count || 0}
                  </p>
                  <span className="text-[11px] text-emerald-600 font-medium mt-1 inline-block">
                    Siap dieksekusi Super Admin
                  </span>
                </div>
              </div>

              {/* Opportunities Cards */}
              <div className="space-y-4">
                <h3 className="font-bold text-slate-900 text-base">
                  Rekomendasi Peluang Pertumbuhan Strategis (Grounded Opportunities)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {overview?.opportunities?.map((opp) => (
                    <div
                      key={opp.id}
                      className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between space-y-4 hover:border-emerald-500/50 transition"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="px-2.5 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {opp.type}
                          </span>
                          <span className="text-xs font-bold text-slate-900">
                            Skor Skor: {opp.opportunity_score}/100
                          </span>
                        </div>
                        <h4 className="font-bold text-slate-900 text-base">{opp.title}</h4>
                        <p className="text-xs text-slate-600 leading-relaxed">{opp.finding}</p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-xs font-semibold text-emerald-600">{opp.potential_impact}</span>
                        <button
                          onClick={() => navigate(opp.action_route)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition"
                        >
                          <span>Eksekusi Action</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GAPS */}
          {activeTab === "gaps" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Analisis Kesenjangan Supply vs Demand</h2>
              <p className="text-xs text-slate-500">
                Pencarian pengguna tervalidasi yang belum diimbangi ketersediaan stok produk vendor secara optimal.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Kata Kunci / Destinasi</th>
                      <th className="p-3.5">Volume Cari</th>
                      <th className="p-3.5">Pencarian 0 Hasil</th>
                      <th className="p-3.5">Stok Produk Aktif</th>
                      <th className="p-3.5">Skor Peluang</th>
                      <th className="p-3.5">Prioritas</th>
                      <th className="p-3.5 text-right">Aksi Strategis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {gaps.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-6 text-center text-slate-400">
                          Tidak ada supply gap kritis terdeteksi saat ini.
                        </td>
                      </tr>
                    ) : (
                      gaps.map((g, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="p-3.5 font-bold text-slate-900 uppercase">{g.term}</td>
                          <td className="p-3.5 font-mono">{g.search_volume}x</td>
                          <td className="p-3.5 font-mono text-amber-600 font-semibold">{g.zero_results_count}x</td>
                          <td className="p-3.5 font-mono">{g.active_inventory} unit</td>
                          <td className="p-3.5 font-bold text-slate-900">{g.opportunity_score} / 100</td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${getPriorityBadge(g.priority)}`}>
                              {g.priority}
                            </span>
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() => navigate("/admin/vendors")}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium text-xs transition"
                            >
                              Rekrut Vendor
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: GAP MAP MATRIX */}
          {activeTab === "gapmap" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Peta Kesenjangan Pasar (Marketplace Gap Matrix)</h2>
              <p className="text-xs text-slate-500">
                Pemetaan matriks gabungan antara Destinasi x Kategori Petualangan untuk melihat ruang pertumbuhan baru.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 pt-2">
                {gapMap.map((cell, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                      cell.status === "CRITICAL_GAP"
                        ? "bg-red-50/60 border-red-200 text-red-900"
                        : cell.status === "HIGH_DEMAND_GAP"
                        ? "bg-amber-50/60 border-amber-200 text-amber-900"
                        : "bg-slate-50/60 border-slate-200 text-slate-900"
                    }`}
                  >
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                        {cell.category}
                      </span>
                      <h4 className="font-bold text-base mt-0.5">{cell.destination}</h4>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs font-medium">
                      <span>Demand: {cell.demand_count}</span>
                      <span>Supply: {cell.supply_count}</span>
                      <span className="font-bold uppercase text-[10px]">{cell.status}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: DESTINATIONS */}
          {activeTab === "destinations" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-bold text-slate-900">Intelijen Destinasi & Wilayah Petualangan</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="p-3.5">Nama Destinasi</th>
                      <th className="p-3.5">Produk Aktif</th>
                      <th className="p-3.5">Pencarian</th>
                      <th className="p-3.5">Total Booking</th>
                      <th className="p-3.5">Total GMV</th>
                      <th className="p-3.5">Indikator Supply-Demand</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {destinations.map((d, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 font-bold text-slate-900">{d.name}</td>
                        <td className="p-3.5 font-mono">{d.active_products} produk</td>
                        <td className="p-3.5 font-mono">{d.search_volume}x</td>
                        <td className="p-3.5 font-mono font-semibold">{d.total_bookings} pesanan</td>
                        <td className="p-3.5 font-mono font-bold text-emerald-600">
                          Rp {d.total_gmv?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded border text-[11px] font-semibold ${
                              d.opportunity_flag === "SUPPLY_GAP"
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}
                          >
                            {d.opportunity_flag}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 5: FUNNEL & GMV */}
          {activeTab === "funnel" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <h2 className="text-lg font-bold text-slate-900">Analisis Corong Konversi & Retensi GMV</h2>

              <div className="space-y-3">
                {conversion?.funnel?.map((step, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-xs">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{step.stage}</h4>
                        <span className="text-xs text-slate-500">Jumlah Aktivitas: {step.count}</span>
                      </div>
                    </div>
                    <span className="font-extrabold text-emerald-600 text-sm">
                      Konversi Step: {step.conversion_from_previous}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: ASK GROWTH AI */}
          {activeTab === "ask" && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Tanya AI Growth Strategist</h2>
                <p className="text-xs text-slate-500">
                  Ajukan pertanyaan strategis berbasis data aktual Trexio untuk mendapatkan analisis dan rencana aksi terukur.
                </p>
              </div>

              {/* Sample Quick Questions */}
              <div className="flex flex-wrap gap-2">
                {[
                  "Dimana Trexio harus menambah Vendor?",
                  "Kategori apa yang paling berkembang?",
                  "Destinasi apa yang demand-nya tinggi tetapi supply rendah?",
                  "Bagaimana performa konversi checkout saat ini?",
                ].map((sq, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setQuery(sq);
                      handleAskGrowthAI(sq);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-medium rounded-xl transition"
                  >
                    {sq}
                  </button>
                ))}
              </div>

              {/* Query Input */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ketik pertanyaan pertumbuhan marketplace..."
                  className="flex-1 p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  disabled={asking}
                  onClick={() => handleAskGrowthAI()}
                  className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-xl flex items-center gap-2 transition"
                >
                  <Send className="w-4 h-4" />
                  <span>{asking ? "Proses AI..." : "Tanyakan"}</span>
                </button>
              </div>

              {/* AI Response Card */}
              {aiResponse && (
                <div className="p-6 bg-emerald-50/60 rounded-2xl border border-emerald-100 space-y-4">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <span>Rekomendasi AI Strategis (Grounded Output)</span>
                  </div>
                  <p className="text-xs text-slate-800 whitespace-pre-line leading-relaxed">
                    {aiResponse.answer}
                  </p>

                  <div className="pt-4 border-t border-emerald-200/60 flex flex-wrap gap-2">
                    {aiResponse.suggested_actions?.map((act, idx) => (
                      <button
                        key={idx}
                        onClick={() => navigate(act.route)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-medium transition"
                      >
                        <span>{act.label}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
