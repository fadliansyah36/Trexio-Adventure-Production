import React, { useState, useEffect } from "react";
import { backpackerService } from "@/services/backpackerService";
import {
  Ticket,
  CheckCircle,
  XCircle,
  Spinner,
  MapPin,
  Calendar,
  Storefront,
  ArrowRight,
  BookmarkSimple
} from "@phosphor-icons/react";

export default function BookingReferenceSelector({
  selectedBookingId,
  selectedBookingName,
  onSelectBooking,
  onAutoFill,
  label = "REFERENSI PRODUK / TUJUAN PERJALANAN"
}) {
  const [activeTab, setActiveTab] = useState(selectedBookingId ? "BOOKING" : "MANUAL");
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeTab === "BOOKING" && bookings.length === 0 && !loading) {
      loadEligibleBookings();
    }
  }, [activeTab]);

  const loadEligibleBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await backpackerService.getEligibleBookingReferences();
      const list = Array.isArray(res) ? res : (res?.data || []);
      setBookings(list);
    } catch (err) {
      console.error("[BookingRefSelector] Failed to load eligible bookings:", err);
      setError("Gagal memuat booking. Anda tetap dapat memasukkan tujuan secara manual.");
    } finally {
      setLoading(false);
    }
  };

  const handleChooseBooking = (booking) => {
    if (onSelectBooking) {
      onSelectBooking(booking);
    }
    if (onAutoFill) {
      onAutoFill({
        destination: booking.destination || "",
        travel_date: booking.trip_date || "",
        product_name: booking.product_name || ""
      });
    }
  };

  const handleClear = () => {
    if (onSelectBooking) {
      onSelectBooking(null);
    }
  };

  const selectedBookingObj = bookings.find((b) => String(b.id) === String(selectedBookingId));

  return (
    <div className="bg-slate-50 dark:bg-zinc-800/60 border border-slate-200 dark:border-zinc-700/80 rounded-2xl p-4 space-y-3">
      {/* Header & Subtext */}
      <div>
        <div className="flex items-center justify-between gap-2">
          <label className="text-xs font-black tracking-wide text-slate-800 dark:text-zinc-100 flex items-center gap-1.5 uppercase">
            <Ticket size={16} className="text-emerald-600 dark:text-emerald-400" />
            {label}
          </label>
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 font-extrabold text-[10px]">
            OPSIONAL
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-zinc-400 mt-0.5">
          Sudah punya booking di Trexio? Pilih booking Anda untuk otomatis mengisi tujuan perjalanan.
        </p>
      </div>

      {/* Selected State Banner if a booking is currently linked */}
      {selectedBookingId ? (
        <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/80 rounded-xl p-3.5 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={16} weight="fill" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                  {selectedBookingName || selectedBookingObj?.product_name || "Booking Reference Terpilih"}
                </span>
              </div>
              {selectedBookingObj && (
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-emerald-800 dark:text-emerald-300 pl-5">
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {selectedBookingObj.destination}
                  </span>
                  {selectedBookingObj.trip_date && (
                    <span className="flex items-center gap-1">
                      <Calendar size={12} /> {selectedBookingObj.trip_date}
                    </span>
                  )}
                  {selectedBookingObj.vendor_name && (
                    <span className="flex items-center gap-1">
                      <Storefront size={12} /> {selectedBookingObj.vendor_name}
                    </span>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleClear}
              className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 hover:bg-rose-200 dark:hover:bg-rose-900 text-[11px] font-bold transition-all cursor-pointer shrink-0"
            >
              Hapus Referensi
            </button>
          </div>
        </div>
      ) : (
        /* Tab Choice: Pilih dari Booking vs Masukkan Manual */
        <div className="space-y-3">
          <div className="flex items-center gap-2 p-1 bg-slate-200/70 dark:bg-zinc-700/60 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab("BOOKING")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "BOOKING"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Ticket size={14} />
              Pilih dari Booking Saya
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("MANUAL")}
              className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                activeTab === "MANUAL"
                  ? "bg-white dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 shadow-xs"
                  : "text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <BookmarkSimple size={14} />
              Masukkan Tujuan Manual
            </button>
          </div>

          {activeTab === "BOOKING" && (
            <div className="space-y-2">
              {loading && (
                <div className="p-4 rounded-xl border border-dashed border-slate-300 dark:border-zinc-700 text-center text-xs text-slate-500 dark:text-zinc-400 flex items-center justify-center gap-2">
                  <Spinner size={16} className="animate-spin text-emerald-600 dark:text-emerald-400" />
                  Memuat Booking Trexio Anda...
                </div>
              )}

              {error && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300 flex items-center justify-between">
                  <span>{error}</span>
                  <button
                    type="button"
                    onClick={() => setActiveTab("MANUAL")}
                    className="font-bold underline cursor-pointer"
                  >
                    Isi Manual
                  </button>
                </div>
              )}

              {!loading && !error && bookings.length === 0 && (
                <div className="p-4 rounded-xl bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700 text-center space-y-2">
                  <p className="text-xs text-slate-600 dark:text-zinc-400">
                    Belum ada booking Trexio yang dapat digunakan sebagai referensi tujuan (pembayaran lunas).
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab("MANUAL")}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                  >
                    Lanjutkan dengan Isi Manual
                  </button>
                </div>
              )}

              {!loading && bookings.length > 0 && (
                <div className="max-h-52 overflow-y-auto space-y-2 pr-1">
                  {bookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-white dark:bg-zinc-800 border border-slate-200 dark:border-zinc-700/80 hover:border-emerald-500 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-xs text-slate-900 dark:text-white">
                            {b.product_name}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-extrabold text-[10px]">
                            LUNAS
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-zinc-400">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-slate-400" />
                            {b.destination}
                          </span>
                          {b.trip_date && (
                            <span className="flex items-center gap-1">
                              <Calendar size={12} className="text-slate-400" />
                              {b.trip_date}
                            </span>
                          )}
                          {b.vendor_name && (
                            <span className="flex items-center gap-1">
                              <Storefront size={12} className="text-slate-400" />
                              {b.vendor_name}
                            </span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleChooseBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer shrink-0"
                      >
                        Pilih sebagai Tujuan
                        <ArrowRight size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
