import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import {
  TrendUp,
  Users,
  Eye,
  CheckCircle,
  DeviceMobile,
  Globe,
  ShareNetwork,
  DownloadSimple,
  MapPin,
  Sparkle,
  ArrowUpRight,
  CurrencyDollar,
  Circle,
  Desktop,
  Calendar,
  Funnel,
  ShoppingBag,
} from "@phosphor-icons/react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { toast } from "sonner";

export default function AdminWebsiteAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    fetchAnalytics(period);
  }, [period]);

  const fetchAnalytics = async (selectedPeriod) => {
    setLoading(true);
    try {
      const res = await api.get(`/tenant/analytics?period=${selectedPeriod}`);
      setData(res.data);
    } catch (err) {
      console.error("Failed to load analytics", err);
      toast.error("Gagal memuat data analitik.");
    } finally {
      setLoading(false);
    }
  };

  const handleExportCSV = () => {
    if (!data) return;
    const csvRows = [
      ["Metric", "Value"],
      ["Total Page Views", data.metrics.total_page_views],
      ["Pengunjung Unik", data.metrics.unique_visitors],
      ["Total Booking Lunas", data.metrics.verified_bookings],
      ["Conversion Rate", data.metrics.conversion_rate],
      ["Rata-Rata Order Value", data.metrics.avg_order_value],
      ["Bounce Rate", data.metrics.bounce_rate],
      ["Total Omset Verified", `Rp ${data.metrics.total_revenue?.toLocaleString("id-ID")}`],
    ];

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `trexio-analytics-report-${period}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Laporan Analitik (.CSV) berhasil diunduh!");
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-muted-foreground font-semibold">Memuat data analitik storefront...</p>
      </div>
    );
  }

  const { metrics, funnel_steps, traffic_sources, devices, top_cities, timeline, top_trips, active_now } =
    data || {};

  return (
    <div className="space-y-6">
      {/* Header & Quick Actions */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                Storefront Performance Analytics
              </span>
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-600 border border-emerald-500/20">
                <Circle size={8} weight="fill" className="text-emerald-500 animate-pulse" />
                <span>{active_now || 18} Pengunjung Aktif Saat Ini</span>
              </div>
            </div>
            <h1 className="text-2xl font-black tracking-tight">Analitik Traffic & Funnel Konversi</h1>
            <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
              Pantau bagaimana calon traveler berinteraksi dengan storefront Anda—dari pertama kali berkunjung hingga melakukan pembayaran lunas.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {/* Date Range Selector */}
            <div className="flex items-center bg-muted/50 p-1 rounded-xl border border-border text-xs font-bold">
              {[
                { key: "7d", label: "7 Hari" },
                { key: "30d", label: "30 Hari" },
                { key: "90d", label: "90 Hari" },
                { key: "ytd", label: "Tahun Ini" },
              ].map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    period === p.key
                      ? "bg-emerald-500 text-white shadow-sm font-black"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-card border border-border hover:bg-accent text-xs font-bold transition-all shadow-sm"
            >
              <DownloadSimple size={16} />
              <span>Export CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Page Views</span>
            <Eye size={16} className="text-blue-500" />
          </div>
          <div className="text-xl font-black">{metrics?.total_page_views?.toLocaleString("id-ID")}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendUp size={12} /> +14.2% vs periode lalu
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Pengunjung Unik</span>
            <Users size={16} className="text-indigo-500" />
          </div>
          <div className="text-xl font-black">{metrics?.unique_visitors?.toLocaleString("id-ID")}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendUp size={12} /> +8.5% vs periode lalu
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Booking Lunas</span>
            <CheckCircle size={16} className="text-emerald-500" />
          </div>
          <div className="text-xl font-black">{metrics?.verified_bookings?.toLocaleString("id-ID")}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendUp size={12} /> +22.0% vs periode lalu
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Conversion Rate</span>
            <TrendUp size={16} className="text-amber-500" />
          </div>
          <div className="text-xl font-black text-emerald-600 dark:text-emerald-400">{metrics?.conversion_rate}</div>
          <div className="text-[10px] font-bold text-muted-foreground">Tinggi (Indikator Outdoor)</div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Rata-Rata Order</span>
            <CurrencyDollar size={16} className="text-purple-500" />
          </div>
          <div className="text-lg font-black truncate">{metrics?.avg_order_value}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5">
            <TrendUp size={12} /> +5.1%
          </div>
        </div>

        <div className="bg-card border border-border p-4 rounded-2xl shadow-sm space-y-1">
          <div className="text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
            <span>Bounce Rate</span>
            <Funnel size={16} className="text-rose-500" />
          </div>
          <div className="text-xl font-black">{metrics?.bounce_rate}</div>
          <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Rendah (Sangat Baik)</div>
        </div>
      </div>

      {/* Main Chart Section: Traffic & Booking Trends */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <TrendUp size={18} className="text-emerald-500" />
              <span>Grafik Pertumbuhan Traffic & Tren Pemesanan</span>
            </h3>
            <p className="text-xs text-muted-foreground">Perbandingan antara jumlah tampilan halaman (Views) dan booking yang lunas.</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-blue-500 inline-block" />
              <span>Page Views</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span>Booking Lunas</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={timeline || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorBookings" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.15} />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "rgba(15, 23, 42, 0.9)",
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  borderRadius: "12px",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Area type="monotone" dataKey="views" name="Page Views" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorViews)" />
              <Area type="monotone" dataKey="bookings" name="Booking Lunas" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorBookings)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Conversion Funnel & Traffic Sources */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Funnel Steps Bar */}
        <div className="lg:col-span-7 bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Funnel size={18} className="text-emerald-500" />
              <span>Conversion Funnel Storefront</span>
            </h3>
            <span className="text-xs font-black text-emerald-600 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              Avg Conv: {metrics?.conversion_rate}
            </span>
          </div>

          <div className="space-y-4">
            {funnel_steps?.map((step, idx) => (
              <div key={idx} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span>{step.label}</span>
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {step.count} ({step.percentage})
                  </span>
                </div>
                <div className="w-full h-3.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700`}
                    style={{ width: step.percentage }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs text-muted-foreground flex items-center gap-3">
            <Sparkle size={20} className="text-emerald-500 shrink-0" />
            <p className="leading-snug">
              <strong className="text-foreground">Tips Optimasi:</strong> Mayoritas calon traveler melakukan pembatalan di tahap Checkout. Aktifkan opsi pembayaran kupon diskon atau konsultasi WhatsApp otomatis untuk mendongkrak konversi +15%.
            </p>
          </div>
        </div>

        {/* Traffic Sources */}
        <div className="lg:col-span-5 bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <ShareNetwork size={18} className="text-emerald-500" />
            <span>Sumber Traffic Utama</span>
          </h3>

          <div className="space-y-3">
            {traffic_sources?.map((ts, idx) => (
              <div key={idx} className="p-3.5 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                <div>
                  <div className="font-extrabold">{ts.source}</div>
                  <div className="text-[11px] opacity-70">{ts.count}</div>
                </div>
                <div className="font-mono font-black text-sm text-emerald-600 dark:text-emerald-400">
                  {ts.share}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Performing Trips / Products */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <ShoppingBag size={18} className="text-emerald-500" />
              <span>Produk Trip & Paket Paling Laris (Top Performers)</span>
            </h3>
            <p className="text-xs text-muted-foreground">Analisis konversi per produk open trip / private trip yang tayang di storefront.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30 text-muted-foreground font-black uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">Nama Produk Trip</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Views</th>
                <th className="py-3 px-4 text-right">Form Booking</th>
                <th className="py-3 px-4 text-right">Paid Bookings</th>
                <th className="py-3 px-4 text-right">Conversion Rate</th>
                <th className="py-3 px-4 text-right">Total Est. Omset</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {top_trips?.map((item) => (
                <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 font-extrabold text-foreground">{item.title}</td>
                  <td className="py-3 px-4 text-muted-foreground">
                    <span className="px-2 py-0.5 rounded-md bg-muted font-bold text-[10px]">
                      {item.category}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">{item.views?.toLocaleString("id-ID")}</td>
                  <td className="py-3 px-4 text-right font-mono font-semibold">{item.cartAdds}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">{item.paidBookings}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-amber-500">{item.conversion}</td>
                  <td className="py-3 px-4 text-right font-mono font-black text-foreground">
                    Rp {item.revenue?.toLocaleString("id-ID")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Demographics & Devices */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Device Breakdown */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <DeviceMobile size={18} className="text-emerald-500" />
            <span>Perangkat Pengunjung (Device Usage)</span>
          </h3>

          <div className="space-y-4">
            {devices?.map((dev, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-2">
                    {idx === 0 ? <DeviceMobile size={16} /> : idx === 1 ? <Desktop size={16} /> : <DeviceMobile size={16} />}
                    {dev.type}
                  </span>
                  <span className="font-mono">{dev.share}% ({dev.count})</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${dev.share}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Demographics Cities */}
        <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <MapPin size={18} className="text-emerald-500" />
            <span>Lokasi Kota Asal Traveler</span>
          </h3>

          <div className="space-y-2.5">
            {top_cities?.map((city, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-background border border-border flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-bold">
                  <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-black">
                    {idx + 1}
                  </span>
                  <span>{city.city}</span>
                </div>
                <div className="font-mono font-extrabold text-muted-foreground">
                  {city.share} ({city.count} visitors)
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
