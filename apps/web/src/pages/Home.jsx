import { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, formatRupiah, apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import SearchBarWithAutocomplete from "@/components/site/SearchBarWithAutocomplete";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import SEO from "@/components/site/SEO";
import { generateOrganizationSchema } from "@/services/seoService";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import ProductCard from "@/components/site/ProductCard";
import {
  HorizontalProductSkeletonList,
  ProductSkeletonGrid,
  ProviderSkeletonGrid,
  BasecampCardSkeleton,
  RentalCardSkeleton,
} from "@/components/site/CardSkeletons";
import {
  MagnifyingGlass,
  ArrowRight,
  Star,
  MapPin,
  CalendarBlank,
  Package,
  Compass,
  Sparkle,
  Lightning,
  UserCheck,
  Backpack,
  HouseLine,
  Tent,
  House,
  Bus,
  Car,
  Mountains,
  Ticket,
  GridFour,
  QrCode,
  Heart,
  ChatCircleDots,
  Bell,
  DownloadSimple,
  ShieldCheck,
  CheckCircle,
  Storefront,
  CaretRight,
  CaretLeft,
  X,
  User,
  SlidersHorizontal,
  Handbag,
  Megaphone,
  UsersThree,
  PaperPlaneTilt,
  Newspaper,
  CreditCard,
} from "@phosphor-icons/react";

// Trexio Marketplace Categories
const CATEGORIES_12 = [
  { name: "Trexio Backpacker", icon: Compass, link: "/backpacker", desc: "Rute pintar, patungan, & nebeng", slug: "backpacker" },
  { name: "Open Trip", icon: Compass, link: "/category/open-trip", desc: "Trip gabungan hemat", slug: "open-trip" },
  { name: "Private Trip", icon: Sparkle, link: "/category/private-trip", desc: "Trip privat kustom", slug: "private-trip" },
  { name: "Guide", icon: UserCheck, link: "/category/guide", desc: "Pemandu gunung terlisensi", slug: "guide" },
  { name: "Porter", icon: Backpack, link: "/category/porter", desc: "Jasa porter pendakian", slug: "porter" },
  { name: "Sewa Alat", icon: Package, link: "/category/rental-gear", desc: "Tenda & alat outdoor", slug: "rental-gear" },
  { name: "Basecamp", icon: HouseLine, link: "/category/basecamp", desc: "Pos registrasi & rehat", slug: "basecamp" },
  { name: "Camping Ground", icon: Tent, link: "/category/camping-ground", desc: "Kemping alam & kawah", slug: "camping-ground" },
  { name: "Homestay", icon: House, link: "/category/homestay", desc: "Penginapan lokal ramah", slug: "homestay" },
  { name: "Shuttle", icon: Bus, link: "/category/shuttle", desc: "Antar-jemput stasiun", slug: "shuttle" },
  { name: "Transportasi", icon: Car, link: "/category/transportasi", desc: "Jeep 4x4 & armada lokal", slug: "transportasi" },
  { name: "Wisata Alam", icon: Mountains, link: "/category/wisata-alam", desc: "Air terjun & kawah", slug: "wisata-alam" },
  { name: "Event", icon: Ticket, link: "/category/event", desc: "Festival & gathering", slug: "event" },
];

/** Standard Reusable Marketplace Product Card */
function StandardProductCard({ item, type = "trip", onWishlistToggle }) {
  const [isWishlisted, setIsWishlisted] = useState(item.wishlisted || false);

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted(!isWishlisted);
    if (onWishlistToggle) onWishlistToggle(item, !isWishlisted);
  };

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

  const linkTo =
    item.to ||
    (item.trip_id
      ? `/trip/${item.trip_id}`
      : isTrip && item.id && !String(item.id).startsWith("cat_")
      ? `/trip/${item.id}`
      : item.type === "rental" || type === "rental"
      ? `/rental/${item.id}`
      : `/category/${catSlug}${item.id ? `?item=${item.id}` : ""}`);

  return (
    <div
      data-testid={item.slug ? `home-trip-${item.slug}` : `product-card-${item.id}`}
      className="group relative bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-lg transition-all duration-300 flex flex-col justify-between w-full shrink-0 select-none"
    >
      <div>
        {/* Cover Image & Badges */}
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          <img
            src={item.cover_image || item.image || "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"}
            alt={item.title || item.name}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {item.badge && (
            <span className="absolute top-2.5 left-2.5 bg-emerald-600 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs">
              {item.badge}
            </span>
          )}
          {item.category && !item.badge && (
            <span className="absolute top-2.5 left-2.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md">
              {item.category}
            </span>
          )}

          {/* Wishlist Button */}
          <button
            onClick={handleWishlist}
            aria-label="Wishlist"
            className={`absolute top-2.5 right-2.5 p-2 rounded-full backdrop-blur-md transition-transform active:scale-90 shadow-md ${
              isWishlisted
                ? "bg-rose-500 text-white"
                : "bg-black/40 text-white hover:bg-black/60"
            }`}
          >
            <Heart size={14} weight={isWishlisted ? "fill" : "bold"} />
          </button>

          {/* Rating Tag */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/70 backdrop-blur-xs text-white text-[10px] font-bold flex items-center gap-1">
            <Star size={11} weight="fill" className="text-amber-400" />
            <span>{item.rating || "5.0"}</span>
            <span className="text-slate-300 font-normal">({item.reviews_count || 48})</span>
          </div>
        </div>

        {/* Product Details */}
        <div className="p-3.5 space-y-2">
          {/* Location / Destination */}
          <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider line-clamp-1">
            <MapPin size={12} className="shrink-0" />
            <span>{item.region || item.destination || item.location || "Indonesia"}</span>
          </div>

          {/* Title */}
          <Link
            to={linkTo}
            className="block font-black text-xs md:text-sm text-foreground line-clamp-2 group-hover:text-emerald-800 transition-colors leading-snug"
          >
            {item.title || item.name}
          </Link>

          {/* Remaining slots / Schedule if available */}
          {item.departure_dates && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground font-medium">
              <CalendarBlank size={11} className="shrink-0" />
              <span className="truncate">
                {Array.isArray(item.departure_dates) ? item.departure_dates[0] : String(item.departure_dates).split(',')[0]}
              </span>
            </div>
          )}

          {/* Partner / Organizer Badge */}
          {item.provider && (
            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck size={11} className="text-emerald-500" />
              <span className="truncate">by {item.provider}</span>
            </div>
          )}
        </div>
      </div>

      {/* Pricing & Booking CTA */}
      <div className="p-3.5 pt-2 border-t border-border/60 flex items-center justify-between gap-2 bg-muted/10">
        <div>
          <div className="text-[9px] uppercase tracking-wider text-muted-foreground font-semibold">Mulai dari</div>
          <div className="text-xs sm:text-sm font-black text-emerald-800 dark:text-emerald-400">
            {formatRupiah(item.price || item.price_per_day || 0)}
            <span className="text-[9px] text-muted-foreground font-normal">
              {item.price_unit ? `/${item.price_unit}` : isTrip ? "" : "/hari"}
            </span>
          </div>
        </div>

        <Link
          to={linkTo}
          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition-colors shadow-xs shrink-0"
        >
          Pesan
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const nav = useNavigate();

  // Core Data States & Loading Indicators
  const [homepageConfig, setHomepageConfig] = useState(null);
  const [featured, setFeatured] = useState([]);
  const [loadingFeatured, setLoadingFeatured] = useState(true);

  const [sponsoredCampaigns, setSponsoredCampaigns] = useState([]);
  const [loadingSponsored, setLoadingSponsored] = useState(false);

  const [popularTrips, setPopularTrips] = useState([]);
  const [loadingPopular, setLoadingPopular] = useState(true);

  const [rentals, setRentals] = useState([]);
  const [loadingRentals, setLoadingRentals] = useState(true);

  // AI Personalized Recommendations State
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [loadingAiRecs, setLoadingAiRecs] = useState(true);

  // Category Items State
  const [selectedCategorySlug, setSelectedCategorySlug] = useState("open-trip");
  const [categoryItems, setCategoryItems] = useState([]);
  const [loadingCategoryItems, setLoadingCategoryItems] = useState(true);

  // Specialist Provider States (Guides, Porters, Basecamps)
  const [guides, setGuides] = useState([]);
  const [loadingGuides, setLoadingGuides] = useState(true);

  const [porters, setPorters] = useState([]);
  const [loadingPorters, setLoadingPorters] = useState(true);

  const [basecamps, setBasecamps] = useState([]);
  const [loadingBasecamps, setLoadingBasecamps] = useState(true);

  // Banner State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // User Dashboard State
  const [upcomingAdventures, setUpcomingAdventures] = useState([]);
  const [userContextState, setUserContextState] = useState("UPCOMING");

  // Notifications & Communications Summary State
  const [notifsSummary, setNotifsSummary] = useState(null);
  const [commSummary, setCommSummary] = useState(null);

  useEffect(() => {
    if (user) {
      apiFetch("/notifications").then((res) => {
        if (res) setNotifsSummary(res);
      }).catch(() => null);

      apiFetch("/communications/summary").then((res) => {
        if (res && res.ok) setCommSummary(res);
      }).catch(() => null);
    }
  }, [user]);

  // Category Modal State
  const [showAllCategoriesModal, setShowAllCategoriesModal] = useState(false);

  // PWA Install State
  const [isPWAInstalled, setIsPWAInstalled] = useState(false);

  // Auto-scroll Banners
  useEffect(() => {
    const bannersCount = homepageConfig?.banners?.length || 0;
    if (bannersCount <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % bannersCount);
    }, 5000);
    return () => clearInterval(timer);
  }, [homepageConfig?.banners]);

  // Check PWA Standalone status
  useEffect(() => {
    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true;
    setIsPWAInstalled(standalone);
  }, []);

  // Fetch Homepage Config & Main Datasets
  useEffect(() => {
    api.get("/homepage-config")
      .then((res) => {
        if (res.data) setHomepageConfig(res.data);
      })
      .catch(() => {});

    // Featured Trips
    setLoadingFeatured(true);
    api.get("/trips/featured")
      .then((r) => setFeatured(Array.isArray(r.data) ? r.data : []))
      .catch(() => setFeatured([]))
      .finally(() => setLoadingFeatured(false));

    // Active Sponsored Ad Campaigns
    setLoadingSponsored(true);
    api.get("/ad-campaigns/active?placement=homepage_featured")
      .then((r) => {
        const camps = Array.isArray(r.data) ? r.data : [];
        setSponsoredCampaigns(camps);
        // Track impression
        camps.forEach((c) => {
          api.post(`/ad-campaigns/${c.id}/impression`).catch(() => null);
        });
      })
      .catch(() => setSponsoredCampaigns([]))
      .finally(() => setLoadingSponsored(false));

    // Popular Open Trips
    setLoadingPopular(true);
    api.get("/trips?sort=popularity&limit=10")
      .then((r) => setPopularTrips(Array.isArray(r.data) ? r.data : []))
      .catch(() => setPopularTrips([]))
      .finally(() => setLoadingPopular(false));

    // Outdoor Rentals
    setLoadingRentals(true);
    api.get("/rentals")
      .then((r) => setRentals(Array.isArray(r.data) ? r.data : []))
      .catch(() => setRentals([]))
      .finally(() => setLoadingRentals(false));

    // Phase 3 AI Dynamic Homepage Ranking Engine
    api.get("/ai/homepage/ranked")
      .then((res) => {
        if (res.data?.ok && res.data?.sections) {
          const s = res.data.sections;
          if (Array.isArray(s.recommended_for_you) && s.recommended_for_you.length > 0) {
            setAiRecommendations(s.recommended_for_you);
          }
          if (Array.isArray(s.best_trips) && s.best_trips.length > 0) {
            setFeatured(s.best_trips);
          }
          if (Array.isArray(s.popular_open_trips) && s.popular_open_trips.length > 0) {
            setPopularTrips(s.popular_open_trips);
          }
          if (Array.isArray(s.outdoor_rental) && s.outdoor_rental.length > 0) {
            setRentals(s.outdoor_rental);
          }
        }
      })
      .catch(() => null);

    // Personalized AI Recommendations Feed
    setLoadingAiRecs(true);
    api.get("/ai/recommendations/for-you?limit=6")
      .then((r) => setAiRecommendations(Array.isArray(r.data?.recommendations) ? r.data.recommendations : []))
      .catch(() => setAiRecommendations([]))
      .finally(() => setLoadingAiRecs(false));

    // Specialized Providers
    setLoadingGuides(true);
    api.get("/categories/guide")
      .then((res) => setGuides(res.data?.items || []))
      .catch(() => {})
      .finally(() => setLoadingGuides(false));

    setLoadingPorters(true);
    api.get("/categories/porter")
      .then((res) => setPorters(res.data?.items || []))
      .catch(() => {})
      .finally(() => setLoadingPorters(false));

    setLoadingBasecamps(true);
    api.get("/categories/basecamp")
      .then((res) => setBasecamps(res.data?.items || []))
      .catch(() => {})
      .finally(() => setLoadingBasecamps(false));

    // Logged-in User Bookings
    const loadUserBookings = () => {
      if (user) {
        api.get("/bookings/my").then((r) => {
          if (Array.isArray(r.data) && r.data.length > 0) {
            const activeBookings = r.data.filter((b) => {
              const isCancelled =
                (b.booking_status || "").toLowerCase() === "cancelled" ||
                (b.payment_status || "").toLowerCase() === "cancelled" ||
                (b.trip_status || "").toUpperCase() === "CANCELLED" ||
                (b.status || "").toUpperCase() === "CANCELLED" ||
                b.payment_status === "expired" ||
                b.payment_status === "failed" ||
                b.payment_status === "rejected";
              return !isCancelled;
            });

            if (activeBookings.length > 0) {
              const mapped = activeBookings.slice(0, 3).map((b) => {
                const isPaid = b.payment_status === "verified" || b.payment_status === "paid" || b.booking_status === "confirmed";
                return {
                  id: b.id || b.booking_code,
                  booking_code: b.booking_code || b.id,
                  title: b.trip_title || b.product_name || "Petualangan Seru TREXIO",
                  region: b.region || "Indonesia",
                  date: b.departure_date ? new Date(b.departure_date).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "Jadwal Mendatang",
                  meeting_point: b.meeting_point || "Pos Registrasi Utama",
                  pax: b.num_seats || b.pax || 1,
                  payment_status: b.payment_status || "pending",
                  booking_status: b.booking_status || "pending_payment",
                  is_paid: isPaid,
                  status: isPaid ? "CONFIRMED" : "AWAITING_PAYMENT",
                  image: b.cover_image || "https://images.pexels.com/photos/38262907/pexels-photo-38262907.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
                };
              });
              setUpcomingAdventures(mapped);
            } else {
              setUpcomingAdventures([]);
            }
          } else {
            setUpcomingAdventures([]);
          }
        }).catch(() => setUpcomingAdventures([]));
      } else {
        setUpcomingAdventures([]);
      }
    };

    loadUserBookings();
    window.addEventListener("trexio:booking-updated", loadUserBookings);
    return () => {
      window.removeEventListener("trexio:booking-updated", loadUserBookings);
    };
  }, [user]);

  // Fetch items whenever selected category changes
  useEffect(() => {
    setLoadingCategoryItems(true);
    api.get(`/categories/${selectedCategorySlug}`)
      .then((res) => {
        if (res.data && Array.isArray(res.data.items)) {
          setCategoryItems(res.data.items);
        } else {
          setCategoryItems([]);
        }
      })
      .catch(() => setCategoryItems([]))
      .finally(() => setLoadingCategoryItems(false));
  }, [selectedCategorySlug]);

  // Wishlist handler helper
  const handleWishlistToggle = async (item, isSaved) => {
    if (!user) {
      toast.info("Silakan login terlebih dahulu untuk menyimpan ke Wishlist");
      return;
    }
    try {
      if (isSaved) {
        await apiFetch("/wishlist", {
          method: "POST",
          body: JSON.stringify({ item_id: item.id, item_type: "trip", title: item.title || item.name }),
        });
        toast.success("Ditambahkan ke Wishlist!");
      } else {
        await apiFetch(`/wishlist/trip/${item.id}`, { method: "DELETE" });
        toast.success("Dihapus dari Wishlist");
      }
    } catch {
      toast.success(isSaved ? "Ditambahkan ke Wishlist!" : "Dihapus dari Wishlist");
    }
  };

  // Trigger PWA Installation
  const triggerPWAInstall = () => {
    if (window.__trexioPwaPrompt) {
      window.dispatchEvent(new CustomEvent("trexio-trigger-install"));
    } else {
      toast.info("Trexio PWA telah terinstall atau peramban Anda telah berada dalam mode PWA.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-zinc-950 text-foreground pb-24 md:pb-12">
      <SEO
        title="Marketplace Open Trip & Outdoor Gear Indonesia"
        description="Temukan dan pesan berbagai paket Open Trip pendakian gunung, sewa alat outdoor, perlengkapan camping, dan tour petualangan alam di Indonesia."
        keywords="open trip, pendakian gunung, sewa alat outdoor, camping, outdoor indonesia, trexio"
        jsonLd={generateOrganizationSchema()}
      />
      
      {/* 1. APP HEADER (MOBILE-FIRST PWA HEADER) */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border/80 shadow-2xs px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Logo & Brand Tagline */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <TrexioLogo variant="icon" size="sm" />
            <div className="hidden sm:block">
              <span className="font-black text-lg tracking-tight text-foreground leading-none block">
                TREXIO
              </span>
              <span className="text-[9px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest block">
                Adventure Marketplace
              </span>
            </div>
          </Link>

          {/* Quick Destination Selector & Search Pill */}
          <div className="flex-1 max-w-xl mx-2">
            <SearchBarWithAutocomplete
              variant="compact"
              placeholder={homepageConfig?.hero?.searchPlaceholder || "Temukan trip, gunung, guide, basecamp..."}
            />
          </div>

          {/* Top Actions: Notifications & Profile */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/messages"
              className="p-2 rounded-xl border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative"
              title="Notifikasi & Pesan"
            >
              <Bell size={18} weight="bold" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
            </Link>

            {user ? (
              <Link
                to="/profile"
                className="w-9 h-9 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center border-2 border-emerald-500/40 shadow-xs hover:scale-105 transition-transform"
                title={user.email}
              >
                {user.email?.charAt(0).toUpperCase() || "U"}
              </Link>
            ) : (
              <Link
                to="/login"
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors shadow-xs"
              >
                Masuk
              </Link>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-3 sm:px-6 pt-4 space-y-6">
        {/* 2. PROMOTIONAL BANNER CAROUSEL */}
        {(() => {
          const activeBanners = Array.isArray(homepageConfig?.banners) ? homepageConfig.banners : [];
          if (activeBanners.length === 0) return null;
          return (
            <section className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-lg border border-border/80 group">
              <div className="relative aspect-[21/9] sm:aspect-[24/9] md:aspect-[32/10] overflow-hidden bg-slate-900">
                {activeBanners.map((banner, idx) => (
                  <div
                    key={banner.id || idx}
                    className={`absolute inset-0 transition-opacity duration-700 ${
                      idx === (currentBannerIndex % activeBanners.length) ? "opacity-100 z-10" : "opacity-0 z-0"
                    }`}
                  >
                    <img
                      src={banner.bg}
                      alt={banner.title}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent" />

                    {/* Banner Copy & CTA */}
                    <div className="absolute inset-0 p-4 sm:p-8 flex flex-col justify-center max-w-xl text-white space-y-1.5 sm:space-y-3">
                      <span className={`inline-self-start px-2.5 py-0.5 rounded-full text-[9px] sm:text-[11px] font-black uppercase tracking-widest ${banner.badgeBg || "bg-emerald-500 text-white"} shadow-md w-fit`}>
                        {banner.tag}
                      </span>
                      <h2 className="text-base sm:text-2xl md:text-3xl font-black tracking-tight leading-tight line-clamp-2">
                        {banner.title}
                      </h2>
                      <p className="text-xs sm:text-sm text-slate-300 line-clamp-2 font-medium hidden sm:block">
                        {banner.subtitle}
                      </p>
                      <div className="pt-1">
                        <Link
                          to={banner.link || "/explore"}
                          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 sm:px-5 py-1.5 sm:py-2.5 rounded-xl shadow-md transition-all active:scale-95"
                        >
                          Jelajahi Sekarang <ArrowRight size={14} weight="bold" />
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Slider Navigation Buttons */}
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev - 1 + activeBanners.length) % activeBanners.length)}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors hidden sm:flex"
                  aria-label="Previous Banner"
                >
                  <CaretLeft size={18} weight="bold" />
                </button>
                <button
                  onClick={() => setCurrentBannerIndex((prev) => (prev + 1) % activeBanners.length)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/40 text-white hover:bg-black/70 transition-colors hidden sm:flex"
                  aria-label="Next Banner"
                >
                  <CaretRight size={18} weight="bold" />
                </button>

                {/* Indicator Dots */}
                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {activeBanners.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentBannerIndex(idx)}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === (currentBannerIndex % activeBanners.length) ? "w-6 bg-emerald-400" : "w-1.5 bg-white/50"
                      }`}
                      aria-label={`Go to slide ${idx + 1}`}
                    />
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        {/* 3. LOGGED-IN CONTEXTUAL DASHBOARD (IF USER AUTHENTICATED) */}
        {user && upcomingAdventures.length > 0 && (
          <section className="bg-gradient-to-r from-emerald-950 via-slate-900 to-zinc-900 text-white rounded-2xl p-4 sm:p-5 border border-emerald-500/40 shadow-xl space-y-3" data-testid="upcoming-adventure-section">
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <span className="inline-flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full">
                <CalendarBlank size={12} weight="fill" /> TRIP TERDEKATMU
              </span>
              <Link to="/my-bookings" className="text-xs text-emerald-300 font-bold hover:underline flex items-center gap-1">
                Semua Tiket <ArrowRight size={12} />
              </Link>
            </div>
            {upcomingAdventures.slice(0, 1).map((adv) => (
              <div key={adv.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3" data-testid={`upcoming-adventure-card-${adv.id}`}>
                <div className="flex items-center gap-3">
                  <img src={adv.image} alt={adv.title} loading="lazy" className="w-14 h-14 rounded-xl object-cover shrink-0 border border-emerald-500/30" />
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="font-extrabold text-sm text-white line-clamp-1">{adv.title}</h3>
                      {adv.is_paid ? (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          TERKONFIRMASI
                        </span>
                      ) : (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 animate-pulse">
                          MENUNGGU PEMBAYARAN
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-200 mt-0.5">{adv.date} • {adv.meeting_point}</p>
                  </div>
                </div>
                {adv.is_paid ? (
                  <Link
                    to="/my-bookings"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2 rounded-xl shadow-md shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <QrCode size={16} /> Buka E-Ticket
                  </Link>
                ) : (
                  <Link
                    to={`/payment/${adv.id}`}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs px-4 py-2 rounded-xl shadow-md shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                  >
                    <CreditCard size={16} /> Bayar Sekarang
                  </Link>
                )}
              </div>
            ))}
          </section>
        )}

        {/* 4. MARKETPLACE CATEGORIES (HORIZONTAL SCROLL / COMPACT GRID) */}
        <section className="space-y-3" data-testid="home-marketplace-categories">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GridFour size={20} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
              <h2 className="text-base sm:text-lg font-black text-foreground">
                Kategori Layanan
              </h2>
            </div>
            <button
              onClick={() => setShowAllCategoriesModal(true)}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua ({CATEGORIES_12.length}) <ArrowRight size={12} />
            </button>
          </div>

          {/* Category Horizontal Scroll Pills */}
          <div className="flex items-center gap-2.5 overflow-x-auto no-scrollbar pb-2 pt-1 touch-pan-x">
            {CATEGORIES_12.map((c) => {
              const Icon = c.icon;
              const isSelected = selectedCategorySlug === c.slug;
              return (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setSelectedCategorySlug(c.slug)}
                  data-testid={`home-cat-${c.slug}`}
                  className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl border text-xs font-bold transition-all shrink-0 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-md ring-2 ring-emerald-500/30 scale-102"
                      : "bg-card border-border/80 text-foreground hover:border-emerald-500/50 hover:bg-muted"
                  }`}
                >
                  <Icon size={18} weight={isSelected ? "fill" : "bold"} className={isSelected ? "text-white" : "text-emerald-600 dark:text-emerald-400"} />
                  <span className="whitespace-nowrap">{c.name}</span>
                </button>
              );
            })}
          </div>

          {/* Active Category Showcase Panel */}
          <div className="p-4 bg-card border border-border/80 rounded-2xl shadow-2xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border/60">
              <div className="text-xs font-bold text-foreground capitalize flex items-center gap-1.5">
                <Sparkle size={14} weight="fill" className="text-emerald-500" />
                Rekomendasi {CATEGORIES_12.find((c) => c.slug === selectedCategorySlug)?.name}:
              </div>
              <Link
                to={`/category/${selectedCategorySlug}`}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline flex items-center gap-1"
              >
                Katalog Lengkap <ArrowRight size={12} />
              </Link>
            </div>

            {selectedCategorySlug === "backpacker" ? (
              <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-zinc-900 text-white rounded-2xl p-5 border border-emerald-500/30 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-600 text-white">
                      FITUR UTAMA TREXIO BACKPACKER
                    </span>
                    <h3 className="text-lg font-black mt-1">
                      Platform Petualang Independen &amp; Hemat
                    </h3>
                    <p className="text-xs text-slate-300">
                      Cari rute multi-moda termurah, patungan biaya perjalanan (Equal/Split), dan temukan teman nebeng (carpool).
                    </p>
                  </div>
                  <Link
                    to="/backpacker"
                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md shrink-0 flex items-center justify-center gap-1.5 self-start sm:self-auto"
                  >
                    Buka Trexio Backpacker <ArrowRight size={14} />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-emerald-400 font-extrabold text-xs">⚡ Rute Pintar Multi-Modal</div>
                    <p className="text-[11px] text-slate-300">Estimasi bus, kereta, shuttle, hingga angkutan lokal basecamp.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-emerald-400 font-extrabold text-xs">🧮 Split Your Cost</div>
                    <p className="text-[11px] text-slate-300">Kalkulator patungan otomatis untuk sewa elf, porter, &amp; konsumsi.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-emerald-400 font-extrabold text-xs">🚗 Cari Teman Nebeng</div>
                    <p className="text-[11px] text-slate-300">Grup carpool &amp; share ride terverifikasi sesama pendaki.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/5 border border-white/10 space-y-1">
                    <div className="text-emerald-400 font-extrabold text-xs">🚐 Angkutan Lokal Hop</div>
                    <p className="text-[11px] text-slate-300">Shuttle &amp; pick-up lokal langsung ke trailhead/basecamp.</p>
                  </div>
                </div>
              </div>
            ) : loadingCategoryItems ? (
              <ProductSkeletonGrid count={4} cols="grid-cols-2 md:grid-cols-2 lg:grid-cols-4" />
            ) : categoryItems.length === 0 ? (
              <div className="py-6 text-center text-xs text-muted-foreground">
                Belum ada produk dalam kategori ini.
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {categoryItems.slice(0, 4).map((item) => (
                  <StandardProductCard
                    key={item.id}
                    item={item}
                    type={selectedCategorySlug}
                    onWishlistToggle={handleWishlistToggle}
                  />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* AI PERSONALIZED RECOMMENDATIONS FEED */}
        {aiRecommendations.length > 0 && (
          <section className="space-y-3 bg-gradient-to-r from-emerald-950/20 via-card to-emerald-950/10 p-4 sm:p-5 rounded-3xl border border-emerald-500/30 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1.5">
                  <Sparkle size={14} weight="fill" className="text-emerald-500 dark:text-emerald-400" /> REKOMENDASI TERPERSONALISASI AI
                </div>
                <h2 className="text-base sm:text-xl font-black text-foreground">
                  Rekomendasi Spesial Untukmu
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full flex items-center gap-1">
                <Sparkle size={12} weight="fill" /> PERSONALIZED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4 pt-1">
              {aiRecommendations.map((rec) => (
                <div
                  key={rec.id}
                  onClick={() => {
                    api.post("/ai/events", {
                      event_type: "RECOMMENDATION_CLICK",
                      product_id: rec.id,
                      metadata: { category: rec.category, destination: rec.destination }
                    }).catch(() => null);
                  }}
                  className="relative flex flex-col justify-between bg-card border border-border/80 rounded-2xl p-2 sm:p-3 hover:border-emerald-500/60 transition-all shadow-xs w-full"
                >
                  {/* Top Reason Badge */}
                  {rec.ai_reason && (
                    <div className="mb-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      <Sparkle size={11} weight="fill" className="text-emerald-500 shrink-0" />
                      <span className="truncate">{rec.ai_reason}</span>
                    </div>
                  )}

                  <StandardProductCard
                    item={rec}
                    type={rec.type || "trip"}
                    onWishlistToggle={handleWishlistToggle}
                  />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SPONSORED ADVERTISING CAMPAIGN SECTION (PROMOTED PRODUCTS) */}
        {sponsoredCampaigns.length > 0 && (
          <section className="space-y-3 bg-gradient-to-r from-purple-950/20 via-card to-purple-950/10 p-4 sm:p-5 rounded-3xl border border-purple-500/30 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] font-black uppercase tracking-widest text-purple-600 dark:text-purple-400 flex items-center gap-1.5">
                  <Sparkle size={14} weight="fill" className="text-amber-400" /> MITRA PILIHAN & TRIP SPONSOR
                </div>
                <h2 className="text-base sm:text-xl font-black text-foreground">
                  Promosi Mitra Vendor Official
                </h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 bg-purple-500/10 border border-purple-500/20 px-2.5 py-1 rounded-full">
                SPONSORED
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 pt-1">
              {sponsoredCampaigns.map((camp) => (
                <div
                  key={camp.id}
                  onClick={() => {
                    api.post(`/ad-campaigns/${camp.id}/click`).catch(() => null);
                  }}
                  className="relative group w-full"
                >
                  <StandardProductCard
                    item={{
                      id: camp.product_id,
                      title: camp.product_title,
                      image: camp.product_image,
                      price: camp.product_price || camp.amount,
                      location: camp.product_location || "Indonesia",
                      rating: 5.0,
                      reviews_count: 12,
                      provider: camp.vendor_name || "Official Partner"
                    }}
                    type="trip"
                    onWishlistToggle={handleWishlistToggle}
                  />
                  <div className="absolute top-2.5 left-2.5 z-20 pointer-events-none">
                    <span className="bg-purple-600 text-white font-black text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-md shadow-md border border-purple-400/30 flex items-center gap-1">
                      <Sparkle size={10} weight="fill" /> SPONSORED
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 5. BEST TRIP (PRODUK / TRIP TERBAIK) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Lightning size={14} weight="fill" /> TERPOPULER
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                BEST TRIP
              </h2>
            </div>
            <Link
              to="/explore?sort=rating"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingFeatured ? (
            <ProductSkeletonGrid count={4} cols="grid-cols-2 md:grid-cols-2 lg:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {featured.slice(0, 8).map((trip) => (
                <StandardProductCard
                  key={trip.id}
                  item={trip}
                  type="trip"
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </section>

        {/* 6. OPEN TRIP PALING DIMINATI */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-amber-500 flex items-center gap-1">
                <Star size={14} weight="fill" /> HIGH DEMAND
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                OPEN TRIP PALING DIMINATI
              </h2>
            </div>
            <Link
              to="/explore?category=Open%20Trip"
              data-testid="link-open-trip-all"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingPopular ? (
            <ProductSkeletonGrid count={4} cols="grid-cols-2 md:grid-cols-2 lg:grid-cols-4" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
              {popularTrips.slice(0, 4).map((trip) => (
                <StandardProductCard
                  key={trip.id}
                  item={trip}
                  type="trip"
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </section>

        {/* 7. PRIVATE TRIP */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-purple-500 flex items-center gap-1">
                <Sparkle size={14} weight="fill" /> EKSKLUSIF & KUSTOM
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                PRIVATE TRIP
              </h2>
            </div>
            <Link
              to="/explore?category=Private%20Trip"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingFeatured ? (
            <ProductSkeletonGrid count={3} cols="grid-cols-2 md:grid-cols-2 lg:grid-cols-3" />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
              {featured.filter((t) => t.category === "Cultural" || t.difficulty === "Pemula").slice(0, 3).map((trip) => (
                <StandardProductCard
                  key={trip.id}
                  item={{ ...trip, badge: "PRIVATE TRIP" }}
                  type="trip"
                  onWishlistToggle={handleWishlistToggle}
                />
              ))}
            </div>
          )}
        </section>

        {/* 8. GUIDE PILIHAN */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <UserCheck size={14} weight="bold" /> TERLISENSI APGI / BNSP
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                GUIDE PILIHAN
              </h2>
            </div>
            <Link
              to="/category/guide"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingGuides ? (
            <ProviderSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {guides.slice(0, 4).map((g) => (
                <Link
                  key={g.id}
                  to="/category/guide"
                  className="group bg-card border border-border/80 rounded-2xl p-3 sm:p-4 hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5"
                >
                  <img
                    src={g.image}
                    alt={g.title}
                    loading="lazy"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-emerald-500/30"
                  />
                  <div className="min-w-0 flex-1 w-full">
                    <div className="flex items-center gap-1 text-[10px] font-black text-emerald-800 dark:text-emerald-400 uppercase">
                      <ShieldCheck size={12} /> {g.badge || "Verified Guide"}
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover:text-emerald-800 transition-colors">
                      {g.title}
                    </h3>
                    <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                      📍 {g.location}
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-800 dark:text-emerald-400">{formatRupiah(g.price)}/hari</span>
                      <span className="text-amber-500 text-[10px]">★ {g.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 9. PORTER PENDAKIAN */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Backpack size={14} weight="bold" /> LOGISTIK PENDAKIAN
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                PORTER PENDAKIAN
              </h2>
            </div>
            <Link
              to="/category/porter"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingPorters ? (
            <ProviderSkeletonGrid count={4} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {porters.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  to="/category/porter"
                  className="group bg-card border border-border/80 rounded-2xl p-3 sm:p-4 hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col sm:flex-row items-start sm:items-center gap-2.5 sm:gap-3.5"
                >
                  <img
                    src={p.image}
                    alt={p.title}
                    loading="lazy"
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl object-cover shrink-0 border border-emerald-500/30"
                  />
                  <div className="min-w-0 flex-1 w-full">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                      Area: {p.location}
                    </div>
                    <h3 className="font-extrabold text-xs sm:text-sm text-foreground truncate group-hover:text-emerald-800 transition-colors">
                      {p.title}
                    </h3>
                    <div className="text-[10px] text-emerald-800 dark:text-emerald-400 font-semibold mt-0.5">
                      Cap: 25Kg Logistik
                    </div>
                    <div className="mt-1 flex items-center justify-between text-xs font-bold">
                      <span className="text-emerald-800 dark:text-emerald-400">{formatRupiah(p.price)}/hari</span>
                      <span className="text-amber-500 text-[10px]">★ {p.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 10. BASECAMP & REST AREA */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <HouseLine size={14} weight="bold" /> POS REGISTRASI & REHAT
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                BASECAMP PENDAKIAN
              </h2>
            </div>
            <Link
              to="/category/basecamp"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Lihat Semua <ArrowRight size={12} />
            </Link>
          </div>

          {loadingBasecamps ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <BasecampCardSkeleton />
              <BasecampCardSkeleton />
              <BasecampCardSkeleton />
              <BasecampCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {basecamps.slice(0, 4).map((bc) => (
                <Link
                  key={bc.id}
                  to="/category/basecamp"
                  className="group bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                    <img src={bc.image} alt={bc.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-2.5 left-2.5 bg-black/70 text-white text-[9px] font-bold px-2 py-0.5 rounded-md truncate max-w-[85%]">
                      📍 {bc.location}
                    </span>
                  </div>
                  <div className="p-3 sm:p-3.5 space-y-1.5">
                    <h3 className="font-extrabold text-xs sm:text-sm text-foreground line-clamp-1 group-hover:text-emerald-800 transition-colors">
                      {bc.title}
                    </h3>
                    <div className="text-[10px] text-muted-foreground line-clamp-1">
                      Fasilitas: {Array.isArray(bc.specs) ? bc.specs.join(', ') : 'WiFi, Charger, Shower'}
                    </div>
                    <div className="pt-2 border-t border-border/50 flex items-center justify-between text-xs font-black text-emerald-800 dark:text-emerald-400">
                      <span>{formatRupiah(bc.price)}/pax</span>
                      <span className="text-amber-500 text-[10px]">★ {bc.rating}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 11. SEWA ALAT OUTDOOR (RENTAL GEAR) */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-400 flex items-center gap-1">
                <Package size={14} weight="bold" /> STERIL & SIAP PAKAI
              </div>
              <h2 className="text-base sm:text-xl font-black text-foreground">
                SEWA ALAT OUTDOOR
              </h2>
            </div>
            <Link
              to="/rental"
              data-testid="link-rental-all"
              className="text-xs font-bold text-emerald-800 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              Katalog Rental <ArrowRight size={12} />
            </Link>
          </div>

          {loadingRentals ? (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              <RentalCardSkeleton />
              <RentalCardSkeleton />
              <RentalCardSkeleton />
              <RentalCardSkeleton />
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {rentals.slice(0, 4).map((r) => (
                <Link
                  key={r.id}
                  to={`/rental/${r.id}`}
                  className="group bg-card border border-border/80 rounded-2xl overflow-hidden hover:border-emerald-500/60 hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="aspect-square bg-muted relative overflow-hidden">
                    <img src={r.cover_image} alt={r.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <span className="absolute top-2 left-2 bg-emerald-700 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-md">
                      {r.category}
                    </span>
                  </div>
                  <div className="p-3 space-y-1">
                    <div className="font-extrabold text-xs text-foreground line-clamp-1 group-hover:text-emerald-800 transition-colors">
                      {r.name}
                    </div>
                    <div className="text-xs font-black text-emerald-800 dark:text-emerald-400">
                      {formatRupiah(r.price_per_day)}<span className="text-[10px] font-normal text-muted-foreground">/hari</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* 12. VENDOR REGISTRATION BANNERS ("Jadi Mitra Trexio") */}
        <section className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/40 relative overflow-hidden">
          <div className="relative z-10 max-w-xl space-y-3">
            <span className="inline-flex items-center gap-1 bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <Storefront size={14} /> JADI MITRA TREXIO
            </span>
            <h2 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              Tawarkan Layanan Petualangan Anda Kepada Ribuan Traveler
            </h2>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              Bergabunglah sebagai Open Trip Organizer, Guide APGI, Porter, Pengelola Basecamp, atau Persewaan Alat Outdoor di Trexio. Dapatkan sistem booking & payment otomatis gratis!
            </p>

            <div className="pt-2 flex flex-wrap gap-2">
              {["Open Trip Organizer", "Guide APGI/BNSP", "Porter", "Basecamp", "Sewa Alat", "Transportasi"].map((tag) => (
                <span key={tag} className="text-[10px] bg-white/10 text-emerald-200 border border-white/15 px-2.5 py-1 rounded-lg font-bold">
                  ✓ {tag}
                </span>
              ))}
            </div>

            <div className="pt-3">
              <Link
                to="/partner/register"
                className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-6 py-3 rounded-2xl shadow-lg transition-all active:scale-95"
              >
                Daftar Sebagai Mitra Sekarang <ArrowRight size={16} weight="bold" />
              </Link>
            </div>
          </div>
        </section>

        {/* 13. INSTALL PWA SECTION */}
        <section className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 p-2 flex items-center justify-center shrink-0 shadow-md">
              <TrexioLogo variant="icon" size="lg" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-black text-lg text-foreground">Install Trexio PWA App</h3>
                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Mobile First
                </span>
              </div>
              <p className="text-xs text-muted-foreground max-w-md leading-relaxed">
                Akses Trexio lebih cepat langsung dari layar utama smartphone Anda. Buka katalog, pesan trip, dan akses e-ticket secara instan tanpa lag.
              </p>
            </div>
          </div>

          <div className="shrink-0 w-full sm:w-auto">
            <Button
              onClick={triggerPWAInstall}
              disabled={isPWAInstalled}
              className="w-full sm:w-auto h-12 px-6 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2"
            >
              <DownloadSimple size={18} weight="bold" />
              {isPWAInstalled ? "App Sudah Terinstall" : "Install Trexio App"}
            </Button>
          </div>
        </section>

        {/* 14. COMPACT FOOTER */}
        <footer className="pt-8 border-t border-border/80 text-muted-foreground text-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="font-black text-foreground text-sm flex items-center gap-1.5">
                <TrexioLogo variant="icon" size="xs" /> TREXIO — Adventure Marketplace
              </div>
              <div className="text-[11px] text-muted-foreground mt-0.5">Track Every Journey · Platform Open Trip & Outdoor #1</div>
            </div>

            <div className="flex flex-wrap gap-4 text-xs font-semibold">
              <Link to="/about" className="hover:text-foreground transition-colors">Tentang Trexio</Link>
              <Link to="/help" className="hover:text-foreground transition-colors">Bantuan</Link>
              <Link to="/terms" className="hover:text-foreground transition-colors">Syarat & Ketentuan</Link>
              <Link to="/privacy" className="hover:text-foreground transition-colors">Kebijakan Privasi</Link>
              <Link to="/partner/register" className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline">Jadi Mitra</Link>
            </div>
          </div>

          <div className="text-[11px] text-center text-muted-foreground pt-4 border-t border-border/40">
            © {new Date().getFullYear()} Trexio Indonesia. Hak Cipta Dilindungi Undang-Undang.
          </div>
        </footer>

      </div>

      {/* ALL CATEGORIES MODAL DRAWER */}
      {showAllCategoriesModal && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 pb-20 md:pb-6 overflow-y-auto min-h-screen">
          <div className="bg-card border border-border rounded-2xl sm:rounded-3xl w-full max-w-2xl max-h-[calc(100dvh-5.5rem)] sm:max-h-[85vh] my-auto flex flex-col p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="shrink-0 flex items-center justify-between border-b border-border pb-3 mb-3">
              <div>
                <h3 className="font-black text-base sm:text-lg text-foreground flex items-center gap-2">
                  <GridFour size={22} className="text-emerald-500" />
                  Seluruh Kategori Marketplace Trexio
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Pilih kategori layanan petualangan outdoor yang kamu butuhkan
                </p>
              </div>
              <button
                onClick={() => setShowAllCategoriesModal(false)}
                className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 pr-1">
              {CATEGORIES_12.map((c) => {
                const Icon = c.icon;
                return (
                  <button
                    key={c.name}
                    onClick={() => {
                      setSelectedCategorySlug(c.slug);
                      setShowAllCategoriesModal(false);
                    }}
                    className="flex flex-col p-3.5 rounded-2xl bg-muted/30 border border-border/80 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-2 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                      <Icon size={22} weight="fill" />
                    </div>
                    <div className="font-bold text-xs sm:text-sm text-foreground group-hover:text-emerald-600">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">
                      {c.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
