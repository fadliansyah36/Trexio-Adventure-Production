import { useState, useEffect } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TrexioLogo from "@/components/site/TrexioLogo";
import { api } from "@/lib/api";
import {
  Buildings,
  Gauge,
  SignOut,
  Crown,
  ArrowSquareOut,
  Storefront,
  Globe,
  MoneyWavy,
  Headset,
  Gear,
  ShieldCheck,
  Funnel,
  Pulse,
  Sliders,
  Receipt,
  UserCheck,
  Rocket,
  Database,
  Cpu,
  UsersThree,
  TrendUp,
  Compass,
} from "@phosphor-icons/react";

export default function SuperLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [actionStats, setActionStats] = useState(null);

  useEffect(() => {
    async function fetchActionCenter() {
      try {
        const { data } = await api.get("/super/action-center");
        if (data) setActionStats(data);
      } catch (e) {
        // Silent catch for badges
      }
    }
    fetchActionCenter();
    const timer = setInterval(fetchActionCenter, 15000);
    return () => clearInterval(timer);
  }, []);

  const getBadgeCount = (path) => {
    if (!actionStats) return 0;
    if (path === "/super/payments") return actionStats.pending_payouts || 0;
    if (path === "/super/billing-requests") return actionStats.pending_billing_requests || 0;
    if (path === "/super/vendors") return actionStats.pending_vendor_verifications || 0;
    if (path === "/super/customer-care") return actionStats.open_support_tickets || 0;
    return 0;
  };

  const navGroups = [
    {
      group: "COMMAND CENTER",
      items: [
        { to: "/super", label: "Executive Overview & KPIs", icon: Gauge, end: true },
        { to: "/super/ai-command-center", label: "AI Command Center", icon: Cpu },
        { to: "/super/ai-growth-intelligence", label: "AI Growth Intelligence", icon: TrendUp },
        { to: "/super/ai-trust-risk", label: "AI Trust & Risk Center", icon: ShieldCheck },
        { to: "/super/master-data", label: "Master Data Management", icon: Database },
      ],
    },
    {
      group: "SaaS MONETIZATION & BILLING",
      items: [
        { to: "/super/subscriptions", label: "Langganan Tenant SaaS", icon: Crown },
        { to: "/super/advertising", label: "Iklan & Sponsor Vendor", icon: Rocket },
        { to: "/super/billing-requests", label: "Moderasi & Approval Queue", icon: Receipt },
      ],
    },
    {
      group: "ECOSYSTEM GOVERNANCE",
      items: [
        { to: "/super/tenants", label: "Tenants & Storefronts", icon: Buildings },
        { to: "/super/vendors", label: "Mitra Vendors & KYC", icon: Storefront },
        { to: "/super/community", label: "Moderasi & Komunitas", icon: UsersThree },
        { to: "/super/backpacker", label: "Backpacker Ops Center", icon: Compass },
      ],
    },
    {
      group: "KEUANGAN & GERBANG PEMBAYARAN TREXIO",
      items: [
        { to: "/super/payments", label: "Central Payment & Payouts", icon: MoneyWavy },
      ],
    },
    {
      group: "WEBSITE & CMS BUILDER",
      items: [
        { to: "/super/website-platform", label: "Homepage CMS Engine", icon: Globe },
        { to: "/super/seo", label: "AI SEO & Content Intelligence", icon: Globe },
      ],
    },
    {
      group: "CARE & MEDIATION",
      items: [
        { to: "/super/customer-care", label: "Support & Audit Logs", icon: Headset },
      ],
    },
    {
      group: "SYSTEM & GOVERNANCE",
      items: [
        { to: "/super/ai-control", label: "Trexio AI Control Center", icon: Cpu },
        { to: "/super/security", label: "Security Center & RBAC", icon: ShieldCheck },
        { to: "/super/profile", label: "Profil Super Admin", icon: UserCheck },
        { to: "/super/settings", label: "Feature Flags & Settings", icon: Gear },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 font-sans">
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
        <aside className="bg-black/80 border-r border-white/10 lg:min-h-screen flex flex-col justify-between">
          <div>
            {/* Header Brand */}
            <div className="px-5 py-5 border-b border-white/10 space-y-2">
              <div className="flex items-center justify-between">
                <TrexioLogo variant="horizontal" size="sm" showTagline={true} className="text-white" />
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-amber-400 via-orange-500 to-amber-600 text-black shadow-md shrink-0">
                  <Crown weight="fill" size={16} />
                </span>
              </div>
              <div className="text-[9px] font-mono uppercase tracking-widest text-amber-400 font-bold px-0.5">
                SUPER ADMIN OPERATING SYSTEM
              </div>
            </div>

            {/* Nav Menu */}
            <nav className="p-4 space-y-5 overflow-y-auto max-h-[calc(100vh-160px)]">
              {navGroups.map((g) => (
                <div key={g.group} className="space-y-1.5">
                  <div className="px-3 text-[9px] uppercase font-mono font-black tracking-widest text-neutral-500">
                    {g.group}
                  </div>
                  <div className="space-y-1">
                    {g.items.map((it) => {
                      const count = getBadgeCount(it.to);
                      return (
                        <NavLink
                          key={it.to}
                          to={it.to}
                          end={it.end}
                          data-testid={`super-nav-${it.label}`}
                          className={({ isActive }) =>
                            `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                              isActive
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/30 shadow-md"
                                : "hover:bg-white/5 text-neutral-400 hover:text-white"
                            }`
                          }
                        >
                          <div className="flex items-center gap-3 truncate">
                            <it.icon size={18} className="shrink-0" />
                            <span className="truncate">{it.label}</span>
                          </div>
                          {count > 0 && (
                            <span
                              data-testid={`super-nav-badge-${it.to.split("/").pop() || "home"}`}
                              className="ml-2 inline-flex shrink-0 items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black leading-none bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300/60 animate-pulse"
                            >
                              {count}
                            </span>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="pt-2">
                <NavLink
                  to="/admin"
                  className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs font-bold text-neutral-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-all"
                  data-testid="super-nav-tenant-admin"
                >
                  <ArrowSquareOut size={16} /> Buka Tenant Admin
                </NavLink>
              </div>
            </nav>
          </div>

          {/* User Footer */}
          <div className="p-5 border-t border-white/10 bg-black/40 hidden lg:block">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase font-mono font-bold text-amber-400">Super Authority</div>
                <div className="font-bold text-xs text-white truncate max-w-[170px]">{user?.name}</div>
                <div className="text-[10px] text-neutral-400 truncate max-w-[170px]">{user?.email}</div>
              </div>
              <button
                data-testid="super-logout"
                onClick={async () => {
                  await logout();
                  nav("/");
                }}
                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all cursor-pointer"
                title="Keluar"
              >
                <SignOut size={16} />
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
