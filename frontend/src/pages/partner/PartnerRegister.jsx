import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ValidatedInput, FormCompletionBanner } from "@/components/vendor/ValidatedInput";
import { useAutoSave, AutoSaveBadge } from "@/components/vendor/AutoSaveIndicator";
import {
  Storefront,
  Buildings,
  CheckCircle,
  ShieldCheck,
  ArrowRight,
  LockKey,
  User,
  EnvelopeSimple,
  Phone,
  Bank,
  Sparkle,
  Globe,
  RocketLaunch,
  Check,
} from "@phosphor-icons/react";

const MARKETPLACE_12_CATEGORIES = [
  { key: "open-trip", label: "Open Trip", desc: "Paket trip gabungan hemat dengan jadwal terstruktur" },
  { key: "private-trip", label: "Private Trip", desc: "Tour kustom eksklusif khusus grup & keluarga" },
  { key: "guide", label: "Guide", desc: "Pemandu gunung & lokasi wisata tersertifikasi APGI/BNSP" },
  { key: "porter", label: "Porter", desc: "Jasa angkut logistik & perlengkapan pendakian" },
  { key: "rental-gear", label: "Rental Gear", desc: "Sewa tenda, carrier, kompor, & alat camping" },
  { key: "basecamp", label: "Basecamp", desc: "Pos registrasi resmi, SIMAKSI, & rest area pendaki" },
  { key: "camping-ground", label: "Camping Ground", desc: "Spot kemping, glamping, & lokasi berkemah" },
  { key: "homestay", label: "Homestay", desc: "Akomodasi penginapan lokal ramah pendaki" },
  { key: "shuttle", label: "Shuttle", desc: "Layanan shuttle travel antar-jemput stasiun/bandara" },
  { key: "transportasi", label: "Transportasi", desc: "Sewa Jeep 4x4, pick-up bak, & kendaraan offroad" },
  { key: "wisata-alam", label: "Wisata Alam", desc: "Ekowisata, tur air terjun, & ekskursi kawah" },
  { key: "event", label: "Event", desc: "Outdoor festival, clean-up action, & trail run" },
];

export default function PartnerRegister() {
  const nav = useNavigate();
  const { setUser } = useAuth();
  const [activeTab, setActiveTab] = useState("vendor"); // 'vendor' | 'tenant'
  const [submitting, setSubmitting] = useState(false);

  // Vendor Form State
  const [vendorForm, setVendorForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    brand_name: "",
    tagline: "",
    description: "",
    types: ["open-trip"],
    city: "Malang",
    province: "Jawa Timur",
    nik: "",
    bank_name: "BCA",
    bank_account_number: "",
    bank_account_holder: "",
  });

  const [showVendorPass, setShowVendorPass] = useState(false);
  const [showVendorConfirmPass, setShowVendorConfirmPass] = useState(false);

  // Tenant Form State
  const [tenantForm, setTenantForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    organization_name: "",
    slug: "",
    plan: "pro",
    brand_color: "#10B981",
    categories: ["open-trip", "guide", "rental-gear"],
  });

  const [showTenantPass, setShowTenantPass] = useState(false);
  const [showTenantConfirmPass, setShowTenantConfirmPass] = useState(false);

  const [slugChecking, setSlugChecking] = useState(false);
  const [slugStatus, setSlugStatus] = useState(null);

  // Pre-fill form if user/vendor is already logged in
  useEffect(() => {
    let active = true;
    async function loadCurrent() {
      try {
        const [vRes, uRes] = await Promise.allSettled([
          api.get("/vendor/me"),
          api.get("/auth/me")
        ]);
        const vData = vRes.status === "fulfilled" ? vRes.value?.data : null;
        const uData = uRes.status === "fulfilled" ? uRes.value?.data : null;

        if (active) {
          if (vData) {
            setVendorForm((prev) => ({
              ...prev,
              name: uData?.name || vData.brand_name || prev.name,
              email: vData.contact?.email || uData?.email || prev.email,
              phone: vData.contact?.phone || uData?.phone || prev.phone,
              brand_name: vData.brand_name || prev.brand_name,
              tagline: vData.tagline || prev.tagline,
              description: vData.description || prev.description,
              types: Array.isArray(vData.types) && vData.types.length ? vData.types : prev.types,
              city: vData.legal?.city || prev.city,
              province: vData.legal?.province || prev.province,
              nik: vData.legal?.nik || prev.nik,
              bank_name: vData.payout?.bank_name || prev.bank_name,
              bank_account_number: vData.payout?.account_number || prev.bank_account_number,
              bank_account_holder: vData.payout?.account_holder || prev.bank_account_holder,
            }));
          } else if (uData) {
            setVendorForm((prev) => ({
              ...prev,
              name: uData.name || prev.name,
              email: uData.email || prev.email,
              phone: uData.phone || prev.phone,
              brand_name: uData.name || prev.brand_name,
              bank_account_holder: uData.name || prev.bank_account_holder,
            }));
          }

          if (!vData) {
            try {
              const draftRaw = localStorage.getItem("trx_partner_vendor_draft");
              if (draftRaw) {
                const draft = JSON.parse(draftRaw);
                if (draft && typeof draft === "object") {
                  setVendorForm((prev) => ({ ...prev, ...draft }));
                }
              }
            } catch {
              // ignore
            }
          }
        }
      } catch {
        // Fallback
      }
    }
    loadCurrent();
    return () => { active = false; };
  }, []);

  const handleAutoSavePartnerVendor = async (formData) => {
    if (!formData.brand_name && !formData.email) return;
    try {
      await api.patch("/vendor/me", formData);
    } catch {
      // Local storage backup handles offline draft
    }
  };

  const { status: partnerVendorAutoSaveStatus, lastSavedAt: partnerVendorAutoSaveTime } = useAutoSave({
    data: vendorForm,
    onSave: handleAutoSavePartnerVendor,
    storageKey: "trx_partner_vendor_draft",
    debounceMs: 600,
    enabled: activeTab === "vendor",
  });

  // Check Slug availability for Tenant
  useEffect(() => {
    if (activeTab !== "tenant") {
      setSlugStatus(null);
      return;
    }
    const targetSlug = tenantForm.slug;
    if (!targetSlug || targetSlug.length < 3) {
      setSlugStatus(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSlugChecking(true);
      try {
        const { data } = await api.get(`/partner/check-slug?slug=${encodeURIComponent(targetSlug)}&type=tenant`);
        setSlugStatus(data);
      } catch {
        setSlugStatus(null);
      } finally {
        setSlugChecking(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [activeTab, tenantForm.slug]);

  function setV(k, val) {
    setVendorForm((prev) => ({ ...prev, [k]: val }));
  }

  function setT(k, val) {
    setTenantForm((prev) => ({ ...prev, [k]: val }));
  }

  function toggleVendorType(key) {
    setVendorForm((prev) => {
      const exists = prev.types.includes(key);
      const updated = exists ? prev.types.filter((t) => t !== key) : [...prev.types, key];
      return { ...prev, types: updated.length ? updated : ["open-trip"] };
    });
  }

  function toggleTenantCategory(key) {
    setTenantForm((prev) => {
      const exists = prev.categories.includes(key);
      const updated = exists ? prev.categories.filter((c) => c !== key) : [...prev.categories, key];
      return { ...prev, categories: updated.length ? updated : ["open-trip"] };
    });
  }

  async function handleRegisterVendor(e) {
    e.preventDefault();
    const nameTrimmed = vendorForm.name.trim();
    const brandTrimmed = vendorForm.brand_name.trim();
    const emailTrimmed = vendorForm.email.trim();
    const phoneTrimmed = vendorForm.phone.trim();
    const password = vendorForm.password;
    const confirmPassword = vendorForm.confirmPassword;

    if (!nameTrimmed) return toast.error("Nama penanggung jawab wajib diisi");
    if (nameTrimmed.length < 3) return toast.error("Nama penanggung jawab minimal 3 karakter");

    if (!emailTrimmed) return toast.error("Email resmi akun wajib diisi");
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) return toast.error("Format email resmi tidak valid (contoh: budi@organizer.id)");

    if (!password) return toast.error("Password akun wajib diisi");
    if (password.length < 6) return toast.error("Password minimal 6 karakter");

    if (confirmPassword !== password) {
      return toast.error("Konfirmasi password tidak cocok dengan password akun!");
    }

    if (!phoneTrimmed) return toast.error("Nomor WhatsApp / HP wajib diisi");
    const phoneClean = phoneTrimmed.replace(/[\s\-]/g, "");
    const phoneRegex = /^(\+?62|0)8[1-9][0-9]{6,11}$/;
    if (!phoneRegex.test(phoneClean)) return toast.error("Nomor WhatsApp / HP tidak valid (contoh: 081234567890)");

    if (!brandTrimmed) return toast.error("Nama brand / organizer wajib diisi");
    if (brandTrimmed.length < 3) return toast.error("Nama brand / organizer minimal 3 karakter");

    if (vendorForm.bank_account_number) {
      const bankAccClean = vendorForm.bank_account_number.trim().replace(/[\s\-]/g, "");
      if (!/^[0-9]{5,25}$/.test(bankAccClean)) {
        return toast.error("Nomor rekening harus berupa angka (minimal 5 digit)");
      }
    }

    if (vendorForm.bank_account_holder) {
      if (vendorForm.bank_account_holder.trim().length < 3) {
        return toast.error("Nama pemilik rekening minimal 3 karakter");
      }
    }

    setSubmitting(true);
    const toastId = toast.loading("Mengirim formulir pendaftaran vendor...");
    try {
      localStorage.removeItem("trexio-has-logged-out");
      // Omit confirmPassword from API request body
      const { confirmPassword: _discarded, ...vendorPayload } = vendorForm;
      const { data } = await api.post("/partner/register-vendor", vendorPayload);
      const token = data?.access_token || data?.token;
      if (token) {
        localStorage.setItem("trexio-token", token);
      }
      toast.dismiss(toastId);
      toast.success(data.message || "Registrasi Vendor Berhasil! Mengalihkan ke Dashboard Vendor...");
      if (data.user) setUser(data.user);
      nav(data.redirect_url || "/vendor");
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = formatApiError(err.response?.data?.detail) || "Gagal melakukan registrasi vendor";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRegisterTenant(e) {
    e.preventDefault();
    if (!tenantForm.organization_name.trim()) return toast.error("Nama perusahaan / tenant wajib diisi");
    if (!tenantForm.email.trim() || !tenantForm.password.trim()) return toast.error("Email dan password akun wajib diisi");
    if (tenantForm.password.length < 6) return toast.error("Password minimal 6 karakter");
    if (tenantForm.confirmPassword !== tenantForm.password) {
      return toast.error("Konfirmasi password tidak cocok dengan password akun!");
    }

    setSubmitting(true);
    const toastId = toast.loading("Mengirim formulir pendaftaran tenant white-label...");
    try {
      localStorage.removeItem("trexio-has-logged-out");
      // Omit confirmPassword from API request body
      const { confirmPassword: _discarded, ...tenantPayload } = tenantForm;
      const { data } = await api.post("/partner/register-tenant", tenantPayload);
      const token = data?.access_token || data?.token;
      if (token) {
        localStorage.setItem("trexio-token", token);
      }
      toast.dismiss(toastId);
      toast.success(data.message || "Registrasi Tenant Berhasil! Mengalihkan ke Admin Portal...");
      if (data.user) setUser(data.user);
      nav(data.redirect_url || "/admin");
    } catch (err) {
      toast.dismiss(toastId);
      const errMsg = formatApiError(err.response?.data?.detail) || "Gagal melakukan registrasi tenant";
      toast.error(errMsg);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header Hero Banner */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <Sparkle size={14} weight="fill" /> Portal Pendaftaran Mitra & Tenant TREXIO
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
            Kembangkan Bisnis Perjalanan & Outdoor Anda Bersama TREXIO
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Daftarkan bisnis Anda sebagai **Mitra Vendor** penjual open trip/outdoor gear atau **Tenant White-Label** untuk memiliki platform pemesanan travel dengan nama brand sendiri.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center">
          <div className="bg-muted p-1.5 rounded-2xl border border-border inline-flex gap-1.5 shadow-inner">
            <button
              type="button"
              onClick={() => setActiveTab("vendor")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "vendor"
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Storefront size={18} weight={activeTab === "vendor" ? "fill" : "regular"} className="text-emerald-500" />
              <span>Mitra Vendor & Organizer</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("tenant")}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${
                activeTab === "tenant"
                  ? "bg-background text-foreground shadow-sm border border-border"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Buildings size={18} weight={activeTab === "tenant" ? "fill" : "regular"} className="text-blue-500" />
              <span>Mitra Tenant White-Label</span>
            </button>
          </div>
        </div>

        {/* Registration Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Form Side */}
          <div className="lg:col-span-7 bg-card border border-border rounded-2xl p-6 sm:p-8 shadow-sm">
            {activeTab === "vendor" ? (
              <form onSubmit={handleRegisterVendor} className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                      <Storefront className="text-emerald-500" size={24} /> Form Registrasi Vendor / Organizer
                    </h2>
                    <p className="text-xs text-muted-foreground mt-1">
                      Lengkapi data di bawah ini untuk langsung membuka toko & mengelola produk paket trip di TREXIO.
                    </p>
                  </div>
                  <AutoSaveBadge status={partnerVendorAutoSaveStatus} lastSavedAt={partnerVendorAutoSaveTime} testid="partner-vendor-autosave-badge" />
                </div>

                <FormCompletionBanner
                  validCount={[
                    vendorForm.name.trim().length >= 3,
                    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vendorForm.email.trim()),
                    vendorForm.password.length >= 6,
                    vendorForm.phone.replace(/\D/g, "").length >= 9,
                    vendorForm.brand_name.trim().length >= 3,
                    vendorForm.types.length >= 1,
                  ].filter(Boolean).length}
                  totalCount={6}
                  label="Kelengkapan Formulir Vendor"
                />

                {/* Section 1: Akun Pemilik */}
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    1. Informasi Akun & Pengelola
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <ValidatedInput
                      label="Nama Lengkap Penanggung Jawab"
                      required
                      icon={User}
                      placeholder="Contoh: Budi Santoso"
                      value={vendorForm.name}
                      onChange={(val) => setV("name", val)}
                      minLength={3}
                      maxLength={80}
                      helperText="Minimal 3 karakter"
                      testid="vendor-register-name"
                    />

                    <ValidatedInput
                      label="Email Resmi Akun"
                      type="email"
                      required
                      icon={EnvelopeSimple}
                      placeholder="budi@organizer.id"
                      value={vendorForm.email}
                      onChange={(val) => setV("email", val)}
                      helperText="Format email aktif untuk verifikasi & notifikasi"
                      testid="vendor-register-email"
                    />

                    <ValidatedInput
                      label="Password Akun Mitra"
                      type="password"
                      required
                      icon={LockKey}
                      placeholder="••••••••"
                      value={vendorForm.password}
                      onChange={(val) => setV("password", val)}
                      minLength={6}
                      helperText="Minimal 6 karakter"
                      testid="vendor-register-password"
                    />

                    <ValidatedInput
                      label="Nomor WhatsApp / HP"
                      type="tel"
                      required
                      icon={Phone}
                      placeholder="081234567890"
                      value={vendorForm.phone}
                      onChange={(val) => setV("phone", val)}
                      minLength={9}
                      maxLength={16}
                      helperText="Contoh: 081234567890 (9-15 digit)"
                      testid="vendor-register-phone"
                    />
                  </div>
                </div>

                {/* Section 2: Profil Brand */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    2. Profil Brand & Usaha
                  </div>

                  <div className="space-y-4 text-xs">
                    <ValidatedInput
                      label="Nama Brand / Tour Organizer"
                      required
                      icon={Storefront}
                      placeholder="Contoh: Bromo Explorer Tour"
                      value={vendorForm.brand_name}
                      onChange={(val) => setV("brand_name", val)}
                      minLength={3}
                      maxLength={60}
                      helperText="Nama usaha / brand travel Anda (minimal 3 karakter)"
                      testid="vendor-register-brand-name"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <ValidatedInput
                        label="Tagline Singkat"
                        placeholder="Spesialis Open Trip Bromo & Semeru"
                        value={vendorForm.tagline}
                        onChange={(val) => setV("tagline", val)}
                        helperText="Tagline promosi toko Anda"
                        testid="vendor-register-tagline"
                      />

                      <ValidatedInput
                        label="Kota Operasional"
                        placeholder="Malang / Surabaya / Jakarta"
                        value={vendorForm.city}
                        onChange={(val) => setV("city", val)}
                        helperText="Lokasi domisili usaha Anda"
                        testid="vendor-register-city"
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Kategori Layanan Utama (12 Kategori Marketplace)</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Pilih satu atau beberapa kategori layanan yang Anda sediakan:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MARKETPLACE_12_CATEGORIES.map((vt) => {
                          const isSelected = vendorForm.types.includes(vt.key);
                          return (
                            <button
                              key={vt.key}
                              type="button"
                              onClick={() => toggleVendorType(vt.key)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-emerald-500 bg-emerald-500/10 text-foreground font-bold shadow-sm"
                                  : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                                <span>{vt.label}</span>
                                {isSelected && <Check size={14} className="text-emerald-500 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{vt.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Section 3: Rekening Payout */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                    3. Rekening Payout & Pencairan Hasil Penjualan
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <ValidatedInput
                      label="Nama Bank"
                      isSelect
                      value={vendorForm.bank_name}
                      onChange={(val) => setV("bank_name", val)}
                      options={[
                        { key: "BCA", label: "Bank BCA" },
                        { key: "Mandiri", label: "Bank Mandiri" },
                        { key: "BNI", label: "Bank BNI" },
                        { key: "BRI", label: "Bank BRI" },
                        { key: "Permata", label: "Bank Permata" },
                      ]}
                      testid="vendor-register-bank-name"
                    />

                    <ValidatedInput
                      label="Nomor Rekening"
                      icon={Bank}
                      placeholder="1234567890"
                      inputMode="numeric"
                      value={vendorForm.bank_account_number}
                      onChange={(val) => setV("bank_account_number", val)}
                      validator={(val) => {
                        const digits = val.replace(/\D/g, "");
                        if (!val.trim()) return { isValid: true, message: "Opsional" };
                        if (digits.length < 5) return { isValid: false, message: "Nomor rekening minimal 5 digit angka" };
                        return { isValid: true, message: "Nomor rekening valid & tersimpan" };
                      }}
                      testid="vendor-register-bank-account"
                    />

                    <ValidatedInput
                      label="Nama Pemilik Rekening"
                      placeholder="Sesuai buku tabungan"
                      value={vendorForm.bank_account_holder}
                      onChange={(val) => setV("bank_account_holder", val)}
                      validator={(val) => {
                        if (!val.trim()) return { isValid: true, message: "Opsional" };
                        if (val.trim().length < 3) return { isValid: false, message: "Minimal 3 karakter" };
                        return { isValid: true, message: "Nama pemilik rekening valid" };
                      }}
                      testid="vendor-register-bank-holder"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Membuat Akun Vendor...
                    </>
                  ) : (
                    <>
                      Daftar Mitra Vendor Sekarang <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Sudah memiliki akun mitra?{" "}
                  <Link to="/partner/login" className="text-emerald-600 font-bold hover:underline">
                    Login Portal Mitra Di Sini
                  </Link>
                </p>
              </form>
            ) : (
              /* Tenant White-Label Form */
              <form onSubmit={handleRegisterTenant} className="space-y-6">
                <div>
                  <h2 className="text-xl font-black text-foreground flex items-center gap-2">
                    <Buildings className="text-blue-500" size={24} /> Form Registrasi Tenant White-Label
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    Buat infrastruktur platform open trip & travel lengkap dengan domain, branding, dan manajemen inventaris sendiri.
                  </p>
                </div>

                {/* Section 1: Akun Pemilik */}
                <div className="space-y-4 pt-2 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    1. Informasi Akun Tenant Admin
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Nama Admin / Owner *</Label>
                      <Input
                        placeholder="Contoh: Rian Utama"
                        value={tenantForm.name}
                        onChange={(e) => setT("name", e.target.value)}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Email Perusahaan / Admin *</Label>
                      <Input
                        type="email"
                        placeholder="admin@travelkita.id"
                        value={tenantForm.email}
                        onChange={(e) => setT("email", e.target.value)}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Password Akun *</Label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        value={tenantForm.password}
                        onChange={(e) => setT("password", e.target.value)}
                        className="bg-background"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Nomor Telepon Kantor / WA *</Label>
                      <Input
                        placeholder="081234567890"
                        value={tenantForm.phone}
                        onChange={(e) => setT("phone", e.target.value)}
                        className="bg-background"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: Organisasi & Subdomain */}
                <div className="space-y-4 pt-4 border-t border-border">
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    2. Identitas Platform & Subdomain
                  </div>

                  <div className="space-y-4 text-xs">
                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Nama Perusahaan / Travel Brand *</Label>
                      <Input
                        placeholder="Contoh: Malang Travel Network"
                        value={tenantForm.organization_name}
                        onChange={(e) => setT("organization_name", e.target.value)}
                        className="bg-background font-bold text-sm"
                        required
                      />
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Custom Subdomain / Slug Tenant *</Label>
                      <div className="flex items-center gap-1">
                        <Input
                          placeholder="malangtravel"
                          value={tenantForm.slug}
                          onChange={(e) => setT("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                          className="bg-background font-mono text-xs"
                        />
                        <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">.trexio.id</span>
                      </div>
                      {slugChecking && (
                        <div className="text-[11px] text-amber-500 mt-1">Memeriksa ketersediaan domain...</div>
                      )}
                      {slugStatus && (
                        <div className={`text-[11px] mt-1 font-semibold ${slugStatus.available ? "text-emerald-600" : "text-rose-500"}`}>
                          {slugStatus.available ? "✓ Subdomain tersedia" : `✗ ${slugStatus.reason}`}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <Label className="font-semibold text-xs mb-1 block">Pilihan Paket Tenant</Label>
                        <select
                          value={tenantForm.plan}
                          onChange={(e) => setT("plan", e.target.value)}
                          className="w-full h-9 px-3 rounded-md border border-border bg-background text-xs font-bold"
                        >
                          <option value="free">Free Starter (1 Subdomain, Max 5 Vendor)</option>
                          <option value="pro">Pro Travel Enterprise (3 Custom Domain, Max 50 Vendor)</option>
                          <option value="enterprise">Unlimited Enterprise Network</option>
                        </select>
                      </div>

                      <div>
                        <Label className="font-semibold text-xs mb-1 block">Warna Utama Brand Branding</Label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={tenantForm.brand_color}
                            onChange={(e) => setT("brand_color", e.target.value)}
                            className="h-9 w-12 rounded border border-border bg-background p-1 cursor-pointer"
                          />
                          <span className="font-mono text-xs uppercase text-muted-foreground">{tenantForm.brand_color}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="font-semibold text-xs mb-1 block">Kategori Didukung Platform Tenant (Pilih Kategori)</Label>
                      <p className="text-[11px] text-muted-foreground mb-2">Modul & kategori yang akan diaktifkan di platform white-label Anda:</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {MARKETPLACE_12_CATEGORIES.map((cat) => {
                          const isSelected = tenantForm.categories.includes(cat.key);
                          return (
                            <button
                              key={cat.key}
                              type="button"
                              onClick={() => toggleTenantCategory(cat.key)}
                              className={`p-2.5 rounded-xl border text-left transition-all ${
                                isSelected
                                  ? "border-blue-500 bg-blue-500/10 text-foreground font-bold shadow-sm"
                                  : "border-border bg-background hover:bg-muted/50 text-muted-foreground"
                              }`}
                            >
                              <div className="text-xs font-bold text-foreground flex items-center justify-between">
                                <span>{cat.label}</span>
                                {isSelected && <Check size={14} className="text-blue-500 shrink-0" />}
                              </div>
                              <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-1">{cat.desc}</p>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Membuat Tenant Platform...
                    </>
                  ) : (
                    <>
                      Buat Platform Tenant Sekarang <ArrowRight size={18} weight="bold" />
                    </>
                  )}
                </Button>

                <p className="text-[11px] text-center text-muted-foreground">
                  Sudah memiliki akun tenant admin?{" "}
                  <Link to="/partner/login" className="text-blue-600 font-bold hover:underline">
                    Login Dashboard Tenant
                  </Link>
                </p>
              </form>
            )}
          </div>

          {/* Side Info & Benefits */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-4">
              <div className="font-bold text-sm text-foreground pb-3 border-b border-border flex items-center justify-between">
                <span>Keuntungan Bermitra di TREXIO</span>
                <RocketLaunch size={20} className="text-emerald-500" />
              </div>

              {activeTab === "vendor" ? (
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <Storefront size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Akses Langsung Ribuan Traveler</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Tampilkan trip Anda di marketplace utama TREXIO dan jangkau wisatawan lokal & mancanegara secara gratis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <ShieldCheck size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Pembayaran melalui Trexio Dijamin Aman</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Semua transaksi terintegrasi dengan Trexio Secure Payment (Virtual Account, GoPay, & QRIS). Payout dicairkan langsung ke rekening Anda.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 shrink-0 mt-0.5">
                      <Bank size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Manajemen Pesanan & Manifes Peserta</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Kelola data peserta, tanggal keberangkatan, serta kapasitas kursi secara real-time dari Dashboard Vendor.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                      <Globe size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">White-Label & Custom Subdomain</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Punya brand travel sendiri? Gunakan domain & tema warna resmi organisasi Anda dengan engine backend TREXIO.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                      <Buildings size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Multi-Vendor & Sub-Organizers</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Kelola puluhan vendor local partner di bawah jaringan tenant Anda dengan pembagian komisi otomatis.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-600 shrink-0 mt-0.5">
                      <Sparkle size={18} weight="fill" />
                    </div>
                    <div>
                      <h4 className="font-bold text-foreground">Analytics & Financial Report</h4>
                      <p className="text-muted-foreground mt-0.5 leading-relaxed">
                        Pantau total reservasi, gross merchandise value, dan performa setiap trip dari Dashboard Admin Tenant.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Direct Login Card */}
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-5 text-xs text-foreground space-y-3">
              <div className="flex items-center gap-2 font-bold text-emerald-700 dark:text-emerald-400">
                <ShieldCheck size={20} /> Login Cepat Akun Mitra
              </div>
              <p className="text-muted-foreground leading-relaxed">
                Sudah pernah mendaftar sebagai vendor atau tenant? Masuk ke portal login terpadu untuk mengakses dashboard Anda.
              </p>
              <Link to="/partner/login" className="block w-full">
                <Button variant="outline" className="w-full text-xs font-bold border-emerald-500/30 hover:bg-emerald-500/20">
                  Buka Portal Login Mitra →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
