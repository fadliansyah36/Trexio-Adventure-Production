import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import {
  ShieldCheck,
  Lock,
  EnvelopeSimple,
  Eye,
  EyeSlash,
  ArrowLeft,
  Key,
  ShieldWarning,
  CheckCircle,
  WarningCircle,
  ArrowCounterClockwise,
  PaperPlaneRight,
  Sparkle,
  QrCode,
  Copy,
  Check,
} from "@phosphor-icons/react";

export default function AdminLogin() {
  const { login, verify2Fa } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next");

  // Login form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });

  // 2FA Authenticator state
  const [is2FaMode, setIs2FaMode] = useState(false);
  const [totpCode, setTotpCode] = useState("");
  const [tempToken, setTempToken] = useState("");
  const [totpData, setTotpData] = useState(null);
  const [totpError, setTotpError] = useState("");
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Forgot password flow state
  const [isForgotMode, setIsForgotMode] = useState(false);
  const [forgotStep, setForgotStep] = useState("request"); // "request" | "reset" | "success"
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotMethod, setForgotMethod] = useState("email"); // "email" | "whatsapp"
  const [resetTicketId, setResetTicketId] = useState("");
  const [adminDevOtp, setAdminDevOtp] = useState("");
  const [forgotEmailError, setForgotEmailError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [resetErrors, setResetErrors] = useState({ token: "", password: "" });

  function validateLogin() {
    const errors = { email: "", password: "" };
    let valid = true;

    if (!email.trim()) {
      errors.email = "Alamat email wajib diisi";
      valid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Format email tidak valid";
      valid = false;
    }

    if (!password) {
      errors.password = "Kata sandi wajib diisi";
      valid = false;
    } else if (password.length < 4) {
      errors.password = "Kata sandi minimal 4 karakter";
      valid = false;
    }

    setFieldErrors(errors);
    return valid;
  }

  async function handleSubmitLogin(e) {
    e.preventDefault();
    setServerError("");

    if (!validateLogin()) return;

    setLoading(true);
    try {
      const resUser = await login(email, password);

      if (resUser?.requires_2fa) {
        setIs2FaMode(true);
        setTempToken(resUser.temp_token);
        setTotpData(resUser);
        toast.info(resUser.message || "Silakan lakukan verifikasi 2FA Authenticator.");
        return;
      }

      const roles = resUser?.roles || (resUser?.role ? [resUser.role] : []);
      
      if (roles.includes("super_admin")) {
        toast.success("Selamat datang kembali, Super Admin!");
        nav(next || "/super");
      } else if (roles.includes("admin")) {
        toast.success("Login Portal Admin berhasil!");
        nav(next || "/admin");
      } else {
        toast.warning("Akun ini terdaftar sebagai traveler. Mengalihkan ke beranda...");
        nav(next || "/");
      }
    } catch (err) {
      const msg =
        formatApiError(err.response?.data?.detail) ||
        "Gagal masuk. Periksa kembali email dan kata sandi administrasi Anda.";
      setServerError(msg);
      toast.error("Autentikasi Administrasi Gagal");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify2Fa(e) {
    e.preventDefault();
    setTotpError("");

    const cleanCode = totpCode.trim().replace(/\s+/g, "");
    if (!cleanCode || cleanCode.length < 6) {
      setTotpError("Masukkan 6 digit kode dari aplikasi Authenticator");
      return;
    }

    setLoading(true);
    try {
      const resUser = await verify2Fa(tempToken, cleanCode, email);
      toast.success("Verifikasi 2FA Berhasil! Selamat datang Super Admin.");
      const roles = resUser?.roles || (resUser?.role ? [resUser.role] : []);
      if (roles.includes("super_admin")) {
        nav(next || "/super");
      } else if (roles.includes("admin")) {
        nav(next || "/admin");
      } else {
        nav(next || "/");
      }
    } catch (err) {
      const msg =
        formatApiError(err.response?.data?.detail) ||
        "Kode 2FA Authenticator tidak valid atau telah expired. Silakan periksa jam pada HP Anda.";
      setTotpError(msg);
      toast.error("Otorisasi 2FA Gagal");
    } finally {
      setLoading(false);
    }
  }

  function handleCopySecret() {
    if (totpData?.secret_key) {
      navigator.clipboard.writeText(totpData.secret_key);
      setCopiedSecret(true);
      toast.success("Secret key 2FA disalin!");
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }

  function handleOpenForgot() {
    setIsForgotMode(true);
    setForgotStep("request");
    setForgotEmail(email || "admin@trexio.id");
    setForgotEmailError("");
    setResetErrors({ token: "", password: "" });
    setServerError("");
  }

  function handleBackToLogin() {
    setIsForgotMode(false);
    setForgotStep("request");
    setServerError("");
  }

  async function handleRequestReset(e) {
    if (e) e.preventDefault();
    setForgotEmailError("");

    if (!forgotEmail.trim()) {
      setForgotEmailError("Masukkan email atau nomor WhatsApp administrator Anda");
      return;
    }

    setForgotLoading(true);
    try {
      const { data } = await api.post("/auth/forgot-password/request", {
        identifier: forgotEmail.trim(),
        method: forgotMethod,
      });

      setResetTicketId(data.reset_ticket_id || "");
      toast.success(data.message || "Kode otorisasi pemulihan berhasil dikirim!");
      setForgotStep("reset");
    } catch (err) {
      setForgotEmailError(formatApiError(err?.response?.data?.detail) || "Gagal mengirimkan kode pemulihan admin.");
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleConfirmReset(e) {
    if (e) e.preventDefault();
    const errs = { token: "", password: "" };
    let valid = true;

    if (!resetToken.trim()) {
      errs.token = "Kode verifikasi wajib diisi";
      valid = false;
    }
    if (!newPassword || newPassword.length < 6) {
      errs.password = "Kata sandi baru minimal 6 karakter";
      valid = false;
    }

    setResetErrors(errs);
    if (!valid) return;

    setForgotLoading(true);
    try {
      const verifyRes = await api.post("/auth/forgot-password/verify-otp", {
        code: resetToken.trim(),
        reset_ticket_id: resetTicketId,
        identifier: forgotEmail.trim(),
      });

      const actualToken = verifyRes.data?.reset_token || resetTicketId;

      const resetRes = await api.post("/auth/forgot-password/reset", {
        reset_token: actualToken,
        new_password: newPassword,
        email: forgotEmail.trim(),
      });

      toast.success(resetRes.data?.message || "Kata sandi administrasi berhasil diperbarui!");
      setForgotStep("success");
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal memperbarui kata sandi admin.");
    } finally {
      setForgotLoading(false);
    }
  }

  function handleFinishAndLogin() {
    setEmail(forgotEmail);
    setPassword(newPassword);
    setIsForgotMode(false);
    setForgotStep("request");
    toast.info("Kata sandi baru telah diisi. Silakan klik Otorisasi Admin.");
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between selection:bg-emerald-500 selection:text-white">
      {/* Top Bar */}
      <header className="p-4 sm:p-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/50 backdrop-blur-md">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors"
        >
          <ArrowLeft size={16} />
          <span>Kembali ke Situs Utama</span>
        </Link>
        <div className="flex items-center gap-2 text-[11px] font-mono tracking-wider text-emerald-400 bg-emerald-950/60 border border-emerald-800/50 px-3 py-1 rounded-full">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>SECURE ADMIN PORTAL v2.4</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-md">
          {/* Main Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-950/20 backdrop-blur-xl relative overflow-hidden">
            {/* Top Security Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-indigo-500" />

            {is2FaMode ? (
              /* 2FA AUTHENTICATOR CHALLENGE MODE */
              <div className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="inline-flex items-center justify-center p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-1 shadow-lg shadow-emerald-500/10">
                    <ShieldCheck size={36} weight="fill" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white font-['Cabinet_Grotesk']">
                    Otorisasi 2FA Super Admin
                  </h2>
                  <p className="text-xs text-slate-400 font-['Manrope'] max-w-sm mx-auto leading-relaxed">
                    {totpData?.totp_enabled
                      ? "Akun Super Admin dilindungi 2FA. Masukkan 6-digit kode token dari Google Authenticator / Authy."
                      : "Akun Super Admin diwajibkan mengaktifkan 2FA. Pindai QR Code di bawah dengan Google Authenticator atau Authy."}
                  </p>
                </div>

                {/* First-time QR Setup Box */}
                {!totpData?.totp_enabled && totpData?.qr_code_url && (
                  <div className="p-4 rounded-2xl bg-slate-950/90 border border-emerald-500/30 text-slate-200 text-xs space-y-3.5 shadow-inner">
                    <div className="flex items-center justify-between text-emerald-400 font-bold text-[11px] uppercase tracking-wider">
                      <span className="flex items-center gap-1.5">
                        <QrCode size={16} /> Registrasi Authenticator Pertama
                      </span>
                      <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-[10px]">REQUIRED</span>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
                      <div className="bg-white p-2 rounded-xl shadow-md shrink-0">
                        <img src={totpData.qr_code_url} alt="2FA QR Code" className="w-28 h-28 object-contain" />
                      </div>
                      <div className="space-y-2 text-[11px] text-slate-300">
                        <ol className="list-decimal list-inside space-y-1 text-slate-400">
                          <li>Buka <strong className="text-slate-200">Google Authenticator</strong> / <strong className="text-slate-200">Authy</strong>.</li>
                          <li>Pindai QR Code atau masukkan Secret Key.</li>
                          <li>Masukkan 6 digit kode token di bawah.</li>
                        </ol>
                        <div className="pt-1 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-amber-300 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/50 truncate max-w-[130px]">
                            {totpData.secret_key}
                          </span>
                          <button
                            type="button"
                            onClick={handleCopySecret}
                            className="text-[10px] font-bold px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded transition-colors flex items-center gap-1 cursor-pointer shrink-0"
                          >
                            {copiedSecret ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                            <span>{copiedSecret ? "Tersalin!" : "Salin Key"}</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TOTP Input Form */}
                <form onSubmit={handleVerify2Fa} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="totp-code" className="text-xs font-semibold text-slate-300 flex items-center justify-between font-['Manrope']">
                      <span>Kode Verification Token (6 Digit)</span>
                      <span className="text-[10px] text-emerald-400 font-mono">AUTHENTICATOR APP</span>
                    </Label>
                    <div className="relative">
                      <Input
                        id="totp-code"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={6}
                        autoFocus
                        value={totpCode}
                        onChange={(e) => {
                          setTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6));
                          if (totpError) setTotpError("");
                        }}
                        placeholder="000 000"
                        className="text-center tracking-[0.5em] text-xl font-mono font-bold bg-slate-950/90 border-slate-700 text-emerald-400 placeholder:text-slate-700 focus:border-emerald-500 focus:ring-emerald-500/20 h-12 rounded-xl"
                      />
                    </div>
                    {totpError && (
                      <p className="text-[11px] text-rose-400 flex items-center gap-1 font-['Manrope']">
                        <WarningCircle size={14} /> {totpError}
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={loading || totpCode.length < 6}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold h-11 text-xs uppercase tracking-wider transition-all shadow-lg shadow-emerald-600/20 cursor-pointer disabled:opacity-50 rounded-xl"
                  >
                    {loading ? "Memverifikasi Kode..." : "Verifikasi & Masuk Dashboard Super Admin"}
                  </Button>

                  <button
                    type="button"
                    onClick={() => {
                      setIs2FaMode(false);
                      setTotpCode("");
                      setTotpError("");
                    }}
                    className="w-full text-center text-xs text-slate-400 hover:text-slate-200 transition-colors py-2 cursor-pointer font-['Manrope']"
                  >
                    &larr; Batal / Kembali ke Form Login
                  </button>
                </form>
              </div>
            ) : !isForgotMode ? (
              /* LOGIN MODE */
              <>
                {/* Header / Branding */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-3">
                    <TrexioLogo variant="icon" size="xl" />
                  </div>
                  <div className="text-[11px] font-mono font-bold tracking-widest text-emerald-400 uppercase mb-1">
                    TREXIO CONTROL CENTER
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-['Cabinet_Grotesk']">
                    Portal Administrasi
                  </h1>
                  <p className="mt-1.5 text-xs text-slate-400 font-['Manrope']">
                    Masuk untuk mengelola tenant, booking, katalog, dan sistem TREXIO.
                  </p>
                </div>

                {/* Server Error Alert */}
                {serverError && (
                  <div
                    data-testid="admin-login-error"
                    className="mb-6 p-3.5 rounded-xl bg-rose-950/80 border border-rose-800/80 text-rose-200 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-2"
                  >
                    <WarningCircle size={18} className="text-rose-400 shrink-0 mt-0.5" />
                    <div className="flex-1 leading-relaxed">{serverError}</div>
                  </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmitLogin} data-testid="admin-login-form" className="space-y-5">
                  {/* Email Field */}
                  <div className="space-y-1.5">
                    <Label htmlFor="admin-email" className="text-xs font-semibold text-slate-300 font-['Manrope'] flex justify-between">
                      <span>Email Administrator</span>
                      <span className="text-[10px] text-slate-500 font-mono">REQUIRED</span>
                    </Label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <EnvelopeSimple size={18} />
                      </div>
                      <Input
                        id="admin-email"
                        data-testid="admin-login-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                        }}
                        placeholder="admin@trexio.id"
                        autoComplete="email"
                        disabled={loading}
                        className={`pl-10 bg-slate-950/80 border text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-['Manrope'] text-sm h-11 rounded-xl transition-all ${
                          fieldErrors.email ? "border-rose-500/80 focus-visible:ring-rose-500" : "border-slate-800"
                        }`}
                      />
                    </div>
                    {fieldErrors.email && (
                      <p className="text-[11px] text-rose-400 font-['Manrope']">{fieldErrors.email}</p>
                    )}
                  </div>

                  {/* Password Field */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="admin-password" className="text-xs font-semibold text-slate-300 font-['Manrope']">
                        Kata Sandi
                      </Label>
                      <button
                        type="button"
                        data-testid="admin-forgot-password-link"
                        onClick={handleOpenForgot}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors font-['Manrope'] hover:underline"
                      >
                        Lupa Kata Sandi?
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <Lock size={18} />
                      </div>
                      <Input
                        id="admin-password"
                        data-testid="admin-login-password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (fieldErrors.password) setFieldErrors({ ...fieldErrors, password: "" });
                        }}
                        placeholder="••••••••"
                        autoComplete="current-password"
                        disabled={loading}
                        className={`pl-10 pr-10 bg-slate-950/80 border text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-['Manrope'] text-sm h-11 rounded-xl transition-all ${
                          fieldErrors.password ? "border-rose-500/80 focus-visible:ring-rose-500" : "border-slate-800"
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                      >
                        {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                    {fieldErrors.password && (
                      <p className="text-[11px] text-rose-400 font-['Manrope']">{fieldErrors.password}</p>
                    )}
                  </div>

                  {/* Remember Me Toggle */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 hover:text-slate-300 select-none">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded bg-slate-950 border-slate-700 text-emerald-500 focus:ring-emerald-500/30 h-4 w-4"
                      />
                      <span>Ingat sesi di perangkat ini</span>
                    </label>
                    <span className="text-[11px] font-mono text-emerald-400/80 flex items-center gap-1">
                      <ShieldWarning size={12} /> SSL 256-Bit
                    </span>
                  </div>

                  {/* Submit Button */}
                  <Button
                    data-testid="admin-login-submit"
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-sm transition-all duration-200 shadow-lg shadow-emerald-950/40 font-['Manrope'] flex items-center justify-center gap-2 mt-2 cursor-pointer disabled:opacity-60"
                  >
                    {loading ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Memverifikasi Kredensial...</span>
                      </>
                    ) : (
                      <>
                        <Key size={18} />
                        <span>Otorisasi Admin</span>
                      </>
                    )}
                  </Button>
                </form>
              </>
            ) : (
              /* FORGOT PASSWORD MODE */
              <div className="animate-in fade-in duration-300">
                {/* Header */}
                <div className="text-center mb-6">
                  <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-800/80 border border-slate-700 text-amber-400 shadow-inner mb-3">
                    <ArrowCounterClockwise weight="bold" size={30} />
                  </div>
                  <div className="text-[11px] font-mono font-bold tracking-widest text-amber-400 uppercase mb-1">
                    ACCOUNT RECOVERY
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-white font-['Cabinet_Grotesk']">
                    {forgotStep === "request" && "Pemulihan Kata Sandi"}
                    {forgotStep === "reset" && "Atur Kata Sandi Baru"}
                    {forgotStep === "success" && "Pemulihan Selesai"}
                  </h2>
                  <p className="mt-1 text-xs text-slate-400 font-['Manrope']">
                    {forgotStep === "request" && "Masukkan email administrator untuk menerima petunjuk reset."}
                    {forgotStep === "reset" && "Masukkan kode otorisasi dan buat kata sandi baru Anda."}
                    {forgotStep === "success" && "Kata sandi Anda telah diperbarui dan siap digunakan."}
                  </p>
                </div>

                {/* STEP 1: Request Reset Link */}
                {forgotStep === "request" && (
                  <form onSubmit={handleRequestReset} data-testid="admin-forgot-password-form" className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="admin-forgot-email" className="text-xs font-semibold text-slate-300 font-['Manrope']">
                        Email / Nomor WhatsApp Administrator
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <EnvelopeSimple size={18} />
                        </div>
                        <Input
                          id="admin-forgot-email"
                          data-testid="admin-forgot-email-input"
                          type="text"
                          value={forgotEmail}
                          onChange={(e) => {
                            setForgotEmail(e.target.value);
                            setForgotEmailError("");
                          }}
                          placeholder="admin@trexio.id atau 081234567890"
                          disabled={forgotLoading}
                          className={`pl-10 bg-slate-950/80 border text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-['Manrope'] text-sm h-11 rounded-xl ${
                            forgotEmailError ? "border-rose-500" : "border-slate-800"
                          }`}
                        />
                      </div>
                      {forgotEmailError && (
                        <p className="text-[11px] text-rose-400 font-['Manrope']">{forgotEmailError}</p>
                      )}
                    </div>

                    {/* Method Selector */}
                    <div className="space-y-1.5 font-['Manrope']">
                      <Label className="text-xs font-semibold text-slate-300 block">Metode Pengiriman OTP</Label>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setForgotMethod("email")}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            forgotMethod === "email"
                              ? "bg-amber-500/10 border-amber-500/50 text-amber-300 font-bold"
                              : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <EnvelopeSimple size={16} />
                          <span>Verifikasi Email</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setForgotMethod("whatsapp")}
                          className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                            forgotMethod === "whatsapp"
                              ? "bg-emerald-500/10 border-emerald-500/50 text-emerald-400 font-bold"
                              : "bg-slate-950/50 border-slate-800 text-slate-400 hover:text-slate-200"
                          }`}
                        >
                          <WhatsappLogo size={16} className="text-emerald-500" />
                          <span>OTP WhatsApp</span>
                        </button>
                      </div>
                    </div>

                    <div className="p-3 bg-slate-950/60 border border-slate-800/80 rounded-xl text-[11px] text-slate-400 space-y-1 font-['Manrope']">
                      <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                        <ShieldWarning size={14} className="text-amber-400 shrink-0" />
                        Akses Pemulihan Terproteksi
                      </div>
                      <p>
                        Tautan verifikasi akan dikirimkan ke email terdaftar. Hubungi Tim Security jika Anda kehilangan akses email.
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        type="submit"
                        data-testid="admin-forgot-submit-button"
                        disabled={forgotLoading}
                        className="w-full h-11 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-950/30 font-['Manrope'] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <>
                            <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                            <span>Mengirim Instruksi...</span>
                          </>
                        ) : (
                          <>
                            <PaperPlaneRight size={18} weight="bold" />
                            <span>Kirim Kode Pemulihan</span>
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        data-testid="admin-forgot-back-button"
                        onClick={handleBackToLogin}
                        className="w-full h-10 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-all font-['Manrope'] flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft size={14} />
                        <span>Kembali ke Halaman Login</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 2: Input Reset Token & New Password */}
                {forgotStep === "reset" && (
                  <form onSubmit={handleConfirmReset} data-testid="admin-reset-password-form" className="space-y-4">
                    <div className="p-3 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-xs text-emerald-200 flex items-start gap-2.5">
                      <CheckCircle size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                      <div>
                        Kode verifikasi pemulihan OTP telah dikirimkan ke <span className="font-bold text-white">{forgotEmail}</span>. Silakan periksa pesan Anda.
                      </div>
                    </div>

                    {/* Reset Token Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="reset-token" className="text-xs font-semibold text-slate-300 font-['Manrope']">
                        Kode Verifikasi (OTP Token)
                      </Label>
                      <Input
                        id="reset-token"
                        data-testid="admin-reset-token-input"
                        type="text"
                        value={resetToken}
                        onChange={(e) => {
                          setResetToken(e.target.value);
                          if (resetErrors.token) setResetErrors({ ...resetErrors, token: "" });
                        }}
                        placeholder="TRX-XXXX"
                        className={`bg-slate-950/80 border font-mono text-sm h-11 rounded-xl text-emerald-400 tracking-wider ${
                          resetErrors.token ? "border-rose-500" : "border-slate-800"
                        }`}
                      />
                      {resetErrors.token && (
                        <p className="text-[11px] text-rose-400 font-['Manrope']">{resetErrors.token}</p>
                      )}
                    </div>

                    {/* New Password Input */}
                    <div className="space-y-1.5">
                      <Label htmlFor="new-password" className="text-xs font-semibold text-slate-300 font-['Manrope']">
                        Kata Sandi Baru
                      </Label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                          <Lock size={18} />
                        </div>
                        <Input
                          id="new-password"
                          data-testid="admin-reset-new-password-input"
                          type={showNewPassword ? "text" : "password"}
                          value={newPassword}
                          onChange={(e) => {
                            setNewPassword(e.target.value);
                            if (resetErrors.password) setResetErrors({ ...resetErrors, password: "" });
                          }}
                          placeholder="Minimal 6 karakter"
                          className={`pl-10 pr-10 bg-slate-950/80 border text-slate-100 placeholder:text-slate-600 focus-visible:ring-emerald-500 font-['Manrope'] text-sm h-11 rounded-xl ${
                            resetErrors.password ? "border-rose-500" : "border-slate-800"
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPassword(!showNewPassword)}
                          tabIndex={-1}
                          className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {resetErrors.password && (
                        <p className="text-[11px] text-rose-400 font-['Manrope']">{resetErrors.password}</p>
                      )}
                    </div>

                    <div className="pt-2 space-y-2">
                      <Button
                        type="submit"
                        data-testid="admin-reset-submit-button"
                        disabled={forgotLoading}
                        className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 font-['Manrope'] flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {forgotLoading ? (
                          <>
                            <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            <span>Memperbarui Kata Sandi...</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle size={18} />
                            <span>Simpan Kata Sandi Baru</span>
                          </>
                        )}
                      </Button>

                      <button
                        type="button"
                        onClick={() => setForgotStep("request")}
                        className="w-full h-10 bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 rounded-xl text-xs font-semibold transition-all font-['Manrope'] flex items-center justify-center gap-1.5"
                      >
                        <ArrowLeft size={14} />
                        <span>Kembali ke Langkah Sebelumnya</span>
                      </button>
                    </div>
                  </form>
                )}

                {/* STEP 3: Reset Success */}
                {forgotStep === "success" && (
                  <div className="text-center space-y-5">
                    <div className="p-4 bg-emerald-950/80 border border-emerald-800/80 rounded-2xl text-emerald-200 space-y-2">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-emerald-600 text-white font-bold mb-1">
                        <CheckCircle size={28} weight="bold" />
                      </div>
                      <h3 className="font-bold text-base text-white font-['Cabinet_Grotesk']">
                        Kata Sandi Berhasil Diperbarui
                      </h3>
                      <p className="text-xs text-slate-300 font-['Manrope']">
                        Kata sandi baru untuk <span className="font-mono text-emerald-300">{forgotEmail}</span> telah aktif.
                      </p>
                    </div>

                    <Button
                      type="button"
                      onClick={handleFinishAndLogin}
                      className="w-full h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm transition-all shadow-lg shadow-emerald-950/40 font-['Manrope'] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Key size={18} />
                      <span>Masuk dengan Kata Sandi Baru</span>
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Security Footer Notice */}
          <div className="mt-6 text-center space-y-2">
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500 font-mono">
              <span className="flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-500" /> Session Encryption
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <CheckCircle size={12} className="text-emerald-500" /> Audit Log Active
              </span>
            </div>
            <p className="text-[11px] text-slate-600">
              Akses khusus untuk administrator TREXIO yang terverifikasi.
            </p>
          </div>
        </div>
      </main>

      {/* Footer copyright */}
      <footer className="p-4 text-center text-[11px] text-slate-600 border-t border-slate-900">
        © {new Date().getFullYear()} TREXIO Indonesia. All rights reserved.
      </footer>
    </div>
  );
}

