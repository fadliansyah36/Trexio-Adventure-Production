import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, formatRupiah } from "@/lib/api";
import {
  Users,
  Path,
  MoneyWavy,
  ClipboardText,
  TrendUp,
  CheckCircle,
} from "@phosphor-icons/react";

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  useEffect(() => {
    api.get("/admin/stats").then((r) => setStats(r.data));
    api.get("/admin/bookings").then((r) => setRecent(Array.isArray(r.data) ? r.data.slice(0, 6) : [])).catch(() => {});
  }, []);

  const cards = stats
    ? [
        {
          label: "Total Booking",
          value: stats.total_bookings,
          icon: ClipboardText,
          color: "text-[hsl(var(--secondary))]",
        },
        {
          label: "Perlu Verifikasi",
          value: stats.pending_payments,
          icon: MoneyWavy,
          color: "text-[hsl(var(--primary))]",
        },
        {
          label: "Terkonfirmasi",
          value: stats.verified_bookings,
          icon: CheckCircle,
          color: "text-[hsl(var(--secondary))]",
        },
        {
          label: "Total User",
          value: stats.total_users,
          icon: Users,
          color: "text-foreground",
        },
        {
          label: "Total Trip",
          value: stats.total_trips,
          icon: Path,
          color: "text-foreground",
        },
        {
          label: "Revenue",
          value: formatRupiah(stats.revenue || 0),
          icon: TrendUp,
          color: "text-[hsl(var(--secondary))]",
        },
      ]
    : [];

  return (
    <div>
      <div className="trx-overline text-muted-foreground">Overview</div>
      <div className="mt-2 flex items-center justify-between">
        <h1 className="text-3xl md:text-4xl font-black tracking-tighter">
          Dashboard Tenant
        </h1>
        <Link
          to="/admin/builder"
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md flex items-center gap-2 transition-all"
        >
          <span>Kustomisasi Landing Page (7 Template)</span> →
        </Link>
      </div>

      {/* Landing Page Builder Promotion Banner */}
      <div className="mt-6 bg-gradient-to-r from-emerald-900 via-emerald-800 to-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border border-emerald-500/30">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 uppercase tracking-widest">
            Fitur Multitenant Terbaru
          </div>
          <h2 className="text-xl font-black tracking-tight">Kustomisasi Halaman Landing Tenant Trexio</h2>
          <p className="text-xs text-emerald-100/80 max-w-2xl leading-relaxed">
            Pilih dari 7 template landing page profesional, sesuaikan urutan section dengan sistem drag/reorder, dan edit teks serta warna secara real-time.
          </p>
        </div>
        <Link
          to="/admin/builder"
          className="px-5 py-3 rounded-xl bg-white text-slate-900 hover:bg-emerald-50 font-black text-xs shadow-lg transition-all shrink-0 cursor-pointer"
        >
          Buka Site Builder Sekarang
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white border border-border rounded-md p-5"
          >
            <div className={`inline-flex ${c.color}`}>
              <c.icon size={20} />
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{c.label}</div>
            <div
              className="mt-1 text-2xl font-black tracking-tight"
              data-testid={`stat-${c.label}`}
            >
              {c.value}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">Booking terbaru</h2>
          <Link
            to="/admin/bookings"
            className="text-sm text-[hsl(var(--secondary))] font-semibold hover:underline"
          >
            Lihat semua
          </Link>
        </div>
        <div className="mt-4 bg-white border border-border rounded-md overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[hsl(var(--muted))]">
              <tr>
                <th className="text-left px-4 py-3">Kode</th>
                <th className="text-left px-4 py-3">Trip</th>
                <th className="text-left px-4 py-3">Status Bayar</th>
                <th className="text-right px-4 py-3">Total</th>
              </tr>
            </thead>
            <tbody>
              {recent.map((b) => (
                <tr key={b.id} className="border-t border-border">
                  <td className="px-4 py-3 font-mono text-xs">
                    {b.booking_code}
                  </td>
                  <td className="px-4 py-3">{b.trip_title}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-semibold">
                      {b.payment_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-bold">
                    {formatRupiah(b.total_amount)}
                  </td>
                </tr>
              ))}
              {recent.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-muted-foreground">
                    Belum ada booking
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
