import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MapPin, CalendarBlank, Mountains, Star, CheckCircle, Scales } from "@phosphor-icons/react";
import { formatRupiah } from "@/lib/api";
import { useCompare } from "@/context/CompareContext";

export default function TripCard({ trip, testIdPrefix = "trip-card" }) {
  const navigate = useNavigate();
  const { toggleCompare, isInCompare } = useCompare();
  const isCompared = isInCompare(trip.id);

  const remaining = (trip.max_participants || 0) - (trip.booked_seats || 0);
  const nearlyFull = remaining <= 3 && remaining > 0;
  const badgesList = Array.isArray(trip.badges)
    ? trip.badges
    : typeof trip.badges === "string"
    ? trip.badges.split(",").map((s) => s.trim()).filter(Boolean)
    : [];

  const handleCardClick = (e) => {
    // Prevent navigation if click was on or inside a button/interactive element
    if (e.target.closest("button") || e.target.closest("a")) {
      return;
    }
    navigate(`/trip/${trip.id}`);
  };

  const isVerified = trip.vendor_verified === true || trip.vendor_status === "verified";

  return (
    <motion.div
      onClick={handleCardClick}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      data-testid={`${testIdPrefix}-${trip.slug || trip.id}`}
      className="group cursor-pointer flex flex-col justify-between bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-xl transition-all duration-300 h-full select-none"
    >
      <div>
        <div className="relative aspect-[4/3] sm:aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={trip.cover_image}
            alt={trip.title}
            loading="lazy"
            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
            onLoad={(e) => (e.currentTarget.style.opacity = 1)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 opacity-80 pointer-events-none" />

          {/* BADGES ON COVER */}
          <div className="absolute left-2 top-2 sm:left-3 sm:top-3 flex flex-wrap gap-1 z-10 pointer-events-none">
            {badgesList.length > 0 ? (
              badgesList.slice(0, 1).map((b) => (
                <span
                  key={b}
                  className="rounded-md bg-emerald-700/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs"
                >
                  {b}
                </span>
              ))
            ) : (
              <span className="rounded-md bg-emerald-700/95 backdrop-blur-md px-2 py-0.5 sm:px-2.5 sm:py-1 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider text-white shadow-xs">
                Open Trip
              </span>
            )}
          </div>

          {/* TOP RIGHT CONTROLS: COMPARE TOGGLE & SEAT ALERT */}
          <div className="absolute right-2 top-2 sm:right-3 sm:top-3 flex flex-col items-end gap-1 z-20">
            <button
              type="button"
              data-testid={`compare-toggle-${trip.id}`}
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                toggleCompare(trip);
              }}
              className={`inline-flex items-center gap-1.5 rounded-lg px-2 py-1 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-extrabold backdrop-blur-md shadow-sm transition-all duration-200 border cursor-pointer ${
                isCompared
                  ? "bg-emerald-600 text-white border-emerald-500 scale-105 ring-2 ring-emerald-400/50"
                  : "bg-slate-900/85 hover:bg-slate-900 text-slate-100 hover:text-emerald-300 border-white/20 active:scale-95"
              }`}
              title={isCompared ? "Daftar Komparasi" : "Tambah ke Komparasi"}
            >
              <Scales size={13} weight={isCompared ? "fill" : "bold"} />
              <span>{isCompared ? "✓ Dibandingkan" : "+ Bandingkan"}</span>
            </button>

            {nearlyFull && (
              <span className="rounded-md bg-amber-500/90 backdrop-blur-md px-1.5 py-0.5 text-[9px] font-extrabold text-white shadow-xs animate-pulse">
                SISA {remaining}
              </span>
            )}
          </div>

          {/* DESTINATION OVERLAY */}
          <div className="absolute bottom-2 left-2 right-2 sm:bottom-3 sm:left-3 sm:right-3 text-white flex items-center justify-between text-[10px] sm:text-xs font-medium z-10 pointer-events-none">
            <span className="inline-flex items-center gap-1 drop-shadow truncate">
              <MapPin size={12} className="text-emerald-400 shrink-0" /> {trip.destination}
            </span>
          </div>
        </div>

        <div className="p-2.5 sm:p-5">
          {/* PROVIDER & RATING */}
          <div className="flex items-center justify-between text-[10px] sm:text-xs text-muted-foreground mb-1 sm:mb-2">
            <Link
              to={`/vendor/${trip.vendor_slug || 'trexio-official'}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400 hover:underline truncate max-w-[150px] sm:max-w-none"
            >
              {isVerified && <CheckCircle size={12} weight="fill" className="shrink-0 text-emerald-500" />}
              <span>{trip.vendor_name || "TREXIO Partner"}</span>
            </Link>
            <div className="flex items-center gap-0.5 sm:gap-1">
              <Star size={12} weight="fill" className="text-amber-500" />
              <span className="font-bold text-foreground">{trip.vendor_rating || trip.rating || 5.0}</span>
            </div>
          </div>

          <h3 className="text-xs sm:text-base font-bold text-foreground group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors line-clamp-2 leading-tight sm:leading-snug">
            {trip.title}
          </h3>

          <div className="mt-2 sm:mt-3.5 flex flex-wrap gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-muted text-slate-700 dark:text-slate-300 font-medium text-[9px] sm:text-[11px]">
              <CalendarBlank size={12} className="text-emerald-500" />
              {trip.duration_days} Hari
            </span>
            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 sm:px-2.5 sm:py-1 rounded-md bg-muted text-slate-700 dark:text-slate-300 font-medium text-[9px] sm:text-[11px]">
              <Mountains size={12} weight="fill" className="text-emerald-500" />
              {trip.difficulty}
            </span>
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-5 pt-2 sm:pt-4 border-t border-border/60 flex items-center justify-between gap-1">
        <div>
          <div className="text-[8px] sm:text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Mulai dari
          </div>
          <div className="text-xs sm:text-lg font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(trip.price)}
          </div>
        </div>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/trip/${trip.id}`);
          }}
          className="inline-flex items-center gap-1 rounded-xl bg-emerald-700 group-hover:bg-emerald-800 text-white px-2.5 py-1.5 sm:px-3.5 sm:py-2 text-[10px] sm:text-xs font-bold transition-all shadow-xs cursor-pointer"
        >
          Pesan <span className="hidden sm:inline">Seat</span> →
        </button>
      </div>
    </motion.div>
  );
}
