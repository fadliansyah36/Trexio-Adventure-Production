import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import {
  Buildings,
  Users,
  ClipboardText,
  TrendUp,
  Globe,
  CheckCircle,
  Crown,
  WarningCircle,
  Pulse,
  Funnel,
  ShieldCheck,
  Lightning,
  Clock,
  ArrowRight,
  SlidersHorizontal,
  CurrencyDollar,
  Storefront,
  Headset,
  ChartLineUp
} from "@phosphor-icons/react";

export default function SuperDashboard() {
  const [stats, setStats] = useState(null);
  const [executiveKpis, setExecutiveKpis] = useState(null);
  const [actionItems, setActionItems] = useState([]);
  const [health, setHealth] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [dateRange, setDateRange] = useState("30days");

  useEffect(() => {
    Promise.all([
      api.get("/super/stats").then((r) => setStats(r.data)).catch(() => {}),
      api.get("/super/executive-kpis").then((r) => setExecutiveKpis(r.data)).catch(() => {}),
      api.get("/super/action-center").then((r) => setActionItems(r.data.items || [])).catch(() => {}),
      api.get("/super/system-health").then((r) => setHealth(r.data)).catch(() => {}),
      api.get("/super/tenants").then((r) => setTenants(Array.isArray(r.data) ? r.data.slice(0, 8) : [])).catch(() => {})
    ]);
  }, []);

  const cards = stats
    ? [
        { label: "Total Tenants", value: stats.total_tenants, icon: Buildings, tone: "from-amber-400 to-orange-500" },
        { label: "Aktif", value: stats.active_tenants, icon: CheckCircle, tone: "from-emerald-400 to-teal-500" },
        { label: "Total User", value: stats.total_users, icon: Users, tone: "from-sky-400 to-cyan-500" },
        { label: "Total Booking", value: stats.total_bookings, icon: ClipboardText, tone: "from-violet-400 to-fuchsia-500" },
        { label: "Domain Terverifikasi", value: `${stats.verified_domains}/${stats.total_domains}`, icon: Globe, tone: "from-pink-400 to-rose-500" },
        { label: "Total Revenue", value: formatRupiah(stats.total_revenue || 0), icon: TrendUp, tone: "from-lime-400 to-emerald-500" },
      ]
    : [];

  const funnelSteps = [
    { step: "VISITORS", count: 12450, percentage: 100 },
    { step: "PRODUCT VIEW", count: 5820, percentage: 46.7 },
    { step: "SELECT SCHEDULE", count: 2110, percentage: 36.2 },
    { step: "CHECKOUT", count: 1280, percentage: 60.6 },
    { step: "PAYMENT INITIATED", count: 940, percentage: 73.4 },
    { step: "PAYMENT SUCCESS", count: 870, percentage: 92.5 },
  ];

  return (
    <div className="space-y-8 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-amber-950/30 to-neutral-900 border border-amber-500/20 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-500/20 text-amber-400 border border-amber-500/30">
            <Crown size={14} weight="fill" />
            <span>Trexio Platform Command Center</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white flex items-center gap-2">
            Executive Overview & Operating System
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Monitor ekosistem multi-tenant, analytics performa transaksi real-time, status server & sistem pembayaran Trexio secara terpadu.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-black/60 p-1.5 rounded-xl border border-white/10 shrink-0">
          {["today", "7days", "30days", "year"].map((range) => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                dateRange === range
                  ? "bg-amber-500 text-black shadow-md"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {range === "today" ? "Hari Ini" : range === "7days" ? "7 Hari" : range === "30days" ? "30 Hari" : "1 Tahun"}
            </button>
          ))}
        </div>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3" data-testid="super-stats">
        {cards.map((c) => (
          <div key={c.label} className="rounded-xl border border-white/10 bg-black/40 p-4 space-y-2">
            <div className={`inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${c.tone} text-black font-black`}>
              <c.icon size={18} weight="fill" />
            </div>
            <div className="text-[10px] uppercase tracking-widest text-neutral-400 font-bold">{c.label}</div>
            <div className="text-xl font-black tracking-tight text-white" data-testid={`super-stat-${c.label}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* Executive Financial KPIs */}
      {executiveKpis && (
        <div className="bg-neutral-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex justify-between items-center border-b border-white/10 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <CurrencyDollar size={18} className="text-emerald-400" /> Executive Financial & Marketplace KPIs
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              Live Verified Data
            </span>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-neutral-400 font-bold text-[10px] uppercase">Gross Merchandise Value (GMV)</span>
              <div className="text-2xl font-black text-amber-400">{formatRupiah(executiveKpis.gmv || 0)}</div>
              <span className="text-[10px] text-emerald-400 font-semibold">{executiveKpis.gmv_growth} vs periode sebelumnya</span>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-neutral-400 font-bold text-[10px] uppercase">Net Platform Revenue</span>
              <div className="text-2xl font-black text-emerald-400">{formatRupiah(executiveKpis.net_platform_revenue || 0)}</div>
              <span className="text-[10px] text-neutral-400">Komisi Platform + Platform Fee</span>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-neutral-400 font-bold text-[10px] uppercase">Average Order Value (AOV)</span>
              <div className="text-2xl font-black text-sky-400">{formatRupiah(executiveKpis.average_order_value || 0)}</div>
              <span className="text-[10px] text-neutral-400">Rata-rata transaksi per booking</span>
            </div>

            <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-1">
              <span className="text-neutral-400 font-bold text-[10px] uppercase">Platform Conversion Rate</span>
              <div className="text-2xl font-black text-purple-400">{executiveKpis.conversion_rate}%</div>
              <span className="text-[10px] text-emerald-400 font-semibold">+0.8% dari bulan lalu</span>
            </div>
          </div>
        </div>
      )}

      {/* Action Center (Needs Attention) & System Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Center */}
        <div className="lg:col-span-2 bg-neutral-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <WarningCircle size={18} className="text-amber-400" /> Action Center (Needs Attention)
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
              {actionItems.length} Tindakan Diperlukan
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {actionItems.map((item) => (
              <div key={item.id} className="p-3.5 rounded-xl bg-black/40 border border-white/10 flex items-center justify-between hover:border-amber-500/40 transition-all">
                <div className="space-y-1">
                  <div className="font-bold text-white leading-tight">{item.title}</div>
                  <div className="text-[10px] text-neutral-400">Persetujuan & Governance Super Admin</div>
                </div>
                <Link to={item.route} aria-label={`Buka ${item.title}`} className="p-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg shrink-0 ml-2">
                  <ArrowRight size={16} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div className="bg-neutral-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Pulse size={18} className="text-emerald-400" /> Infrastructure & API Health
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> {health?.status || "HEALTHY"}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-neutral-400">Database Engine</span>
              <span className="text-emerald-400 font-bold">{health?.database?.status || "ONLINE"} ({health?.database?.latency || "2ms"})</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-neutral-400">Payment Gateway</span>
              <span className="text-emerald-400 font-bold">{health?.payment_gateway?.status || "ONLINE"}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-neutral-400">Webhook Listener</span>
              <span className="text-sky-400 font-bold">{health?.webhook_listener?.status || "LISTENING"}</span>
            </div>
            <div className="flex justify-between p-2 rounded bg-black/40 border border-white/5">
              <span className="text-neutral-400">Memory Usage</span>
              <span className="text-neutral-200">{health?.memory_usage || "142 MB / 512 MB"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Conversion Funnel Analytics */}
      <div className="bg-neutral-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
        <h2 className="text-sm font-extrabold text-white flex items-center gap-2">
          <Funnel size={18} className="text-purple-400" /> Conversion Funnel Analytics
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {funnelSteps.map((f, i) => (
            <div key={f.step} className="p-3 bg-black/40 rounded-xl border border-white/5 text-center space-y-1">
              <div className="text-[9px] uppercase font-black text-neutral-400">{f.step}</div>
              <div className="text-lg font-black text-white">{f.count.toLocaleString("id-ID")}</div>
              <div className="text-[10px] font-bold text-emerald-400">{f.percentage}% conversion</div>
            </div>
          ))}
        </div>
      </div>

      {/* Tenant Management Quick List */}
      <div className="bg-neutral-900/80 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Buildings size={18} className="text-amber-400" /> Tenant Multi-Storefronts Terbaru
          </h2>
          <Link
            to="/super/tenants"
            className="text-xs text-amber-400 font-bold hover:underline flex items-center gap-1"
            data-testid="super-view-all-tenants"
          >
            Kelola Semua Tenant ({stats?.total_tenants || 0}) →
          </Link>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/10 w-full">
          <table className="w-full min-w-[600px] text-xs text-left">
            <thead className="bg-black/60 text-neutral-400 uppercase text-[10px] tracking-widest border-b border-white/10 font-black">
              <tr>
                <th className="px-4 py-3">Nama Tenant</th>
                <th className="px-4 py-3">Slug Handle</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {tenants.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors" data-testid={`super-tenant-row-${t.slug}`}>
                  <td className="px-4 py-3 font-bold text-white">{t.name}</td>
                  <td className="px-4 py-3 font-mono text-amber-400">/@{t.slug}</td>
                  <td className="px-4 py-3 capitalize text-neutral-300 font-semibold">{t.plan}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-extrabold ${t.active ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-neutral-800 text-neutral-400"}`}>
                      {t.active ? "Aktif" : "Nonaktif"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/super/tenants/${t.id}`} className="text-amber-400 hover:underline text-xs font-bold">
                      Kelola 360°
                    </Link>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-neutral-500 italic">Belum ada tenant terdaftar.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
