import { Link, NavLink, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useCompare } from "@/context/CompareContext";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { getStoredCart, fetchAndSyncCart } from "@/lib/cartStorage";
import CartDrawer from "@/components/site/CartDrawer";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import SearchBarWithAutocomplete from "@/components/site/SearchBarWithAutocomplete";
import {
  Compass,
  MapTrifold,
  UserCircle,
  SignOut,
  List,
  X,
  ShieldCheck,
  Storefront,
  Bell,
  Heart,
  ShoppingCart,
  Wallet,
  CheckCircle,
  CaretDown,
  Sparkle,
  UserCheck,
  Backpack,
  Package,
  HouseLine,
  Tent,
  House,
  Bus,
  Car,
  Mountains,
  Ticket,
  GridFour,
  DownloadSimple,
  Sun,
  Moon,
  Scales,
  ChatCircleDots,
  PaperPlaneTilt,
  Megaphone,
  UsersThree,
  Newspaper,
  ArrowRight,
  Clock,
} from "@phosphor-icons/react";
import { triggerPWAInstall } from "@/components/site/PWAInstallPrompt";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export const MARKETPLACE_CATEGORIES = [
  { slug: "backpacker", name: "Trexio Backpacker", icon: Compass, link: "/backpacker", desc: "Rute pintar, patungan, & nebeng" },
  { slug: "open-trip", name: "Open Trip", icon: Compass, link: "/category/open-trip", desc: "Trip gabungan hemat" },
  { slug: "private-trip", name: "Private Trip", icon: Sparkle, link: "/category/private-trip", desc: "Trip privat kustom" },
  { slug: "guide", name: "Guide", icon: UserCheck, link: "/category/guide", desc: "Pemandu gunung terlisensi" },
  { slug: "porter", name: "Porter", icon: Backpack, link: "/category/porter", desc: "Jasa porter pendakian" },
  { slug: "rental-gear", name: "Rental Gear", icon: Package, link: "/category/rental-gear", desc: "Sewa tenda & alat outdoor" },
  { slug: "basecamp", name: "Basecamp", icon: HouseLine, link: "/category/basecamp", desc: "Pos registrasi & istirahat" },
  { slug: "camping-ground", name: "Camping Ground", icon: Tent, link: "/category/camping-ground", desc: "Kemping alam & kawah" },
  { slug: "homestay", name: "Homestay", icon: House, link: "/category/homestay", desc: "Penginapan lokal ramah" },
  { slug: "shuttle", name: "Shuttle", icon: Bus, link: "/category/shuttle", desc: "Antar-jemput stasiun/bandara" },
  { slug: "transportasi", name: "Transportasi", icon: Car, link: "/category/transportasi", desc: "Jeep 4x4 & armada lokal" },
  { slug: "wisata-alam", name: "Wisata Alam", icon: Mountains, link: "/category/wisata-alam", desc: "Air terjun & kawah alam" },
  { slug: "event", name: "Event", icon: Ticket, link: "/category/event", desc: "Festival & gathering" },
];

export function isVendorUser(u) {
  if (!u) return false;
  const roles = Array.isArray(u.roles) ? u.roles : u.role ? [u.role] : [];
  const vendorRoles = ["vendor", "mitra", "partner", "guide", "merchant", "rental", "community", "event_org", "tenant_admin"];
  return roles.some((r) => vendorRoles.includes(r)) || Boolean(u.vendor_id || u.is_vendor || u.vendor);
}

export default function Navbar() {
  const { user, login, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { selectedTrips, setIsOpen: setCompareOpen } = useCompare();
  const nav = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [mobileCategoryOpen, setMobileCategoryOpen] = useState(false);

  const [notifs, setNotifs] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadBooking, setUnreadBooking] = useState(0);
  const [unreadNews, setUnreadNews] = useState(0);
  const [unreadCommunity, setUnreadCommunity] = useState(0);
  const [notifCategory, setNotifCategory] = useState("all");

  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [partnerConversations, setPartnerConversations] = useState([]);

  const [wishlistCount, setWishlistCount] = useState(0);
  const [cartCount, setCartCount] = useState(() => getStoredCart().length);
  const [bookingCount, setBookingCount] = useState(0);
  const [walletBalance, setWalletBalance] = useState(null);
  const [cartDrawerOpen, setCartDrawerOpen] = useState(false);

  const loadUserData = async () => {
    try {
      const [notifRes, wishRes, cartRes, walletRes, bookingRes, commRes] = await Promise.all([
        user ? apiFetch("/notifications").catch(() => null) : null,
        user ? apiFetch("/wishlist").catch(() => null) : null,
        fetchAndSyncCart().catch(() => getStoredCart()),
        user ? apiFetch("/wallet/mine").catch(() => null) : null,
        user ? apiFetch("/bookings/mine").catch(() => null) : null,
        user ? apiFetch("/communications/summary").catch(() => null) : null,
      ]);

      if (user) {
        if (notifRes && notifRes.notifications) {
          setNotifs(notifRes.notifications);
          setUnreadCount(notifRes.unread_count || 0);
          setUnreadBooking(notifRes.unread_booking || 0);
          setUnreadNews(notifRes.unread_news || 0);
          setUnreadCommunity(notifRes.unread_community || 0);
        }
        if (commRes && commRes.ok) {
          setUnreadChatCount(commRes.unread_chat_count || 0);
          setPartnerConversations(commRes.conversations || []);
        }
      } else {
        // Guest mode default Trexio News & Community announcements
        const guestNotifs = [
          {
            id: "guest_notif_1",
            title: "Trexio News: Update Kuota SIMAKSI Gede Pangrango & Rinjani",
            message: "Balai Taman Nasional resmi merilis kuota online pendakian musim ini. Simak SOP pendaftaran & syarat kesehatan terbaru.",
            type: "news",
            category: "news",
            link: "/community",
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          },
          {
            id: "guest_notif_2",
            title: "Trexio News: Imbauan Weather Alert & Zero Waste SOP",
            message: "BMKG merilis prakiraan cuaca ekstrim di wilayah jalur pendakian Jawa Tengah. Wajib membawa trash bag & raincoat standar.",
            type: "news",
            category: "news",
            link: "/community",
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
          },
          {
            id: "guest_notif_3",
            title: "Trexio Community: Diskusi Forum & Share Cost Pendaki",
            message: "Lihat ribuan kawan pendaki yang berbagi pengalaman, review alat outdoor, dan grup open trip di Trexio Community.",
            type: "community",
            category: "community",
            link: "/community",
            read: false,
            created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
          },
        ];
        setNotifs(guestNotifs);
        setUnreadCount(2);
        setUnreadNews(2);
        setUnreadCommunity(1);
        setUnreadBooking(0);
        setUnreadChatCount(0);
        setPartnerConversations([]);
      }

      if (wishRes && Array.isArray(wishRes)) setWishlistCount(wishRes.length);
      if (cartRes && Array.isArray(cartRes)) setCartCount(cartRes.length);
      if (walletRes && typeof walletRes.balance === "number") setWalletBalance(walletRes.balance);
      if (bookingRes && Array.isArray(bookingRes)) {
        const active = bookingRes.filter((b) => {
          const isCancelled =
            (b.booking_status || "").toLowerCase() === "cancelled" ||
            (b.payment_status || "").toLowerCase() === "cancelled" ||
            (b.trip_status || "").toUpperCase() === "CANCELLED" ||
            (b.status || "").toUpperCase() === "CANCELLED" ||
            b.payment_status === "expired" ||
            b.payment_status === "failed" ||
            b.payment_status === "rejected";
          return !isCancelled;
        }).length;
        setBookingCount(active);
      }
    } catch (e) {
      // safe fallback
    }
  };

  const markAllNotifsRead = async (cat = "all") => {
    try {
      if (user) {
        await apiFetch("/notifications/read-all", {
          method: "POST",
          body: JSON.stringify({ category: cat }),
        });
        loadUserData();
      } else {
        setNotifs((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        setUnreadNews(0);
        setUnreadCommunity(0);
      }
      toast.success(
        cat === "all"
          ? "Semua notifikasi telah ditandai dibaca"
          : `Notifikasi ${cat.toUpperCase()} telah ditandai dibaca`
      );
    } catch (e) {
      toast.error("Gagal memperbarui notifikasi");
    }
  };

  const markSingleNotifRead = async (n) => {
    try {
      if (!n.read) {
        if (user && !n.id.startsWith("guest_")) {
          await apiFetch(`/notifications/${n.id}/read`, { method: "POST" });
          loadUserData();
        } else {
          setNotifs((prev) => prev.map((item) => (item.id === n.id ? { ...item, read: true } : item)));
        }
      }
      if (n.link) nav(n.link);
    } catch (e) {
      if (n.link) nav(n.link);
    }
  };

  useEffect(() => {
    const handleCartUpdated = (e) => {
      const items = e.detail || getStoredCart();
      if (Array.isArray(items)) {
        setCartCount(items.length);
      } else {
        setCartCount(getStoredCart().length);
      }
    };

    const handleOpenDrawer = () => {
      setCartDrawerOpen(true);
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    window.addEventListener("open-cart-drawer", handleOpenDrawer);
    window.addEventListener("trexio:booking-updated", loadUserData);
    // Initial sync
    setCartCount(getStoredCart().length);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
      window.removeEventListener("open-cart-drawer", handleOpenDrawer);
      window.removeEventListener("trexio:booking-updated", loadUserData);
    };
  }, []);

  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const isScrolled = window.scrollY > 12;
          setScrolled((prev) => (prev !== isScrolled ? isScrolled : prev));
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    loadUserData();
  }, [user]);

  const linkClass = ({ isActive }) =>
    `text-sm font-medium tracking-tight px-3 py-2 rounded-md ${
      isActive
        ? "text-[hsl(var(--secondary))]"
        : "text-foreground/70 hover:text-foreground"
    }`;

  return (
    <header
      className={`sticky top-0 z-40 w-full ${scrolled ? "trx-glass border-b border-border" : "bg-transparent"}`}
      style={{ transition: "background-color 0.2s ease, box-shadow 0.2s ease" }}
    >
      <div className="trx-container flex h-16 items-center justify-between">
        <Link
          to="/"
          data-testid="nav-logo"
          aria-label="Trexio Beranda"
          className="flex items-center shrink-0"
        >
          <TrexioLogo variant="horizontal" size="sm" showTagline={true} />
        </Link>

        {/* Search Bar with Autocomplete */}
        <div className="hidden lg:block w-64 xl:w-80 mx-3">
          <SearchBarWithAutocomplete placeholder="Cari trip, rental gear, vendor..." variant="navbar" />
        </div>

        <nav className="hidden md:flex items-center gap-1">
          <NavLink to="/" data-testid="nav-home" className={linkClass} end>
            Beranda
          </NavLink>
          <NavLink
            to="/explore"
            data-testid="nav-explore"
            className={linkClass}
          >
            Explore Trip
          </NavLink>
          <NavLink
            to="/backpacker"
            data-testid="nav-backpacker"
            className={linkClass}
          >
            <span className="inline-flex items-center gap-1.5 font-extrabold text-emerald-600 dark:text-emerald-400">
              <Compass size={15} className="text-emerald-500 animate-spin-slow" />
              Trexio Backpacker
              <span className="px-1.5 py-0.2 text-[9px] font-black bg-emerald-600 text-white rounded-md uppercase tracking-wider">
                Baru
              </span>
            </span>
          </NavLink>
          <NavLink
            to="/ai-discovery"
            data-testid="nav-ai-discovery"
            className={linkClass}
          >
            <span className="inline-flex items-center gap-1 font-bold text-emerald-600 dark:text-emerald-400">
              <Sparkle size={14} weight="fill" className="text-emerald-500 animate-pulse" />
              AI Discovery
            </span>
          </NavLink>

          {/* Kategori Megamenu Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                data-testid="nav-category-dropdown"
                className="flex items-center gap-1.5 text-sm font-semibold tracking-tight px-3 py-2 rounded-lg text-foreground/80 hover:text-emerald-600 hover:bg-emerald-500/10 cursor-pointer transition-all"
              >
                <GridFour size={16} className="text-emerald-500" />
                <span>Kategori</span>
                <CaretDown size={13} className="text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-[580px] p-4 bg-card/95 backdrop-blur-md border border-border/80 shadow-2xl rounded-2xl animate-in fade-in-50 zoom-in-95"
            >
              {/* Header inside Megamenu */}
              <div className="flex items-center justify-between px-2 pb-3 mb-2 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <GridFour size={18} weight="fill" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-wider text-foreground">
                      12 Kategori Outdoor Marketplace
                    </h3>
                    <p className="text-[11px] text-muted-foreground">
                      Eksplorasi trip, layanan pemandu, sewa alat & akomodasi outdoor
                    </p>
                  </div>
                </div>
                <Link
                  to="/explore"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0"
                >
                  Semua Trip →
                </Link>
              </div>

              {/* 2-Column Grid of 12 Categories */}
              <div className="grid grid-cols-2 gap-1.5">
                {MARKETPLACE_CATEGORIES.map((cat) => (
                  <DropdownMenuItem
                    key={cat.slug}
                    onClick={() => nav(cat.link)}
                    className="group flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-transparent transition-all"
                  >
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white shrink-0 transition-colors shadow-2xs">
                      <cat.icon size={18} weight="fill" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">
                        {cat.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate">
                        {cat.desc}
                      </div>
                    </div>
                  </DropdownMenuItem>
                ))}
              </div>

              {/* Footer Banner inside Megamenu */}
              <div className="mt-3 pt-3 border-t border-border/60 flex items-center justify-between px-2 bg-muted/40 rounded-xl p-2.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Storefront size={18} className="text-emerald-500 shrink-0" />
                  <span className="text-xs text-muted-foreground truncate">
                    Punya bisnis travel, guide, atau rental gear outdoor?
                  </span>
                </div>
                <Link
                  to="/partner/register"
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline shrink-0 pl-2"
                >
                  Registrasi Partner →
                </Link>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <NavLink
            to="/destinations"
            data-testid="nav-destinations"
            className={linkClass}
          >
            Destinasi
          </NavLink>
          <NavLink
            to="/safety"
            data-testid="nav-safety"
            className={linkClass}
          >
            AI Safety & Cuaca
          </NavLink>
          <NavLink
            to="/promos"
            data-testid="nav-promos"
            className={linkClass}
          >
            Promo
          </NavLink>
          <NavLink
            to="/community"
            data-testid="nav-community"
            className={linkClass}
          >
            Forum Komunitas
          </NavLink>
          <NavLink to="/help" data-testid="nav-help" className={linkClass}>
            Bantuan
          </NavLink>
        </nav>

        <div className="hidden md:flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="p-2 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted trx-btn-press transition-colors border border-transparent hover:border-border/60"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun size={20} weight="bold" className="text-amber-400 animate-spin-slow" />
            ) : (
              <Moon size={20} weight="bold" className="text-slate-700" />
            )}
          </button>

          {user && isVendorUser(user) ? (
            <Link to="/vendor" data-testid="btn-vendor-dashboard">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 rounded-xl border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-extrabold hover:bg-emerald-500/20 hover:border-emerald-500 text-xs px-3 py-1.5 shadow-2xs transition-all"
              >
                <Storefront size={16} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                <span>Dashboard Vendor</span>
              </Button>
            </Link>
          ) : user && ((Array.isArray(user.roles) ? user.roles : [user.role]).includes("super_admin")) ? (
            <Link to="/super" data-testid="btn-super-dashboard">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1.5 rounded-xl border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 font-bold hover:bg-amber-500/20 text-xs px-3 py-1.5 shadow-2xs transition-all"
              >
                <ShieldCheck size={16} weight="bold" /> Super Panel
              </Button>
            </Link>
          ) : (
            <Link to="/partner/register" data-testid="btn-vendor-register">
              <Button
                variant="outline"
                size="sm"
                className="hidden lg:flex items-center gap-1.5 rounded-xl border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold hover:bg-emerald-500/20 text-xs px-3 py-1.5 shadow-2xs transition-all"
              >
                <Storefront size={16} weight="bold" /> Registrasi Vendor
              </Button>
            </Link>
          )}
          {/* Compare Button */}
          {selectedTrips.length > 0 && (
            <button
              type="button"
              onClick={() => setCompareOpen(true)}
              title="Bandingkan Paket Trip"
              aria-label="Bandingkan Paket Trip"
              data-testid="nav-compare-btn"
              className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted trx-btn-press"
            >
              <Scales size={20} className="text-emerald-500 font-bold" />
              <span
                data-testid="nav-compare-badge"
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-black text-white shadow-xs"
              >
                {selectedTrips.length}
              </span>
            </button>
          )}

          {/* Cart Button (Always visible for all visitors) */}
          <button
            type="button"
            onClick={() => setCartDrawerOpen(true)}
            title="Keranjang"
            aria-label="Keranjang"
            className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted trx-btn-press"
          >
            <ShoppingCart size={20} />
            {cartCount > 0 && (
              <span
                data-testid="nav-cart-badge"
                className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-700 px-1 text-[10px] font-black text-white shadow-xs animate-pulse"
              >
                {cartCount}
              </span>
            )}
          </button>

          {user ? (
            <>
              {/* Wishlist Button */}
              <Link to="/wishlist" title="Wishlist">
                <button aria-label="Wishlist" className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted trx-btn-press">
                  <Heart size={20} weight={wishlistCount > 0 ? "fill" : "regular"} className={wishlistCount > 0 ? "text-rose-500" : ""} />
                  {wishlistCount > 0 && (
                    <span
                      data-testid="nav-wishlist-badge"
                      className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-black text-white shadow-xs"
                    >
                      {wishlistCount}
                    </span>
                  )}
                </button>
              </Link>

              {/* Communications & Partner Chat Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Komunikasi & Partner Chat"
                    title="Communications & Partner Chat"
                    data-testid="nav-partner-chat-btn"
                    className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted trx-btn-press"
                  >
                    <ChatCircleDots size={20} className="text-emerald-600 dark:text-emerald-400" />
                    {unreadChatCount > 0 && (
                      <span
                        data-testid="nav-chat-unread-badge"
                        className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-600 px-1 text-[9px] font-black text-white shadow-xs animate-pulse"
                      >
                        {unreadChatCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-88 p-0 rounded-2xl border border-border shadow-xl">
                  <div className="p-3.5 border-b border-border bg-emerald-950/5 dark:bg-emerald-950/40">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sm text-foreground">
                        <ChatCircleDots size={18} className="text-emerald-600" />
                        <span>Komunikasi & Chat Partner</span>
                      </div>
                      {unreadChatCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-600 text-white">
                          {unreadChatCount} Baru
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Pusat komunikasi bersama Vendor, Guide Terlisensi & Support TREXIO
                    </p>
                  </div>

                  <div className="max-h-72 overflow-y-auto divide-y divide-border">
                    {partnerConversations.length === 0 ? (
                      <div className="p-6 text-center space-y-2">
                        <ChatCircleDots size={32} className="mx-auto text-neutral-300" />
                        <p className="text-xs text-muted-foreground font-medium">
                          Belum ada diskusi terbuka dengan partner.
                        </p>
                      </div>
                    ) : (
                      partnerConversations.map((c) => (
                        <div
                          key={c.id}
                          onClick={() => nav(`/messages?conversation_id=${c.id}`)}
                          className="p-3 text-xs cursor-pointer hover:bg-emerald-500/5 transition-colors flex items-start gap-3"
                        >
                          <div className="h-8 w-8 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center shrink-0 text-xs border border-emerald-500/20">
                            {c.vendor_name ? c.vendor_name.charAt(0).toUpperCase() : "M"}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <span className="font-extrabold text-foreground truncate text-xs">
                                {c.vendor_name}
                              </span>
                              <span className="text-[10px] text-neutral-400 shrink-0">
                                {new Date(c.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <p className="text-muted-foreground truncate text-[11px] leading-snug">
                              {c.last_message}
                            </p>
                          </div>
                          {c.unread_count > 0 && (
                            <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-1.5 animate-pulse" />
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-2.5 border-t border-border bg-neutral-50/50 dark:bg-neutral-900/50 text-center">
                    <button
                      onClick={() => nav("/messages")}
                      className="w-full py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all"
                    >
                      <span>Buka Seluruh Chat & Diskusi</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notification Menu with All Categories (Informasi Booking, Trexio News, Trexio Community, & Partner Chat) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="Pusat Notifikasi & Informasi"
                    title="Pusat Notifikasi & Update Trexio"
                    data-testid="nav-notification-btn"
                    className="relative p-2 rounded-md text-foreground/70 hover:text-foreground hover:bg-muted trx-btn-press"
                  >
                    <Bell size={20} />
                    {(unreadCount + unreadChatCount) > 0 && (
                      <span
                        data-testid="nav-unread-badge"
                        className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-black text-white shadow-xs animate-pulse"
                      >
                        {unreadCount + unreadChatCount}
                      </span>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-96 sm:w-[420px] p-0 rounded-2xl border border-border shadow-xl overflow-hidden">
                  <div className="p-3.5 border-b border-border bg-neutral-50/90 dark:bg-neutral-900/90 backdrop-blur-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-sm text-foreground">
                        <Bell size={18} className="text-rose-500" />
                        <span>Notifikasi & Update Live</span>
                        {(unreadCount + unreadChatCount) > 0 && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-xs">
                            {unreadCount + unreadChatCount} Baru
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotifsRead(notifCategory)}
                          className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <CheckCircle size={14} /> Tandai dibaca
                        </button>
                      )}
                    </div>

                    {/* Category Filter Tabs */}
                    <div className="flex items-center gap-1 mt-3 pt-2 border-t border-border overflow-x-auto no-scrollbar">
                      <button
                        onClick={() => setNotifCategory("all")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 ${
                          notifCategory === "all"
                            ? "bg-foreground text-background shadow-2xs"
                            : "text-muted-foreground hover:bg-neutral-200/50 dark:hover:bg-neutral-800"
                        }`}
                      >
                        Semua ({notifs.length + (partnerConversations?.length || 0)})
                      </button>

                      <button
                        onClick={() => setNotifCategory("booking")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                          notifCategory === "booking"
                            ? "bg-blue-600 text-white shadow-2xs"
                            : "text-muted-foreground hover:bg-blue-50 dark:hover:bg-blue-950/30"
                        }`}
                      >
                        <Ticket size={12} />
                        Booking {unreadBooking > 0 && `(${unreadBooking})`}
                      </button>

                      <button
                        onClick={() => setNotifCategory("news")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                          notifCategory === "news"
                            ? "bg-amber-600 text-white shadow-2xs"
                            : "text-muted-foreground hover:bg-amber-50 dark:hover:bg-amber-950/30"
                        }`}
                      >
                        <Megaphone size={12} />
                        News {unreadNews > 0 && `(${unreadNews})`}
                      </button>

                      <button
                        onClick={() => setNotifCategory("community")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                          notifCategory === "community"
                            ? "bg-purple-600 text-white shadow-2xs"
                            : "text-muted-foreground hover:bg-purple-50 dark:hover:bg-purple-950/30"
                        }`}
                      >
                        <UsersThree size={12} />
                        Komunitas {unreadCommunity > 0 && `(${unreadCommunity})`}
                      </button>

                      <button
                        onClick={() => setNotifCategory("chat")}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-all shrink-0 flex items-center gap-1 ${
                          notifCategory === "chat"
                            ? "bg-emerald-600 text-white shadow-2xs"
                            : "text-muted-foreground hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                        }`}
                      >
                        <ChatCircleDots size={12} />
                        Partner Chat {unreadChatCount > 0 && `(${unreadChatCount})`}
                      </button>
                    </div>
                  </div>

                  {/* Notification & Chat Content List */}
                  <div className="max-h-88 overflow-y-auto divide-y divide-border">
                    {(() => {
                      // Handle "chat" category specifically
                      if (notifCategory === "chat") {
                        if (!partnerConversations || partnerConversations.length === 0) {
                          return (
                            <div className="p-6 text-center space-y-2">
                              <ChatCircleDots size={32} className="mx-auto text-neutral-300" />
                              <p className="text-xs text-muted-foreground font-medium">
                                Belum ada diskusi atau percakapan dengan mitra partner.
                              </p>
                            </div>
                          );
                        }
                        return partnerConversations.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => nav(`/messages?conversation_id=${c.id}`)}
                            className="p-3.5 text-xs cursor-pointer hover:bg-emerald-500/5 transition-colors flex items-start gap-3"
                          >
                            <div className="h-9 w-9 rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-black flex items-center justify-center shrink-0 text-xs border border-emerald-500/20 shadow-2xs">
                              {c.vendor_name ? c.vendor_name.charAt(0).toUpperCase() : "M"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-0.5">
                                <span className="font-extrabold text-foreground truncate text-xs flex items-center gap-1.5">
                                  <span>{c.vendor_name}</span>
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-600 font-bold">Mitra</span>
                                </span>
                                <span className="text-[10px] text-neutral-400 shrink-0">
                                  {new Date(c.updated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </span>
                              </div>
                              <p className="text-muted-foreground truncate text-[11px] leading-snug">
                                {c.last_message}
                              </p>
                            </div>
                            {c.unread_count > 0 && (
                              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2 animate-pulse" />
                            )}
                          </div>
                        ));
                      }

                      // Handle standard notifications filtering
                      const filteredNotifs = notifs.filter((n) => {
                        if (notifCategory === "booking") {
                          return n.category === "booking" || ["booking", "simaksi", "rental", "trip", "payment", "ticket"].includes(n.type);
                        }
                        if (notifCategory === "news") {
                          return n.category === "news" || ["news", "announcement", "article", "weather", "promo", "system"].includes(n.type);
                        }
                        if (notifCategory === "community") {
                          return n.category === "community" || ["community", "discussion", "forum", "like", "comment", "reply"].includes(n.type);
                        }
                        return true;
                      });

                      if (filteredNotifs.length === 0 && (notifCategory !== "all" || partnerConversations.length === 0)) {
                        return (
                          <div className="p-6 text-center space-y-2">
                            <Bell size={28} className="mx-auto text-neutral-300" />
                            <p className="text-xs text-muted-foreground font-medium">
                              Tidak ada notifikasi dalam kategori {notifCategory.toUpperCase()}.
                            </p>
                          </div>
                        );
                      }

                      return (
                        <>
                          {/* If category is "all", showcase recent Partner Chat banner item first */}
                          {notifCategory === "all" && partnerConversations && partnerConversations.length > 0 && (
                            <div
                              onClick={() => nav(`/messages?conversation_id=${partnerConversations[0].id}`)}
                              className="p-3 bg-emerald-500/5 hover:bg-emerald-500/10 transition-colors border-b border-border cursor-pointer flex items-center justify-between"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-7 w-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                                  <ChatCircleDots size={16} weight="bold" />
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[11px] font-black text-foreground truncate">
                                    Chat Partner: {partnerConversations[0].vendor_name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground truncate">
                                    {partnerConversations[0].last_message}
                                  </p>
                                </div>
                              </div>
                              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 shrink-0 ml-2">
                                Buka Chat →
                              </span>
                            </div>
                          )}

                          {filteredNotifs.map((n) => {
                            const isBooking = n.category === "booking" || ["booking", "simaksi", "rental", "trip", "payment", "ticket"].includes(n.type);
                            const isNews = n.category === "news" || ["news", "announcement", "article", "weather", "promo", "system"].includes(n.type);

                            return (
                              <div
                                key={n.id}
                                onClick={() => markSingleNotifRead(n)}
                                className={`p-3.5 text-xs cursor-pointer hover:bg-muted/50 transition-colors flex items-start gap-3 ${
                                  !n.read ? "bg-amber-500/5 font-medium" : ""
                                }`}
                              >
                                <div
                                  className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                                    isBooking
                                      ? "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400"
                                      : isNews
                                      ? "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400"
                                      : "bg-purple-50 text-purple-600 dark:bg-purple-950/50 dark:text-purple-400"
                                  }`}
                                >
                                  {isBooking ? (
                                    <Ticket size={16} weight="bold" />
                                  ) : isNews ? (
                                    <Megaphone size={16} weight="bold" />
                                  ) : (
                                    <UsersThree size={16} weight="bold" />
                                  )}
                                </div>

                                <div className="flex-1 min-w-0 space-y-1">
                                  <div className="flex items-center justify-between gap-1">
                                    <span className="font-extrabold text-foreground truncate text-xs">
                                      {n.title}
                                    </span>
                                    <span className="text-[10px] text-neutral-400 shrink-0">
                                      {new Date(n.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                    </span>
                                  </div>
                                  <p className="text-neutral-600 dark:text-neutral-300 leading-relaxed text-[11px] line-clamp-2">
                                    {n.message}
                                  </p>
                                </div>

                                {!n.read && (
                                  <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0 mt-1.5 animate-pulse" />
                                )}
                              </div>
                            );
                          })}
                        </>
                      );
                    })()}
                  </div>

                  {/* Footer Quick Links */}
                  <div className="p-2.5 border-t border-border bg-neutral-50/80 dark:bg-neutral-900/80 grid grid-cols-3 gap-1.5 text-center">
                    <button
                      onClick={() => nav("/my-bookings")}
                      className="py-1.5 px-2 rounded-xl bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all truncate"
                    >
                      <Ticket size={12} />
                      <span>Booking Saya</span>
                    </button>

                    <button
                      onClick={() => nav("/community")}
                      className="py-1.5 px-2 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 font-bold text-[10px] flex items-center justify-center gap-1 transition-all truncate"
                    >
                      <UsersThree size={12} />
                      <span>Forum & News</span>
                    </button>

                    <button
                      onClick={() => nav("/messages")}
                      className="py-1.5 px-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 font-bold text-[10px] flex items-center justify-center gap-1 transition-all truncate shadow-2xs"
                    >
                      <ChatCircleDots size={12} />
                      <span>Partner Chat</span>
                    </button>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    data-testid="nav-user-menu"
                    aria-label={`Menu Akun ${user.name || "Pengguna"}`}
                    className="flex items-center gap-2 rounded-md border border-border bg-white px-3 py-1.5 text-sm font-medium hover:bg-muted trx-btn-press relative"
                  >
                    <UserCircle size={18} weight="duotone" />
                    <span className="max-w-[120px] truncate">{user.name}</span>
                    {bookingCount > 0 && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-60">
                  <DropdownMenuLabel className="text-xs">
                    <div>{user.email}</div>
                    {walletBalance !== null && (
                      <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 p-1 rounded border border-emerald-200 dark:border-emerald-800">
                        <Wallet size={14} /> Saldo: Rp{walletBalance.toLocaleString("id-ID")}
                      </div>
                    )}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {isVendorUser(user) && (
                    <>
                      <DropdownMenuItem
                        data-testid="nav-vendor-panel"
                        onClick={() => nav("/vendor")}
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-extrabold hover:bg-emerald-500/20 focus:bg-emerald-500/20 border border-emerald-500/30 my-1 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <Storefront size={18} weight="bold" className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                          <span>Dashboard Vendor</span>
                        </div>
                        <span className="text-[10px] uppercase tracking-wider bg-emerald-700 text-white font-black px-1.5 py-0.5 rounded-md">
                          Panel
                        </span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}
                  <DropdownMenuItem
                    data-testid="nav-profile"
                    onClick={() => nav("/profile")}
                  >
                    <UserCircle size={16} className="mr-2 text-emerald-600" /> Profil Pendaki
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="nav-my-bookings"
                    onClick={() => nav("/my-bookings")}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center">
                      <MapTrifold size={16} className="mr-2 text-blue-600" /> My Adventure & Bookings
                    </div>
                    {bookingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                        {bookingCount}
                      </span>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => nav("/wishlist")}
                  >
                    <Heart size={16} className="mr-2 text-rose-500" /> Wishlist & Favorit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => nav("/messages")}
                  >
                    <Bell size={16} className="mr-2 text-purple-600" /> Pesan & Diskusi Partner
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => nav("/transactions")}
                  >
                    <Wallet size={16} className="mr-2 text-amber-600" /> Histori Transaksi & Invoice
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => nav("/support")}
                  >
                    <ShieldCheck size={16} className="mr-2 text-teal-600" /> Bantuan & Sengketa
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => window.dispatchEvent(new CustomEvent("open-trexio-onboarding"))}
                  >
                    <Sparkle size={16} className="mr-2 text-emerald-500" /> Panduan Pengguna Baru
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="nav-wallet"
                    onClick={() => nav("/wallet")}
                  >
                    <Wallet size={16} className="mr-2" /> Dompet Saya
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    data-testid="nav-my-rentals"
                    onClick={() => nav("/my-rentals")}
                  >
                    <MapTrifold size={16} className="mr-2" /> Rental Saya
                  </DropdownMenuItem>
                  {!isVendorUser(user) && (
                    <DropdownMenuItem
                      data-testid="nav-become-vendor"
                      onClick={() => nav("/partner/register")}
                    >
                      <Storefront size={16} className="mr-2 text-emerald-600" /> Registrasi Mitra & Tenant
                    </DropdownMenuItem>
                  )}
                  {(Array.isArray(user.roles) ? user.roles : [user.role]).includes("admin") && (
                    <DropdownMenuItem
                      data-testid="nav-admin"
                      onClick={() => nav("/admin")}
                    >
                      <ShieldCheck size={16} className="mr-2 text-indigo-600" /> Admin Panel
                    </DropdownMenuItem>
                  )}
                  {(Array.isArray(user.roles) ? user.roles : [user.role]).includes("super_admin") && (
                    <DropdownMenuItem
                      data-testid="nav-super"
                      onClick={() => nav("/super")}
                    >
                      <ShieldCheck size={16} className="mr-2 text-amber-500" /> Super Panel
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    data-testid="nav-logout"
                    onClick={async () => {
                      await logout();
                      nav("/");
                    }}
                  >
                    <SignOut size={16} className="mr-2" /> Keluar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login" data-testid="nav-login">
                <Button
                  variant="ghost"
                  className="rounded-md text-sm trx-btn-press"
                >
                  Masuk
                </Button>
              </Link>
              <Link to="/register" data-testid="nav-register">
                <Button className="rounded-md bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/90 trx-btn-press">
                  Daftar
                </Button>
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-1">
          <button
            onClick={toggleTheme}
            title={isDark ? "Ganti ke Mode Terang" : "Ganti ke Mode Gelap"}
            className="p-2 rounded-xl text-foreground/80 hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Toggle dark mode"
          >
            {isDark ? (
              <Sun size={20} weight="bold" className="text-amber-400" />
            ) : (
              <Moon size={20} weight="bold" className="text-foreground" />
            )}
          </button>
          <button
            className="p-2 rounded-md hover:bg-muted"
            onClick={() => setOpen(!open)}
            data-testid="nav-mobile-toggle"
            aria-label="menu"
          >
            {open ? <X size={22} /> : <List size={22} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-card max-h-[85vh] overflow-y-auto">
          <div className="trx-container flex flex-col gap-1 py-3">
            {/* Dark Mode Row Toggle */}
            <button
              onClick={toggleTheme}
              className="flex items-center justify-between p-3 rounded-xl bg-muted/40 hover:bg-muted text-xs font-bold text-foreground my-1 transition-colors"
            >
              <div className="flex items-center gap-2">
                {isDark ? (
                  <Sun size={18} weight="bold" className="text-amber-400" />
                ) : (
                  <Moon size={18} weight="bold" className="text-foreground" />
                )}
                <span>Tema Tampilan</span>
              </div>
              <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                {isDark ? "Mode Gelap 🌙" : "Mode Terang ☀️"}
              </span>
            </button>
            <NavLink
              to="/"
              onClick={() => setOpen(false)}
              className={linkClass}
              end
            >
              Beranda
            </NavLink>
            <NavLink
              to="/explore"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Explore Trip
            </NavLink>

            {/* Trexio Backpacker Featured Link in Mobile Menu */}
            <NavLink
              to="/backpacker"
              onClick={() => setOpen(false)}
              className="flex items-center justify-between p-3 my-1 rounded-xl bg-gradient-to-r from-emerald-600/10 via-emerald-500/10 to-transparent border border-emerald-500/30 text-xs font-black text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 transition-all"
            >
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-600 text-white shadow-2xs">
                  <Compass size={16} weight="bold" />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span>Trexio Backpacker</span>
                    <span className="px-1.5 py-0.2 text-[8px] font-black bg-emerald-600 text-white rounded-md uppercase">
                      Pintar &amp; Hemat
                    </span>
                  </div>
                  <div className="text-[10px] text-muted-foreground font-normal">
                    Multi-modal rute, patungan, &amp; carpool nebeng
                  </div>
                </div>
              </div>
              <ArrowRight size={14} />
            </NavLink>

            {/* Mobile 13 Kategori Accordion/Card */}
            <div className="my-1.5 rounded-xl border border-border/60 bg-muted/30 overflow-hidden">
              <button
                onClick={() => setMobileCategoryOpen(!mobileCategoryOpen)}
                className="w-full flex items-center justify-between p-3 text-xs font-bold text-foreground hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                    <GridFour size={16} weight="fill" />
                  </div>
                  <span>13 Kategori Marketplace</span>
                </div>
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <span className="text-[10px] font-normal">{mobileCategoryOpen ? "Sembunyikan" : "Tampilkan"}</span>
                  <CaretDown
                    size={14}
                    className={`transition-transform duration-200 ${mobileCategoryOpen ? "rotate-180 text-emerald-500" : ""}`}
                  />
                </div>
              </button>

              {mobileCategoryOpen && (
                <div className="p-3 pt-0 border-t border-border/40 grid grid-cols-2 gap-2 mt-2">
                  {MARKETPLACE_CATEGORIES.map((cat) => (
                    <Link
                      key={cat.slug}
                      to={cat.link}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-2 p-2 rounded-lg bg-background border border-border/50 hover:border-emerald-500/50 hover:bg-emerald-500/5 transition-all"
                    >
                      <div className="p-1.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
                        <cat.icon size={15} weight="fill" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-foreground truncate">{cat.name}</div>
                        <div className="text-[9px] text-muted-foreground truncate">{cat.desc}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <NavLink
              to="/destinations"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Destinasi
            </NavLink>
            <NavLink
              to="/safety"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              AI Safety & Cuaca
            </NavLink>
            <NavLink
              to="/communities"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Komunitas
            </NavLink>
            <NavLink
              to="/rental"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Rental
            </NavLink>
            <NavLink
              to="/help"
              onClick={() => setOpen(false)}
              className={linkClass}
            >
              Bantuan
            </NavLink>
            <NavLink
              to="/partner/register"
              onClick={() => setOpen(false)}
              className={`${linkClass} text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5`}
            >
              <Storefront size={18} /> Registrasi Vendor & Tenant
            </NavLink>
            <button
              onClick={() => {
                setOpen(false);
                triggerPWAInstall();
              }}
              className={`${linkClass} text-emerald-700 dark:text-emerald-400 font-bold flex items-center gap-1.5 w-full text-left`}
            >
              <DownloadSimple size={18} weight="bold" /> Install Aplikasi Trexio
            </button>
            <div className="border-t border-border my-2" />
            {user ? (
              <>
                {isVendorUser(user) && (
                  <NavLink
                    to="/vendor"
                    onClick={() => setOpen(false)}
                    className={`${linkClass} text-emerald-800 dark:text-emerald-300 bg-emerald-500/15 font-extrabold flex items-center justify-between border border-emerald-500/30 rounded-xl px-3 py-2.5 my-1`}
                  >
                    <div className="flex items-center gap-2">
                      <Storefront size={20} weight="bold" className="text-emerald-600 dark:text-emerald-400" />
                      <span>Dashboard Vendor</span>
                    </div>
                    <span className="text-[10px] uppercase font-black bg-emerald-700 text-white px-2 py-0.5 rounded-md">
                      Akses
                    </span>
                  </NavLink>
                )}
                <NavLink
                  to="/profile"
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  Profil Pendaki
                </NavLink>
                <NavLink
                  to="/my-bookings"
                  onClick={() => setOpen(false)}
                  className={linkClass}
                >
                  Reservasi Saya
                </NavLink>
                {user.role === "admin" && (
                  <NavLink
                    to="/admin"
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    Admin Panel
                  </NavLink>
                )}
                {(user.roles || []).includes("super_admin") && (
                  <NavLink
                    to="/super"
                    onClick={() => setOpen(false)}
                    className={linkClass}
                  >
                    Super Panel
                  </NavLink>
                )}
                <button
                  className="text-left px-3 py-2 text-sm text-destructive"
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                    nav("/");
                  }}
                >
                  Keluar
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 px-3 py-2">
                <div className="flex gap-2">
                  <Link to="/login" className="flex-1" onClick={() => setOpen(false)}>
                    <Button variant="outline" className="w-full">
                      Masuk
                    </Button>
                  </Link>
                  <Link to="/register" className="flex-1" onClick={() => setOpen(false)}>
                    <Button className="w-full bg-[hsl(var(--secondary))]">
                      Daftar
                    </Button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CartDrawer open={cartDrawerOpen} onOpenChange={setCartDrawerOpen} />
    </header>
  );
}
