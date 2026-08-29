import { useEffect, useState } from "react";
import { api, formatRupiah, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { DownloadSimple } from "@phosphor-icons/react";
import { exportAdminBookingsCSV } from "@/lib/exportCsv";

const STATUS_LABEL = {
  pending: "Menunggu Bayar",
  awaiting_verification: "Verifikasi",
  verified: "Terkonfirmasi",
  rejected: "Ditolak",
};

export default function AdminBookings() {
  const [items, setItems] = useState([]);
  const [status, setStatus] = useState("all");

  async function load() {
    const params = status !== "all" ? { status } : {};
    const { data } = await api.get("/admin/bookings", { params });
    setItems(data);
  }
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function setBookingStatus(id, s) {
    try {
      await api.post(`/admin/bookings/${id}/status`, { status: s });
      toast.success("Status booking diperbarui");
      load();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal");
    }
  }

  return (
    <div>
      <div className="trx-overline text-muted-foreground">Operasional</div>
      <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">
        Manajemen Booking
      </h1>
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger data-testid="admin-status-filter" className="w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua status</SelectItem>
              <SelectItem value="pending">Menunggu bayar</SelectItem>
              <SelectItem value="awaiting_verification">Menunggu verifikasi</SelectItem>
              <SelectItem value="verified">Terkonfirmasi</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>
          <div className="text-sm text-muted-foreground">
            {items.length} booking
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => {
            if (!items || items.length === 0) {
              toast.error("Tidak ada data booking untuk di-export.");
              return;
            }
            exportAdminBookingsCSV(items);
            toast.success("Laporan booking CSV berhasil di-download!");
          }}
          className="flex items-center gap-2 border-border text-xs font-bold py-2 rounded-xl cursor-pointer"
        >
          <DownloadSimple size={16} className="text-emerald-600" />
          <span>Export CSV</span>
        </Button>
      </div>

      <div className="mt-6 bg-white border border-border rounded-md overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[hsl(var(--muted))]">
            <tr>
              <th className="text-left px-4 py-3">Kode</th>
              <th className="text-left px-4 py-3">User</th>
              <th className="text-left px-4 py-3">Trip</th>
              <th className="text-left px-4 py-3">Tanggal</th>
              <th className="text-left px-4 py-3">Bayar</th>
              <th className="text-left px-4 py-3">Booking</th>
              <th className="text-right px-4 py-3">Total</th>
              <th className="px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {items.map((b) => (
              <tr key={b.id} className="border-t border-border">
                <td className="px-4 py-3 font-mono text-xs">{b.booking_code}</td>
                <td className="px-4 py-3">{b.contact_name}</td>
                <td className="px-4 py-3">{b.trip_title}</td>
                <td className="px-4 py-3">
                  {new Date(b.departure_date).toLocaleDateString("id-ID")}
                </td>
                <td className="px-4 py-3 text-xs font-semibold">
                  {STATUS_LABEL[b.payment_status] || b.payment_status}
                </td>
                <td className="px-4 py-3 text-xs">{b.booking_status}</td>
                <td className="px-4 py-3 text-right font-bold">
                  {formatRupiah(b.total_amount)}
                </td>
                <td className="px-4 py-3">
                  <Select
                    value={b.booking_status}
                    onValueChange={(v) => setBookingStatus(b.id, v)}
                  >
                    <SelectTrigger className="w-[160px] h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending_payment">Pending Payment</SelectItem>
                      <SelectItem value="confirmed">Confirmed</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={8} className="text-center py-10 text-muted-foreground">
                  Tidak ada data.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
