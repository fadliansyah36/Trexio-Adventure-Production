import React, { useEffect, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { usePush } from "@/lib/usePush";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import UserQrPassModal from "@/components/UserQrPassModal";
import CameraQrScanner from "@/components/CameraQrScanner";
import ConfirmationModal from "@/components/ui/ConfirmationModal";
import { CalendarX } from "lucide-react";
import {
  Clock,
  ClockCounterClockwise,
  CheckCircle,
  XCircle,
  ArrowRight,
  Bell,
  BellSlash,
  QrCode,
  MapPin,
  CalendarBlank,
  Compass,
  CheckSquare,
  Square,
  Plus,
  Trash,
  Phone,
  ChatCircleDots,
  ShieldWarning,
  Sparkle,
  Star,
  Copy,
  Receipt,
  DownloadSimple,
  Camera,
  ShieldCheck,
  ArrowCounterClockwise,
  CreditCard,
} from "@phosphor-icons/react";

export default function MyBookings() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "upcoming";

  const [activeTab, setActiveTab] = useState(initialTab);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedBookingQrImage, setSelectedBookingQrImage] = useState(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrModalBookingCode, setQrModalBookingCode] = useState(null);
  const [showHikerScannerModal, setShowHikerScannerModal] = useState(false);

  // Review modal state
  const [reviewModal, setReviewModal] = useState(null);
  const [rating, setRating] = useState(5);
  const [reviewText, setReviewText] = useState("");

  // Cancellation modal state
  const [cancelBookingTarget, setCancelBookingTarget] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);

  // Custom Packing Checklist State per Booking
  const [newItemInputs, setNewItemInputs] = useState({});

  // Toggle packing item
  const handleToggleChecklist = async (bookingId, itemId) => {
    const targetBooking = bookings.find((b) => b.id === bookingId || b.booking_code === bookingId);
    if (!targetBooking) return;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id !== targetBooking.id && b.booking_code !== targetBooking.booking_code) return b;
        const currentList = b.packing_checklist || [];
        const updatedList = currentList.map((item) =>
          String(item.id) === String(itemId) ? { ...item, checked: !item.checked } : item
        );
        const total = updatedList.length;
        const completed = updatedList.filter((i) => i.checked).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        return {
          ...b,
          packing_checklist: updatedList,
          prep_completed_count: completed,
          prep_total_count: total,
          prep_progress: progress,
        };
      })
    );

    try {
      await api.patch(`/bookings/${targetBooking.id || targetBooking.booking_code}/checklist/${itemId}/toggle`);
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal memperbarui item checklist.");
      fetchBookings(true);
    }
  };

  // Add custom packing item
  const handleAddChecklistItem = async (bookingId) => {
    const targetBooking = bookings.find((b) => b.id === bookingId || b.booking_code === bookingId);
    if (!targetBooking) return;

    const label = (newItemInputs[bookingId] || "").trim();
    if (!label) {
      toast.error("Masukkan nama item perlengkapan terlebih dahulu.");
      return;
    }

    try {
      const res = await api.post(`/bookings/${targetBooking.id || targetBooking.booking_code}/checklist/item`, {
        label,
        category: "Perlengkapan Tambahan",
      });

      if (res.data?.ok) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== targetBooking.id && b.booking_code !== targetBooking.booking_code) return b;
            return {
              ...b,
              packing_checklist: res.data.checklist,
              prep_completed_count: res.data.completed_count,
              prep_total_count: res.data.total_count,
              prep_progress: res.data.progress,
            };
          })
        );
        setNewItemInputs((prev) => ({ ...prev, [bookingId]: "" }));
        toast.success("Perlengkapan khusus berhasil ditambahkan!");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal menambahkan item checklist.");
    }
  };

  // Delete packing item
  const handleDeleteChecklistItem = async (bookingId, itemId) => {
    const targetBooking = bookings.find((b) => b.id === bookingId || b.booking_code === bookingId);
    if (!targetBooking) return;

    try {
      const res = await api.delete(`/bookings/${targetBooking.id || targetBooking.booking_code}/checklist/${itemId}`);
      if (res.data?.ok) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== targetBooking.id && b.booking_code !== targetBooking.booking_code) return b;
            return {
              ...b,
              packing_checklist: res.data.checklist,
              prep_completed_count: res.data.completed_count,
              prep_total_count: res.data.total_count,
              prep_progress: res.data.progress,
            };
          })
        );
        toast.success("Item perlengkapan dihapus.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal menghapus item checklist.");
    }
  };

  // Reset packing checklist to trip defaults
  const handleResetChecklist = async (bookingId) => {
    const targetBooking = bookings.find((b) => b.id === bookingId || b.booking_code === bookingId);
    if (!targetBooking) return;

    try {
      const res = await api.post(`/bookings/${targetBooking.id || targetBooking.booking_code}/checklist/reset`);
      if (res.data?.ok) {
        setBookings((prev) =>
          prev.map((b) => {
            if (b.id !== targetBooking.id && b.booking_code !== targetBooking.booking_code) return b;
            return {
              ...b,
              packing_checklist: res.data.checklist,
              prep_completed_count: res.data.completed_count,
              prep_total_count: res.data.total_count,
              prep_progress: res.data.progress,
            };
          })
        );
        toast.success("Checklist direset ke standar trip.");
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal mereset checklist.");
    }
  };

  const { user } = useAuth();
  const push = usePush(user);

  const [lastSyncTime, setLastSyncTime] = useState(new Date());
  const [isSyncing, setIsSyncing] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const prevStatusRef = React.useRef({});

  const fetchBookings = React.useCallback(async (isManual = false) => {
    if (isSyncing && !isManual) return;
    setIsSyncing(true);
    try {
      const res = await api.get("/bookings/mine");
      const data = Array.isArray(res.data) ? res.data : [];

      // Check for live status updates vs previous fetch
      data.forEach((b) => {
        const idKey = b.id || b.booking_code;
        const currentStatus = (b.trip_status || b.status || "UPCOMING").toUpperCase();
        const prevStatus = prevStatusRef.current[idKey];

        if (prevStatus && prevStatus !== currentStatus) {
          const title = `🔔 Update Trip: ${b.trip_title || "Booking #" + b.booking_code}`;
          const msg = `Status perjalanan Anda diperbarui menjadi "${currentStatus}".`;

          toast.success(title, { description: msg });

          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(title, { body: msg, icon: "/icon.png" });
            } catch (err) {
              // safe fallback
            }
          }
        }
        prevStatusRef.current[idKey] = currentStatus;
      });

      setBookings(data);
      setLastSyncTime(new Date());
    } catch (err) {
      // safe error ignore on auto sync
    } finally {
      setLoading(false);
      setIsSyncing(false);
    }
  }, [isSyncing]);

  // Initial load & Polling Interval for Live Updates
  useEffect(() => {
    if (searchParams.get("payment_success") === "true") {
      toast.success("Pembayaran Berhasil Terverifikasi! 🎉 E-Tiket & manifes trip Anda telah terbit dan siap digunakan.", {
        duration: 5000,
      });
      setActiveTab("upcoming");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchBookings(true);

    const interval = setInterval(() => {
      if (autoSync) {
        fetchBookings(false);
      }
    }, 12000); // Poll every 12s for live status changes

    return () => clearInterval(interval);
  }, [autoSync, fetchBookings]);

  useEffect(() => {
    if (selectedBooking && selectedBooking.booking_code) {
      api.get(`/bookings/code/${selectedBooking.booking_code}/qr`)
        .then((res) => setSelectedBookingQrImage(res.data.qr_image))
        .catch(() => setSelectedBookingQrImage(null));
    } else {
      setSelectedBookingQrImage(null);
    }
  }, [selectedBooking]);

  async function handleSelfCheckin(booking) {
    try {
      const res = await api.post(`/bookings/${booking.id || booking.booking_code}/self-checkin`);
      toast.success(res.data.message || "Konfirmasi kehadiran berhasil!");
      setBookings((prev) =>
        prev.map((b) =>
          (b.id === booking.id || b.booking_code === booking.booking_code)
            ? { ...b, checked_in: true, checkin_time: new Date().toISOString(), trip_status: "ONGOING" }
            : b
        )
      );
      if (selectedBooking && (selectedBooking.id === booking.id || selectedBooking.booking_code === booking.booking_code)) {
        setSelectedBooking((prev) => ({
          ...prev,
          checked_in: true,
          checkin_time: new Date().toISOString(),
          trip_status: "ONGOING",
        }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal melakukan konfirmasi check-in.");
    }
  }

  async function handleConfirmComplete(booking) {
    try {
      const res = await api.post(`/bookings/${booking.id || booking.booking_code}/confirm-complete`);
      toast.success(res.data.message || "Trip berhasil dikonfirmasi selesai!");
      setBookings((prev) =>
        prev.map((b) =>
          (b.id === booking.id || b.booking_code === booking.booking_code)
            ? { ...b, trip_status: "COMPLETED" }
            : b
        )
      );
      if (selectedBooking && (selectedBooking.id === booking.id || selectedBooking.booking_code === booking.booking_code)) {
        setSelectedBooking((prev) => ({
          ...prev,
          trip_status: "COMPLETED",
        }));
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal mengonfirmasi selesai trip.");
    }
  }

  // Helper to determine payment and booking status state
  const isBookingPaid = (b) => b.payment_status === "verified" || b.payment_status === "paid" || b.booking_status === "confirmed";
  const isBookingCancelled = (b) =>
    (b.booking_status || "").toLowerCase() === "cancelled" ||
    (b.status || "").toUpperCase() === "CANCELLED" ||
    (b.payment_status || "").toLowerCase() === "cancelled" ||
    b.payment_status === "rejected" ||
    b.payment_status === "failed" ||
    b.payment_status === "expired";
  const isBookingUnpaid = (b) =>
    !isBookingPaid(b) &&
    !isBookingCancelled(b) &&
    (b.payment_status === "pending" ||
      b.payment_status === "awaiting_verification" ||
      b.booking_status === "pending_payment" ||
      (b.booking_status || "").toUpperCase() === "AWAITING_PAYMENT" ||
      (b.status || "").toUpperCase() === "AWAITING_PAYMENT");

  // Handle Booking Cancellation
  const handleCancelBooking = async () => {
    if (!cancelBookingTarget) return;
    const targetId = cancelBookingTarget.id || cancelBookingTarget.booking_code;
    try {
      setIsCancelling(true);
      const res = await api.post(`/bookings/${targetId}/cancel`);
      toast.success(res.data?.message || "Booking berhasil dibatalkan.");
      setCancelBookingTarget(null);
      window.dispatchEvent(new CustomEvent("trexio:booking-updated"));
      fetchBookings(true);
    } catch (err) {
      const errorMsg = formatApiError(err?.response?.data) || "Gagal membatalkan booking.";
      toast.error(errorMsg);
      setCancelBookingTarget(null);
      fetchBookings(true);
    } finally {
      setIsCancelling(false);
    }
  };

  // Filter Bookings
  const filteredBookings = bookings.filter((b) => {
    const isPaid = isBookingPaid(b);
    const isUnpaid = isBookingUnpaid(b);
    const isCancelled = isBookingCancelled(b);
    const status = (b.trip_status || b.status || "UPCOMING").toUpperCase();

    if (activeTab === "unpaid") return isUnpaid;
    if (activeTab === "upcoming") return isPaid && (status === "UPCOMING" || status === "CONFIRMED");
    if (activeTab === "ongoing") return isPaid && status === "ONGOING";
    if (activeTab === "completed") return status === "COMPLETED";
    if (activeTab === "cancelled") return isCancelled || status === "CANCELLED";
    if (activeTab === "eticket") return isPaid;
    return true;
  });

  // Submit Review via API
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModal) return;
    if (!reviewText.trim()) {
      toast.error("Tuliskan komentar ulasan Anda.");
      return;
    }

    try {
      const res = await api.post("/reviews", {
        item_type: "trip",
        item_id: reviewModal.trip_id || reviewModal.item_id,
        booking_id: reviewModal.id,
        rating: Number(rating),
        comment: reviewText.trim(),
      });

      setBookings((prev) =>
        prev.map((b) => (b.id === reviewModal.id || b.booking_code === reviewModal.booking_code ? { ...b, reviewed: true } : b))
      );
      toast.success(res.data?.message || "Ulasan & rating terverifikasi berhasil dikirim!");
      setReviewModal(null);
      setReviewText("");
    } catch (err) {
      toast.error(err?.response?.data?.detail || "Gagal mengirim ulasan. Pastikan pesanan trip ini telah dikonfirmasi selesai.");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <Compass size={16} weight="fill" /> Personal Adventure Center
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              My Adventure & Bookings
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Pusat kendali perjalanan: jadwal keberangkatan, E-Ticket digital, checklist persiapan, dan komunikasi organizer.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                setQrModalBookingCode(null);
                setShowQrModal(true);
              }}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs px-4 py-2 rounded-xl shadow-xs transition-all"
            >
              <QrCode size={18} weight="bold" /> Digital QR Pass
            </button>

            <button
              onClick={() => fetchBookings(true)}
              disabled={isSyncing}
              title="Sync status manual"
              className="inline-flex items-center gap-1.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-3 py-2 rounded-xl border border-border transition-all"
            >
              <Compass size={16} className={isSyncing ? "animate-spin text-emerald-600" : ""} />
              {isSyncing ? "Syncing..." : "Sync Live"}
            </button>
          </div>
        </div>

        {/* Live Push Notification & Auto Sync Hub */}
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs transition-all">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                  push.subscribed ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                }`}>
                  <span className={`h-2 w-2 rounded-full ${push.subscribed ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                  {push.subscribed ? "Live Push Updates Active" : "Push Updates Inactive"}
                </span>

                <span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
                  • Refreshed: {lastSyncTime.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-foreground flex items-center gap-1.5">
                <Bell size={18} className="text-emerald-600" weight="fill" />
                Real-Time Push Notification Engine
              </h3>
              <p className="text-xs text-muted-foreground">
                Dapatkan notifikasi langsung di perangkat saat status booking, verifikasi pembayaran, atau pengumuman trip diperbarui oleh mitra organizer.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {push.subscribed && (
                <button
                  type="button"
                  onClick={push.sendTest}
                  className="inline-flex items-center gap-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-3 py-2 rounded-xl border border-blue-500/20 transition-all"
                >
                  <Sparkle size={15} weight="fill" /> Test Push Alert
                </button>
              )}

              <button
                type="button"
                onClick={push.subscribed ? push.disable : push.enable}
                className={`inline-flex items-center gap-2 text-xs font-black px-4 py-2 rounded-xl border shadow-xs transition-all ${
                  push.subscribed
                    ? "bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700"
                    : "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                }`}
              >
                {push.subscribed ? <Bell size={16} weight="fill" /> : <BellSlash size={16} />}
                {push.subscribed ? "Notifikasi Push Aktif ✓" : "Aktifkan Push Update"}
              </button>
            </div>
          </div>
        </div>

        {/* ONGOING ADVENTURE MODE CALLOUT (Section 47 & 81) */}
        {bookings.some((b) => b.trip_status === "ONGOING") && (
          <div className="bg-gradient-to-r from-emerald-900 to-teal-950 text-white rounded-2xl p-6 shadow-xl border border-emerald-500/40 relative overflow-hidden space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <span className="inline-flex items-center gap-1.5 bg-emerald-800 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full animate-pulse">
                <Sparkle size={12} weight="fill" /> ADVENTURE MODE ACTIVE
              </span>
              <span className="text-xs text-emerald-300 font-mono font-bold">
                Live Trip Status: Day 1 of 3
              </span>
            </div>

            {bookings
              .filter((b) => b.trip_status === "ONGOING")
              .map((adv) => (
                <div key={adv.id} className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl font-black text-white">{adv.trip_title}</h2>
                    <p className="text-xs text-emerald-200">
                      Organizer: <strong className="text-white">{adv.partner_name}</strong> • Meeting Point: {adv.meeting_point}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setSelectedBooking(adv)}
                      className="bg-white text-emerald-950 hover:bg-emerald-100 font-black text-xs px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center gap-1.5"
                    >
                      <QrCode size={18} /> Buka E-Ticket & Pass
                    </button>
                    <a
                      href={`tel:${adv.partner_phone}`}
                      className="bg-emerald-700/80 hover:bg-emerald-700 text-white font-extrabold text-xs px-3.5 py-2.5 rounded-xl border border-emerald-500/30 flex items-center gap-1.5"
                    >
                      <Phone size={16} /> Kontak Urgent
                    </a>
                  </div>
                </div>
              ))}
          </div>
        )}

        {/* Main Tabs */}
        <div className="flex flex-wrap border-b border-border gap-2 sm:gap-4 text-xs sm:text-sm font-bold">
          {(() => {
            const unpaidCount = bookings.filter((b) => isBookingUnpaid(b) && (b.trip_status || "").toUpperCase() !== "CANCELLED").length;
            const upcomingCount = bookings.filter((b) => isBookingPaid(b) && ["UPCOMING", "CONFIRMED", ""].includes((b.trip_status || "").toUpperCase())).length;
            const ongoingCount = bookings.filter((b) => isBookingPaid(b) && (b.trip_status || "").toUpperCase() === "ONGOING").length;
            const completedCount = bookings.filter((b) => (b.trip_status || "").toUpperCase() === "COMPLETED").length;
            const eticketCount = bookings.filter((b) => isBookingPaid(b)).length;

            return (
              <>
                <button
                  onClick={() => setActiveTab("unpaid")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "unpaid" ? "border-amber-500 text-amber-600 dark:text-amber-400" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <CreditCard size={16} className="text-amber-500" /> Menunggu Pembayaran
                  {unpaidCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20 animate-pulse">
                      {unpaidCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("upcoming")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "upcoming" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <CalendarBlank size={16} /> Mendatang
                  {upcomingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      {upcomingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("ongoing")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "ongoing" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <Compass size={16} className="text-emerald-500 animate-spin" /> Sedang Berjalan
                  {ongoingCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-800 text-white animate-pulse">
                      {ongoingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("completed")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "completed" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <CheckCircle size={16} /> Selesai
                  {completedCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-muted text-muted-foreground border border-border">
                      {completedCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("eticket")}
                  className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                    activeTab === "eticket" ? "border-emerald-500 text-emerald-600 dark:text-emerald-400" : "border-transparent text-muted-foreground"
                  }`}
                >
                  <QrCode size={16} /> E-Ticket Pass
                  {eticketCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                      {eticketCount}
                    </span>
                  )}
                </button>
              </>
            );
          })()}
        </div>

        {/* Booking Cards Grid */}
        <div className="space-y-6">
          {filteredBookings.length === 0 ? (
            <EmptyState
              title="Tidak Ada Trip Pada Kategori Ini"
              description="Mulai cari petualangan gunung, camping, atau trip impianmu di katalog Trexio."
              icon={CalendarX}
              actionLabel="Jelajah Trip"
              actionLink="/explore"
            />
          ) : (
            filteredBookings.map((b) => {
              return (
                <div
                  key={b.id}
                  data-testid={`booking-card-${b.booking_code}`}
                  className="bg-card border border-border rounded-2xl overflow-hidden shadow-xs space-y-4 p-5 sm:p-6"
                >
                  <div className="flex flex-col md:flex-row gap-5 items-start">
                    <img
                      src={b.trip_cover}
                      alt={b.trip_title}
                      className="w-full md:w-44 h-32 object-cover rounded-xl shrink-0"
                    />

                    <div className="flex-1 space-y-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-xs text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-md border border-emerald-500/20">
                            {b.booking_code}
                          </span>
                          {isBookingPaid(b) && (
                            b.checked_in ? (
                              <span className="text-[11px] font-black text-emerald-700 bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                                <CheckCircle size={14} weight="fill" /> Sudah Check-In
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-300">
                                Belum Check-In
                              </span>
                            )
                          )}
                        </div>
                        {(() => {
                          if (isBookingPaid(b)) {
                            return (
                              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                                TERKONFIRMASI
                              </span>
                            );
                          }
                          if (b.payment_status === "awaiting_verification") {
                            return (
                              <span className="text-xs font-black text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2.5 py-1 rounded-full uppercase">
                                MENUNGGU VERIFIKASI
                              </span>
                            );
                          }
                          if (b.booking_status === "cancelled" || b.payment_status === "cancelled" || b.payment_status === "expired" || b.payment_status === "failed") {
                            return (
                              <span className="text-xs font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-full uppercase">
                                DIBATALKAN / EXPIRED
                              </span>
                            );
                          }
                          return (
                            <span className="text-xs font-black text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase animate-pulse">
                              MENUNGGU PEMBAYARAN
                            </span>
                          );
                        })()}
                      </div>

                      <h3 className="font-black text-lg text-foreground">{b.trip_title}</h3>
                      <p className="text-xs text-muted-foreground font-medium">
                        Destinasi: <strong className="text-foreground">{b.trip_destination}</strong> • Organizer: <strong className="text-foreground">{b.partner_name}</strong>
                      </p>

                      <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-foreground pt-1">
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <CalendarBlank size={16} className="text-emerald-500" />
                          {formatDateID(b.departure_date)}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <MapPin size={16} className="text-emerald-500" />
                          {b.meeting_point} ({b.meeting_time})
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 w-full md:w-auto border-t md:border-t-0 md:border-l border-border pt-3 md:pt-0 md:pl-5 space-y-2">
                      <div className="text-[10px] text-muted-foreground uppercase font-bold">Total Pembayaran</div>
                      <div className="text-lg font-black text-emerald-600">{formatRupiah(b.total_amount)}</div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isBookingUnpaid(b) && (
                          <>
                            <Link
                              to={`/payment/${b.id || b.booking_code}`}
                              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                            >
                              <CreditCard size={16} /> Lanjutkan Pembayaran
                            </Link>
                            <button
                              type="button"
                              onClick={() => setCancelBookingTarget(b)}
                              className="border border-rose-500/40 hover:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-bold text-xs px-3.5 py-2 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              <XCircle size={16} /> Batalkan Booking
                            </button>
                          </>
                        )}

                        {isBookingPaid(b) && (
                          b.checked_in ? (
                            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle size={14} weight="fill" className="text-emerald-500" /> Berhasil Check-In
                            </span>
                          ) : (
                            <span className="bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold text-xs px-3 py-2 rounded-xl border border-amber-500/20 inline-flex items-center gap-1">
                              <Clock size={14} className="text-amber-500" /> Menunggu Check-In
                            </span>
                          )
                        )}

                        {isBookingPaid(b) && (
                          <button
                            onClick={() => {
                              setQrModalBookingCode(b.booking_code);
                              setShowQrModal(true);
                            }}
                            className="bg-slate-900 hover:bg-black text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-colors shadow-xs flex items-center gap-1.5"
                          >
                            <QrCode size={16} /> QR Pass
                          </button>
                        )}
                        <button
                          onClick={() => setSelectedBooking(b)}
                          className="border border-border hover:bg-muted text-foreground font-bold text-xs px-3 py-2 rounded-xl transition-colors"
                        >
                          Detail
                        </button>

                        <button
                          onClick={async () => {
                            try {
                              const res = await api.post("/chat/conversations", {
                                vendor_id: b.vendor_id || "vendor_official",
                                booking_id: b.id,
                                booking_code: b.booking_code,
                                product_title: b.trip_title,
                                initial_message: `Halo organizer, saya peserta booking #${b.booking_code} untuk "${b.trip_title}". Ingin koordinasi persiapan trip.`
                              });
                              if (res.data?.id) {
                                nav(`/messages?tab=chat&conversation_id=${res.data.id}`);
                              }
                            } catch (e) {
                              toast.error("Gagal membuka ruang chat dengan organizer.");
                            }
                          }}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-3 py-2 rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        >
                          <ChatCircleDots size={16} /> Chat Organizer
                        </button>
                        {((b.trip_status || "").toUpperCase() === "COMPLETED" || (b.booking_status || "").toLowerCase() === "completed") && (
                          !b.reviewed ? (
                            <button
                              onClick={() => setReviewModal(b)}
                              className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl transition-all flex items-center gap-1 shadow-xs cursor-pointer"
                            >
                              <Star size={14} weight="fill" /> Tulis Ulasan & Rating
                            </button>
                          ) : (
                            <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs px-3 py-2 rounded-xl border border-emerald-500/20 inline-flex items-center gap-1">
                              <CheckCircle size={14} weight="fill" className="text-emerald-500" /> Ulasan Terkirim
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  </div>

                  {/* PREPARATION CENTER & PACKING CHECKLIST */}
                  <div className="bg-slate-50 dark:bg-zinc-800/40 p-4 sm:p-5 rounded-2xl border border-border/80 space-y-4">
                    <div className="flex flex-wrap justify-between items-center gap-2">
                      <div className="flex items-center gap-2 text-xs font-black text-foreground">
                        <CheckSquare size={18} className="text-emerald-500 shrink-0" />
                        <span>Preparation Packing Checklist</span>
                        <span className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-md font-bold">
                          Terintegrasi Server
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs font-bold">
                        <span className={b.prep_progress === 100 ? "text-emerald-600 font-black" : "text-amber-600"}>
                          {b.prep_progress || 0}% Ready ({b.prep_completed_count || 0}/{b.prep_total_count || 0} Item)
                        </span>
                        <button
                          onClick={() => handleResetChecklist(b.id)}
                          title="Reset ke checklist standar trip"
                          className="inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                        >
                          <ArrowCounterClockwise size={13} /> Reset Standar
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 dark:bg-zinc-700 h-2.5 rounded-full overflow-hidden shadow-xs">
                      <div
                        className={`h-full transition-all duration-300 ${
                          b.prep_progress === 100 ? "bg-emerald-500" : "bg-gradient-to-r from-amber-500 to-emerald-500"
                        }`}
                        style={{ width: `${b.prep_progress || 0}%` }}
                      />
                    </div>

                    {/* Compact Checklist Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-xs">
                      {(b.packing_checklist || []).map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-center justify-between gap-2 p-2.5 rounded-xl border transition-all ${
                            item.checked
                              ? "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200"
                              : "bg-white dark:bg-zinc-800/90 border-border text-foreground hover:border-emerald-300"
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => handleToggleChecklist(b.id, item.id)}
                            className="flex items-center gap-2.5 truncate text-left flex-1 cursor-pointer"
                          >
                            {item.checked ? (
                              <CheckSquare size={18} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            ) : (
                              <Square size={18} className="text-muted-foreground shrink-0" />
                            )}
                            <span className={`truncate font-semibold ${item.checked ? "line-through opacity-85" : ""}`}>
                              {item.label}
                            </span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteChecklistItem(b.id, item.id)}
                            title="Hapus item perlengkapan ini"
                            className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 text-muted-foreground hover:text-rose-600 transition-all rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer shrink-0"
                          >
                            <Trash size={14} />
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Add Custom Item */}
                    <div className="flex gap-2 pt-1">
                      <input
                        type="text"
                        value={newItemInputs[b.id] || ""}
                        onChange={(e) => setNewItemInputs((prev) => ({ ...prev, [b.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddChecklistItem(b.id);
                          }
                        }}
                        placeholder="+ Tambah item perlengkapan khusus (cth: Obat Alergi, Powerbank)..."
                        className="flex-1 bg-white dark:bg-zinc-800 border border-border rounded-xl px-3.5 py-2 text-xs focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddChecklistItem(b.id)}
                        className="bg-slate-900 hover:bg-black dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        <Plus size={15} weight="bold" /> Tambah
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BOOKING DETAIL & DIGITAL PASS MODAL (Section 45 & 46) */}
        {selectedBooking && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-4 sm:p-6 space-y-4 shadow-2xl animate-in zoom-in-95 my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
              <div className="shrink-0 flex justify-between items-center border-b border-border pb-3">
                <div className="flex items-center gap-2 font-black text-sm sm:text-base text-foreground">
                  <QrCode size={20} className="text-emerald-500" /> TREXIO ADVENTURE PASS
                </div>
                <button onClick={() => setSelectedBooking(null)} aria-label="Tutup Detail Booking" className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground font-bold text-sm hover:bg-muted transition-colors">
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                {/* QR Pass */}
                <div className="bg-gradient-to-br from-emerald-600 via-teal-800 to-slate-900 text-white rounded-2xl p-4 sm:p-6 text-center space-y-3 shadow-md">
                  <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-200">
                    <span>VERIFIED DIGITAL E-TICKET</span>
                    {selectedBooking.checked_in ? (
                      <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                        ✓ CHECKED-IN
                      </span>
                    ) : (
                      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full">
                        READY TO SCAN
                      </span>
                    )}
                  </div>

                  <div className="bg-white p-3 sm:p-4 rounded-xl inline-block shadow-inner mx-auto border-2 border-emerald-400/30">
                    {selectedBookingQrImage ? (
                      <img
                        src={selectedBookingQrImage}
                        alt="Scannable QR Code E-Ticket"
                        className="w-36 h-36 object-contain mx-auto rounded-lg"
                      />
                    ) : (
                      <div className="w-36 h-36 bg-neutral-900 rounded-lg flex flex-col items-center justify-center p-2 text-center text-white space-y-1 mx-auto">
                        <QrCode size={64} className="text-emerald-400" />
                        <span className="font-mono text-[9px] text-neutral-300">SCAN AT BASECAMP</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="font-mono font-black text-base sm:text-lg text-emerald-200">{selectedBooking.booking_code}</div>
                    <div className="font-extrabold text-sm sm:text-base text-white">{selectedBooking.trip_title}</div>
                  </div>
                </div>

                {/* Status Kehadiran & Meeting Point (Read-Only) */}
                <div className="bg-muted/40 border border-border rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-xs text-foreground flex items-center gap-1.5">
                      <ShieldCheck size={16} className="text-emerald-500" /> Status Validasi Kehadiran
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Otentikasi Vendor
                    </span>
                  </div>

                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Pemeriksaan e-Tiket & registrasi simaksi wajib dilakukan oleh petugas Vendor/Basecamp resmi melalui pemindaian QR Code Pass saat Anda tiba di meeting point.
                  </p>

                  <div className="pt-1">
                    {selectedBooking.checked_in ? (
                      <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 dark:text-emerald-200 font-bold text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle size={18} weight="fill" className="text-emerald-600 shrink-0" />
                        <div>
                          <div>Telah Terverifikasi Check-in di Basecamp</div>
                          {selectedBooking.checkin_time && (
                            <div className="text-[10px] font-normal text-emerald-700 dark:text-emerald-300">
                              Waktu: {new Date(selectedBooking.checkin_time).toLocaleString("id-ID")}
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/30 text-amber-800 dark:text-amber-200 font-bold text-xs rounded-xl flex items-center gap-2">
                        <Clock size={18} className="text-amber-600 shrink-0" />
                        <div>
                          <div>Menunggu Pemindaian QR oleh Petugas Basecamp</div>
                          <div className="text-[10px] font-normal text-amber-700 dark:text-amber-300">
                            Tunjukkan QR Pass di atas kepada petugas meeting point untuk check-in.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Meeting Point & Instructions */}
                <div className="space-y-3 text-xs">
                  <div className="bg-slate-50 dark:bg-zinc-800 p-3.5 sm:p-4 rounded-xl border border-border space-y-2">
                    <div className="font-black text-foreground flex items-center gap-1.5">
                      <MapPin size={16} className="text-emerald-500" /> Lokasi Meeting Point & Jam
                    </div>
                    <p className="text-muted-foreground font-medium">{selectedBooking.meeting_point} — {selectedBooking.meeting_time}</p>
                    <a
                      href={selectedBooking.meeting_maps}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold hover:underline mt-1"
                    >
                      Buka Petunjuk di Google Maps <ArrowRight size={12} />
                    </a>
                  </div>

                  {/* Participant Checklist */}
                  <div className="space-y-2">
                    <div className="font-bold text-foreground">Daftar Peserta & Check-in Status:</div>
                    <div className="space-y-1.5">
                      {selectedBooking.participants?.map((p, idx) => (
                        <div key={idx} className="flex justify-between items-center p-2.5 bg-muted/40 rounded-xl border border-border/60">
                          <div>
                            <div className="font-bold text-foreground">{p.name}</div>
                            <div className="text-[10px] text-muted-foreground">{p.phone}</div>
                          </div>
                          {p.checked_in ? (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full border border-emerald-200">
                              ✓ CHECKED-IN
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-muted-foreground text-[10px] font-bold px-2 py-0.5 rounded-full">
                              Pending Scan
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="shrink-0 pt-2 border-t border-border">
                <button
                  onClick={() => setSelectedBooking(null)}
                  className="w-full bg-slate-900 text-white font-black text-xs py-2.5 rounded-xl hover:bg-black"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REVIEW MODAL */}
        {reviewModal && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <form onSubmit={handleSubmitReview} className="bg-card border border-border rounded-2xl max-w-md w-full p-4 sm:p-6 space-y-4 shadow-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[90vh] flex flex-col">
              <h3 className="shrink-0 font-black text-base text-foreground border-b border-border pb-2">
                Tulis Ulasan & Rating Trip
              </h3>

              <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Bagikan pengalaman pendakian/perjalananmu bersama {reviewModal.partner_name} untuk membantu penjelajah lainnya.
                </p>

                <div>
                  <label className="font-bold text-foreground block mb-1">Rating Bintang:</label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setRating(star)}
                        className="p-1 text-amber-500 hover:scale-110 transition-transform"
                      >
                        <Star size={24} weight={star <= rating ? "fill" : "regular"} />
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="font-bold text-foreground block mb-1">Ulasan Pengalaman:</label>
                  <textarea
                    required
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Ceritakan tentang guide, pelayanan, makanan, dan keindahan jalur..."
                    className="w-full p-2.5 rounded-xl border border-border bg-background text-xs font-medium"
                  />
                </div>
              </div>

              <div className="shrink-0 flex flex-col-reverse sm:flex-row justify-end gap-2 pt-3 border-t border-border">
                <button
                  type="button"
                  onClick={() => setReviewModal(null)}
                  className="px-4 py-2.5 border border-border rounded-xl text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-extrabold"
                >
                  Kirim Ulasan
                </button>
              </div>
            </form>
          </div>
        )}

        <UserQrPassModal
          isOpen={showQrModal}
          onClose={() => {
            setShowQrModal(false);
            setQrModalBookingCode(null);
          }}
          initialBookingCode={qrModalBookingCode}
        />

        {/* HIKER CAMERA SCANNER MODAL */}
        {showHikerScannerModal && (
          <div className="fixed inset-0 z-[100] bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
            <div className="relative bg-card border border-border rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[92vh] flex flex-col">
              <CameraQrScanner
                title="Scanner QR Pendaki Trexio"
                onClose={() => setShowHikerScannerModal(false)}
                onScanSuccess={async (scannedCode) => {
                  setShowHikerScannerModal(false);
                  const matchedBooking = bookings.find((b) => b.booking_code === scannedCode);
                  if (matchedBooking) {
                    await handleSelfCheckin(matchedBooking);
                  } else {
                    toast.info(`Kode QR dibaca: ${scannedCode}`);
                  }
                }}
              />
            </div>
          </div>
        )}

        {/* BOOKING CANCELLATION CONFIRMATION MODAL */}
        <ConfirmationModal
          isOpen={!!cancelBookingTarget}
          onClose={() => setCancelBookingTarget(null)}
          onConfirm={handleCancelBooking}
          title="Batalkan Booking?"
          description="Booking yang dibatalkan tidak dapat dilanjutkan menggunakan transaksi pembayaran yang sama"
          confirmText="Batalkan Booking"
          cancelText="Kembali"
          variant="rose"
          loading={isCancelling}
        />
      </div>
    </div>
  );
}
