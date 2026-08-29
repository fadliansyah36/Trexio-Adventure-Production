import { useEffect, useState } from "react";
import { useOutletContext, useSearchParams } from "react-router-dom";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import { ClipboardText, Lock, QrCode, CheckCircle, Clock, FileText, User, DownloadSimple, CheckSquare } from "@phosphor-icons/react";
import { toast } from "sonner";
import { exportVendorBookingsCSV } from "@/lib/exportCsv";
import EmptyState from "@/components/EmptyState";
import { ClipboardX } from "lucide-react";
import CameraQrScanner from "@/components/CameraQrScanner";

const STATUS_COLOR = {
  verified: "bg-emerald-100 text-emerald-800 border-emerald-200",
  paid: "bg-emerald-100 text-emerald-800 border-emerald-200",
  awaiting_verification: "bg-amber-100 text-amber-800 border-amber-200",
  pending: "bg-neutral-100 text-neutral-700 border-neutral-200",
  rejected: "bg-rose-100 text-rose-800 border-rose-200",
  cancelled: "bg-rose-100 text-rose-800 border-rose-200",
};

export default function VendorBookings() {
  const { vendor } = useOutletContext();
  const [searchParams] = useSearchParams();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("all");
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [checkinCodeInput, setCheckinCodeInput] = useState("");
  const [showCheckinModal, setShowCheckinModal] = useState(false);

  useEffect(() => {
    loadBookings();
    if (searchParams.get("action") === "checkin") {
      setShowCheckinModal(true);
    }
  }, [searchParams]);

  async function loadBookings() {
    setLoading(true);
    try {
      const r = await api.get("/vendor/bookings");
      setBookings(Array.isArray(r.data) ? r.data : []);
    } catch {
      setBookings([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleCheckinSubmit(e) {
    e.preventDefault();
    if (!checkinCodeInput.trim()) return;
    try {
      const res = await api.post("/vendor/checkin", { booking_code: checkinCodeInput.trim() });
      toast.success(res.data.message || "Check-in berhasil!");
      setCheckinCodeInput("");
      setShowCheckinModal(false);
      loadBookings();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Kode booking tidak ditemukan.");
    }
  }

  async function handleCheckinDirect(code) {
    try {
      const res = await api.post("/vendor/checkin", { booking_code: code });
      toast.success(res.data.message || "Check-in berhasil!");
      loadBookings();
      if (selectedBooking && selectedBooking.booking_code === code) {
        setSelectedBooking({ ...selectedBooking, checked_in: true, checkin_time: new Date().toISOString() });
      }
    } catch (e) {
      toast.error("Gagal melakukan check-in.");
    }
  }

  const filtered = tab === "all" ? bookings : bookings.filter((b) => b.payment_status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="trx-overline text-muted-foreground">Order & Check-in</div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Manajemen Booking & Manifest Peserta</h1>
          <p className="text-xs text-muted-foreground mt-1">Pantau seluruh pendaftaran peserta, detail keuangan booking, dan lakukkan check-in di lokasi.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              if (!filtered || filtered.length === 0) {
                toast.error("Tidak ada data booking untuk di-export.");
                return;
              }
              exportVendorBookingsCSV(filtered, vendor?.brand_name || "Vendor");
              toast.success("Laporan booking CSV berhasil di-download!");
            }}
            className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-extrabold text-xs px-4 py-2.5 rounded-xl hover:bg-muted shadow-xs transition-all cursor-pointer"
          >
            <DownloadSimple size={18} className="text-emerald-600" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => setShowCheckinModal(true)}
            className="inline-flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-extrabold text-xs px-5 py-2.5 rounded-xl hover:opacity-90 shadow-sm transition-all cursor-pointer"
          >
            <QrCode size={18} /> Scan / Input Check-In Pass
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-2 text-xs font-bold overflow-x-auto pb-2">
        {[
          { id: "all", label: "Semua Order" },
          { id: "verified", label: "Terverifikasi / Paid" },
          { id: "awaiting_verification", label: "Menunggu Verifikasi" },
          { id: "pending", label: "Pending Payment" },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded-lg transition-all shrink-0 ${
              tab === t.id ? "bg-[hsl(var(--secondary))] text-white" : "bg-white border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label} ({t.id === "all" ? bookings.length : bookings.filter((b) => b.payment_status === t.id).length})
          </button>
        ))}
      </div>

      {/* Table Bookings */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-8 text-center text-xs text-neutral-500 font-bold">Memuat daftar booking...</div>
        ) : filtered.length === 0 ? (
          <EmptyState
            title="Belum Ada Booking Masuk"
            description="Pendaftaran peserta dan order booking baru di kategori ini akan tampil di sini."
            icon={ClipboardX}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-border">
                <tr>
                  <th className="px-4 py-3">Kode Order</th>
                  <th className="px-4 py-3">Judul Trip / Paket</th>
                  <th className="px-4 py-3">Kontak Pemesan</th>
                  <th className="px-4 py-3 text-center">Peserta</th>
                  <th className="px-4 py-3">Tgl Berangkat</th>
                  <th className="px-4 py-3">Status Bayar</th>
                  <th className="px-4 py-3 text-center">Check-In</th>
                  <th className="px-4 py-3 text-right">Nilai Kotor</th>
                  <th className="px-4 py-3 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((b) => (
                  <tr key={b.id} className="hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[hsl(var(--primary))]">{b.booking_code}</td>
                    <td className="px-4 py-3 font-bold text-foreground max-w-[200px] truncate">{b.trip_title || "—"}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      <div className="font-semibold text-foreground">{b.contact_name}</div>
                      <div className="text-[11px]">{b.contact_email}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-extrabold">{b.quantity} Pax</td>
                    <td className="px-4 py-3 text-muted-foreground font-medium">{b.departure_date ? formatDateID(b.departure_date) : "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${STATUS_COLOR[b.payment_status] || "bg-neutral-100"}`}>
                        {b.payment_status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {b.checked_in ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle weight="fill" size={12} /> Checked In
                        </span>
                      ) : (
                        <button
                          onClick={() => handleCheckinDirect(b.booking_code)}
                          className="text-[11px] font-bold text-[hsl(var(--primary))] hover:underline"
                        >
                          Check In Now
                        </button>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-black text-emerald-700">{formatRupiah(b.total_amount)}</td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="px-3 py-1 font-bold bg-neutral-100 border border-neutral-200 rounded-lg text-foreground hover:bg-neutral-200"
                      >
                        Detail & Manifest
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Detail & Manifest */}
      {selectedBooking && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
          <div className="relative bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
              <div>
                <div className="text-[10px] uppercase font-bold text-muted-foreground">Detail Booking Pass</div>
                <h3 className="font-black text-base sm:text-lg text-foreground font-mono">#{selectedBooking.booking_code}</h3>
              </div>
              <button onClick={() => setSelectedBooking(null)} className="text-muted-foreground hover:text-foreground font-bold p-1">✕</button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 text-xs pr-1">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1.5 border border-border">
                  <div className="font-bold uppercase text-neutral-500 text-[10px]">Informasi Trip</div>
                  <div className="font-extrabold text-sm text-foreground">{selectedBooking.trip_title || "Expedisi Outdoor"}</div>
                  <div>Keberangkatan: <span className="font-bold">{selectedBooking.departure_date ? formatDateID(selectedBooking.departure_date) : "—"}</span></div>
                  <div>Jumlah Peserta: <span className="font-bold">{selectedBooking.quantity} Pax</span></div>
                </div>

                <div className="p-3.5 bg-neutral-50 rounded-xl space-y-1.5 border border-border">
                  <div className="font-bold uppercase text-neutral-500 text-[10px]">Kontak Pemesan</div>
                  <div className="font-extrabold text-sm text-foreground">{selectedBooking.contact_name}</div>
                  <div>Email: <span className="font-bold break-all">{selectedBooking.contact_email}</span></div>
                  <div>No. WA/Telp: <span className="font-bold">{selectedBooking.contact_phone || "081234567890"}</span></div>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-3.5 border border-emerald-200 bg-emerald-50/50 rounded-xl space-y-1.5 text-xs">
                <div className="font-bold uppercase text-emerald-800 text-[10px]">Financial Breakdown Booking Ini</div>
                <div className="flex justify-between font-medium text-emerald-950">
                  <span>Nilai Transaksi Kotor (Gross Amount)</span>
                  <span className="font-bold">{formatRupiah(selectedBooking.total_amount)}</span>
                </div>
                <div className="flex justify-between font-medium text-rose-700">
                  <span>Potongan Komisi Platform Trexio (7%)</span>
                  <span className="font-bold">-{formatRupiah(Math.round((selectedBooking.total_amount || 0) * 0.07))}</span>
                </div>
                <div className="flex justify-between font-black text-emerald-900 border-t border-emerald-200 pt-2 text-sm">
                  <span>Pendapatan Bersih Mitra (Net Revenue)</span>
                  <span>{formatRupiah(Math.round((selectedBooking.total_amount || 0) * 0.93))}</span>
                </div>
              </div>

              {/* Preparation Packing Checklist Status */}
              <div className="space-y-2 text-xs">
                <div className="font-bold uppercase text-neutral-500 text-[10px] flex items-center justify-between">
                  <span>Checklist Kesiapan Perlengkapan Peserta</span>
                  <span className="text-emerald-600 font-extrabold">
                    {selectedBooking.prep_progress ?? (selectedBooking.packing_checklist ? Math.round((selectedBooking.packing_checklist.filter(i=>i.checked).length / selectedBooking.packing_checklist.length)*100) : 0)}% Ready
                  </span>
                </div>
                <div className="p-3 border border-border rounded-xl bg-neutral-50/70 space-y-2">
                  {selectedBooking.packing_checklist && selectedBooking.packing_checklist.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[11px]">
                      {selectedBooking.packing_checklist.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 font-medium truncate">
                          {item.checked ? (
                            <CheckSquare size={14} weight="fill" className="text-emerald-600 shrink-0" />
                          ) : (
                            <span className="w-3.5 h-3.5 border border-neutral-300 rounded-sm shrink-0 inline-block" />
                          )}
                          <span className={item.checked ? "line-through text-neutral-500 truncate" : "text-neutral-800 truncate"}>
                            {item.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-muted-foreground text-[11px] italic">Belum ada item checklist khusus.</div>
                  )}
                </div>
              </div>

              {/* Manifest Peserta */}
              <div className="space-y-2 text-xs">
                <div className="font-bold uppercase text-neutral-500 text-[10px]">Manifest Daftar Peserta (Operasional)</div>
                <div className="p-3 border border-border rounded-xl space-y-2">
                  {Array.from({ length: selectedBooking.quantity || 1 }).map((_, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-2 text-xs font-semibold p-2 bg-neutral-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <User size={16} className="text-muted-foreground shrink-0" />
                        <span>Peserta #{idx + 1}: {idx === 0 ? selectedBooking.contact_name : `Peserta Pendamping ${idx + 1}`}</span>
                      </div>
                      <span className="text-[11px] text-muted-foreground">E-Ticket & Simaksi Terverifikasi</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="shrink-0 flex justify-end items-center gap-2 pt-3 border-t border-border mt-3">
              {selectedBooking.checked_in && selectedBooking.trip_status !== 'COMPLETED' && (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      const res = await api.post(`/vendor/bookings/${selectedBooking.id || selectedBooking.booking_code}/complete-trip`);
                      toast.success(res.data.message || "Trip pendakian berhasil dikonfirmasi selesai!");
                      setSelectedBooking(null);
                      loadBookings();
                    } catch (err) {
                      toast.error(err?.response?.data?.detail || "Gagal mengonfirmasi trip selesai.");
                    }
                  }}
                  className="px-4 py-2 font-extrabold text-xs bg-emerald-700 text-white rounded-xl hover:bg-emerald-800 transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <CheckCircle size={15} weight="bold" /> Konfirmasi Selesai Trip
                </button>
              )}
              <button
                onClick={() => setSelectedBooking(null)}
                className="px-4 py-2 font-bold text-xs border border-border rounded-xl hover:bg-neutral-100"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Checkin Scan */}
      {showCheckinModal && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 lg:pb-6 overflow-y-auto min-h-screen">
          <div className="relative bg-card border border-border rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[92vh] flex flex-col">
            <CameraQrScanner
              title="Scanner Camera Basecamp Trexio"
              onClose={() => setShowCheckinModal(false)}
              onScanSuccess={async (scannedCode) => {
                setShowCheckinModal(false);
                await handleCheckinDirect(scannedCode);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
