import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import { api } from "@/lib/api";
import {
  Gauge,
  ClipboardText,
  MoneyWavy,
  Path,
  SignOut,
  UsersThree,
  Package,
  Browsers,
  Globe,
  Palette,
  ListChecks,
  Sparkle,
  TrendUp,
  Gear,
  CaretDown,
  CaretRight,
  UserCircle,
  Crown,
  ShieldCheck
} from "@phosphor-icons/react";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [websiteOpen, setWebsiteOpen] = useState(true);
  const [badges, setBadges] = useState({
    pendingBookings: 0,
    pendingPayments: 0,
  });

  useEffect(() => {
    async function loadAdminBadges() {
      try {
        const [statsRes, bookingsRes] = await Promise.all([
          api.get("/admin/stats"),
          api.get("/admin/bookings"),
        ]);
        const bookingsList = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const pendingBookingsCount = bookingsList.filter(
          (b) => b.payment_status === "pending" || b.payment_status === "awaiting_verification"
        ).length;

        setBadges({
          pendingBookings: pendingBookingsCount,
          pendingPayments: statsRes.data?.pending_payments || 0,
        });
      } catch (e) {
        // Silent catch for badges
      }
    }
    loadAdminBadges();
    const timer = setInterval(loadAdminBadges, 15000);
    return () => clearInterval(timer);
  }, []);

  const getAdminBadge = (path) => {
    if (path === "/admin/bookings") return badges.pendingBookings;
    if (path === "/admin/payments") return badges.pendingPayments;
    return 0;
  };

  const mainItems = [
    { to: "/admin", label: "Dashboard", icon: Gauge, end: true },
    { to: "/admin/ai-command-center", label: "AI Command Center", icon: Sparkle },
    { to: "/admin/ai-growth-intelligence", label: "AI Growth Intelligence", icon: TrendUp },
    { to: "/admin/ai-trust-risk", label: "AI Trust & Risk Center", icon: ShieldCheck },
    { to: "/admin/subscription", label: "Langganan Tenant & Billing", icon: Crown },
    { to: "/admin/profile", label: "Profil Tenant & Admin", icon: UserCircle },
  ];

  const marketplaceItems = [
    { to: "/admin/trips", label: "Katalog Trip", icon: Path },
    { to: "/admin/bookings", label: "Booking & Order", icon: ClipboardText },
    { to: "/admin/payments", label: "Laporan Keuangan", icon: MoneyWavy },
    { to: "/admin/communities", label: "Komunitas", icon: UsersThree },
    { to: "/admin/rentals", label: "Rental Gear", icon: Package },
  ];

  const websiteSubItems = [
    { to: "/admin/website", label: "Overview", icon: Globe, end: true },
    { to: "/admin/website/builder", label: "Page Builder", icon: Browsers },
    { to: "/admin/website/templates", label: "Templates (7 Preset)", icon: Palette },
    { to: "/admin/website/pages", label: "Kelola Halaman", icon: ListChecks },
    { to: "/admin/website/navigation", label: "Navigasi Header", icon: ListChecks },
    { to: "/admin/website/branding", label: "Logo & Warna", icon: Palette },
    { to: "/admin/website/domain", label: "Domain & SSL", icon: Globe },
    { to: "/admin/website/seo", label: "SEO & Social", icon: Sparkle },
    { to: "/admin/website/analytics", label: "Analytics Funnel", icon: TrendUp },
    { to: "/admin/website/settings", label: "Settings & Scripts", icon: Gear },
  ];

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))]">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] lg:min-h-screen flex flex-col justify-between">
          <div>
            <div className="px-6 py-5 flex items-center justify-between border-b border-white/10">
              <Link to="/admin" className="flex items-center gap-2">
                <TrexioLogo variant="horizontal" size="sm" showTagline={false} className="text-white" />
                <span className="text-[10px] uppercase font-black tracking-widest bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/30">
                  TENANT
                </span>
              </Link>
            </div>

            <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
              {/* Main */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-80">
                  DASHBOARD
                </div>
                {mainItems.map((it) => {
                  const count = getAdminBadge(it.to);
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      end={it.end}
                      data-testid={`admin-nav-${it.label}`}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          isActive ? "bg-white/15 text-white font-bold shadow-xs" : "hover:bg-white/10 opacity-80 hover:opacity-100"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <it.icon size={16} className="shrink-0" /> <span className="truncate">{it.label}</span>
                      </div>
                      {count > 0 && (
                        <span
                          data-testid={`admin-nav-badge-${it.to.split("/").pop() || "home"}`}
                          className="ml-2 inline-flex shrink-0 items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black leading-none bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300/60 animate-pulse"
                        >
                          {count}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Marketplace */}
              <div className="space-y-1">
                <div className="px-3 text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-80">
                  MARKETPLACE ENGINE
                </div>
                {marketplaceItems.map((it) => {
                  const count = getAdminBadge(it.to);
                  return (
                    <NavLink
                      key={it.to}
                      to={it.to}
                      data-testid={`admin-nav-${it.label}`}
                      className={({ isActive }) =>
                        `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-semibold transition-all ${
                          isActive ? "bg-white/15 text-white font-bold shadow-xs" : "hover:bg-white/10 opacity-80 hover:opacity-100"
                        }`
                      }
                    >
                      <div className="flex items-center gap-3 truncate min-w-0">
                        <it.icon size={16} className="shrink-0" /> <span className="truncate">{it.label}</span>
                      </div>
                      {count > 0 && (
                        <span
                          data-testid={`admin-nav-badge-${it.to.split("/").pop() || "home"}`}
                          className="ml-2 inline-flex shrink-0 items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black leading-none bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300/60 animate-pulse"
                        >
                          {count}
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </div>

              {/* Website Builder Section */}
              <div className="space-y-1">
                <button
                  onClick={() => setWebsiteOpen(!websiteOpen)}
                  className="w-full px-3 py-1 flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-90 cursor-pointer hover:opacity-100"
                >
                  <span>WEBSITE & LANDING BUILDER</span>
                  {websiteOpen ? <CaretDown size={12} /> : <CaretRight size={12} />}
                </button>

                {websiteOpen && (
                  <div className="pl-2 space-y-0.5 border-l border-emerald-500/30 ml-2">
                    {websiteSubItems.map((it) => (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        end={it.end}
                        data-testid={`admin-nav-${it.label}`}
                        className={({ isActive }) =>
                          `flex items-center gap-2.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-all ${
                            isActive
                              ? "bg-emerald-500/25 text-emerald-300 font-bold border-l-2 border-emerald-400"
                              : "hover:bg-white/10 opacity-75 hover:opacity-100"
                          }`
                        }
                      >
                        <it.icon size={14} /> {it.label}
                      </NavLink>
                    ))}
                  </div>
                )}
              </div>
            </nav>
          </div>

          <div className="px-6 py-4 border-t border-white/10 hidden lg:block">
            <div className="text-[10px] uppercase opacity-70">Pengguna Tenant</div>
            <div className="font-bold text-xs mt-0.5 truncate">{user?.name}</div>
            <div className="text-[11px] opacity-70 truncate">{user?.email}</div>
            <button
              data-testid="admin-logout"
              onClick={async () => {
                await logout();
                nav("/");
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-xs opacity-80 hover:opacity-100 text-red-300 cursor-pointer"
            >
              <SignOut size={14} /> Keluar
            </button>
          </div>
        </aside>

        <main className="p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
