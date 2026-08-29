import { useCompare } from "@/context/CompareContext";
import { formatRupiah } from "@/lib/api";
import { Link, useNavigate } from "react-router-dom";
import {
  X,
  Scale,
  MapPin,
  Calendar,
  Mountain,
  Users,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Plus,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function CompareDrawer() {
  const navigate = useNavigate();
  const {
    selectedTrips,
    isOpen,
    setIsOpen,
    removeFromCompare,
    clearCompare,
    maxCompare,
  } = useCompare();

  if (selectedTrips.length === 0) return null;

  return (
    <>
      {/* FLOATING BOTTOM BAR */}
      <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-[60] w-[92%] max-w-2xl bg-slate-900/95 dark:bg-slate-900/95 text-white backdrop-blur-xl border border-emerald-500/30 rounded-2xl shadow-2xl p-3 sm:p-4 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="h-10 w-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shrink-0">
            <Scale size={20} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs sm:text-sm text-white truncate">
                Bandingkan Paket Trip
              </span>
              <span className="px-2 py-0.5 rounded-full bg-emerald-600 text-white font-extrabold text-[10px]" data-testid="compare-count-badge">
                {selectedTrips.length}/{maxCompare}
              </span>
            </div>
            {/* THUMBNAIL PREVIEWS */}
            <div className="flex items-center gap-1.5 mt-1 overflow-x-auto py-0.5">
              {selectedTrips.map((t) => (
                <div
                  key={t.id}
                  className="relative group shrink-0 h-7 w-7 rounded-lg overflow-hidden border border-white/20 bg-slate-800"
                >
                  <img
                    src={t.cover_image}
                    alt={t.title}
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromCompare(t.id);
                    }}
                    aria-label={`Hapus ${t.title} dari komparasi`}
                    className="absolute inset-0 bg-black/70 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Hapus"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clearCompare}
            data-testid="compare-clear-btn"
            className="hidden sm:inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <Trash2 size={14} /> Reset
          </button>
          <Button
            onClick={() => setIsOpen(true)}
            data-testid="open-compare-modal-btn"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-4 py-2 rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 cursor-pointer"
          >
            Bandingkan <ArrowRight size={14} />
          </Button>
        </div>
      </div>

      {/* SIDE-BY-SIDE COMPARISON MODAL */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-card border-border p-4 sm:p-6 rounded-3xl shadow-2xl z-[100]">
          <DialogHeader className="pb-4 border-b border-border flex flex-row items-center justify-between">
            <div>
              <DialogTitle className="text-xl sm:text-2xl font-black text-foreground flex items-center gap-2">
                <Scale className="text-emerald-500" size={24} /> Komparasi Paket Trip
              </DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Perbandingan berdampingan harga, durasi, spesifikasi, dan kuota seat.
              </p>
            </div>
            <button
              onClick={clearCompare}
              className="text-xs font-semibold text-rose-500 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Trash2 size={13} /> Reset Komparasi
            </button>
          </DialogHeader>

          {/* SIDE-BY-SIDE GRID TABLE */}
          <div className="mt-4 overflow-x-auto pb-4">
            <div
              className="grid gap-4 min-w-[580px]"
              style={{
                gridTemplateColumns: `160px repeat(${selectedTrips.length + (selectedTrips.length < maxCompare ? 1 : 0)}, minmax(210px, 1fr))`,
              }}
            >
              {/* LABEL COLUMN HEADER */}
              <div className="space-y-6 pt-4 font-bold text-xs text-muted-foreground uppercase tracking-wider">
                <div className="h-48 flex items-end pb-2 border-b border-border text-foreground font-black text-sm">
                  Kriteria Trip
                </div>
                <div className="py-2 border-b border-border/60">Harga per Pax</div>
                <div className="py-2 border-b border-border/60">Destinasi / Region</div>
                <div className="py-2 border-b border-border/60">Kategori</div>
                <div className="py-2 border-b border-border/60">Durasi</div>
                <div className="py-2 border-b border-border/60">Tingkat Kesulitan</div>
                <div className="py-2 border-b border-border/60">Kapasitas / Sisa Seat</div>
                <div className="py-2 border-b border-border/60">Penyelenggara / Vendor</div>
                <div className="py-2">Aksi</div>
              </div>

              {/* TRIP COLUMNS */}
              {selectedTrips.map((trip) => {
                const remaining = (trip.max_participants || 0) - (trip.booked_seats || 0);
                return (
                  <div
                    key={trip.id}
                    className="bg-muted/30 dark:bg-slate-900/50 border border-border/80 rounded-2xl p-4 flex flex-col justify-between space-y-6 relative group"
                  >
                    {/* TOP HEADER / COVER */}
                    <div className="h-48 flex flex-col justify-between border-b border-border pb-3 relative">
                      <button
                        onClick={() => removeFromCompare(trip.id)}
                        aria-label={`Hapus ${trip.title} dari komparasi`}
                        className="absolute top-0 right-0 z-10 bg-slate-900/80 hover:bg-rose-600 text-white p-1.5 rounded-full shadow transition-all cursor-pointer"
                        title="Hapus dari komparasi"
                      >
                        <X size={14} />
                      </button>

                      <div className="aspect-[16/9] w-full rounded-xl overflow-hidden bg-muted mb-2 border border-border/50">
                        <img
                          src={trip.cover_image}
                          alt={trip.title}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <h4 className="font-extrabold text-sm text-foreground line-clamp-2 leading-tight">
                        {trip.title}
                      </h4>
                    </div>

                    {/* HARGA */}
                    <div className="py-2 border-b border-border/60">
                      <div className="text-base font-black text-emerald-600 dark:text-emerald-400">
                        {formatRupiah(trip.price)}
                      </div>
                      <div className="text-[10px] text-muted-foreground">/ peserta</div>
                    </div>

                    {/* DESTINASI */}
                    <div className="py-2 border-b border-border/60 text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <MapPin size={14} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{trip.destination || "Destinasi"} ({trip.region || "Indonesia"})</span>
                    </div>

                    {/* KATEGORI */}
                    <div className="py-2 border-b border-border/60 text-xs font-medium text-foreground">
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold border border-emerald-500/20 inline-block">
                        {trip.category || "Open Trip"}
                      </span>
                    </div>

                    {/* DURASI */}
                    <div className="py-2 border-b border-border/60 text-xs text-foreground flex items-center gap-1.5 font-medium">
                      <Calendar size={14} className="text-emerald-500 shrink-0" />
                      <span>{trip.duration_days || 1} Hari ({trip.duration_days > 1 ? `${trip.duration_days - 1} Malam` : "1 Day"})</span>
                    </div>

                    {/* KESULITAN */}
                    <div className="py-2 border-b border-border/60 text-xs text-foreground flex items-center gap-1.5 font-medium">
                      <Mountain size={14} className="text-emerald-500 shrink-0" />
                      <span>{trip.difficulty || "Moderat"}</span>
                    </div>

                    {/* SEAT */}
                    <div className="py-2 border-b border-border/60 text-xs font-semibold">
                      <div className="flex items-center gap-1.5 text-foreground">
                        <Users size={14} className="text-emerald-500 shrink-0" />
                        <span>Max {trip.max_participants || 10} Peserta</span>
                      </div>
                      <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Sisa {remaining > 0 ? remaining : 0} Seat Lagi
                      </div>
                    </div>

                    {/* VENDOR */}
                    <div className="py-2 border-b border-border/60 text-xs text-foreground flex items-center gap-1 font-semibold">
                      <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{trip.vendor_name || "TREXIO Partner"}</span>
                    </div>

                    {/* ACTION */}
                    <div className="pt-2">
                      <Link
                        to={`/trip/${trip.id}`}
                        onClick={() => setIsOpen(false)}
                        className="w-full inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-3 text-xs font-bold transition-all shadow-md"
                      >
                        Pesan Trip <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                );
              })}

              {/* ADD ANOTHER TRIP CARD PLACEHOLDER IF < MAX_COMPARE */}
              {selectedTrips.length < maxCompare && (
                <div className="border-2 border-dashed border-border/80 rounded-2xl p-4 flex flex-col items-center justify-center text-center space-y-4 bg-card/50">
                  <div className="h-12 w-12 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                    <Plus size={24} />
                  </div>
                  <div>
                    <h5 className="font-extrabold text-sm text-foreground">Tambah Trip Lain</h5>
                    <p className="text-xs text-muted-foreground mt-1 max-w-[180px]">
                      Pilih hingga {maxCompare} trip untuk dibandingkan berdampingan.
                    </p>
                  </div>
                  <Button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/explore");
                    }}
                    variant="outline"
                    className="border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs rounded-xl hover:bg-emerald-500/10"
                  >
                    Cari Trip (+ ({selectedTrips.length}/{maxCompare}))
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
