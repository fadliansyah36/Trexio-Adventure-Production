import { useEffect, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { House, ShoppingCart, Ticket, User, Sparkle } from "@phosphor-icons/react";
import { useAuth } from "@/context/AuthContext";
import { getStoredCart } from "@/lib/cartStorage";
import { api } from "@/lib/api";

export default function MobileBottomNav() {
  const { user } = useAuth();
  const location = useLocation();

  const [cartCount, setCartCount] = useState(() => getStoredCart().length);
  const [activeBookingCount, setActiveBookingCount] = useState(0);

  useEffect(() => {
    const handleCartUpdated = (e) => {
      const items = e.detail || getStoredCart();
      setCartCount(Array.isArray(items) ? items.length : getStoredCart().length);
    };

    window.addEventListener("cart-updated", handleCartUpdated);
    setCartCount(getStoredCart().length);

    return () => {
      window.removeEventListener("cart-updated", handleCartUpdated);
    };
  }, []);

  useEffect(() => {
    const loadBookingCount = async () => {
      if (!user) {
        setActiveBookingCount(0);
        return;
      }
      try {
        const { data } = await api.get("/bookings/my");
        if (Array.isArray(data)) {
          const active = data.filter((b) => {
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
          setActiveBookingCount(active);
        } else {
          setActiveBookingCount(0);
        }
      } catch (err) {
        setActiveBookingCount(0);
      }
    };

    loadBookingCount();

    window.addEventListener("trexio:booking-updated", loadBookingCount);
    return () => {
      window.removeEventListener("trexio:booking-updated", loadBookingCount);
    };
  }, [user]);

  // Hide mobile bottom nav on admin/super/vendor panel subroutes or login pages
  const isHide =
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/super") ||
    location.pathname.startsWith("/vendor") ||
    location.pathname === "/login" ||
    location.pathname === "/register";

  if (isHide) return null;

  const navItems = [
    { label: "Home", icon: House, to: "/" },
    { label: "AI Trip", icon: Sparkle, to: "/ai-discovery" },
    { label: "Keranjang", icon: ShoppingCart, to: "/cart", badge: cartCount, badgeColor: "bg-emerald-700" },
    { label: "Booking", icon: Ticket, to: user ? "/my-bookings" : "/login", badge: activeBookingCount, badgeColor: "bg-amber-500" },
    { label: "Akun", icon: User, to: user ? "/profile" : "/login" },
  ];

  return (
    <nav
      data-testid="mobile-bottom-nav"
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border/80 shadow-2xl pb-[env(safe-area-inset-bottom,0px)]"
    >
      <div className="grid grid-cols-5 h-14 items-center px-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.to;
          const badgeVal = item.badge || 0;

          return (
            <NavLink
              key={item.label}
              to={item.to}
              onClick={(e) => {
                if (item.label === "Keranjang" && location.pathname !== "/cart") {
                  e.preventDefault();
                  window.dispatchEvent(new CustomEvent("open-cart-drawer"));
                }
              }}
              className={`flex flex-col items-center justify-center h-full w-full py-1 transition-all touch-target ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className={`relative px-2.5 py-0.5 rounded-full transition-all ${isActive ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 scale-105" : ""}`}>
                <Icon size={20} weight={isActive ? "fill" : "regular"} />
                {badgeVal > 0 && (
                  <span
                    data-testid={`mobile-badge-${item.label.toLowerCase()}`}
                    className={`absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full px-1 text-[9px] font-black text-white shadow-xs ${item.badgeColor || "bg-emerald-700"} animate-pulse`}
                  >
                    {badgeVal}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight font-semibold mt-0.5 line-clamp-1">
                {item.label}
              </span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
