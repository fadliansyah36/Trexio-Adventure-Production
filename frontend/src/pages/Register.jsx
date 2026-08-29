import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import SocialAuthModal from "@/components/auth/SocialAuthModal";
import { Eye, EyeSlash } from "@phosphor-icons/react";

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Social Modal state
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState("google");

  const passwordsMatch = form.confirmPassword === "" || form.password === form.confirmPassword;

  async function submit(e) {
    e.preventDefault();
    if (form.password.length < 6) {
      return toast.error("Password minimal 6 karakter");
    }
    if (form.password !== form.confirmPassword) {
      return toast.error("Konfirmasi password tidak cocok dengan password!");
    }

    setLoading(true);
    try {
      // Exclude confirmPassword from registration payload
      const { confirmPassword, ...registerPayload } = form;
      await register(registerPayload);
      toast.success("Akun berhasil dibuat!");
      nav("/");
    } catch (e) {
      toast.error(
        formatApiError(e.response?.data?.detail) || "Gagal mendaftar",
      );
    } finally {
      setLoading(false);
    }
  }

  function handleOpenSocial(provider) {
    setSocialProvider(provider);
    setSocialModalOpen(true);
  }

  function handleAuthSuccess() {
    nav("/");
  }

  return (
    <div className="min-h-[calc(100vh-160px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="flex items-center justify-center p-8 md:p-12 order-2 lg:order-1">
        <form
          onSubmit={submit}
          className="w-full max-w-sm"
          data-testid="register-form"
        >
          <Link to="/" aria-label="Trexio Beranda" className="inline-block mb-6">
            <TrexioLogo variant="horizontal" size="md" showTagline={true} />
          </Link>
          <h1 className="mt-8 text-3xl font-black tracking-tighter">
            Daftar akun
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Gratis dan cuma butuh 30 detik.
          </p>
          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="reg-name">Nama lengkap</Label>
              <Input
                id="reg-name"
                data-testid="register-name"
                autoComplete="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nama Lengkap Anda"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-email">Email</Label>
              <Input
                id="reg-email"
                data-testid="register-email"
                type="email"
                autoComplete="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="email@domain.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-phone">Nomor HP / WhatsApp</Label>
              <Input
                id="reg-phone"
                data-testid="register-phone"
                type="tel"
                autoComplete="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="081234567890"
              />
            </div>
            <div>
              <Label htmlFor="reg-password">Kata sandi (min. 6 karakter)</Label>
              <div className="relative mt-1">
                <Input
                  id="reg-password"
                  data-testid="register-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan Kata Sandi" : "Tampilkan Kata Sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <Label htmlFor="reg-confirm-password">Konfirmasi kata sandi</Label>
              <div className="relative mt-1">
                <Input
                  id="reg-confirm-password"
                  data-testid="register-confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={`pr-10 ${
                    !passwordsMatch ? "border-red-500 focus:ring-red-500" : ""
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? "Sembunyikan Konfirmasi Kata Sandi" : "Tampilkan Konfirmasi Kata Sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  {showConfirmPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {!passwordsMatch && (
                <p className="mt-1 text-xs text-red-500 font-semibold" data-testid="password-mismatch-error">
                  Konfirmasi kata sandi tidak cocok.
                </p>
              )}
            </div>
          </div>
          <Button
            data-testid="register-submit"
            type="submit"
            disabled={loading || !passwordsMatch}
            className="mt-6 w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-md cursor-pointer"
          >
            {loading ? "Memproses..." : "Buat Akun"}
          </Button>

          {/* Social Auth Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-background px-2 text-muted-foreground">Atau Daftar Dengan</span>
            </div>
          </div>

          <div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={loading}
              onClick={() => handleOpenSocial("google")}
              className="w-full text-xs font-semibold rounded-xl border border-input py-2.5 hover:bg-emerald-500/10 hover:text-emerald-600 flex items-center justify-center gap-2 cursor-pointer"
            >
              <div className="w-4 h-4 rounded-full bg-emerald-600 text-white font-black text-[10px] flex items-center justify-center">
                G
              </div>
              Lanjutkan dengan Google
            </Button>
          </div>

          <p className="mt-6 text-sm text-center text-muted-foreground">
            Sudah punya akun?{" "}
            <Link
              to="/login"
              className="text-[hsl(var(--secondary))] font-semibold hover:underline"
            >
              Masuk
            </Link>
          </p>
        </form>
      </div>

      {/* Social Account Selector Modal */}
      <SocialAuthModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        provider="google"
        mode="register"
        onSuccess={handleAuthSuccess}
      />

      <div className="hidden lg:block relative order-1 lg:order-2">
        <img
          src="https://images.unsplash.com/photo-1713323738386-12d82fe87db4?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA1ODh8MHwxfHNlYXJjaHwxfHxoaWtpbmclMjBiYWNrcGFja2VyJTIwZm9yZXN0fGVufDB8fHx8MTc4NDUxNDc2N3ww&ixlib=rb-4.1.0&q=85"
          className="absolute inset-0 h-full w-full object-cover"
          alt="Eksplorasi Pendaki Trexio"
        />
        <div className="absolute inset-0 bg-gradient-to-bl from-[hsl(var(--primary))]/50 to-transparent" />
      </div>
    </div>
  );
}
