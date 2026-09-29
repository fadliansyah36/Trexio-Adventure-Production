import { useState } from "react";
import { Link } from "react-router-dom";
import { MapPin, Star, Heart, ShieldCheck, CalendarBlank, ShoppingCart, Check, CircleNotch } from "@phosphor-icons/react";
import { formatRupiah } from "@/lib/api";
import { addItemToCart } from "@/lib/cartStorage";
import { buildProductUrl } from "@/lib/utils";
import { toast } from "sonner";

/**
 * Reusable Marketplace ProductCard component
 * Designed for mobile-optimized touch performance, soft shadows, rounded corners,
 * and high typographic hierarchy.
 */
export default function ProductCard({
  item,
  type = "trip",
  onWishlistToggle,
  onQuickAdd,
  className = "",
  testIdPrefix = "product-card",
}) {
  const [isWishlisted, setIsWishlisted] = useState(item?.wishlisted || false);
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  if (!item) return null;

  const image =
    item.cover_image ||
    item.image ||
    "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";
  const title = item.title || item.name || "Produk Petualangan Trexio";
  const location = item.region || item.destination || item.location || "Indonesia";
  const rating = item.rating || "5.0";
  const reviewsCount = item.reviews_count || 48;
  const price = item.price || item.price_per_day || 0;
  const priceUnit = item.price_unit || (type === "rental" ? "hari" : "pax");
  const badge = item.badge || item.tag;

  const isVerified = item.vendor_verified === true || item.vendor_status === "verified" || item.verified === true;

  // Determine destination URL
  const isTrip =
    type === "trip" ||
    type === "open-trip" ||
    type === "private-trip" ||
    item.category === "Open Trip" ||
    item.category === "Private Trip";

  const catSlug =
    item.category_slug ||
    item.slug ||
    (type && type !== "trip" ? type : "open-trip");

  const linkTo = item.to || buildProductUrl({ ...item, type: type || item.type });

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const nextState = !isWishlisted;
    setIsWishlisted(nextState);
    if (onWishlistToggle) {
      onWishlistToggle(item, nextState);
    }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (isAdding) return;
    setIsAdding(true);

    try {
      const payload = {
        item_id: item.id || item.slug || item.trip_id,
        item_type: type || item.type || (isTrip ? "trip" : "rental"),
        title: title,
        price: Number(price || 0),
        quantity: 1,
        cover_image: image,
        departure_date: Array.isArray(item.departure_dates)
          ? item.departure_dates[0]
          : item.departure_dates || "",
      };

      const updatedCart = await addItemToCart(payload);

      setAdded(true);
      toast.success(`"${title}" telah ditambahkan ke keranjang booking!`, {
        description: `${formatRupiah(price)} / ${priceUnit}`,
      });

      if (onQuickAdd) {
        onQuickAdd(item, updatedCart);
      }

      setTimeout(() => setAdded(false), 2500);
    } catch (err) {
      console.error("Quick add error:", err);
      toast.error("Gagal menambahkan ke keranjang booking");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div
      data-testid={`${testIdPrefix}-${item.slug || item.id}`}
      className={`group relative bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-lg transition-all duration-300 flex flex-col justify-between shrink-0 select-none ${className}`}
    >
      <div>
        {/* Cover Image & Overlay Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={image}
            alt={title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />

          {/* Badge */}
          {badge ? (
            <span className="absolute top-2.5 left-2.5 bg-emerald-700/95 backdrop-blur-xs text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs z-10">
              {badge}
            </span>
          ) : item.category ? (
            <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md z-10">
              {item.category}
            </span>
          ) : null}

          {/* Wishlist Button */}
          <button
            type="button"
            onClick={handleWishlist}
            aria-label="Wishlist"
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-all active:scale-90 shadow-md z-10 ${
              isWishlisted
                ? "bg-rose-500 text-white"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <Heart size={14} weight={isWishlisted ? "fill" : "bold"} />
          </button>

          {/* Rating Tag */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1 z-10">
            <Star size={11} weight="fill" className="text-amber-400" />
            <span>{rating}</span>
            <span className="text-slate-300 font-normal">({reviewsCount})</span>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-3.5 space-y-2">
          {/* Location */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider line-clamp-1">
            <MapPin size={12} className="shrink-0" />
            <span>{location}</span>
          </div>

          {/* Title */}
          <Link
            to={linkTo}
            className="block font-black text-xs md:text-sm text-foreground line-clamp-2 group-hover:text-emerald-600 transition-colors leading-snug"
          >
            {title}
          </Link>

          {/* Schedule / Departure date if available */}
          {item.departure_dates && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <CalendarBlank size={11} className="shrink-0" />
              <span className="truncate">
                {Array.isArray(item.departure_dates)
                  ? item.departure_dates[0]
                  : String(item.departure_dates).split(",")[0]}
              </span>
            </div>
          )}

          {/* Provider Badge */}
          {item.provider && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              {isVerified && <ShieldCheck size={11} className="text-emerald-500 shrink-0" />}
              <span className="truncate">by {item.provider}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing & CTA */}
      <div className="p-3.5 pt-2 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/10">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">
            Mulai dari
          </div>
          <div className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400">
            {formatRupiah(price)}
            <span className="text-[9px] text-muted-foreground font-normal">
              /{priceUnit}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleQuickAdd}
            disabled={isAdding}
            data-testid={`quick-add-btn-${item.id || item.slug}`}
            title="Tambah Cepat ke Keranjang Booking"
            aria-label="Quick Add to Booking Basket"
            className={`px-2.5 py-1.5 rounded-xl border text-[11px] font-bold flex items-center gap-1.5 transition-all active:scale-95 shrink-0 shadow-2xs ${
              added
                ? "bg-emerald-500/15 text-emerald-600 border-emerald-500/40 dark:text-emerald-400"
                : "bg-background hover:bg-emerald-50/80 text-foreground border-border hover:border-emerald-500/50 hover:text-emerald-600 dark:hover:bg-emerald-950/40"
            }`}
          >
            {isAdding ? (
              <CircleNotch size={14} className="animate-spin text-emerald-600" />
            ) : added ? (
              <>
                <Check size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart size={14} className="text-emerald-600 dark:text-emerald-400" />
                <span>+ Quick Add</span>
              </>
            )}
          </button>

          <Link
            to={linkTo}
            className="px-3 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white text-[11px] font-bold transition-all shadow-xs shrink-0"
          >
            Pesan
          </Link>
        </div>
      </div>
    </div>
  );
}
