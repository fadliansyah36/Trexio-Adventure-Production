import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { QrCode, ShieldCheck, DownloadSimple, Copy, Check, X, Compass, Ticket, User, Sparkle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function UserQrPassModal({ isOpen, onClose, initialBookingCode = null }) {
  const [loading, setLoading] = useState(true);
  const [qrData, setQrData] = useState(null);
  const [activeTab, setActiveTab] = useState("pass"); // "pass" | "booking"
  const [selectedBookingCode, setSelectedBookingCode] = useState(initialBookingCode);
  const [singleBookingQr, setSingleBookingQr] = useState(null);
  const [loadingSingleBooking, setLoadingSingleBooking] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchUserQr();
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialBookingCode) {
      setSelectedBookingCode(initialBookingCode);
      setActiveTab("booking");
      fetchBookingQr(initialBookingCode);
    }
  }, [initialBookingCode]);

  async function fetchUserQr() {
    setLoading(true);
    try {
      const { data } = await api.get("/users/me/qr");
      setQrData(data);
      if (!selectedBookingCode && data.active_booking) {
        setSelectedBookingCode(data.active_booking.booking_code);
      }
    } catch (err) {
      toast.error("Gagal memuat Digital QR Pass");
    } finally {
      setLoading(false);
    }
  }

  async function fetchBookingQr(code) {
    if (!code) return;
    setLoadingSingleBooking(true);
    try {
      const { data } = await api.get(`/bookings/code/${code}/qr`);
      setSingleBookingQr(data);
    } catch (err) {
      setSingleBookingQr(null);
    } finally {
      setLoadingSingleBooking(false);
    }
  }

  function handleSelectBooking(code) {
    setSelectedBookingCode(code);
    fetchBookingQr(code);
  }

  function handleCopyCode(code) {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopied(true);
    toast.success("Kode verifikasi berhasil disalin!");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownloadQr(dataUrl, filename) {
    if (!dataUrl) return;
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    toast.success("QR Code berhasil diunduh ke galeri Anda!");
  }

  if (!isOpen) return null;

  const currentQrImage = activeTab === "pass" ? qrData?.qr_image : singleBookingQr?.qr_image || qrData?.qr_image;
  const currentCode = activeTab === "pass" ? qrData?.ver_code : selectedBookingCode || qrData?.ver_code;

  return (
    <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto">
      <div className="bg-card border border-border rounded-3xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-2xl animate-in zoom-in-95 my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="shrink-0 flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2 font-black text-base text-foreground">
            <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <QrCode size={20} weight="bold" />
            </div>
            <span>Digital QR Pass Pendaki</span>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
            <p className="text-xs text-muted-foreground font-medium">Menyiapkan Kode QR Verifikasi...</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1">
            {/* Tab Selector */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-muted/60 rounded-xl border border-border text-xs font-bold">
              <button
                onClick={() => setActiveTab("pass")}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "pass"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <User size={15} weight="bold" /> Pass Identitas
              </button>
              <button
                onClick={() => {
                  setActiveTab("booking");
                  if (selectedBookingCode) fetchBookingQr(selectedBookingCode);
                }}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === "booking"
                    ? "bg-card text-emerald-600 dark:text-emerald-400 shadow-xs border border-border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Ticket size={15} weight="bold" /> QR Booking Trip ({qrData?.total_bookings || 0})
              </button>
            </div>

            {/* Booking Selector Dropdown if Booking tab selected */}
            {activeTab === "booking" && (qrData?.user_bookings || []).length > 0 && (
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-muted-foreground uppercase">Pilih Tiket Booking Trip:</label>
                <select
                  value={selectedBookingCode || ""}
                  onChange={(e) => handleSelectBooking(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-semibold text-foreground focus:ring-2 focus:ring-emerald-500"
                >
                  {qrData.user_bookings.map((b) => (
                    <option key={b.id || b.booking_code} value={b.booking_code}>
                      {b.booking_code} — {b.trip_title || b.product_title || "Trip Pendaki"} ({b.payment_status || "Verified"})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Main QR Card Container */}
            <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white rounded-2xl p-5 text-center space-y-4 shadow-lg border border-emerald-500/30 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300" />

              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider text-emerald-200 border-b border-white/10 pb-2">
                <span className="flex items-center gap-1">
                  <ShieldCheck size={14} className="text-emerald-400" /> TREXIO VERIFIED PASS
                </span>
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-300">
                  {activeTab === "pass" ? "MEMBER PASS" : "E-TICKET TRIP"}
                </span>
              </div>

              {/* QR Image Box */}
              <div className="bg-white p-3.5 sm:p-4 rounded-2xl inline-block shadow-xl mx-auto border-4 border-emerald-400/30">
                {loadingSingleBooking ? (
                  <div className="w-44 h-44 flex flex-col items-center justify-center space-y-2 text-neutral-800">
                    <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[10px] font-bold">Membuat QR...</span>
                  </div>
                ) : currentQrImage ? (
                  <img
                    src={currentQrImage}
                    alt="TREXIO Digital QR Code"
                    className="w-44 h-44 object-contain mx-auto rounded-lg"
                  />
                ) : (
                  <div className="w-44 h-44 bg-neutral-100 flex items-center justify-center text-xs text-neutral-500 font-bold">
                    QR Tidak Tersedia
                  </div>
                )}
              </div>

              {/* Code & Title */}
              <div className="space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <span className="font-mono font-black text-lg text-emerald-300 tracking-wider">
                    {currentCode}
                  </span>
                  <button
                    onClick={() => handleCopyCode(currentCode)}
                    aria-label="Salin Kode"
                    className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-emerald-200 transition-colors"
                    title="Salin Kode"
                  >
                    {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <div className="text-xs font-bold text-slate-200">
                  {activeTab === "pass"
                    ? `${qrData?.user?.name || "Pendaki Trexio"} (${qrData?.user?.level_pendaki || "Pendaki Regular"})`
                    : singleBookingQr?.booking?.trip_title || qrData?.active_booking?.trip_title || "Belum Ada Tiket Booking Active"}
                </div>
              </div>

              <p className="text-[10px] text-emerald-200/80 leading-relaxed font-medium pt-1 border-t border-white/10">
                Tunjukkan QR Code ini kepada vendor/basecamp partner Trexio untuk verifikasi check-in instan di lokasi.
              </p>
            </div>

            {/* Actions */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() =>
                  handleDownloadQr(
                    currentQrImage,
                    `TREXIO_QR_${currentCode || "PASS"}.png`
                  )
                }
                className="py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-xs transition-all"
              >
                <DownloadSimple size={16} weight="bold" /> Unduh QR Image
              </button>
              <button
                onClick={() => handleCopyCode(currentCode)}
                className="py-2.5 px-3 border border-border bg-muted/40 hover:bg-muted text-foreground font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                {copied ? "Tersalin!" : "Salin Kode"}
              </button>
            </div>

            {/* Tip Banner */}
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 flex items-start gap-2 text-[11px] text-amber-700 dark:text-amber-300">
              <Sparkle size={16} className="shrink-0 mt-0.5 text-amber-500" />
              <span>
                <strong>Tips Basecamp:</strong> Naikkan tingkat kecerahan layar HP Anda agar scanner vendor dapat membaca QR Code dengan cepat dan lancar.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
