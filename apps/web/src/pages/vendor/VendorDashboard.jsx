import { useOutletContext, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { api, formatRupiah, safeArray } from "@/lib/api";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import AnalyticsDashboard from "@/components/vendor/AnalyticsDashboard";
import { KPICard, KPIGrid } from "@/components/vendor/KPICard";
import EmptyState from "@/components/EmptyState";
import { CalendarX } from "lucide-react";
import {
  Package,
  ClipboardText,
  TrendUp,
  Wallet,
  Warning,
  ArrowRight,
  Sparkle,
  Clock,
} from "@phosphor-icons/react";

const TYPE_LABEL = {
  organizer: "Open Trip Organizer",
  guide: "Mountain Guide & Porter",
  merchant: "Outdoor Gear Merchant",
  rental: "Rental Gear Provider",
  community: "Adventure Community",
  event_org: "Outdoor Event Organizer",
  basecamp: "Basecamp & Homestay",
};

export default function VendorDashboard() {
  const { vendor } = useOutletContext();
  const [finance, setFinance] = useState(null);
  const [recentBookings, setRecentBookings] = useState([]);
  const [timeFilter, setTimeFilter] = useState("30d");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOverview() {
      try {
        const [fRes, bRes] = await Promise.all([
          api.get("/vendor/finance").catch(() => ({ data: null })),
          api.get("/vendor/bookings").catch(() => ({ data: [] })),
        ]);
        setFinance(fRes.data);
        setRecentBookings(Array.isArray(bRes.data) ? bRes.data.slice(0, 5) : []);
      } finally {
        setLoading(false);
      }
    }
    loadOverview();
  }, []);

  const grossSales = finance?.gross_sales || vendor.stats?.revenue || 0;
  const trexioFee = finance?.trexio_fee !== undefined ? finance.trexio_fee : (finance?.platform_fee ?? 0);
  const netRevenue = finance?.net_revenue !== undefined ? finance.net_revenue : Math.max(0, grossSales - trexioFee);
  const wallet = finance?.wallet || { available_balance: 0, pending_balance: 0 };

  const kpis = [
    { label: "GROSS SALES", value: formatRupiah(grossSales), sub: "Omset kotor sebelum fee", icon: TrendUp, color: "bg-emerald-500 text-white" },
    { label: "NET REVENUE MITRA", value: formatRupiah(netRevenue), sub: "Setelah potongan komisi platform", icon: Wallet, color: "bg-[hsl(var(--primary))] text-white" },
    { label: "SALDO SIAP TARIK", value: formatRupiah(wallet.available_balance), sub: "Tersedia di dompet", icon: Wallet, color: "bg-emerald-900 text-emerald-200" },
    { label: "SALDO PENDING (ESCROW)", value: formatRupiah(wallet.pending_balance), sub: "Trip sedang berjalan", icon: Clock, color: "bg-amber-500 text-white" },
    { label: "TOTAL BOOKING", value: vendor.stats?.total_bookings ?? recentBookings.length, sub: "Seluruh riwayat pendaftaran", icon: ClipboardText, color: "bg-blue-600 text-white" },
    { label: "KATALOG PRODUK", value: vendor.stats?.total_products ?? 0, sub: "Trip & Layanan Aktif", icon: Package, color: "bg-purple-600 text-white" },
  ];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-border rounded-2xl p-6 shadow-sm">
        <div>
          <div className="trx-overline text-muted-foreground">Executive Overview • Trexio Partner Center</div>
          <div className="mt-1 flex items-center flex-wrap gap-2">
            <h1 className="text-2xl md:text-3xl font-black tracking-tighter text-foreground">
              Halo, {vendor.brand_name}
            </h1>
            <VendorVerifiedBadge
              verified={vendor.status === "verified" || vendor.verified}
              status={vendor.status}
              showUnverified={true}
              dataTestId="vendor-dashboard-verified-badge"
            />
          </div>
          <p className="mt-1 text-xs text-muted-foreground max-w-xl">
            {vendor.tagline || "Kelola produk, monitor booking, dan pantau pendapatan Anda dari satu tempat."}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {safeArray(vendor.types).map((t) => (
              <span key={t} data-testid={`vendor-type-${t}`} className="rounded-full bg-neutral-100 border border-neutral-200 px-3 py-0.5 text-[10px] font-bold text-neutral-700 uppercase">
                {TYPE_LABEL[t] || t}
              </span>
            ))}
          </div>
        </div>

        {/* Time Filter */}
        <div className="flex items-center gap-1.5 bg-neutral-100 p-1.5 rounded-xl border border-border text-xs font-bold self-start md:self-auto">
          {["today", "7d", "30d", "month"].map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`px-3 py-1.5 rounded-lg transition-all uppercase ${
                timeFilter === tf ? "bg-white text-foreground shadow-xs font-black" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tf === "today" ? "Hari Ini" : tf === "7d" ? "7 Hari" : tf === "30d" ? "30 Hari" : "Bulan Ini"}
            </button>
          ))}
        </div>
      </div>

      {/* AI Business Copilot Callout Banner */}
      <div className="bg-gradient-to-r from-neutral-900 via-emerald-950 to-neutral-900 text-white border border-emerald-500/30 rounded-2xl p-5 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-2xl border border-emerald-500/30 shrink-0">
            <Sparkle size={28} weight="fill" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                AI Business Copilot
              </span>
              <span className="text-xs font-extrabold text-neutral-300">Grounded Real Data</span>
            </div>
            <h3 className="text-base font-extrabold text-white">Buka Trexio AI Business Copilot Anda</h3>
            <p className="text-xs text-neutral-300 max-w-2xl leading-relaxed">
              Analisis performa produk, konversi booking, harga kompetitif, deteksi demand pasar, optimasi SEO & iklan secara otomatis dari data bisnis Anda.
            </p>
          </div>
        </div>

        <Link
          to="/vendor/ai-copilot"
          className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-neutral-950 font-black text-xs rounded-xl shadow-md transition-all flex items-center gap-2 shrink-0"
        >
          <span>Buka AI Copilot</span>
          <ArrowRight size={14} weight="bold" />
        </Link>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-black uppercase text-amber-900 tracking-wider">
          <Warning weight="fill" size={18} className="text-amber-600" /> Action Center — Perlu Perhatian Anda
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs font-bold">
          <Link to="/vendor/bookings" className="p-3 bg-white border border-amber-200 rounded-xl hover:shadow-sm flex items-center justify-between text-amber-900">
            <span>{recentBookings.filter((b) => b.payment_status === "awaiting_verification" || b.payment_status === "pending").length} Booking Menunggu Verifikasi</span>
            <ArrowRight size={14} />
          </Link>
          <Link to="/vendor/products" className="p-3 bg-white border border-amber-200 rounded-xl hover:shadow-sm flex items-center justify-between text-amber-900">
            <span>{vendor.stats?.total_products || 0} Katalog Produk Terbit</span>
            <ArrowRight size={14} />
          </Link>
          <Link to="/vendor/finance" className="p-3 bg-white border border-amber-200 rounded-xl hover:shadow-sm flex items-center justify-between text-amber-900">
            <span>{finance?.withdrawals?.filter((w) => w.status === "under_review" || w.status === "pending").length || 0} Withdrawal Diproses</span>
            <ArrowRight size={14} />
          </Link>
          <Link to="/vendor/profile" className="p-3 bg-white border border-amber-200 rounded-xl hover:shadow-sm flex items-center justify-between text-amber-900">
            <span>{vendor.cover_image ? "✓ Sampul Storefront Aktif" : "⚠️ Unggah Foto Sampul Brand"}</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KPIGrid>
        <KPICard
          title="Gross Sales"
          value={formatRupiah(grossSales)}
          growth={grossSales > 0 ? "Real Time Data" : "Rp 0"}
          growthType={grossSales > 0 ? "positive" : "neutral"}
          growthLabel="Omset kotor sebelum platform fee"
          icon={TrendUp}
          iconBg="bg-emerald-50 text-emerald-600"
        />
        <KPICard
          title="Net Revenue Mitra"
          value={formatRupiah(netRevenue)}
          growth={netRevenue > 0 ? "Real Time Data" : "Rp 0"}
          growthType={netRevenue > 0 ? "positive" : "neutral"}
          growthLabel="Setelah potongan Trexio 7%"
          icon={Wallet}
          iconBg="bg-primary/10 text-primary"
        />
        <KPICard
          title="Active & Total Bookings"
          value={`${vendor.stats?.total_bookings ?? recentBookings.length} Pax`}
          growth={recentBookings.length > 0 ? "Terverifikasi" : "0 Pax"}
          growthType={recentBookings.length > 0 ? "positive" : "neutral"}
          growthLabel="Pendaftaran terverifikasi"
          icon={ClipboardText}
          iconBg="bg-blue-50 text-blue-600"
        />
        <KPICard
          title="Saldo Siap Tarik"
          value={formatRupiah(wallet.available_balance)}
          growth={wallet.available_balance > 0 ? "Siap Ditarik" : "Rp 0"}
          growthType={wallet.available_balance > 0 ? "positive" : "neutral"}
          growthLabel="Tersedia di dompet payout"
          icon={Wallet}
          iconBg="bg-emerald-100 text-emerald-800"
        />
        <KPICard
          title="Saldo Pending (Escrow)"
          value={formatRupiah(wallet.pending_balance)}
          growth="Dilepas pasca trip"
          growthType="neutral"
          growthLabel="Trip aktif berjalan"
          icon={Clock}
          iconBg="bg-amber-50 text-amber-600"
        />
        <KPICard
          title="Katalog Produk & Layanan"
          value={`${vendor.stats?.total_products ?? 0} Listing`}
          growth="Aktif"
          growthType="neutral"
          growthLabel="Trip, rental, guide, & camp"
          icon={Package}
          iconBg="bg-purple-50 text-purple-600"
        />
      </KPIGrid>

      {/* Visual Analytics & Recharts Performance Section */}
      <AnalyticsDashboard initialRange={timeFilter} showTitle={true} />

      {/* Recent Bookings & Upcoming Trips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-border rounded-2xl p-6 space-y-4 shadow-xs">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider">Booking Terkini Masuk</h2>
            <Link to="/vendor/bookings" className="text-xs font-bold text-[hsl(var(--primary))] hover:underline flex items-center gap-1">
              Lihat Semua Order <ArrowRight size={14} />
            </Link>
          </div>

          {recentBookings.length === 0 ? (
            <EmptyState
              title="Belum Ada Booking Terkini"
              description="Booking dari pendaki atau traveler akan muncul secara otomatis di sini."
              icon={CalendarX}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase border-b border-border">
                  <tr>
                    <th className="px-3 py-2">Kode</th>
                    <th className="px-3 py-2">Trip</th>
                    <th className="px-3 py-2">Pemesan</th>
                    <th className="px-3 py-2 text-center">Status</th>
                    <th className="px-3 py-2 text-right">Gross</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {recentBookings.map((b) => (
                    <tr key={b.id}>
                      <td className="px-3 py-2.5 font-mono font-bold text-[hsl(var(--primary))]">{b.booking_code}</td>
                      <td className="px-3 py-2.5 font-bold truncate max-w-[180px]">{b.trip_title || "Trip Outdoor"}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{b.contact_name}</td>
                      <td className="px-3 py-2.5 text-center">
                        <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {b.payment_status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-black text-emerald-700">{formatRupiah(b.total_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Storefront Link Banner */}
        <div className="bg-gradient-to-br from-[hsl(var(--secondary))] to-emerald-950 text-white rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-xs">
          <div className="space-y-2">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-amber-300">
              <Sparkle weight="fill" size={20} />
            </div>
            <h3 className="font-black text-lg">Storefront Publik Brand Anda</h3>
            <p className="text-xs text-emerald-100/80">
              Bagikan tautan langsung storefront brand Anda ke pelanggan sosial media agar bisa memesan secara langsung.
            </p>
            <div className="p-3 bg-white/10 border border-white/20 rounded-xl font-mono text-xs font-bold text-amber-200 truncate">
              trexio.id/@{vendor.slug || "brand-anda"}
            </div>
          </div>

          <Link
            to="/vendor/settings"
            className="w-full text-center bg-white text-emerald-950 font-black text-xs py-3 rounded-xl hover:bg-neutral-100 transition-all"
          >
            Kelola Profil Storefront & KYC
          </Link>
        </div>
      </div>
    </div>
  );
}
