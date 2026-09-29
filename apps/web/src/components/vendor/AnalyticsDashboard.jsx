import React, { useState, useEffect, useMemo } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import {
  TrendUp,
  TrendDown,
  Eye,
  ShoppingCart,
  CurrencyDollar,
  Calendar,
  DownloadSimple,
  Funnel,
  CheckCircle,
  ChartBar,
  ChartPie,
  Sparkle,
  Info,
} from "@phosphor-icons/react";
import { api, formatRupiah } from "@/lib/api";
import { KPICard, KPIGrid } from "@/components/vendor/KPICard";

const PRESET_RANGES = [
  { id: "7d", label: "7 Hari" },
  { id: "30d", label: "30 Hari" },
  { id: "90d", label: "90 Hari" },
  { id: "ytd", label: "Tahun Ini" },
  { id: "custom", label: "Kustom" },
];

const CATEGORY_COLORS = ["#047857", "#0284c7", "#d97706", "#7c3aed", "#ec4899"];

export default function AnalyticsDashboard({
  initialRange = "30d",
  customData = null,
  showTitle = true,
  className = "",
}) {
  const [range, setRange] = useState(initialRange);
  const [startDate, setStartDate] = useState("2026-07-01");
  const [endDate, setEndDate] = useState("2026-07-31");
  const [activeMetricTab, setActiveMetricTab] = useState("all"); // 'all' | 'views' | 'bookings' | 'revenue'
  const [serverAnalytics, setServerAnalytics] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (customData) return;
    setLoading(true);
    api
      .get(`/vendor/analytics?period=${range}`)
      .then((res) => {
        setServerAnalytics(res.data);
      })
      .catch(() => {
        setServerAnalytics(null);
      })
      .finally(() => setLoading(false));
  }, [range, customData]);

  // Chart time-series data
  const chartData = useMemo(() => {
    if (customData) return customData;
    if (serverAnalytics?.timeline) return serverAnalytics.timeline;
    return [];
  }, [customData, serverAnalytics]);

  // Summary Metrics Calculation
  const summary = useMemo(() => {
    if (customData) {
      const totalViews = customData.reduce((acc, d) => acc + (d.pageViews || 0), 0);
      const totalBookings = customData.reduce((acc, d) => acc + (d.bookings || 0), 0);
      const totalRevenue = customData.reduce((acc, d) => acc + (d.revenue || 0), 0);
      const avgConversion = totalViews ? parseFloat(((totalBookings / totalViews) * 100).toFixed(2)) : 0;
      return { totalViews, totalBookings, totalRevenue, avgConversion, viewsGrowth: "0.0%", bookingsGrowth: "0.0%", conversionGrowth: "0.0%", revenueGrowth: "0.0%" };
    }

    const totalViews = serverAnalytics?.totalViews || 0;
    const totalBookings = serverAnalytics?.totalBookings || 0;
    const totalRevenue = serverAnalytics?.totalRevenue || 0;
    const avgConversion = serverAnalytics?.avgConversion || 0;

    return {
      totalViews,
      totalBookings,
      totalRevenue,
      avgConversion,
      viewsGrowth: totalViews > 0 ? "+0.0%" : "0%",
      bookingsGrowth: totalBookings > 0 ? "+0.0%" : "0%",
      conversionGrowth: avgConversion > 0 ? "+0.0%" : "0%",
      revenueGrowth: totalRevenue > 0 ? "+0.0%" : "0%",
    };
  }, [chartData, customData, serverAnalytics]);

  // Product Distribution Data
  const categoryData = useMemo(() => {
    if (serverAnalytics?.categoryData && serverAnalytics.categoryData.length > 0) {
      return serverAnalytics.categoryData;
    }
    return [
      { name: "Open Trip", value: summary.totalBookings > 0 ? 100 : 0 },
    ];
  }, [serverAnalytics, summary]);

  // Conversion Funnel Data
  const funnelData = [
    { stage: "Halaman Produk", count: summary.totalViews, pct: summary.totalViews > 0 ? "100%" : "0%" },
    { stage: "Intent / Checkout", count: Math.round(summary.totalViews * 0.228), pct: summary.totalViews > 0 ? "22.8%" : "0%" },
    { stage: "Pembayaran Verifikasi", count: summary.totalBookings, pct: summary.totalViews > 0 ? `${summary.avgConversion}%` : "0%" },
    { stage: "Trip Selesai", count: summary.totalBookings, pct: summary.totalViews > 0 ? `${summary.avgConversion}%` : "0%" },
  ];

  const exportCSV = () => {
    const headers = "Periode,Page Views,Bookings,Conversion Rate (%),Revenue (Rp)\n";
    const rows = chartData
      .map((d) => `${d.name},${d.pageViews},${d.bookings},${d.conversionRate},${d.revenue}`)
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trexio-partner-analytics-${range}.csv`;
    a.click();
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Dashboard Top Filter Bar */}
      <div className="bg-white border border-border rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {showTitle && (
            <div>
              <div className="trx-overline text-muted-foreground flex items-center gap-1.5 font-bold">
                <Sparkle weight="fill" size={14} className="text-amber-500" /> Executive Business Intelligence
              </div>
              <h2 className="text-xl font-black tracking-tighter text-foreground">
                Visual Analytics & Conversion Dashboard
              </h2>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {/* Presets */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl border border-border text-xs font-bold">
              {PRESET_RANGES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setRange(p.id)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    range === p.id
                      ? "bg-white text-foreground shadow-xs font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            {/* Export CSV */}
            <button
              onClick={exportCSV}
              className="inline-flex items-center gap-1.5 bg-neutral-900 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl hover:bg-neutral-800 transition-all shadow-xs"
            >
              <DownloadSimple size={15} /> Export CSV
            </button>
          </div>
        </div>

        {/* Custom Range Selector when 'custom' selected */}
        {range === "custom" && (
          <div className="flex items-center gap-3 pt-3 border-t border-border text-xs font-bold animate-in fade-in">
            <Calendar size={18} className="text-muted-foreground" />
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground">Mulai:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="p-1.5 border border-border rounded-lg text-foreground font-semibold"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-muted-foreground">Sampai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="p-1.5 border border-border rounded-lg text-foreground font-semibold"
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary Stat Cards using reusable KPICard */}
      <KPIGrid>
        <KPICard
          title="Page Views Katalog"
          value={summary.totalViews.toLocaleString("id-ID")}
          growth={summary.viewsGrowth}
          growthType="positive"
          growthLabel="vs. periode lalu"
          icon={Eye}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Active & Total Bookings"
          value={`${summary.totalBookings.toLocaleString("id-ID")} Pax`}
          growth={summary.bookingsGrowth}
          growthType="positive"
          growthLabel="vs. periode lalu"
          icon={ShoppingCart}
          iconBg="bg-purple-50 text-purple-600"
        />
        <KPICard
          title="Conversion Rate"
          value={`${summary.avgConversion}%`}
          growth={summary.conversionGrowth}
          growthType="positive"
          growthLabel="vs. target (4.2%)"
          icon={TrendUp}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Gross Revenue & Net"
          value={formatRupiah(summary.totalRevenue)}
          growth={summary.revenueGrowth}
          growthType="positive"
          growthLabel="vs. periode lalu"
          icon={CurrencyDollar}
          iconBg="bg-emerald-50 text-emerald-600"
        />
      </KPIGrid>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Area Chart (2 cols) */}
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black uppercase tracking-wider text-neutral-700 flex items-center gap-2">
                <ChartBar size={18} className="text-[hsl(var(--primary))]" /> Tren Performa Traffic & Booking
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Grafik dinamika penayangan vs pendaftaran selama periode {range}.</p>
            </div>

            {/* Metric Switcher */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg text-[11px] font-bold">
              <button
                onClick={() => setActiveMetricTab("all")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeMetricTab === "all" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Semua
              </button>
              <button
                onClick={() => setActiveMetricTab("views")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeMetricTab === "views" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Views
              </button>
              <button
                onClick={() => setActiveMetricTab("bookings")}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  activeMetricTab === "bookings" ? "bg-white text-foreground shadow-xs" : "text-muted-foreground"
                }`}
              >
                Bookings
              </button>
            </div>
          </div>

          <div className="w-full h-[320px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#047857" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="#047857" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />

                {(activeMetricTab === "all" || activeMetricTab === "views") && (
                  <Area
                    type="monotone"
                    dataKey="pageViews"
                    name="Page Views"
                    stroke="#0284c7"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                )}
                {(activeMetricTab === "all" || activeMetricTab === "bookings") && (
                  <Area
                    type="monotone"
                    dataKey="bookings"
                    name="Bookings (Pax)"
                    stroke="#047857"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorBookings)"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Product Category Distribution (1 col) */}
        <div className="bg-white border border-border rounded-2xl p-6 space-y-4 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-700 flex items-center gap-2">
              <ChartPie size={18} className="text-purple-600" /> Distribusi Kategori Layanan
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Proporsi kontribusi omset per kategori produk.</p>
          </div>

          <div className="w-full h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}%`, "Kontribusi"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                    fontWeight: "bold",
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-2 border-t border-border">
            {categoryData.map((cat, idx) => (
              <div key={cat.name} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: CATEGORY_COLORS[idx % CATEGORY_COLORS.length] }}
                  />
                  <span>{cat.name}</span>
                </div>
                <span className="font-extrabold text-neutral-800">{cat.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Conversion Funnel Bar Chart & Breakdown */}
      <div className="bg-white border border-border rounded-2xl p-6 space-y-5 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-700 flex items-center gap-2">
              <Funnel size={18} className="text-emerald-600" /> Conversion Funnel & Drop-off Analysis
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Visualisasi perjalanan pengguna dari eksplorasi produk hingga keberangkatan trip.
            </p>
          </div>
          <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            Overall Conversion: {summary.avgConversion}%
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
          {/* Bar Chart */}
          <div className="w-full h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e5e7eb" />
                <XAxis type="number" hide />
                <YAxis dataKey="stage" type="category" tick={{ fontSize: 11, fontWeight: "bold", fill: "#374151" }} axisLine={false} tickLine={false} width={130} />
                <Tooltip
                  formatter={(val) => [val.toLocaleString("id-ID"), "Jumlah"]}
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    borderRadius: "12px",
                    border: "1px solid #e5e7eb",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 8, 8, 0]}>
                  {funnelData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={["#0284c7", "#f59e0b", "#8b5cf6", "#10b981"][index % 4]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Step Cards */}
          <div className="space-y-2.5">
            {funnelData.map((fn, idx) => (
              <div key={fn.stage} className="p-3 border border-border rounded-xl bg-neutral-50 flex justify-between items-center text-xs">
                <div className="flex items-center gap-2.5">
                  <span className="flex items-center justify-center h-6 w-6 rounded-full bg-neutral-200 font-black text-[11px] text-neutral-700">
                    {idx + 1}
                  </span>
                  <span className="font-bold text-foreground">{fn.stage}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-black text-neutral-800">{fn.count.toLocaleString("id-ID")}</span>
                  <span className="bg-neutral-200 text-neutral-800 text-[10px] font-black px-2 py-0.5 rounded-full min-w-[50px] text-center">
                    {fn.pct}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
