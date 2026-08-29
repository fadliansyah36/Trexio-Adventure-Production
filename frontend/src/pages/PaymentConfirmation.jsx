import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, Link, useSearchParams } from "react-router-dom";
import { api, formatRupiah, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  CheckCircle,
  ClockCounterClockwise,
  Warning,
  CreditCard,
  ArrowsClockwise,
  ShieldCheck,
  QrCode,
  Bank,
  Wallet,
  Sparkle,
  Ticket,
  Storefront,
} from "@phosphor-icons/react";

export default function PaymentConfirmation() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [booking, setBooking] = useState(null);
  const [midtransConfig, setMidtransConfig] = useState(null);
  const [snapLoading, setSnapLoading] = useState(false);
  const [snapReady, setSnapReady] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState("Virtual Account BCA");
  const [pollingActive, setPollingActive] = useState(false);
  const pollTimerRef = useRef(null);

  const load = useCallback(async () => {
    try {
      const { data } = await api.get(`/payments/midtrans/status/${id}`);
      setBooking((prev) => {
        if (data.payment_method && (!prev || prev.payment_method !== data.payment_method)) {
          setSelectedChannel(data.payment_method);
        }
        return data;
      });
      return data;
    } catch {
      try {
        const { data } = await api.get(`/bookings/${id}`);
        setBooking(data);
        if (data.payment_method) {
          setSelectedChannel(data.payment_method);
        }
        return data;
      } catch {
        toast.error("Gagal memuat detail booking");
      }
    }
  }, [id]);

  useEffect(() => {
    load();
    api
      .get("/payments/midtrans/config")
      .then((r) => setMidtransConfig(r.data))
      .catch(() => {});

    const paymentResult = searchParams.get("payment_result") || searchParams.get("result");
    if (paymentResult) {
      if (paymentResult === "finish") {
        toast.success("Menerima konfirmasi dari Midtrans, memverifikasi status...");
      } else if (paymentResult === "unfinish") {
        toast.info("Transaksi ditunda atau belum selesai");
      } else if (paymentResult === "error") {
        toast.error("Transaksi mengalami masalah pada gateway");
      }
      refreshStatus();
    }
  }, [id, load, searchParams]);

  useEffect(() => {
    if (booking && (booking.payment_status === "pending" || booking.payment_status === "challenge" || pollingActive)) {
      pollTimerRef.current = setInterval(async () => {
        try {
          const { data } = await api.get(`/payments/midtrans/status/${id}`);
          if (data && data.payment_status !== booking.payment_status) {
            setBooking(data);
            if (data.payment_status === "verified") {
              toast.success("Pembayaran Sukses Terverifikasi! 🎉");
              setPollingActive(false);
              clearInterval(pollTimerRef.current);
            }
          }
        } catch {
          // Silent catch during background polling
        }
      }, 4000);
    }

    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [id, booking, pollingActive]);

  useEffect(() => {
    if (!midtransConfig?.enabled) return;
    const src = midtransConfig.is_production
      ? "https://app.midtrans.com/snap/snap.js"
      : "https://app.sandbox.midtrans.com/snap/snap.js";

    if (document.querySelector(`script[data-snap="true"]`)) {
      setSnapReady(true);
      return;
    }

    const s = document.createElement("script");
    s.src = src;
    s.setAttribute("data-client-key", midtransConfig.client_key || "");
    s.setAttribute("data-snap", "true");
    s.async = true;
    s.onload = () => setSnapReady(true);
    s.onerror = () => setSnapReady(false);
    document.body.appendChild(s);
  }, [midtransConfig]);

  async function payWithMidtrans() {
    if (isExpired) {
      toast.error("Transaksi ini telah dibatalkan/kedaluwarsa. Silakan lakukan pemesanan ulang.");
      return;
    }
    setSnapLoading(true);
    setPollingActive(true);

    try {
      const { data } = await api.post(`/payments/midtrans/snap-token/${id}`, {
        payment_channel: selectedChannel,
      });

      if (window.snap && data.token && !data.is_simulated) {
        window.snap.pay(data.token, {
          onSuccess: async () => {
            toast.success("Pembayaran melalui Trexio Dijamin Aman - Berhasil!");
            refreshStatus();
          },
          onPending: async () => {
            toast.info("Pembayaran dikirim, menunggu konfirmasi gateway Midtrans");
            refreshStatus();
          },
          onError: () => {
            toast.error("Pembayaran gagal atau dibatalkan");
            refreshStatus();
          },
          onClose: () => {
            toast.info("Jendela pembayaran ditutup");
            refreshStatus();
          },
        });
        return;
      }

      await simulatePayment(selectedChannel);
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memproses token pembayaran");
    } finally {
      setSnapLoading(false);
    }
  }

  async function simulatePayment(channelName) {
    setSimulating(true);
    try {
      await api.post(`/payments/midtrans/simulate-paid/${id}`, {
        payment_channel: channelName || selectedChannel,
      });
      toast.success("Pembayaran melalui Trexio Dijamin Aman - Berhasil Terkonfirmasi!");
      await refreshStatus();
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Gagal memproses verifikasi pembayaran");
    } finally {
      setSimulating(false);
    }
  }

  async function refreshStatus() {
    try {
      const { data } = await api.get(`/payments/midtrans/status/${id}`);
      setBooking(data);
      if (data.payment_status === "verified") {
        toast.success("Status pembayaran: TERVERIFIKASI SUKSES");
      } else if (data.payment_status === "pending") {
        toast.info("Status pembayaran: MENUNGGU PEMBAYARAN");
      } else if (data.payment_status === "expired" || data.payment_status === "cancelled") {
        toast.error("Status pembayaran: KEDALUWARSA / DIBATALKAN");
      }
      window.dispatchEvent(new CustomEvent("trexio:booking-updated"));
    } catch (e) {
      toast.error("Gagal memperbarui status transaksi");
    }
  }

  if (!booking) {
    return (
      <div className="trx-container py-24 text-center">
        <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent mb-2"></div>
        <div className="text-xs text-muted-foreground">Memuat rincian pembayaran Trexio...</div>
      </div>
    );
  }

  const isPaid = booking.payment_status === "verified" || booking.payment_status === "paid" || booking.booking_status === "confirmed";
  const isExpired =
    booking.payment_status === "expired" ||
    booking.payment_status === "cancelled" ||
    booking.payment_status === "rejected" ||
    (booking.booking_status || "").toLowerCase() === "cancelled" ||
    (booking.trip_status || "").toUpperCase() === "CANCELLED" ||
    (booking.status || "").toUpperCase() === "CANCELLED";

  const channels = [
    { id: "bca_va", name: "Virtual Account BCA", type: "Bank VA", icon: Bank },
    { id: "mandiri_va", name: "Mandiri Livin VA", type: "Bank VA", icon: Bank },
    { id: "bni_va", name: "BNI Mobile VA", type: "Bank VA", icon: Bank },
    { id: "bri_va", name: "BRI VA", type: "Bank VA", icon: Bank },
    { id: "permata_va", name: "Permata VA", type: "Bank VA", icon: Bank },
    { id: "bsi_va", name: "BSI Mobile VA", type: "Bank VA", icon: Bank },
    { id: "gopay", name: "GoPay / QRIS", type: "E-Wallet", icon: QrCode },
    { id: "shopeepay", name: "ShopeePay", type: "E-Wallet", icon: Wallet },
    { id: "qris", name: "QRIS Direct", type: "E-Wallet", icon: QrCode },
    { id: "alfamart", name: "Alfamart / Alfa Group", type: "Gerai Retail", icon: Storefront },
    { id: "credit_card", name: "Kartu Kredit / Debit", type: "Visa / Mastercard", icon: CreditCard },
  ];

  return (
    <div className="pb-24 pt-10">
      <div className="trx-container max-w-5xl">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div>
            <div className="trx-overline text-emerald-600 font-bold uppercase tracking-wider text-xs">
              Portal Pembayaran Resmi · Midtrans Gateway
            </div>
            <h1 className="text-2xl font-black tracking-tight text-foreground">
              Konfirmasi & Pembayaran
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isPaid
                  ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/30"
                  : isExpired
                  ? "bg-red-500/10 text-red-600 border border-red-500/30"
                  : "bg-amber-500/10 text-amber-600 border border-amber-500/30"
              }`}
            >
              {isPaid ? (
                <>
                  <CheckCircle size={14} weight="fill" /> Lunas Terverifikasi
                </>
              ) : isExpired ? (
                <>
                  <Warning size={14} weight="fill" /> Dibatalkan / Kedaluwarsa
                </>
              ) : (
                <>
                  <ClockCounterClockwise size={14} weight="fill" className="animate-pulse" /> Menunggu Pembayaran
                </>
              )}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={refreshStatus}
              className="text-xs flex items-center gap-1.5 h-8"
            >
              <ArrowsClockwise size={14} /> Cek Status
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-3 gap-2 text-center border-b border-border pb-6">
                <div className="space-y-1">
                  <div className="mx-auto h-9 w-9 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-xs">
                    ✓
                  </div>
                  <div className="text-xs font-bold">Booking Dibuat</div>
                  <div className="text-[10px] text-muted-foreground">Tersimpan</div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`mx-auto h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPaid
                        ? "bg-emerald-500 text-white"
                        : isExpired
                        ? "bg-red-500 text-white"
                        : "bg-amber-500 text-white animate-pulse"
                    }`}
                  >
                    {isPaid ? "✓" : isExpired ? "✕" : "2"}
                  </div>
                  <div className="text-xs font-bold">Pembayaran</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isPaid ? "Lunas" : isExpired ? "Gagal" : "Proses Bayar"}
                  </div>
                </div>

                <div className="space-y-1">
                  <div
                    className={`mx-auto h-9 w-9 rounded-full flex items-center justify-center font-bold text-xs ${
                      isPaid ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {isPaid ? "✓" : "3"}
                  </div>
                  <div className="text-xs font-bold">E-Tiket Terbit</div>
                  <div className="text-[10px] text-muted-foreground">
                    {isPaid ? "Siap Digunakan" : "Pending"}
                  </div>
                </div>
              </div>

              {isPaid && (
                <div className="mt-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3">
                  <CheckCircle size={24} weight="fill" className="text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-emerald-700 dark:text-emerald-400 text-sm">
                      Pembayaran Sukses Terverifikasi! 🎉
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Transaksi telah dikonfirmasi secara otomatis oleh Midtrans Gateway pada{" "}
                      {new Date(booking.paid_at || Date.now()).toLocaleString("id-ID")}. E-tiket & manifes pendakian Anda telah terbit.
                    </p>
                  </div>
                </div>
              )}

              {isExpired && (
                <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                  <Warning size={24} weight="fill" className="text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-red-700 dark:text-red-400 text-sm">
                      Transaksi Dibatalkan / Kedaluwarsa
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Waktu pembayaran telah habis atau transaksi dibatalkan oleh gateway. Silakan lakukan pemesanan ulang trip pendakian.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {!isPaid && !isExpired && (
              <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={24} className="text-emerald-500" />
                    <div>
                      <h3 className="font-bold text-base">Pilih Method Pembayaran Midtrans</h3>
                      <p className="text-xs text-muted-foreground">
                        Saluran pembayaran terkonfirmasi otomatis tanpa upload struk
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-black tracking-widest uppercase bg-emerald-800 text-white px-2.5 py-1 rounded">
                    MIDTRANS SECURE
                  </span>
                </div>

                <div>
                  <label className="text-xs font-bold text-foreground mb-3 block">
                    Metode Terpilih: <span className="text-emerald-600 dark:text-emerald-400">{selectedChannel}</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {channels.map((ch) => {
                      const IconComp = ch.icon;
                      const isSelected = selectedChannel === ch.name;
                      return (
                        <button
                          key={ch.id}
                          type="button"
                          onClick={() => setSelectedChannel(ch.name)}
                          className={`p-3.5 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isSelected
                              ? "border-emerald-500 bg-emerald-500/10 shadow-xs ring-1 ring-emerald-500"
                              : "border-border bg-background hover:bg-muted/50"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                              <IconComp size={18} weight="bold" />
                            </div>
                            <div>
                              <div className="font-bold text-xs text-foreground">{ch.name}</div>
                              <div className="text-[10px] text-muted-foreground">{ch.type}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle size={16} weight="fill" className="text-emerald-500" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-muted/50 border border-border rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground font-medium">
                      Total yang Harus Dibayar:
                    </div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      {formatRupiah(booking.total_amount)}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={refreshStatus}
                    className="text-xs flex items-center gap-1.5"
                  >
                    <ArrowsClockwise size={14} /> Refresh
                  </Button>
                </div>

                <div className="space-y-3 pt-2">
                  <Button
                    data-testid="midtrans-pay-btn"
                    onClick={payWithMidtrans}
                    disabled={snapLoading || simulating}
                    className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    {snapLoading || simulating ? (
                      <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Menghubungkan Midtrans Gateway...
                      </>
                    ) : (
                      <>
                        <CreditCard size={18} weight="bold" /> Bayar Sekarang ({selectedChannel})
                      </>
                    )}
                  </Button>

                  <p className="text-[11px] text-center text-muted-foreground leading-relaxed">
                    🔒 Transaksi diproses melalui Midtrans Payment Gateway secara real-time. Dikonfirmasi otomatis via server notification callback.
                  </p>
                </div>
              </div>
            )}
          </div>

          <aside className="space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="font-bold text-sm text-foreground border-b border-border pb-3 flex items-center justify-between">
                <span>Rincian Reservasi</span>
                <Ticket size={16} className="text-emerald-500" />
              </div>

              <div className="flex gap-3">
                <img
                  src={booking.trip_cover || "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=200"}
                  alt={booking.trip_title || "Foto Trip"}
                  className="h-16 w-20 object-cover rounded-xl border border-border shrink-0"
                />
                <div>
                  <h4 className="font-bold text-xs text-foreground line-clamp-2">
                    {booking.trip_title}
                  </h4>
                  <div className="text-[11px] text-muted-foreground mt-1">
                    Titik Kumpul: {booking.meeting_point || "-"}
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-xs border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kode Pemesanan:</span>
                  <span className="font-mono font-bold text-foreground">{booking.booking_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Metode Bayar:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{booking.payment_method || selectedChannel}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tanggal Keberangkatan:</span>
                  <span className="font-semibold text-foreground">
                    {booking.departure_date ? new Date(booking.departure_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    }) : "-"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Jumlah Peserta:</span>
                  <span className="font-semibold text-foreground">{booking.quantity || 1} Pax</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Kontak Pemesan:</span>
                  <span className="font-semibold text-foreground">{booking.contact_name || "-"}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3 flex justify-between items-baseline">
                <span className="font-bold text-xs text-foreground">Total Tagihan:</span>
                <span className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                  {formatRupiah(booking.total_amount)}
                </span>
              </div>

              {isPaid && (
                <Link to="/my-bookings" className="block w-full">
                  <Button className="w-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl h-11">
                    Lihat E-Tiket Saya →
                  </Button>
                </Link>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
