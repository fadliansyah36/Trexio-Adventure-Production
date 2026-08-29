import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Heart,
  ShareNetwork,
  Trash,
  MapPin,
  Star,
  ArrowRight,
  Storefront,
  Sparkle,
  User,
  ShieldWarning,
  SignIn,
  UserPlus,
  Compass,
} from "@phosphor-icons/react";
import { formatRupiah, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

export default function Wishlist() {
  const { user, ready } = useAuth();
  const [activeTab, setActiveTab] = useState("trips");
  const [loading, setLoading] = useState(true);

  const [savedTrips, setSavedTrips] = useState([]);
  const [favoritePartners, setFavoritePartners] = useState([]);
  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    if (!ready) return;

    if (!user) {
      // Unauthenticated visitor / logged out state: reset all wishlist items
      setSavedTrips([]);
      setFavoritePartners([]);
      setRecentlyViewed([]);
      setLoading(false);
      localStorage.removeItem("trexio-wishlist");
      localStorage.removeItem("trexio-favorite-partners");
      sessionStorage.removeItem("trexio-wishlist");
      return;
    }

    // Authenticated user: fetch wishlist items from backend API
    setLoading(true);
    apiFetch("/wishlist")
      .then((items) => {
        if (Array.isArray(items)) {
          const formatted = items.map((w) => ({
            id: w.item_id || w.id,
            wishlist_id: w.id,
            title: w.title || "Petualangan Outdoor",
            destination: w.category || "Indonesia",
            price: w.price || 0,
            rating: 4.9,
            reviews_count: 50,
            partner: "Trexio Partner",
            image: w.cover_image || "https://images.pexels.com/photos/1687514/pexels-photo-1687514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
            item_type: w.item_type || "trip",
          }));
          setSavedTrips(formatted);
        } else {
          setSavedTrips([]);
        }
      })
      .catch(() => setSavedTrips([]))
      .finally(() => setLoading(false));
  }, [user, ready]);

  const handleRemoveTrip = async (itemId, itemType = "trip") => {
    try {
      await apiFetch(`/wishlist/${itemType}/${itemId}`, { method: "DELETE" });
      setSavedTrips((prev) => prev.filter((t) => t.id !== itemId && t.item_id !== itemId));
      toast.success("Petualangan dihapus dari Wishlist");
    } catch {
      setSavedTrips((prev) => prev.filter((t) => t.id !== itemId && t.item_id !== itemId));
      toast.success("Petualangan dihapus dari Wishlist");
    }
  };

  const handleRemovePartner = (id) => {
    setFavoritePartners((prev) => prev.filter((p) => p.id !== id));
    toast.success("Mitra dihapus dari Favorit");
  };

  const handleShare = (item) => {
    if (navigator.share) {
      navigator.share({
        title: item.title || item.name,
        text: `Cek petualangan seru ini di Trexio: ${item.title || item.name}`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan petualangan disalin ke clipboard!");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-20 pt-8 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mb-1">
              <Heart size={16} weight="fill" className="text-rose-500" /> Personal Saved Hub
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground">
              Wishlist & Mitra Favorit
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Simpan rencana trip, rental gear, dan organizer outdoor favoritmu sebelum booking.
            </p>
          </div>

          <div className="flex gap-2">
            <Link
              to="/explore"
              className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl shadow-xs"
            >
              Cari Trip Lain <ArrowRight size={14} />
            </Link>
          </div>
        </div>

        {/* Guest / Visitor Card Notice when user is logged out */}
        {!user && (
          <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 space-y-4 shadow-xs text-center max-w-2xl mx-auto my-6">
            <div className="w-16 h-16 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
              <User size={32} weight="bold" />
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-bold border border-amber-500/20">
              <ShieldWarning size={14} /> Mode Pengunjung Biasa (Belum Login)
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-foreground">
              Wishlist Kosong
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed max-w-lg mx-auto">
              Sesi wishlist Anda telah dikosongkan. Saat ini Anda berada dalam tampilan pengunjung biasa. Silakan masuk atau daftar akun untuk menyimpan petualangan impian dan melihat wishlist tersimpan di semua perangkat Anda.
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
              <Link
                to="/login"
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-xs flex items-center gap-1.5"
              >
                <SignIn size={16} /> Masuk / Login
              </Link>
              <Link
                to="/register"
                className="bg-muted hover:bg-muted/80 text-foreground text-xs font-bold px-5 py-2.5 rounded-xl border border-border transition-all flex items-center gap-1.5"
              >
                <UserPlus size={16} /> Daftar Akun Baru
              </Link>
              <Link
                to="/explore"
                className="bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-foreground text-xs font-bold px-4 py-2.5 rounded-xl transition-colors flex items-center gap-1.5"
              >
                <Compass size={16} /> Jelajah Petualangan
              </Link>
            </div>
          </div>
        )}

        {/* Main Content Tabs for Logged-In User or Authenticated Views */}
        {user && (
          <>
            {/* Navigation Tabs */}
            <div className="flex border-b border-border gap-6 text-sm font-bold">
              <button
                onClick={() => setActiveTab("trips")}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "trips"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Heart size={18} weight={activeTab === "trips" ? "fill" : "regular"} className="text-rose-500" />
                <span>Petualangan Tersimpan</span>
                {savedTrips.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    {savedTrips.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab("partners")}
                className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
                  activeTab === "partners"
                    ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Storefront size={18} className="text-emerald-600" />
                <span>Mitra Favorit</span>
                {favoritePartners.length > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {favoritePartners.length}
                  </span>
                )}
              </button>
            </div>

            {/* Tab 1: Saved Trips */}
            {activeTab === "trips" && (
              <div className="space-y-6">
                {loading ? (
                  <div className="text-center py-12 text-xs text-muted-foreground">
                    Memuat wishlist...
                  </div>
                ) : savedTrips.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl p-8 space-y-3">
                    <Heart size={48} className="mx-auto text-neutral-300 dark:text-zinc-700" />
                    <h3 className="font-black text-lg text-foreground">Wishlist Masih Kosong</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Belum ada trip yang kamu simpan. Tekan ikon hati pada halaman Explore atau Detail Trip untuk menyimpan petualangan impianmu.
                    </p>
                    <Link
                      to="/explore"
                      className="inline-block mt-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors"
                    >
                      Jelajah Sekarang
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedTrips.map((item) => (
                      <div
                        key={item.id}
                        className="group bg-card border border-border rounded-2xl overflow-hidden hover:shadow-lg transition-all flex flex-col justify-between"
                      >
                        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                          <img
                            src={item.image}
                            alt={item.title}
                            loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <button
                            onClick={() => handleRemoveTrip(item.id, item.item_type)}
                            className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur text-white hover:text-rose-400 rounded-full transition-colors"
                            title="Hapus dari Wishlist"
                          >
                            <Trash size={16} />
                          </button>
                        </div>

                        <div className="p-5 space-y-3">
                          <div className="flex justify-between items-center text-xs text-muted-foreground font-semibold">
                            <span className="flex items-center gap-1 text-emerald-600">
                              <MapPin size={14} /> {item.destination}
                            </span>
                            <span className="flex items-center gap-1 font-bold text-amber-500">
                              <Star size={14} weight="fill" /> {item.rating} ({item.reviews_count})
                            </span>
                          </div>
                          <h3 className="font-black text-base text-foreground line-clamp-2 group-hover:text-emerald-600 transition-colors">
                            {item.title}
                          </h3>
                          <div className="text-xs text-muted-foreground">
                            Mitra: <strong className="text-foreground">{item.partner}</strong>
                          </div>
                        </div>

                        <div className="p-4 bg-muted/20 border-t border-border flex items-center justify-between">
                          <div>
                            <div className="text-[10px] text-muted-foreground font-bold uppercase">Mulai Dari</div>
                            <div className="text-base font-black text-emerald-600">{formatRupiah(item.price)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleShare(item)}
                              className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted"
                              title="Bagikan Tautan"
                            >
                              <ShareNetwork size={16} />
                            </button>
                            <Link
                              to={`/trip/${item.id}`}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-colors"
                            >
                              Detail Trip
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Favorite Partners */}
            {activeTab === "partners" && (
              <div className="space-y-6">
                {favoritePartners.length === 0 ? (
                  <div className="text-center py-16 bg-card border border-dashed border-border rounded-2xl p-8 space-y-3">
                    <Storefront size={48} className="mx-auto text-neutral-300 dark:text-zinc-700" />
                    <h3 className="font-black text-lg text-foreground">Belum Ada Mitra Favorit</h3>
                    <p className="text-xs text-muted-foreground max-w-md mx-auto">
                      Kamu belum memfavoritkan organizer atau partner petualangan outdoor.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                    {favoritePartners.map((partner) => (
                      <div
                        key={partner.id}
                        className="bg-card border border-border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 shadow-xs"
                      >
                        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                          <img
                            src={partner.avatar}
                            alt={partner.name}
                            loading="lazy"
                            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full object-cover border-2 border-emerald-500/30 shrink-0"
                          />
                          <div className="min-w-0">
                            <div className="font-black text-sm sm:text-base text-foreground flex items-center gap-1.5 flex-wrap">
                              <span className="truncate">{partner.name}</span>
                              {partner.verified && (
                                <span className="bg-emerald-500/10 text-emerald-600 text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-500/30 shrink-0">
                                  Verified
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-0.5 truncate">
                              {partner.city} • <span className="text-amber-500 font-bold">★ {partner.rating}</span> ({partner.reviews} ulasan)
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-0 border-border/60 shrink-0">
                          <Link
                            to={`/@${partner.handle}`}
                            className="bg-slate-100 dark:bg-zinc-800 text-foreground text-xs font-bold px-3 py-2 rounded-xl hover:bg-emerald-600 hover:text-white transition-colors text-center flex-1 sm:flex-none"
                          >
                            Profil Mitra
                          </Link>
                          <button
                            onClick={() => handleRemovePartner(partner.id)}
                            className="p-2 text-neutral-400 hover:text-rose-500 rounded-lg hover:bg-rose-500/10 transition-colors"
                            title="Hapus dari favorit"
                          >
                            <Trash size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recently Viewed Section */}
            {recentlyViewed.length > 0 && (
              <div className="pt-8 border-t border-border space-y-4">
                <div className="flex items-center gap-2 font-black text-base text-foreground">
                  <Sparkle size={18} className="text-emerald-500" /> Terakhir Dilihat (Recently Viewed)
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {recentlyViewed.map((item) => (
                    <Link
                      key={item.id}
                      to={`/trip/${item.id}`}
                      className="bg-card border border-border rounded-xl p-3 flex items-center gap-4 hover:border-emerald-500/50 transition-colors"
                    >
                      <img src={item.image} alt={item.title} loading="lazy" className="w-16 h-16 rounded-lg object-cover shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-foreground truncate">{item.title}</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{item.destination}</div>
                        <div className="text-xs font-black text-emerald-600 mt-1">{formatRupiah(item.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
