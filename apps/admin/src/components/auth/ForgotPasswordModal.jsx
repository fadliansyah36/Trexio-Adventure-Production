import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import {
  Key,
  EnvelopeSimple,
  WhatsappLogo,
  ShieldCheck,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  LockKey,
  Sparkle,
  Info,
} from "@phosphor-icons/react";

export default function ForgotPasswordModal({
  open,
  onOpenChange,
  initialIdentifier = "",
  onSuccess,
}) {
  const [step, setStep] = useState(1); // 1: Identifier & Method, 2: OTP Verification, 3: New Password, 4: Success
  const [identifier, setIdentifier] = useState(initialIdentifier || "");
  const [method, setMethod] = useState("email"); // "email" | "whatsapp"
  const [loading, setLoading] = useState(false);
  const [resetTicketId, setResetTicketId] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [maskedDest, setMaskedDest] = useState("");
  const [detectedRole, setDetectedRole] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [devOtp, setDevOtp] = useState("");
  const [countdown, setCountdown] = useState(0);

  // New password form
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (open && initialIdentifier) {
      setIdentifier(initialIdentifier);
      if (!initialIdentifier.includes("@") && initialIdentifier.replace(/[^0-9]/g, "").length >= 8) {
        setMethod("whatsapp");
      }
    }
  }, [open, initialIdentifier]);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  function handleResetModalState() {
    setStep(1);
    setOtpCode("");
    setNewPassword("");
    setConfirmPassword("");
    setResetTicketId("");
    setResetToken("");
    setDevOtp("");
    setCountdown(0);
  }

  const handleClose = () => {
    handleResetModalState();
    onOpenChange(false);
  };

  // Step 1: Request OTP / Verification Code
  const handleRequestCode = async (e) => {
    if (e) e.preventDefault();
    if (!identifier || !identifier.trim()) {
      return toast.error("Masukkan Email atau Nomor WhatsApp terdaftar Anda.");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/request", {
        identifier: identifier.trim(),
        method,
      });

      toast.success(data.message || "Kode verifikasi berhasil dikirim!");
      setResetTicketId(data.reset_ticket_id || "");
      setMaskedDest(data.masked_destination || identifier);
      setDetectedRole(data.role || "");

      setStep(2);
      setCountdown(60);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal mengirimkan kode pemulihan.", {
        description: "Pastikan Email atau Nomor WhatsApp sudah terdaftar di aplikasi Trexio.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    if (e) e.preventDefault();
    if (!otpCode || otpCode.trim().length < 4) {
      return toast.error("Masukkan kode OTP 6-digit dengan lengkap.");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/verify-otp", {
        code: otpCode.trim(),
        reset_ticket_id: resetTicketId,
        identifier: identifier.trim(),
      });

      toast.success(data.message || "Kode verifikasi cocok! Silakan buat kata sandi baru.");
      setResetToken(data.reset_token || "");
      setStep(3);
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Kode OTP salah atau kedaluwarsa.");
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Save New Password
  const handleResetPassword = async (e) => {
    if (e) e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      return toast.error("Kata sandi baru minimal harus 6 karakter.");
    }
    if (newPassword !== confirmPassword) {
      return toast.error("Konfirmasi kata sandi tidak cocok. Silakan periksa kembali.");
    }

    setLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/reset", {
        reset_token: resetToken,
        new_password: newPassword,
        email: identifier.includes("@") ? identifier : undefined,
      });

      toast.success(data.message || "Kata sandi berhasil diperbarui!");
      setStep(4);
      if (onSuccess) onSuccess();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal memperbarui kata sandi.");
    } finally {
      setLoading(false);
    }
  };

  const getRoleLabel = (role) => {
    switch (role) {
      case "super_admin":
        return "Super Admin Platform";
      case "tenant_owner":
      case "tenant_admin":
        return "Pengelola Tenant";
      case "partner_owner":
      case "vendor":
        return "Mitra Outdoor / Vendor";
      case "user":
      default:
        return "User Pendaki / Hiker";
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        data-testid="forgot-password-modal"
        className="max-w-md rounded-2xl p-6 border-border shadow-2xl bg-card text-foreground"
      >
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Key size={22} weight="duotone" />
              </div>
              <div>
                <DialogTitle className="text-lg font-black tracking-tight">
                  Lupa Kata Sandi Akun
                </DialogTitle>
              </div>
            </div>
            {detectedRole && (
              <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                {getRoleLabel(detectedRole)}
              </span>
            )}
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            {step === 1 && "Pilih metode verifikasi pemulihan menggunakan Email terdaftar atau WhatsApp OTP."}
            {step === 2 && `Masukkan kode verifikasi 6-digit yang dikirimkan ke ${maskedDest}.`}
            {step === 3 && "Buat kata sandi baru yang aman untuk akun Anda."}
            {step === 4 && "Kata sandi Anda telah berhasil diperbarui dan siap digunakan."}
          </DialogDescription>
        </DialogHeader>

        {/* STEP 1: Enter Identifier & Select Verification Method */}
        {step === 1 && (
          <form onSubmit={handleRequestCode} className="mt-2 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="forgot-identifier-input" className="text-xs font-bold text-foreground block mb-1">
                  Email atau Nomor WhatsApp Terdaftar *
                </Label>
                <div className="relative">
                  <Input
                    id="forgot-identifier-input"
                    data-testid="forgot-identifier-input"
                    type="text"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: user@email.com atau 081234567890"
                    className="text-xs bg-background h-10 rounded-xl pr-3"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Sistem akan mencocokkan data akun terdaftar di database Trexio.
                </p>
              </div>

              {/* Method Selector */}
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-foreground">Metode Verifikasi Pemulihan *</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod("email")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      method === "email"
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <EnvelopeSimple size={18} className={method === "email" ? "text-emerald-600 dark:text-emerald-400" : ""} weight="fill" />
                      <span className="text-xs font-bold">Email</span>
                    </div>
                    <span className="text-[10px] opacity-80">Kode OTP dikirim ke Inbox Email</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod("whatsapp")}
                    className={`p-3 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                      method === "whatsapp"
                        ? "border-emerald-500 bg-emerald-500/10 text-foreground ring-1 ring-emerald-500"
                        : "border-border bg-background text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <WhatsappLogo size={18} className="text-emerald-500" weight="fill" />
                      <span className="text-xs font-bold">WhatsApp OTP</span>
                    </div>
                    <span className="text-[10px] opacity-80">OTP Instan ke WhatsApp</span>
                  </button>
                </div>
              </div>

              <div className="p-3 bg-muted/60 border border-border/80 rounded-xl text-[11px] text-muted-foreground flex items-start gap-2">
                <ShieldCheck size={18} className="text-emerald-500 shrink-0 mt-0.5" weight="fill" />
                <span>
                  Proses pemulihan dilindungi enkripsi JWT & Bcrypt. Semua percobaan aktivitas keamanan dicatat dalam Log Audit Sistem.
                </span>
              </div>

              <Button
                type="submit"
                data-testid="forgot-send-btn"
                disabled={loading || !identifier.trim()}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-11 shadow-xs flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Memeriksa Akun...
                  </>
                ) : (
                  <>
                    Kirim Kode Verifikasi ({method === "whatsapp" ? "WhatsApp" : "Email"}) <ArrowRight size={16} weight="bold" />
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 2: Verify OTP Code */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="mt-2 space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground">Pesan Dikirim Ke:</span>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Ubah Destinasi
                </button>
              </div>
              <div className="font-mono font-bold text-emerald-700 dark:text-emerald-300 text-sm">
                {maskedDest}
              </div>
              <p className="text-[10px] text-muted-foreground">
                Kode verifikasi berlaku selama 10 menit.
              </p>
            </div>

            <div>
              <Label htmlFor="forgot-otp-input" className="text-xs font-bold block mb-1">
                Kode Verifikasi 6-Digit *
              </Label>
              <Input
                id="forgot-otp-input"
                data-testid="forgot-otp-input"
                type="text"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder="123456"
                className="text-center font-mono text-lg tracking-[0.4em] font-black h-12 bg-background rounded-xl border-emerald-500/40"
                required
              />
            </div>

            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Tidak menerima kode?</span>
              {countdown > 0 ? (
                <span className="font-mono font-bold text-emerald-600">
                  Kirim Ulang ({countdown}s)
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleRequestCode}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline"
                >
                  Kirim Ulang Kode OTP
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="w-1/3 text-xs h-11 rounded-xl"
              >
                <ArrowLeft size={16} /> Kembali
              </Button>
              <Button
                type="submit"
                data-testid="forgot-verify-btn"
                disabled={loading || otpCode.length < 4}
                className="w-2/3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-11 shadow-xs"
              >
                {loading ? "Memverifikasi..." : "Verifikasi Kode OTP →"}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 3: Enter New Password */}
        {step === 3 && (
          <form onSubmit={handleResetPassword} className="mt-2 space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="forgot-new-pass" className="text-xs font-bold block mb-1">
                  Kata Sandi Baru *
                </Label>
                <div className="relative">
                  <Input
                    id="forgot-new-pass"
                    data-testid="forgot-new-pass"
                    type={showPass ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter"
                    className="text-xs bg-background h-10 rounded-xl"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-2.5 text-[10px] font-bold text-muted-foreground hover:text-foreground"
                  >
                    {showPass ? "Sembunyikan" : "Lihat"}
                  </button>
                </div>
              </div>

              <div>
                <Label htmlFor="forgot-confirm-pass" className="text-xs font-bold block mb-1">
                  Konfirmasi Kata Sandi Baru *
                </Label>
                <Input
                  id="forgot-confirm-pass"
                  data-testid="forgot-confirm-pass"
                  type={showPass ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ulangi kata sandi baru"
                  className="text-xs bg-background h-10 rounded-xl"
                  required
                />
              </div>

              {/* Password strength meter */}
              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-semibold text-muted-foreground">
                  <span>Kekuatan Kata Sandi:</span>
                  <span className={newPassword.length >= 8 ? "text-emerald-600 font-bold" : "text-amber-500"}>
                    {newPassword.length === 0 ? "-" : newPassword.length >= 8 ? "Sangat Kuat" : "Cukup"}
                  </span>
                </div>
                <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      newPassword.length >= 8
                        ? "w-full bg-emerald-500"
                        : newPassword.length >= 6
                        ? "w-2/3 bg-amber-500"
                        : "w-1/3 bg-rose-500"
                    }`}
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-testid="forgot-submit-new-pass"
                disabled={loading || !newPassword || newPassword.length < 6 || newPassword !== confirmPassword}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-11 shadow-xs"
              >
                {loading ? "Memperbarui Kata Sandi..." : "Simpan Kata Sandi Baru & Selesai"}
              </Button>
            </div>
          </form>
        )}

        {/* STEP 4: Success State */}
        {step === 4 && (
          <div className="mt-2 py-4 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center border border-emerald-500/30 animate-bounce">
              <CheckCircle size={36} weight="fill" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">
                Kata Sandi Berhasil Diperbarui!
              </h3>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                Kata sandi baru untuk akun Anda sudah aktif di seluruh platform Trexio. Silakan masuk kembali.
              </p>
            </div>

            <Button
              type="button"
              data-testid="forgot-finish-btn"
              onClick={handleClose}
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs h-11 shadow-xs"
            >
              Masuk ke Akun Sekarang →
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
