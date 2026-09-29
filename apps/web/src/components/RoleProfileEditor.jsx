import React, { useState, useEffect, useRef, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ActivityLog from "@/components/ActivityLog";
import ActiveSessionsManager from "@/components/ActiveSessionsManager";
import { useAutoSave, AutoSaveBadge } from "@/components/vendor/AutoSaveIndicator";
import {
  UserCircle,
  Camera,
  FloppyDisk,
  CheckCircle,
  WarningCircle,
  Trash,
  UploadSimple,
  Key,
  Eye,
  EyeSlash,
  Lock,
  Building,
  ShieldCheck,
  Storefront,
  Heartbeat,
  Phone,
  EnvelopeSimple,
  MapPin,
  Briefcase,
  Bank,
  Clock,
  FirstAid,
  Sparkle,
  Check,
  X,
} from "@phosphor-icons/react";

export default function RoleProfileEditor({ role = "user", initialData, onSaveSuccess }) {
  const { user, setUser } = useAuth();
  const fileInputRef = useRef(null);

  // Universal State
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [bio, setBio] = useState("");

  // Upload state
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState("");

  // Password Confirmation State
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Role Specific States
  // 1. Super Admin
  const [jobTitle, setJobTitle] = useState("");
  const [department, setDepartment] = useState("");
  const [directPhone, setDirectPhone] = useState("");
  const [securityNotes, setSecurityNotes] = useState("");

  // 2. Admin Tenant
  const [tenantName, setTenantName] = useState("");
  const [supportPhone, setSupportPhone] = useState("");
  const [tenantAddress, setTenantAddress] = useState("");
  const [operatingHours, setOperatingHours] = useState("");
  const [operationalNotes, setOperationalNotes] = useState("");

  // 3. Vendor / Partner
  const [businessName, setBusinessName] = useState("");
  const [businessCategory, setBusinessCategory] = useState("Persewaan Alat");
  const [picName, setPicName] = useState("");
  const [picPhone, setPicPhone] = useState("");
  const [bankName, setBankName] = useState("BCA");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankAccountHolder, setBankAccountHolder] = useState("");
  const [serviceArea, setServiceArea] = useState("");
  const [coverImage, setCoverImage] = useState("");

  // 4. User Pendaki
  const [emergencyContactName, setEmergencyContactName] = useState("");
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("");
  const [emergencyContactRelation, setEmergencyContactRelation] = useState("Keluarga");
  const [bloodType, setBloodType] = useState("O+");
  const [originCity, setOriginCity] = useState("");
  const [medicalHistory, setMedicalHistory] = useState("");

  // General Status
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [logRefreshKey, setLogRefreshKey] = useState(0);

  // Email Verification States
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerifiedAt, setEmailVerifiedAt] = useState(null);
  const [resendingVerification, setResendingVerification] = useState(false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Real-time Password Strength Calculation
  const calculatePasswordStrength = (pass) => {
    if (!pass) {
      return {
        score: 0,
        label: "",
        color: "bg-muted",
        textColor: "text-muted-foreground",
        percent: 0,
        criteria: [
          { id: "length", label: "Minimal 8 karakter", met: false },
          { id: "lower", label: "Huruf kecil (a-z)", met: false },
          { id: "upper", label: "Huruf besar (A-Z)", met: false },
          { id: "number", label: "Angka (0-9)", met: false },
          { id: "special", label: "Karakter khusus (@$!%*?&)", met: false },
        ],
        metCount: 0,
      };
    }

    const criteria = [
      { id: "length", label: "Minimal 8 karakter", met: pass.length >= 8 },
      { id: "lower", label: "Huruf kecil (a-z)", met: /[a-z]/.test(pass) },
      { id: "upper", label: "Huruf besar (A-Z)", met: /[A-Z]/.test(pass) },
      { id: "number", label: "Angka (0-9)", met: /[0-9]/.test(pass) },
      { id: "special", label: "Karakter khusus (@$!%*?&)", met: /[^A-Za-z0-9]/.test(pass) },
    ];

    const metCount = criteria.filter((c) => c.met).length;

    let score = 1;
    let label = "Sangat Lemah";
    let color = "bg-rose-500";
    let textColor = "text-rose-600 dark:text-rose-400";
    let percent = 20;

    if (metCount === 2) {
      score = 2;
      label = "Lemah";
      color = "bg-orange-500";
      textColor = "text-orange-600 dark:text-orange-400";
      percent = 40;
    } else if (metCount === 3) {
      score = 3;
      label = "Sedang";
      color = "bg-amber-500";
      textColor = "text-amber-600 dark:text-amber-400";
      percent = 60;
    } else if (metCount === 4) {
      score = 4;
      label = "Kuat";
      color = "bg-emerald-500";
      textColor = "text-emerald-600 dark:text-emerald-400";
      percent = 80;
    } else if (metCount >= 5) {
      score = 5;
      label = "Sangat Kuat";
      color = "bg-emerald-600";
      textColor = "text-emerald-700 dark:text-emerald-300";
      percent = 100;
    }

    return { score, label, color, textColor, percent, criteria, metCount };
  };

  const passwordStrength = calculatePasswordStrength(newPassword);

  useEffect(() => {
    const data = initialData || user || {};
    setName(data.name || "");
    setEmail(data.email || "");
    setPhone(data.phone || "");
    setAvatar(data.avatar || "");
    setPreviewPhoto(data.avatar || "");
    setBio(data.bio || "");

    // Super Admin
    setJobTitle(data.job_title || "Lead System Architect");
    setDepartment(data.department || "Executive Platform Operations");
    setDirectPhone(data.direct_phone || data.contact?.phone || data.phone || "");
    setSecurityNotes(data.security_notes || "Akses Super Admin Terproteksi 2FA TOTP");

    // Admin Tenant
    setTenantName(data.brand_name || data.company_name || data.tenant_name || "Ranupani Semeru Explorer");
    setSupportPhone(data.support_phone || data.contact?.phone || data.phone || "");
    setTenantAddress(data.legal?.address || data.address || "");
    setOperatingHours(data.operating_hours || "24 Jam (Senin - Minggu)");
    setOperationalNotes(data.operational_notes || "Pos Registrasi Resmi & Rest Area Pendaki");

    // Vendor Partner
    setBusinessName(data.brand_name || data.business_name || "");
    setBusinessCategory(
      data.business_category || 
      (Array.isArray(data.types) ? data.types.join(", ") : "Persewaan Alat & Open Trip")
    );
    setPicName(data.pic_name || data.name || "");
    setPicPhone(data.contact?.phone || data.pic_phone || data.phone || "");
    setBankName(data.payout?.bank_name || data.bank_name || "BCA");
    setBankAccountNumber(data.payout?.account_number || data.bank_account_number || "");
    setBankAccountHolder(data.payout?.account_holder || data.bank_account_holder || data.brand_name || data.name || "");
    setServiceArea(
      data.service_area || 
      (data.legal?.city && data.legal?.province ? `${data.legal.city}, ${data.legal.province}` : "")
    );
    setCoverImage(data.cover_image || "");

    // User Pendaki
    setEmergencyContactName(data.emergency_contact_name || "");
    setEmergencyContactPhone(data.emergency_contact_phone || "");
    setEmergencyContactRelation(data.emergency_contact_relation || "Keluarga");
    setBloodType(data.blood_type || "O+");
    setOriginCity(data.origin_city || data.address || "");
    setMedicalHistory(data.medical_history || "Tidak ada riwayat penyakit berat");

    // Email Verification Status
    const isVerified = data.email_verified !== undefined ? !!data.email_verified : (user?.email_verified !== undefined ? !!user.email_verified : false);
    setEmailVerified(isVerified);
    setEmailVerifiedAt(data.email_verified_at || user?.email_verified_at || (isVerified ? new Date().toISOString() : null));
  }, [initialData, user]);

  // Auto-Save Data Payload Construction
  const autoSavePayload = useMemo(() => {
    return {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      bio,
      ...(role === "vendor" || role === "partner" ? {
        business_name: businessName,
        business_category: businessCategory,
        pic_name: picName,
        pic_phone: picPhone,
        bank_name: bankName,
        bank_account_number: bankAccountNumber,
        bank_account_holder: bankAccountHolder,
        service_area: serviceArea,
      } : {}),
      ...(role === "super_admin" || role === "super" ? {
        job_title: jobTitle,
        department: department,
        direct_phone: directPhone,
        security_notes: securityNotes,
      } : {}),
      ...(role === "admin" || role === "tenant" ? {
        company_name: tenantName,
        tenant_name: tenantName,
        support_phone: supportPhone,
        address: tenantAddress,
        operating_hours: operatingHours,
        operational_notes: operationalNotes,
      } : {}),
      ...(role === "user" ? {
        emergency_contact_name: emergencyContactName,
        emergency_contact_phone: emergencyContactPhone,
        emergency_contact_relation: emergencyContactRelation,
        blood_type: bloodType,
        origin_city: originCity,
        medical_history: medicalHistory,
      } : {}),
    };
  }, [
    name, email, phone, bio, role,
    businessName, businessCategory, picName, picPhone, bankName, bankAccountNumber, bankAccountHolder, serviceArea,
    jobTitle, department, directPhone, securityNotes,
    tenantName, supportPhone, tenantAddress, operatingHours, operationalNotes,
    emergencyContactName, emergencyContactPhone, emergencyContactRelation, bloodType, originCity, medicalHistory
  ]);

  const handleAutoSave = async (payload) => {
    if (!payload.name || !payload.email) return;
    const { data } = await api.patch("/users/me/profile", payload);
    const updatedUser = data?.user || data;
    if (setUser) setUser((prev) => ({ ...prev, ...updatedUser }));
    if (onSaveSuccess) onSaveSuccess(updatedUser);
  };

  const { status: autoSaveStatus, lastSavedAt: autoSaveTime } = useAutoSave({
    data: autoSavePayload,
    onSave: handleAutoSave,
    storageKey: `trx_profile_draft_${role}`,
    debounceMs: 700,
  });

  // Cooldown countdown timer for Resend Verification
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // State for OTP Modal
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpInput, setOtpInput] = useState("");

  // Handle Resend / Request OTP Email Verification
  const handleResendVerification = async () => {
    if (resendingVerification || resendCooldown > 0) return;
    setResendingVerification(true);
    try {
      const { data } = await api.post("/users/me/resend-verification", { email });
      setResendCooldown(60);
      setLogRefreshKey((prev) => prev + 1);
      setShowOtpModal(true);
      toast.success(data?.message || `Kode OTP 6-digit verifikasi email telah dikirimkan ke ${email}`);
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal mengirimkan kode OTP verifikasi email");
    } finally {
      setResendingVerification(false);
    }
  };

  // Handle Verify Email Button Click
  const handleVerifyEmail = async () => {
    if (showOtpModal || otpInput) {
      setShowOtpModal(true);
    } else {
      await handleResendVerification();
    }
  };

  // Handle Submitting 6-Digit OTP Code
  const handleVerifyEmailWithOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpInput.trim()) {
      toast.error("Masukkan kode OTP 6-digit terlebih dahulu");
      return;
    }
    if (verifyingEmail) return;
    setVerifyingEmail(true);
    try {
      const { data } = await api.post("/users/me/verify-email", { email, otp: otpInput.trim() });
      setEmailVerified(true);
      const verifiedTime = new Date().toISOString();
      setEmailVerifiedAt(verifiedTime);
      if (setUser) {
        setUser((prev) => ({ ...prev, email_verified: true, email_verified_at: verifiedTime }));
      }
      setShowOtpModal(false);
      setOtpInput("");
      setLogRefreshKey((prev) => prev + 1);
      toast.success(data?.message || "Selamat! Alamat email Anda berhasil diverifikasi.");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Gagal memverifikasi OTP email. Periksa kembali kode Anda.");
    } finally {
      setVerifyingEmail(false);
    }
  };

  // Handle Image File Upload via FormData
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG, PNG, WEBP)");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Local instant preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewPhoto(objectUrl);

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (data?.url) {
        setAvatar(data.url);
        setPreviewPhoto(data.url);
        toast.success("Foto profil berhasil diunggah!");
      }
    } catch (err) {
      toast.error("Gagal mengunggah foto ke server. Menyiapkan simpan lokal.");
      // Fallback: Read as Data URL if upload endpoint fails
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result);
        setPreviewPhoto(reader.result);
      };
      reader.readAsDataURL(file);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setAvatar("");
    setPreviewPhoto("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.info("Foto profil dihapus");
  };

  const validate = () => {
    const errs = {};

    if (!name.trim()) errs.name = "Nama wajib diisi";

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errs.email = "Email wajib diisi";
    } else if (!emailRegex.test(email.trim())) {
      errs.email = "Format email tidak valid";
    }

    if (showPasswordForm) {
      if (!currentPassword) {
        errs.currentPassword = "Password saat ini wajib diisi untuk mengonfirmasi perubahan";
      }
      if (!newPassword) {
        errs.newPassword = "Password baru wajib diisi";
      } else if (newPassword.length < 6) {
        errs.newPassword = "Password minimal 6 karakter";
      }
      if (!confirmPassword) {
        errs.confirmPassword = "Konfirmasi password baru wajib diisi";
      } else if (newPassword !== confirmPassword) {
        errs.confirmPassword = "Konfirmasi password tidak cocok dengan password baru";
      }
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Harap perbaiki kesalahan pada formulir");
      return;
    }

    setSaving(true);

    const payload = {
      name: name.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatar,
      bio,
    };

    // Password fields if user chose to edit password
    if (showPasswordForm && newPassword) {
      payload.current_password = currentPassword;
      payload.new_password = newPassword;
      payload.confirm_password = confirmPassword;
    }

    // Role specific fields payload
    if (role === "super_admin" || role === "super") {
      payload.job_title = jobTitle;
      payload.department = department;
      payload.direct_phone = directPhone;
      payload.security_notes = securityNotes;
    } else if (role === "admin" || role === "tenant") {
      payload.company_name = tenantName;
      payload.tenant_name = tenantName;
      payload.support_phone = supportPhone;
      payload.address = tenantAddress;
      payload.operating_hours = operatingHours;
      payload.operational_notes = operationalNotes;
    } else if (role === "vendor" || role === "partner") {
      payload.business_name = businessName;
      payload.business_category = businessCategory;
      payload.pic_name = picName;
      payload.pic_phone = picPhone;
      payload.bank_name = bankName;
      payload.bank_account_number = bankAccountNumber;
      payload.bank_account_holder = bankAccountHolder;
      payload.service_area = serviceArea;
      if (coverImage) payload.cover_image = coverImage;
    } else {
      // User Pendaki
      payload.emergency_contact_name = emergencyContactName;
      payload.emergency_contact_phone = emergencyContactPhone;
      payload.emergency_contact_relation = emergencyContactRelation;
      payload.blood_type = bloodType;
      payload.origin_city = originCity;
      payload.medical_history = medicalHistory;
    }

    try {
      const { data } = await api.patch("/users/me/profile", payload);
      const updatedUser = data?.user || data || payload;

      if (setUser) {
        setUser((prev) => ({ ...prev, ...updatedUser }));
      }

      if (onSaveSuccess) {
        onSaveSuccess(updatedUser);
      }

      // Reset password form after success
      if (showPasswordForm) {
        setShowPasswordForm(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      setLogRefreshKey((prev) => prev + 1);
      toast.success("Profil berhasil diperbarui & disimpan!");
    } catch (err) {
      const errorMsg = formatApiError(err.response?.data?.detail) || "Gagal memperbarui profil";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Auto-Save Status Banner */}
      <div className="flex items-center justify-between bg-card border border-border p-3.5 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Storefront size={18} className="text-emerald-500" />
          <span>Formulir Profil {role === "vendor" ? "Mitra Vendor" : "Pengguna"}</span>
        </div>
        <AutoSaveBadge status={autoSaveStatus} lastSavedAt={autoSaveTime} testid="role-profile-autosave-badge" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
      {/* 1. EDIT FOTO PROFILE SECTION (FILE UPLOAD ONLY) */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <Label className="font-extrabold text-sm text-foreground flex items-center gap-2">
            <Camera size={18} className="text-emerald-500" />
            <span>Foto Profil ({role === "super_admin" ? "Super Admin" : role === "tenant" ? "Logo Tenant" : role === "vendor" ? "Logo Mitra/Vendor" : "User Pendaki"})</span>
          </Label>
          <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
            FILE UPLOAD ONLY
          </span>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-5 pt-1">
          {/* Avatar Preview Box */}
          <div className="relative group shrink-0">
            {previewPhoto ? (
              <img
                src={previewPhoto}
                alt="Foto Profil"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-500/40 shadow-md transition-all group-hover:brightness-90"
              />
            ) : (
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground gap-1">
                <UserCircle size={42} />
                <span className="text-[10px] font-medium">Belum ada foto</span>
              </div>
            )}

            {uploadingPhoto && (
              <div className="absolute inset-0 bg-background/80 backdrop-blur-xs rounded-2xl flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-3 text-center sm:text-left w-full">
            <div className="space-y-1">
              <p className="text-xs font-bold text-foreground">Unggah Berkas Foto Resmi</p>
              <p className="text-[11px] text-muted-foreground">Format gambar JPG, PNG, WEBP. Ukuran file maksimal 5MB.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png, image/jpeg, image/jpg, image/webp"
              onChange={handleFileUpload}
              className="hidden"
              id="avatar-file-input"
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingPhoto}
                className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 font-bold text-xs h-9 rounded-xl cursor-pointer"
              >
                <UploadSimple size={16} weight="bold" className="mr-1.5" />
                {previewPhoto ? "Ganti Foto Profil" : "Pilih File & Unggah"}
              </Button>

              {previewPhoto && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemovePhoto}
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 font-bold text-xs h-9 rounded-xl cursor-pointer"
                >
                  <Trash size={16} className="mr-1" /> Hapus Foto
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. CORE INFORMATION (NAMA & EMAIL & PHONE) */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
          <UserCircle size={18} className="text-emerald-500" /> Informasi Utama Akun
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="input-name" className="text-xs font-bold text-foreground">
              Nama Lengkap <span className="text-rose-500">*</span>
            </Label>
            <div className="relative">
              <Input
                id="input-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Masukkan nama lengkap"
                className="bg-background border-border text-xs rounded-xl h-10 pl-9"
              />
              <UserCircle size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
            {formErrors.name && <p className="text-[11px] text-rose-500 font-medium">{formErrors.name}</p>}
          </div>

          <div className="space-y-2 sm:col-span-1">
            <div className="flex items-center justify-between gap-2">
              <Label htmlFor="input-email" className="text-xs font-bold text-foreground">
                Alamat Email <span className="text-rose-500">*</span>
              </Label>
              {emailVerified ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 animate-fade-in">
                  <CheckCircle size={13} weight="fill" className="text-emerald-500" /> Terverifikasi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20 animate-fade-in">
                  <WarningCircle size={13} weight="fill" className="text-amber-500" /> Belum Diverifikasi
                </span>
              )}
            </div>

            <div className="relative">
              <Input
                id="input-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@trexio.com"
                className={`bg-background border text-xs rounded-xl h-10 pl-9 ${
                  emailVerified ? "border-emerald-500/40 focus:border-emerald-500" : "border-amber-500/40 focus:border-amber-500"
                }`}
              />
              <EnvelopeSimple size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
            {formErrors.email && <p className="text-[11px] text-rose-500 font-medium">{formErrors.email}</p>}

            {/* EMAIL VERIFICATION CONTROL BOX */}
            {!emailVerified ? (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-2 animate-fade-in">
                <div className="flex items-start gap-2">
                  <WarningCircle size={16} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 leading-snug">
                    Email ini belum diverifikasi. Verifikasi email Anda untuk menerima e-tiket trip, faktur transaksi, dan notifikasi keamanan akun.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-amber-500/20">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendVerification}
                    disabled={resendingVerification || resendCooldown > 0}
                    className="text-[11px] font-extrabold h-8 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-900 dark:text-amber-200 border-amber-500/30"
                  >
                    {resendingVerification ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
                        Mengirim...
                      </span>
                    ) : resendCooldown > 0 ? (
                      `Kirim Ulang (${resendCooldown}s)`
                    ) : (
                      "Kirim Ulang Verifikasi"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleVerifyEmail}
                    disabled={verifyingEmail}
                    className="text-[11px] font-extrabold h-8 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white shadow-2xs"
                  >
                    {verifyingEmail ? (
                      <span className="flex items-center gap-1.5">
                        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                        Verifikasi...
                      </span>
                    ) : (
                      "Verifikasi Email Sekarang"
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="p-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-between gap-2 text-[11px] animate-fade-in">
                <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                  <CheckCircle size={15} weight="fill" className="text-emerald-500 shrink-0" />
                  <span>
                    Alamat email terverifikasi resmi{" "}
                    {emailVerifiedAt && (
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        • {new Date(emailVerifiedAt).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="input-phone" className="text-xs font-bold text-foreground">
              Nomor Telepon / WhatsApp
            </Label>
            <div className="relative">
              <Input
                id="input-phone"
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="08123456789"
                className="bg-background border-border text-xs rounded-xl h-10 pl-9"
              />
              <Phone size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="input-bio" className="text-xs font-bold text-foreground">
              Bio / Profil Singkat
            </Label>
            <textarea
              id="input-bio"
              rows={2}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Deskripsi atau kutipan singkat profil Anda..."
              className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
            />
          </div>
        </div>
      </div>

      {/* 3. ROLE-SPECIFIC FORM FIELDS */}
      {/* A. SUPER ADMIN FIELDS */}
      {(role === "super_admin" || role === "super") && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <ShieldCheck size={18} className="text-amber-500" /> Atribut Akses Super Admin Platform
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Jabatan / Role Title</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="e.g. Lead System Architect"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Briefcase size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Departemen / Division</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Executive Platform Operations"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Building size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nomor Telepon Darurat / Direct Line</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={directPhone}
                  onChange={(e) => setDirectPhone(e.target.value)}
                  placeholder="08123456789"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Phone size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Catatan Keamanan Governance</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={securityNotes}
                  onChange={(e) => setSecurityNotes(e.target.value)}
                  placeholder="e.g. Terenkripsi TOTP 2FA"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <ShieldCheck size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. ADMIN TENANT FIELDS */}
      {(role === "admin" || role === "tenant") && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <Building size={18} className="text-emerald-500" /> Profil Pengelola Tenant & Basecamp
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Tenant / Organisasi Pengelola</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  placeholder="e.g. Semeru Ranupani Explorer"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Building size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Hotline CS / Support Phone</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={supportPhone}
                  onChange={(e) => setSupportPhone(e.target.value)}
                  placeholder="08123456789"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Phone size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Jam Operasional</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={operatingHours}
                  onChange={(e) => setOperatingHours(e.target.value)}
                  placeholder="e.g. 24 Jam (Senin - Minggu)"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Clock size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Alamat Kantor / Basecamp</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={tenantAddress}
                  onChange={(e) => setTenantAddress(e.target.value)}
                  placeholder="Jl. Raya Basecamp..."
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <MapPin size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">Catatan Operasional Tenant</Label>
              <textarea
                rows={2}
                value={operationalNotes}
                onChange={(e) => setOperationalNotes(e.target.value)}
                placeholder="Keterangan fasilitas, syarat registrasi SIMAKSI, dll..."
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* C. VENDOR / PARTNER FIELDS */}
      {(role === "vendor" || role === "partner") && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <Storefront size={18} className="text-blue-500" /> Profil Usaha Mitra / Vendor Trexio
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Brand / Usaha Vendor</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Trexio Outdoor Gear"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Storefront size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Kategori Layanan Usaha</Label>
              <select
                value={businessCategory}
                onChange={(e) => setBusinessCategory(e.target.value)}
                className="w-full h-10 bg-background border border-border text-xs rounded-xl px-3 font-semibold text-foreground focus:outline-none"
              >
                <option value="Persewaan Alat">Persewaan Alat & Gear Pendakian</option>
                <option value="Open Trip & Guide">Penyedia Open Trip & Tour Guide</option>
                <option value="Transportasi">Layanan Transportasi & Shuttle Jeep</option>
                <option value="Basecamp Lodge">Basecamp Lodge & Homestay</option>
                <option value="Porter Service">Jasa Porter & Logistic Team</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Penanggung Jawab (PIC)</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={picName}
                  onChange={(e) => setPicName(e.target.value)}
                  placeholder="Nama PIC Usaha"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <UserCircle size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nomor HP / WhatsApp PIC</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={picPhone}
                  onChange={(e) => setPicPhone(e.target.value)}
                  placeholder="08123456789"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Phone size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Bank Pembayaran</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. BCA, Bank Mandiri, BRI"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <Bank size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nomor Rekening Bank</Label>
              <Input
                type="text"
                value={bankAccountNumber}
                onChange={(e) => setBankAccountNumber(e.target.value)}
                placeholder="1234567890"
                className="bg-background border-border text-xs rounded-xl h-10 font-mono font-bold"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Pemilik Rekening</Label>
              <Input
                type="text"
                value={bankAccountHolder}
                onChange={(e) => setBankAccountHolder(e.target.value)}
                placeholder="A.N. Pemilik Usaha"
                className="bg-background border-border text-xs rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Cakupan Wilayah Layanan</Label>
              <Input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="e.g. Area Gunung Semeru & Arjuno"
                className="bg-background border-border text-xs rounded-xl h-10"
              />
            </div>
          </div>
        </div>
      )}

      {/* D. USER PENDAKI FIELDS */}
      {role === "user" && (
        <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
          <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2 pb-2 border-b border-border">
            <FirstAid size={18} className="text-rose-500" /> Profil Pendaki & Kontak Darurat Safety
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Golongan Darah</Label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value)}
                className="w-full h-10 bg-background border border-border text-xs rounded-xl px-3 font-semibold text-foreground focus:outline-none"
              >
                <option value="O+">O (+)</option>
                <option value="A+">A (+)</option>
                <option value="B+">B (+)</option>
                <option value="AB+">AB (+)</option>
                <option value="O-">O (-)</option>
                <option value="A-">A (-)</option>
                <option value="B-">B (-)</option>
                <option value="AB-">AB (-)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Kota Asal / Alamat Domisili</Label>
              <div className="relative">
                <Input
                  type="text"
                  value={originCity}
                  onChange={(e) => setOriginCity(e.target.value)}
                  placeholder="e.g. Bandung, Jawa Barat"
                  className="bg-background border-border text-xs rounded-xl h-10 pl-9"
                />
                <MapPin size={18} className="absolute left-3 top-2.5 text-muted-foreground" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nama Kontak Darurat</Label>
              <Input
                type="text"
                value={emergencyContactName}
                onChange={(e) => setEmergencyContactName(e.target.value)}
                placeholder="Nama anggota keluarga / rekan"
                className="bg-background border-border text-xs rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-foreground">Nomor Telepon Kontak Darurat</Label>
              <Input
                type="text"
                value={emergencyContactPhone}
                onChange={(e) => setEmergencyContactPhone(e.target.value)}
                placeholder="08123456789"
                className="bg-background border-border text-xs rounded-xl h-10"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <Label className="text-xs font-bold text-foreground">Riwayat Kesehatan & Catatan Fisik Safety</Label>
              <textarea
                rows={2}
                value={medicalHistory}
                onChange={(e) => setMedicalHistory(e.target.value)}
                placeholder="Alergi, riwayat cedera, atau catatan medis untuk tim medis basecamp..."
                className="w-full bg-background border border-border rounded-xl p-3 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </div>
      )}

      {/* 4. PASSWORD CHANGE WITH CONFIRMATION SECTION */}
      <div className="p-5 rounded-2xl bg-card border border-border shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-border">
          <div>
            <h3 className="font-extrabold text-sm text-foreground flex items-center gap-2">
              <Key size={18} className="text-amber-500" /> Keamanan Password Akun
            </h3>
            <p className="text-[11px] text-muted-foreground">Ubah password menggunakan metode verfirmasi dan konfirmasi ganda.</p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="text-xs font-bold h-8 rounded-lg cursor-pointer"
          >
            {showPasswordForm ? "Batal Edit Password" : "Ubah Password"}
          </Button>
        </div>

        {showPasswordForm && (
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 space-y-4 animate-fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
              <Lock size={16} /> Metode Konfirmasi Password Baru
            </div>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="current-pass" className="text-xs font-bold text-foreground">
                  Password saat ini <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="current-pass"
                    type={showCurrentPass ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="Masukkan password saat ini"
                    className="bg-background border-border text-xs rounded-xl h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPass(!showCurrentPass)}
                    className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    {showCurrentPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {formErrors.currentPassword && (
                  <p className="text-[11px] text-rose-500 font-medium">{formErrors.currentPassword}</p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Password Baru Input & Strength Meter */}
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="new-pass" className="text-xs font-bold text-foreground">
                    Password Baru <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="new-pass"
                      type={showNewPass ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="bg-background border-border text-xs rounded-xl h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPass(!showNewPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showNewPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {formErrors.newPassword && (
                    <p className="text-[11px] text-rose-500 font-medium">{formErrors.newPassword}</p>
                  )}

                  {/* REAL-TIME PASSWORD STRENGTH INDICATOR */}
                  {newPassword && (
                    <div className="space-y-2 p-3 bg-background/80 rounded-xl border border-border/80 shadow-2xs animate-fade-in">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-muted-foreground">Kekuatan Password:</span>
                        <span className={`font-extrabold ${passwordStrength.textColor}`}>
                          {passwordStrength.label} ({passwordStrength.percent}%)
                        </span>
                      </div>

                      {/* Visual Strength Bar Segments */}
                      <div className="grid grid-cols-5 gap-1 h-1.5 w-full bg-muted/60 rounded-full overflow-hidden p-0.5">
                        {[1, 2, 3, 4, 5].map((level) => (
                          <div
                            key={level}
                            className={`h-full rounded-full transition-all duration-300 ${
                              level <= passwordStrength.score ? passwordStrength.color : "bg-muted-foreground/20"
                            }`}
                          />
                        ))}
                      </div>

                      {/* Real-time Security Criteria Checklist */}
                      <div className="pt-1.5 space-y-1 border-t border-border/40">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                          Persyaratan Keamanan:
                        </p>
                        <div className="grid grid-cols-1 gap-1">
                          {passwordStrength.criteria.map((c) => (
                            <div
                              key={c.id}
                              className={`flex items-center gap-1.5 text-[11px] transition-colors ${
                                c.met
                                  ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                  : "text-muted-foreground opacity-75"
                              }`}
                            >
                              {c.met ? (
                                <Check size={13} className="text-emerald-500 shrink-0" />
                              ) : (
                                <X size={13} className="text-muted-foreground/60 shrink-0" />
                              )}
                              <span>{c.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Konfirmasi Password Input & Matching Indicator */}
                <div className="space-y-2 sm:col-span-1">
                  <Label htmlFor="confirm-pass" className="text-xs font-bold text-foreground">
                    Konfirmasi Password Baru <span className="text-rose-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirm-pass"
                      type={showConfirmPass ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Ulangi password baru"
                      className="bg-background border-border text-xs rounded-xl h-10 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPass(!showConfirmPass)}
                      className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground cursor-pointer"
                    >
                      {showConfirmPass ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </button>
                  </div>

                  {/* Real-time Match Indicator */}
                  {confirmPassword && (
                    <div className="pt-0.5">
                      {newPassword === confirmPassword ? (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 w-fit">
                          <Check size={14} className="text-emerald-500" /> Password cocok
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-500 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 w-fit">
                          <X size={14} className="text-rose-500" /> Password belum cocok
                        </div>
                      )}
                    </div>
                  )}

                  {formErrors.confirmPassword && (
                    <p className="text-[11px] text-rose-500 font-medium">{formErrors.confirmPassword}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SUBMIT BUTTON */}
      <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
        <AutoSaveBadge status={autoSaveStatus} lastSavedAt={autoSaveTime} testid="role-profile-autosave-footer-badge" />

        <Button
          type="submit"
          disabled={saving || uploadingPhoto}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-black h-11 px-8 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-500/20 cursor-pointer disabled:opacity-50"
        >
          {saving ? (
            <span className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Menyimpan Perubahan...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <FloppyDisk size={18} weight="bold" /> Simpan Perubahan Profil
            </span>
          )}
        </Button>
      </div>
    </form>

    {/* MANAGE ACTIVE SESSIONS SECTION */}
    <ActiveSessionsManager
      user={user}
      onSessionChange={() => setLogRefreshKey((prev) => prev + 1)}
      className="mt-8"
    />

    {/* ACTIVITY LOG SECTION */}
    <ActivityLog key={logRefreshKey} user={user} className="mt-8" />

    {/* OTP Email Verification Modal */}
    {showOtpModal && (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fade-in">
        <div className="bg-card text-card-foreground border border-border w-full max-w-md rounded-2xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <EnvelopeSimple size={20} className="text-emerald-500" />
              <h3 className="font-extrabold text-base">Verifikasi Email OTP</h3>
            </div>
            <button
              type="button"
              onClick={() => setShowOtpModal(false)}
              className="text-muted-foreground hover:text-foreground text-sm font-bold cursor-pointer"
            >
              ✕
            </button>
          </div>

          <p className="text-xs text-muted-foreground">
            Kode OTP 6-digit verifikasi telah dikirimkan ke alamat email <strong className="text-foreground">{email}</strong>. Silakan periksa inbox atau folder spam Anda.
          </p>

          <form onSubmit={handleVerifyEmailWithOtp} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="otp-input" className="text-xs font-bold">
                Masukkan Kode OTP 6-Digit
              </Label>
              <Input
                id="otp-input"
                type="text"
                maxLength={6}
                value={otpInput}
                onChange={(e) => setOtpInput(e.target.value)}
                placeholder="Contoh: 123456"
                className="bg-background border-border text-center text-lg tracking-widest font-mono font-bold rounded-xl h-12"
                autoFocus
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleResendVerification}
                disabled={resendingVerification || resendCooldown > 0}
                className="text-xs text-amber-600 dark:text-amber-400 font-bold"
              >
                {resendingVerification ? "Mengirim..." : resendCooldown > 0 ? `Kirim Ulang (${resendCooldown}s)` : "Kirim Ulang Kode"}
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOtpModal(false)}
                  className="text-xs rounded-xl"
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  disabled={verifyingEmail || !otpInput.trim()}
                  className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl h-9 px-4 shadow-sm"
                >
                  {verifyingEmail ? "Memverifikasi..." : "Verifikasi OTP"}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
  );
}
