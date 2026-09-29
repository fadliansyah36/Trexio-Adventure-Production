import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { ShieldCheck } from "@phosphor-icons/react";

export default function SocialAuthModal({
  open,
  onOpenChange,
  mode = "login",
  onSuccess,
}) {
  const { loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleGoogleOAuth = async () => {
    setLoading(true);
    try {
      const res = await loginWithGoogle();
      toast.success(`Berhasil ${mode === "register" ? "mendaftar" : "masuk"} dengan Google!`, {
        description: `Akun: ${res?.email || "Google"}`,
      });
      onOpenChange(false);
      if (onSuccess) onSuccess(res?.user || res);
    } catch (e) {
      toast.error(`Gagal autentikasi via Google`, {
        description: e?.response?.data?.detail || e?.message || "Silakan coba lagi.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-2xl p-6 border-border shadow-2xl bg-card">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-slate-200 flex items-center justify-center font-black text-emerald-600 text-base">
              G
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              {mode === "register" ? "Daftar Akun" : "Masuk"} via Google
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            Hubungkan akun Google Anda secara resmi untuk {mode === "register" ? "pendaftaran" : "login"} cepat dan terenkripsi.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div className="p-4 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs text-muted-foreground leading-relaxed">
            Pilih opsi masuk menggunakan akun Google resmi. Identitas Anda akan diverifikasi oleh Google OAuth secara aman.
          </div>

          <Button
            type="button"
            onClick={handleGoogleOAuth}
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs py-3 shadow-md flex items-center justify-center gap-2 cursor-pointer"
          >
            <div className="w-5 h-5 rounded-full bg-white text-emerald-700 font-black text-xs flex items-center justify-center">
              G
            </div>
            {loading ? "Menghubungkan ke Google..." : `Lanjutkan dengan Google Account (${mode === "register" ? "Daftar" : "Login"})`}
          </Button>

          <div className="pt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
            <ShieldCheck size={14} className="text-emerald-500" /> Supabase Authentication & Google OAuth 2.0 Resmi Terenkripsi
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
