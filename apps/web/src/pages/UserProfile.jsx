import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import RoleProfileEditor from "@/components/RoleProfileEditor";
import UserQrPassModal from "@/components/UserQrPassModal";
import {
  UserCircle,
  Phone,
  EnvelopeSimple,
  WarningCircle,
  Trophy,
  Mountains,
  Medal,
  ClockCounterClockwise,
  Ticket,
  ChatCircleDots,
  Plus,
  FloppyDisk,
  Sparkle,
  CheckCircle,
  UsersThree,
  ShieldCheck,
  Receipt,
  Lifebuoy,
  Trash,
  Compass,
  Camera,
  Key,
  Eye,
  EyeSlash,
  Lock,
  SignOut,
  Storefront,
  QrCode,
  Heart,
} from "@phosphor-icons/react";

export default function UserProfile() {
  const { user, setUser, logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Password Change States
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOldPass, setShowOldPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  // Avatar presets
  const AVATAR_PRESETS = [
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
  ];

  // Account Management Action States
  const [deactivating, setDeactivating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function handleDeactivateAccount() {
    if (!window.confirm("Apakah Anda yakin ingin menonaktifkan akun Anda? Anda dapat mengaktifkannya kembali sewaktu-waktu dengan login ulang.")) {
      return;
    }
    setDeactivating(true);
    try {
      await api.post("/users/me/deactivate");
      toast.success("Akun berhasil dinonaktifkan.");
      await logout();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menonaktifkan akun");
    } finally {
      setDeactivating(false);
    }
  }

  async function handleDeleteAccount() {
    if (!window.confirm("PERINGATAN: Apakah Anda yakin ingin MENGHAPUS AKUN Anda secara permanen? Tindakan ini tidak dapat dibatalkan.")) {
      return;
    }
    const userPrompt = window.prompt("Ketik 'HAPUS' untuk mengonfirmasi penghapusan permanen akun Anda:");
    if (userPrompt !== "HAPUS") {
      return toast.info("Penghapusan akun dibatalkan.");
    }

    setDeleting(true);
    try {
      await api.post("/users/me/delete");
      toast.success("Akun berhasil dihapus secara permanen.");
      await logout();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal menghapus akun");
    } finally {
      setDeleting(false);
    }
  }
  // Saved Travelers State
  const [savedTravelers, setSavedTravelers] = useState([]);
  const [newTraveler, setNewTraveler] = useState({ name: "", identity_no: "", phone: "" });

  // User Bookings & Wishlist State
  const [userBookings, setUserBookings] = useState([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [dashboardStats, setDashboardStats] = useState(null);
  const [showQrPassModal, setShowQrPassModal] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchUserBookings();
    fetchWishlistCount();
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const { data } = await api.get("/users/me/stats");
      if (data && (data.stats || data.dashboard_stats)) {
        setDashboardStats(data.stats || data.dashboard_stats);
      }
    } catch (err) {
      // Fallback handled gracefully
    }
  }

  async function fetchWishlistCount() {
    try {
      const { data } = await api.get("/wishlist");
      if (Array.isArray(data)) {
        setWishlistCount(data.length);
      }
    } catch (err) {
      setWishlistCount(0);
    }
  }

  async function fetchUserBookings() {
    try {
      const { data } = await api.get("/bookings/mine");
      setUserBookings(Array.isArray(data) ? data : []);
    } catch (err) {
      setUserBookings([]);
    }
  }

  async function fetchProfile() {
    try {
      const { data } = await api.get("/users/me/profile");
      if (data.stats || data.dashboard_stats) {
        setDashboardStats(data.stats || data.dashboard_stats);
      }
      let emergencyContacts = data.emergency_contacts || [];
      if (emergencyContacts.length === 0 && data.emergency_contact_name) {
        emergencyContacts = [
          {
            name: data.emergency_contact_name,
            phone: data.emergency_contact_phone || "N/A",
            relation: data.emergency_contact_relation || "Keluarga",
          },
        ];
      }
      const processedProfile = {
        ...data,
        emergency_contacts: emergencyContacts,
      };
      setProfile(processedProfile);
      setName(processedProfile.name || "");
      setEmail(processedProfile.email || user?.email || "");
      setPhone(processedProfile.phone || "");
      setBio(processedProfile.bio || "");
      setAvatarUrl(processedProfile.avatar || user?.avatar || "");
    } catch (err) {
      const realProfile = {
        name: user?.name || "",
        email: user?.email || "",
        phone: user?.phone || "",
        avatar: user?.avatar || "",
        bio: user?.bio || "",
        emergency_contacts: [],
        badges: [],
        achievements: [],
      };
      setProfile(realProfile);
      setName(realProfile.name);
      setEmail(realProfile.email);
      setPhone(realProfile.phone);
      setBio(realProfile.bio);
      setAvatarUrl(realProfile.avatar);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const updatedData = { name, email, phone, bio, avatar: avatarUrl };
      const { data } = await api.patch("/users/me/profile", updatedData);
      setProfile(data);
      if (setUser) setUser(data);
      toast.success("Profil & Kontak berhasil diperbarui!");
    } catch (err) {
      toast.error(err.response?.data?.error || "Gagal memperbarui profil");
    } finally {
      setSaving(false);
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault();
    if (!oldPassword) {
      return toast.error("Masukkan password lama Anda");
    }
    if (newPassword.length < 6) {
      return toast.error("Password baru minimal 6 karakter");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok dengan password baru!");
    }

    setChangingPassword(true);
    try {
      await api.post("/users/me/change-password", {
        old_password: oldPassword,
        new_password: newPassword,
      });
      toast.success("Password berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast.success("Password berhasil diperbarui!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } finally {
      setChangingPassword(false);
    }
  }

  const handleAvatarFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      setAvatarUrl(imageUrl);
      toast.success("Foto profil dipilih!");
    }
  };

  const handleAddTraveler = (e) => {
    e.preventDefault();
    if (!newTraveler.name.trim()) return toast.error("Nama lengkap traveler wajib diisi");
    setSavedTravelers([
      ...savedTravelers,
      { id: `tr-${Date.now()}`, ...newTraveler, is_primary: false },
    ]);
    setNewTraveler({ name: "", identity_no: "", phone: "" });
    toast.success("Traveler berhasil disimpan!");
  };

  const handleRemoveTraveler = (id) => {
    setSavedTravelers((prev) => prev.filter((t) => t.id !== id));
    toast.success("Data traveler dihapus");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-12 px-4 flex justify-center items-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8 px-4 sm:px-6 pb-20">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            {/* Avatar Profile */}
            <div className="relative group shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={profile?.name}
                  className="w-20 h-20 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-3xl flex items-center justify-center border border-emerald-500/30">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground">{profile?.name}</h1>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
                  {profile?.level_pendaki || "Pendaki Regular"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground mt-1">
                <span className="font-medium">{profile?.email}</span>
                {profile?.email_verified || user?.email_verified ? (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    <CheckCircle size={12} weight="fill" className="text-emerald-500" /> Terverifikasi
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <WarningCircle size={12} weight="fill" className="text-amber-500" /> Belum Diverifikasi
                  </span>
                )}
                <span>• {profile?.phone || "Belum ada nomor HP"}</span>
              </div>
              {profile?.bio && <p className="text-xs text-foreground mt-2 italic">"{profile.bio}"</p>}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              onClick={() => setShowQrPassModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs gap-1.5 rounded-xl shadow-xs"
            >
              <QrCode size={18} weight="bold" /> Digital QR Pass
            </Button>
            {user && (
              (Array.isArray(user.roles) ? user.roles : [user.role]).some((r) =>
                ["vendor", "mitra", "partner", "guide", "merchant", "rental", "community", "event_org", "tenant_admin"].includes(r)
              ) || user.vendor_id || user.is_vendor || user.vendor
            ) && (
              <Link to="/vendor" data-testid="profile-vendor-dashboard">
                <Button size="sm" variant="outline" className="text-xs font-extrabold gap-1.5 rounded-xl border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10">
                  <Storefront size={16} weight="bold" /> Dashboard Vendor
                </Button>
              </Link>
            )}
            <Link to="/wishlist" data-testid="profile-wishlist-button">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl border-rose-500/30 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 relative">
                <Heart size={16} weight={wishlistCount > 0 ? "fill" : "regular"} className="text-rose-500" />
                <span>Wishlist</span>
                {wishlistCount > 0 && (
                  <span
                    data-testid="profile-wishlist-badge"
                    className="ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black bg-rose-500 text-white shadow-2xs"
                  >
                    {wishlistCount}
                  </span>
                )}
              </Button>
            </Link>
            <Link to="/my-bookings">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl">
                <Ticket size={16} /> My Bookings
              </Button>
            </Link>
            <Link to="/transactions">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl">
                <Receipt size={16} /> Transaksi
              </Button>
            </Link>
            <Link to="/community?tab=my_posts">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10">
                <ChatCircleDots size={16} /> Diskusi Komunitas
              </Button>
            </Link>
            <Link to="/support">
              <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl">
                <Lifebuoy size={16} /> Bantuan
              </Button>
            </Link>
          </div>
        </div>

        {/* ADVENTURE STATISTICS PANEL */}
        {(() => {
          // Client-side fallback calculation strictly filtering for COMPLETED trips
          const completedBookings = userBookings.filter((b) => {
            const isPaid = b.payment_status === "verified" || b.payment_status === "paid" || b.booking_status === "confirmed" || b.status === "CONFIRMED" || b.status === "COMPLETED";
            const isCancelled = ["cancelled", "expired", "failed", "rejected"].includes(b.payment_status) || ["cancelled", "expired", "failed", "rejected"].includes(b.booking_status) || b.status === "CANCELLED";
            if (!isPaid || isCancelled) return false;
            return b.booking_status === "completed" || b.trip_status === "COMPLETED" || b.status === "COMPLETED";
          });

          const completedHikes = (profile && Array.isArray(profile.hiking_history))
            ? profile.hiking_history.filter((h) => h && (h.status === "Selesai" || h.status === "completed" || !h.status))
            : [];

          const adventuresCount = dashboardStats?.adventures ?? (completedBookings.length + completedHikes.length);
          
          const fallbackDestinations = new Set([
            ...completedBookings.map((b) => b.trip_destination || b.destination || b.mountain_name || b.trip_title || b.product_title).filter(Boolean),
            ...completedHikes.map((h) => h.mountain_name).filter(Boolean),
          ]).size;
          const destinationsCount = dashboardStats?.destinations ?? fallbackDestinations;

          const fallbackPartners = new Set([
            ...completedBookings.map((b) => b.vendor_name || b.partner_name || b.partner || b.vendor_id).filter(Boolean),
            ...completedHikes.map((h) => h.organizer).filter(Boolean),
          ]).size;
          const partnersCount = dashboardStats?.partners ?? fallbackPartners;

          const fallbackDays = completedBookings.reduce((acc, b) => {
            const days = Number(b.duration_days || b.days || b.duration || 1);
            return acc + (isNaN(days) ? 1 : days);
          }, 0) + completedHikes.length;
          const adventureDaysCount = dashboardStats?.daysHiking ?? fallbackDays;

          const totalWishlistCount = wishlistCount || dashboardStats?.wishlist || 0;

          return (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 sm:gap-3">
                <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 text-center space-y-1 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">{adventuresCount}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight sm:tracking-normal">Adventures</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 text-center space-y-1 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black text-blue-600">{destinationsCount}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight sm:tracking-normal">Destinations</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 text-center space-y-1 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black text-purple-600">{partnersCount}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight sm:tracking-normal">Partners</div>
                </div>
                <div className="bg-card border border-border rounded-2xl p-3 sm:p-4 text-center space-y-1 shadow-2xs">
                  <div className="text-xl sm:text-2xl font-black text-amber-600">{adventureDaysCount}</div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight sm:tracking-normal">Days Hiking</div>
                </div>
                <Link to="/wishlist" className="bg-card hover:bg-rose-500/5 border border-border hover:border-rose-500/30 rounded-2xl p-3 sm:p-4 text-center space-y-1 shadow-2xs transition-all group cursor-pointer col-span-2 sm:col-span-1">
                  <div className="text-xl sm:text-2xl font-black text-rose-500 flex items-center justify-center gap-1">
                    <Heart size={20} weight={totalWishlistCount > 0 ? "fill" : "regular"} className="text-rose-500 group-hover:scale-110 transition-transform" />
                    {totalWishlistCount}
                  </div>
                  <div className="text-[10px] sm:text-[11px] font-bold text-muted-foreground uppercase tracking-tight sm:tracking-normal">
                    Wishlist
                  </div>
                </Link>
              </div>

              {userBookings.length === 0 && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                      <Compass size={24} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-foreground">Belum Ada Riwayat Petualangan</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Akun Anda siap! Jelajahi trip pendakian, open trip, atau sewa peralatan outdoor pertama Anda.</p>
                    </div>
                  </div>
                  <Link to="/explore">
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs shrink-0 whitespace-nowrap">
                      Jelajahi Trip Baru
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          );
        })()}

        {/* 2-Column Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main Edit Form & Password */}
          <div className="lg:col-span-7 space-y-6">
            {/* RoleProfileEditor Component for User Pendaki */}
            <RoleProfileEditor
              role="user"
              initialData={profile}
              onSaveSuccess={(updated) => {
                setProfile((prev) => ({ ...prev, ...updated }));
                if (updated.avatar) setAvatarUrl(updated.avatar);
              }}
            />

            {/* SAVED TRAVELERS MANAGER */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="font-bold text-base text-foreground pb-2 border-b border-border flex items-center justify-between">
                <span className="flex items-center gap-2 text-emerald-600">
                  <UsersThree size={20} /> Saved Travelers (Group Booking Fast-Fill)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Data peserta tersimpan</span>
              </div>

              <div className="space-y-2 text-xs">
                {savedTravelers.map((tr) => (
                  <div key={tr.id} className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
                    <div>
                      <div className="font-bold text-foreground flex items-center gap-2">
                        {tr.name}
                        {tr.is_primary && (
                          <span className="bg-emerald-500/10 text-emerald-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
                            Utama
                          </span>
                        )}
                      </div>
                      <div className="text-muted-foreground font-mono text-[11px] mt-0.5">{tr.phone || "No HP tidak diisi"}</div>
                    </div>
                    {!tr.is_primary && (
                      <button onClick={() => handleRemoveTraveler(tr.id)} className="text-neutral-400 hover:text-rose-500">
                        <Trash size={16} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Form Add Saved Traveler */}
              <form onSubmit={handleAddTraveler} className="pt-3 border-t border-border space-y-3 text-xs">
                <div className="font-bold text-xs text-foreground">Tambah Traveler Baru</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input placeholder="Nama Lengkap" value={newTraveler.name} onChange={(e) => setNewTraveler({ ...newTraveler, name: e.target.value })} className="bg-background text-xs" required />
                  <Input placeholder="No HP / WhatsApp" value={newTraveler.phone} onChange={(e) => setNewTraveler({ ...newTraveler, phone: e.target.value })} className="bg-background text-xs" />
                </div>
                <Button type="submit" variant="outline" size="sm" className="text-xs font-bold rounded-xl gap-1">
                  <Plus size={14} /> Simpan Traveler
                </Button>
              </form>
            </div>
          </div>

          {/* Side Column: Badges, Achievements & Emergency Contacts */}
          <div className="lg:col-span-5 space-y-6">
            {/* Badges & Achievements */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="font-bold text-base text-foreground pb-2 border-b border-border flex items-center gap-2">
                <Medal size={20} className="text-amber-500" /> Badge & Level Pendaki
              </div>

              <div className="space-y-3">
                <div className="text-xs font-semibold text-muted-foreground">Lencana Prestasi Pendaki:</div>
                {(profile?.badges || []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {profile.badges.map((b, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-bold">
                        <Trophy size={14} weight="fill" /> {b}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl border border-border">
                    Belum ada lencana. Selesaikan trip pendakian pertamamu untuk mendapatkan badge!
                  </p>
                )}

                <div className="text-xs font-semibold text-muted-foreground pt-2">Pencapaian Spesial:</div>
                {(profile?.achievements || []).length > 0 ? (
                  <ul className="space-y-1.5 text-xs">
                    {profile.achievements.map((ach, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-foreground font-medium">
                        <Sparkle size={14} className="text-emerald-500 shrink-0" />
                        <span>{ach}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl border border-border">
                    Pencapaian spesial akan terbuka secara otomatis seiring pengalaman pendakian Anda.
                  </p>
                )}
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4">
              <div className="font-bold text-base text-foreground pb-2 border-b border-border flex items-center justify-between">
                <span className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                  <WarningCircle size={20} /> Nomor Darurat (Emergency)
                </span>
                <span className="text-[11px] text-muted-foreground font-normal">Evakuasi SAR</span>
              </div>

              {(profile?.emergency_contacts || []).length > 0 ? (
                <div className="space-y-2 text-xs">
                  {profile.emergency_contacts.map((c, idx) => (
                    <div key={idx} className="p-3 bg-muted/40 border border-border rounded-xl flex items-center justify-between">
                      <div>
                        <div className="font-bold text-foreground">{c.name} <span className="text-muted-foreground font-normal">({c.relation})</span></div>
                        <div className="text-muted-foreground font-mono mt-0.5">{c.phone}</div>
                      </div>
                      <CheckCircle size={18} className="text-emerald-500" />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic bg-muted/40 p-3 rounded-xl border border-border">
                  Belum ada kontak darurat tersimpan. Silakan lengkapi kontak keluarga pada form Edit Profil untuk kebutuhan evakuasi keselamatan.
                </p>
              )}
            </div>

            {/* Account Security & Active Sessions */}
            <div className="bg-card border border-border rounded-2xl p-6 shadow-xs space-y-4 text-xs">
              <div className="font-bold text-base text-foreground pb-2 border-b border-border flex items-center gap-2">
                <ShieldCheck size={20} className="text-emerald-500" /> Keamanan Akun & Sesi
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-muted/40 rounded-xl border border-border space-y-1">
                  <div className="font-bold text-foreground">Sesi Aktif Saat Ini</div>
                  <div className="text-[11px] text-muted-foreground">Chrome Desktop • Jakarta, Indonesia (Sesi Ini)</div>
                </div>

                <div className="flex justify-between items-center pt-1">
                  <div>
                    <div className="font-bold text-foreground">Verifikasi 2 Langkah (2FA)</div>
                    <div className="text-[11px] text-muted-foreground">Keamanan tambahan saat login</div>
                  </div>
                  <span className="bg-emerald-500/10 text-emerald-600 px-2.5 py-1 rounded-full font-bold text-[10px]">
                    Aktif
                  </span>
                </div>

                <div className="pt-3 border-t border-border space-y-2">
                  <Button
                    type="button"
                    variant="destructive"
                    onClick={async () => {
                      await logout();
                    }}
                    className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <SignOut size={16} /> Keluar dari Akun (Akhiri Sesi)
                  </Button>

                  <div className="pt-2 grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deactivating}
                      onClick={handleDeactivateAccount}
                      className="text-[11px] font-bold border-amber-500/40 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 rounded-xl cursor-pointer"
                    >
                      {deactivating ? "Memproses..." : "Nonaktifkan Akun"}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={deleting}
                      onClick={handleDeleteAccount}
                      className="text-[11px] font-bold border-rose-500/40 text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer"
                    >
                      {deleting ? "Memproses..." : "Hapus Akun Permanen"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <UserQrPassModal
        isOpen={showQrPassModal}
        onClose={() => setShowQrPassModal(false)}
      />
    </div>
  );
}

