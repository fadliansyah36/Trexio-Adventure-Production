import { NavLink, Outlet, useNavigate, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import { api } from "@/lib/api";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import TrexioLogo from "@/components/site/TrexioLogo";
import {
  Storefront,
  ChartLine,
  Package,
  ClipboardText,
  User,
  SignOut,
  Sparkle,
  Warning,
  CurrencyDollar,
  Tag,
  TrendUp,
  Users,
  Gear,
  QrCode,
  ShieldCheck,
  PlusCircle,
  CalendarPlus,
  PhoneCall,
  X,
  Lightning,
  Headset,
  UsersThree,
  House,
  Globe,
  ChatCircleDots,
} from "@phosphor-icons/react";

export default function VendorLayout() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showQuickAction, setShowQuickAction] = useState(false);
  const [badges, setBadges] = useState({
    pendingBookings: 0,
    processingWithdrawals: 0,
    kycAttention: 0,
    unreadCommunications: 0,
  });

  useEffect(() => {
    api
      .get("/vendor/me")
      .then((r) => {
        setVendor(r.data);
        if (r.data?.status === "pending" || r.data?.status === "rejected") {
          setBadges((prev) => ({ ...prev, kycAttention: 1 }));
        }
      })
      .catch(() => setVendor(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    async function loadVendorBadges() {
      if (!vendor) return;
      try {
        const [bookingsRes, financeRes, commRes] = await Promise.all([
          api.get("/vendor/bookings"),
          api.get("/vendor/finance"),
          api.get("/vendor/communications/summary"),
        ]);
        const bList = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];
        const pendingB = bList.filter(
          (b) => b.payment_status === "pending" || b.payment_status === "awaiting_verification"
        ).length;

        const withdrawals = Array.isArray(financeRes.data?.withdrawals) ? financeRes.data.withdrawals : [];
        const procW = withdrawals.filter(
          (w) => w.status === "under_review" || w.status === "processing" || w.status === "pending"
        ).length;

        const commUnread = commRes.data?.unread_count || 0;

        setBadges((prev) => ({
          ...prev,
          pendingBookings: pendingB,
          processingWithdrawals: procW,
          unreadCommunications: commUnread,
          kycAttention: vendor.status === "pending" || vendor.status === "rejected" ? 1 : 0,
        }));
      } catch (e) {
        // Silent catch for badges
      }
    }
    if (vendor) {
      loadVendorBadges();
      const timer = setInterval(loadVendorBadges, 15000);
      return () => clearInterval(timer);
    }
  }, [vendor]);

  const getVendorBadge = (path) => {
    if (path === "/vendor/bookings") return badges.pendingBookings;
    if (path === "/vendor/finance") return badges.processingWithdrawals;
    if (path === "/vendor/communications") return badges.unreadCommunications;
    if (path === "/vendor/settings") return badges.kycAttention;
    return 0;
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-neutral-500 font-bold">Memuat Partner Center...</div>;
  }

  // No vendor record → redirect ke onboarding
  if (!vendor) {
    return (
      <div className="min-h-screen bg-[hsl(var(--muted))] flex items-center justify-center p-6">
        <div className="max-w-lg text-center bg-white rounded-lg border border-border p-8" data-testid="vendor-empty-state">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-white">
            <Sparkle weight="fill" size={22} />
          </div>
          <h1 className="mt-4 text-2xl font-black tracking-tighter">Jadi Mitra TREXIO</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Daftarkan brand Anda sebagai organizer, guide, merchant, rental, komunitas, atau event organizer di ekosistem TREXIO.
          </p>
          <Link
            to="/vendor/onboard"
            data-testid="vendor-empty-cta"
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-[hsl(var(--secondary))] text-white px-5 py-2.5 text-sm font-bold hover:opacity-90"
          >
            Mulai Pendaftaran
          </Link>
        </div>
      </div>
    );
  }

  const navSections = [
    {
      title: "OVERVIEW & AI",
      items: [
        { to: "/vendor", label: "Dashboard & Action", icon: ChartLine, end: true },
        { to: "/vendor/ai-copilot", label: "AI Business Copilot", icon: Sparkle, badge: "NEW" },
      ],
    },
    {
      title: "PRODUK & INVENTORY",
      items: [
        { to: "/vendor/products", label: "Produk, Schedule & Kuota", icon: Package },
      ],
    },
    {
      title: "ORDER & OPERASIONAL",
      items: [
        { to: "/vendor/bookings", label: "Bookings & Manifest Check-in", icon: ClipboardText },
      ],
    },
    {
      title: "PELANGGAN & REPUTASI",
      items: [
        { to: "/vendor/communications", label: "Communications & Chat", icon: ChatCircleDots },
        { to: "/vendor/customers", label: "Pelanggan & CRM Data", icon: Users },
        { to: "/vendor/promotions", label: "Voucher & Featured", icon: Tag },
        { to: "/vendor/community", label: "Komunitas & Forum", icon: UsersThree },
      ],
    },
    {
      title: "FINANSIAL & ANALITIK",
      items: [
        { to: "/vendor/finance", label: "Keuangan, Saldo & Payout", icon: CurrencyDollar },
        { to: "/vendor/analytics", label: "Performa & Funnel Sales", icon: TrendUp },
      ],
    },
    {
      title: "PENGATURAN & STAF",
      items: [
        { to: "/vendor/settings", label: "KYC, Tim Staf & Aturan", icon: ShieldCheck },
        { to: "/vendor/profile", label: "Profil Storefront Brand", icon: User },
      ],
    },
  ];

  const statusChip = {
    pending: { label: "Menunggu Verifikasi", cls: "bg-amber-100 text-amber-700 border-amber-200" },
    verified: { label: "Terverifikasi", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    rejected: { label: "Ditolak", cls: "bg-rose-100 text-rose-700 border-rose-200" },
    suspended: { label: "Ditangguhkan", cls: "bg-neutral-100 text-neutral-700 border-neutral-200" },
  }[vendor.status] || { label: vendor.status, cls: "bg-neutral-100 text-neutral-700 border-neutral-200" };

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))] relative pb-20 lg:pb-0">
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] lg:min-h-screen flex flex-col justify-between">
          <div>
            <div className="px-5 py-5 flex items-center justify-between border-b border-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <TrexioLogo variant="icon" size="sm" />
                <div className="overflow-hidden">
                  <div className="text-base font-black tracking-tighter truncate" data-testid="vendor-brand">{vendor.brand_name}</div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 opacity-90">TREXIO Partner Center</div>
                </div>
              </div>
              <Link
                to="/"
                data-testid="btn-vendor-back-home"
                title="Kembali ke Homepage Website"
                className="p-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-all text-xs font-bold flex items-center justify-center shrink-0"
              >
                <House size={18} weight="bold" />
              </Link>
            </div>

            <div className="px-5 py-3 flex items-center gap-2 border-b border-white/10">
              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold border ${statusChip.cls}`} data-testid="vendor-status">
                {statusChip.label}
              </span>
              <VendorVerifiedBadge
                verified={vendor.status === "verified" || vendor.verified}
                status={vendor.status}
                size="sm"
                showUnverified={false}
                dataTestId="vendor-sidebar-verified-badge"
              />
            </div>

            <nav className="p-3 space-y-4 overflow-y-auto max-h-[calc(100vh-180px)]">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-3 text-[10px] font-black uppercase tracking-wider opacity-50 text-white/80">
                    {sec.title}
                  </div>
                  {sec.items.map((it) => {
                    const count = getVendorBadge(it.to);
                    return (
                      <NavLink
                        key={it.to}
                        to={it.to}
                        end={it.end}
                        data-testid={`vendor-nav-${it.label}`}
                        className={({ isActive }) =>
                          `flex items-center justify-between rounded-xl px-3 py-2 text-xs font-bold transition-all ${
                            isActive ? "bg-white/20 text-white shadow-xs" : "hover:bg-white/10 opacity-75 hover:opacity-100"
                          }`
                        }
                      >
                        <div className="flex items-center gap-2.5 truncate min-w-0">
                          <it.icon size={16} className="shrink-0" /> <span className="truncate">{it.label}</span>
                        </div>
                        {count > 0 && (
                          <span
                            data-testid={`vendor-nav-badge-${it.to.split("/").pop() || "home"}`}
                            className="ml-2 inline-flex shrink-0 items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-black leading-none bg-amber-400 text-amber-950 shadow-xs ring-1 ring-amber-300/60 animate-pulse"
                          >
                            {count}
                          </span>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>
          </div>

          <div className="p-5 border-t border-white/10 hidden lg:block bg-black/10 space-y-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 w-full justify-center bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-3 py-2 rounded-xl transition-all border border-white/10"
            >
              <Globe size={16} /> Ke Website Utama
            </Link>
            <div className="pt-1">
              <div className="text-[10px] uppercase font-bold tracking-widest opacity-60">Login Mitra</div>
              <div className="font-extrabold text-xs mt-0.5 truncate">{user?.name}</div>
              <div className="text-[11px] opacity-70 truncate">{user?.email}</div>
              <button
                data-testid="vendor-logout"
                onClick={async () => { await logout(); nav("/"); }}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-rose-200 transition-all"
              >
                <SignOut size={14} /> Keluar Panel
              </button>
            </div>
          </div>
        </aside>

        <main className="p-6 md:p-8 space-y-6">
          {vendor.status === "rejected" && (
            <div className="flex gap-3 items-start rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800" data-testid="vendor-rejected-banner">
              <Warning weight="fill" size={18} className="mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-extrabold">Pengajuan Vendor / Partner Ditolak</div>
                <div className="mt-0.5">{vendor.rejection_reason || "Silakan perbarui dokumen legal pada menu Pengaturan dan ajukan ulang verifikasi."}</div>
              </div>
            </div>
          )}
          {vendor.status === "pending" && (
            <div className="flex gap-3 items-start rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800" data-testid="vendor-pending-banner">
              <Sparkle weight="fill" size={18} className="mt-0.5 flex-shrink-0 text-amber-600" />
              <div>
                <div className="font-extrabold">Menunggu Verifikasi Tim TREXIO</div>
                <div className="mt-0.5">Pengajuan pendaftaran Anda sedang ditinjau. Anda tetap dapat melengkapi katalog produk dan pengaturan profil.</div>
              </div>
            </div>
          )}
          <Outlet context={{ vendor, refresh: () => api.get("/vendor/me").then((r) => setVendor(r.data)) }} />
        </main>
      </div>

      {/* 73. QUICK ACTION MOBILE FLOATING BAR */}
      <div className="lg:hidden fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setShowQuickAction(true)}
          className="flex items-center gap-2 bg-[hsl(var(--primary))] text-white font-extrabold text-xs px-4 py-3 rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all border-2 border-white"
        >
          <Lightning weight="fill" size={18} className="text-amber-300" />
          <span>+ Quick Action</span>
        </button>
      </div>

      {/* Quick Action Mobile Modal Sheet */}
      {showQuickAction && (
        <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-xs flex items-end justify-center p-0 lg:hidden animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 w-full rounded-t-3xl p-6 pb-20 lg:pb-6 space-y-4 shadow-2xl animate-in slide-in-from-bottom-5">
            <div className="flex justify-between items-center border-b border-border pb-3">
              <div className="flex items-center gap-2 font-black text-sm text-foreground">
                <Lightning weight="fill" size={18} className="text-amber-500" /> Quick Action Field Operator
              </div>
              <button
                onClick={() => setShowQuickAction(false)}
                className="p-1 rounded-full text-muted-foreground hover:bg-neutral-100"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-xs text-muted-foreground">
              Akses cepat fungsi operasional mitra langsung saat berada di basecamp, meeting point, atau jalur ekspedisi.
            </p>

            <div className="grid grid-cols-1 gap-2 text-xs font-bold pt-1">
              <button
                onClick={() => { setShowQuickAction(false); nav("/vendor/products?action=add"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-border text-foreground transition-all"
              >
                <PlusCircle size={22} className="text-[hsl(var(--primary))]" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">Add Product</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Tambah trip, rental gear, guide, or camping ground baru</div>
                </div>
              </button>

              <button
                onClick={() => { setShowQuickAction(false); nav("/vendor/products?action=schedule"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-border text-foreground transition-all"
              >
                <CalendarPlus size={22} className="text-emerald-600" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">Add Schedule & Quota</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Buka tanggal rilis & slot kuota peserta baru</div>
                </div>
              </button>

              <button
                onClick={() => { setShowQuickAction(false); nav("/vendor/bookings"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-border text-foreground transition-all"
              >
                <ClipboardText size={22} className="text-blue-600" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">View Booking & Manifest</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Cek daftar nama peserta & status verifikasi bayar</div>
                </div>
              </button>

              <button
                onClick={() => { setShowQuickAction(false); nav("/vendor/bookings?action=checkin"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-border text-foreground transition-all"
              >
                <QrCode size={22} className="text-purple-600" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">Check-in Participant Pass</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Scan QR code atau masukan kode booking peserta</div>
                </div>
              </button>

              <button
                onClick={() => { setShowQuickAction(false); nav("/vendor/customers"); }}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-neutral-50 hover:bg-neutral-100 border border-border text-foreground transition-all"
              >
                <PhoneCall size={22} className="text-amber-600" />
                <div className="text-left">
                  <div className="font-extrabold text-sm">Contact Customer & Support</div>
                  <div className="text-[10px] text-muted-foreground font-normal">Hubungi peserta trip via WhatsApp / Email & bantuan Trexio</div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


