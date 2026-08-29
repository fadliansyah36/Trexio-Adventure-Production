import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { formatApiError } from "@/lib/api";
import { Crown, Sparkle, Eye, EyeSlash } from "@phosphor-icons/react";
import { TrexioLogo } from "@/components/site/TrexioLogo";
import SocialAuthModal from "@/components/auth/SocialAuthModal";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Social & Forgot Modals state
  const [socialModalOpen, setSocialModalOpen] = useState(false);
  const [socialProvider, setSocialProvider] = useState("google");
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const resUser = await login(email, password);
      if (resUser?.requires_2fa) {
        toast.info("Akun Super Admin memerlukan Otorisasi 2FA Authenticator.");
        nav(`/admin/login?next=${encodeURIComponent(params.get("next") || "/super")}`);
        return;
      }
      toast.success("Selamat datang kembali!");
      const roles = resUser?.roles || (resUser?.role ? [resUser.role] : []);
      if (params.get("next")) {
        nav(params.get("next"));
      } else if (roles.includes("super_admin")) {
        nav("/super");
      } else if (roles.includes("admin")) {
        nav("/admin");
      } else {
        nav("/");
      }
    } catch (e) {
      toast.error(formatApiError(e.response?.data?.detail) || "Login gagal");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenSocial(provider) {
    setSocialProvider(provider);
    setSocialModalOpen(true);
  }

  function handleAuthSuccess() {
    nav(next);
  }

  return (
    <div className="min-h-[calc(100vh-160px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img
          src="https://images.pexels.com/photos/1687514/pexels-photo-1687514.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940"
          className="absolute inset-0 h-full w-full object-cover"
          alt="Eksplorasi Pendaki Trexio"
        />
        <div className="absolute inset-0 bg-gradient-to-tr from-[hsl(var(--secondary))]/70 to-transparent" />
        <div className="relative p-12 text-white h-full flex flex-col justify-end">
          <div className="trx-overline opacity-80">TREXIO</div>
          <div className="mt-2 text-4xl font-black tracking-tighter max-w-sm">
            Mulai eksplorasi berikutnya.
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center p-8 md:p-12">
        <form
          onSubmit={submit}
          className="w-full max-w-sm"
          data-testid="login-form"
        >
          <Link to="/" aria-label="Trexio Beranda" className="inline-block mb-6">
            <TrexioLogo variant="horizontal" size="md" showTagline={true} />
          </Link>
          <h1 className="mt-8 text-3xl font-black tracking-tighter">
            Selamat datang
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Masuk untuk mengelola sistem atau melanjutkan booking petualangan.
          </p>

          <div className="mt-6 space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                data-testid="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@email.com"
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="password">Kata sandi</Label>
                <button
                  type="button"
                  data-testid="login-forgot-password-link"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-[hsl(var(--secondary))] hover:underline font-semibold cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative mt-1">
                <Input
                  id="password"
                  data-testid="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
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
          </div>

          <Button
            data-testid="login-submit"
            type="submit"
            disabled={loading}
            className="mt-6 w-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white rounded-md trx-btn-press cursor-pointer"
          >
            {loading ? "Memproses..." : "Masuk"}
          </Button>

          {/* Social Auth Section */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-wider">
              <span className="bg-background px-2 text-muted-foreground">Atau Masuk Dengan</span>
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
            Belum punya akun?{" "}
            <Link
              to="/register"
              className="text-[hsl(var(--secondary))] font-semibold hover:underline"
            >
              Daftar sekarang
            </Link>
          </p>

          <div className="mt-4 pt-4 border-t border-border/60 text-center">
            <Link
              to="/partner/login"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
            >
              <span>Masuk sebagai Vendor?</span>
              <span className="text-[hsl(var(--secondary))] underline">Portal Vendor →</span>
            </Link>
          </div>
        </form>
      </div>

      {/* Social Account Selector Modal */}
      <SocialAuthModal
        open={socialModalOpen}
        onOpenChange={setSocialModalOpen}
        provider="google"
        mode="login"
        onSuccess={handleAuthSuccess}
      />

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={forgotModalOpen}
        onOpenChange={setForgotModalOpen}
        initialIdentifier={email}
      />
    </div>
  );
}
