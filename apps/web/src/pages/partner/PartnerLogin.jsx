import { useState } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { api, formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Storefront,
  Buildings,
  ShieldCheck,
  ArrowRight,
  LockKey,
  EnvelopeSimple,
  Sparkle,
} from "@phosphor-icons/react";
import ForgotPasswordModal from "@/components/auth/ForgotPasswordModal";

export default function PartnerLogin() {
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const { setUser } = useAuth();
  const [partnerType, setPartnerType] = useState(searchParams.get("type") || "vendor"); // 'vendor' | 'tenant'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotModalOpen, setForgotModalOpen] = useState(false);

  async function handlePartnerLogin(e, customEmail, customPass) {
    if (e) e.preventDefault();
    const targetEmail = customEmail || email;
    const targetPass = customPass || password;

    if (!targetEmail.trim() || !targetPass.trim()) {
      return toast.error("Email dan password wajib diisi");
    }

    setLoading(true);
    try {
      localStorage.removeItem("trexio-has-logged-out");
      const { data } = await api.post("/partner/login", {
        email: targetEmail,
        password: targetPass,
        partner_type: partnerType,
      });

      const token = data?.access_token || data?.token;
      if (token) {
        localStorage.setItem("trexio-token", token);
      }

      toast.success(data.message || "Login Mitra Berhasil!");
      if (data.user) setUser(data.user);
      nav(data.redirect_url || (partnerType === "tenant" ? "/admin" : "/vendor"));
    } catch (err) {
      toast.error(formatApiError(err.response?.data?.detail) || "Gagal melakukan login mitra");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center py-12 px-4 sm:px-6">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20">
            <ShieldCheck size={16} weight="fill" /> Portal Login Mitra & Tenant
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Masuk ke Dashboard
          </h1>
          <p className="text-xs text-muted-foreground">
            Akses statistik penjualan, manajemen trip, & operasional platform Anda.
          </p>
        </div>

        {/* Partner Type Selector */}
        <div className="bg-muted p-1 rounded-xl border border-border grid grid-cols-2 gap-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setPartnerType("vendor")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              partnerType === "vendor"
                ? "bg-background text-foreground shadow-xs border border-border font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Storefront size={16} className="text-emerald-500" /> Vendor / Organizer
          </button>

          <button
            type="button"
            onClick={() => setPartnerType("tenant")}
            className={`py-2 px-3 rounded-lg flex items-center justify-center gap-2 transition-all ${
              partnerType === "tenant"
                ? "bg-background text-foreground shadow-xs border border-border font-bold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Buildings size={16} className="text-blue-500" /> Tenant Platform
          </button>
        </div>

        {/* Form Card */}
        <div className="bg-card border border-border rounded-2xl p-6 shadow-sm space-y-5">
          <form onSubmit={handlePartnerLogin} className="space-y-4">
            <div>
              <Label className="font-semibold text-xs mb-1 block">Email Akun Mitra</Label>
              <div className="relative">
                <EnvelopeSimple size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="email@partner.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 bg-background text-xs"
                  required
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="font-semibold text-xs block">Password Akun</Label>
                <button
                  type="button"
                  data-testid="partner-forgot-password-link"
                  onClick={() => setForgotModalOpen(true)}
                  className="text-xs text-emerald-600 dark:text-emerald-400 font-bold hover:underline cursor-pointer"
                >
                  Lupa Kata Sandi?
                </button>
              </div>
              <div className="relative">
                <LockKey size={16} className="absolute left-3 top-3 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-9 bg-background text-xs"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className={`w-full h-11 text-white font-bold text-xs rounded-xl shadow-xs flex items-center justify-center gap-2 ${
                partnerType === "tenant"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-emerald-700 hover:bg-emerald-800"
              }`}
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Memverifikasi Akun...
                </>
              ) : (
                <>
                  Masuk ke Dashboard {partnerType === "tenant" ? "Tenant" : "Vendor"}{" "}
                  <ArrowRight size={16} weight="bold" />
                </>
              )}
            </Button>
          </form>

          <div className="pt-4 border-t border-border text-center text-xs text-muted-foreground space-y-2">
            <div>
              Belum terdaftar sebagai mitra?{" "}
              <Link to="/partner/register" className="text-emerald-600 font-bold hover:underline">
                Daftar Vendor & Tenant Di Sini
              </Link>
            </div>
            <div>
              <Link to="/" className="text-muted-foreground hover:text-foreground text-[11px]">
                ← Kembali ke Halaman Utama TREXIO
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        open={forgotModalOpen}
        onOpenChange={setForgotModalOpen}
        initialIdentifier={email}
      />
    </div>
  );
}
