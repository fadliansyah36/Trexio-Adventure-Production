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
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { WhatsappLogo, ShieldCheck } from "@phosphor-icons/react";

export default function WhatsAppOtpModal({
  open,
  onOpenChange,
  mode = "login",
  initialPhone = "",
  onSuccess,
}) {
  const { sendOtp, verifyOtp } = useAuth();
  const [step, setStep] = useState(1); // 1: Enter phone, 2: Enter OTP
  const [phone, setPhone] = useState(initialPhone || "");
  const [name, setName] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer;
    if (countdown > 0) {
      timer = setInterval(() => setCountdown((c) => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!phone || phone.length < 8) {
      return toast.error("Masukkan nomor WhatsApp yang valid (minimal 8 digit)");
    }
    setLoading(true);
    try {
      const res = await sendOtp(phone, "WhatsApp");
      toast.success(res.message || `Kode OTP 6-digit berhasil dikirim ke WhatsApp ${phone}`);
      setStep(2);
      setCountdown(60);
      setOtpCode(""); // User enters real OTP code
    } catch (err) {
      toast.error("Gagal mengirim kode OTP ke WhatsApp", {
        description: err?.response?.data?.detail || "Pastikan nomor HP benar.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otpCode || otpCode.length < 4) {
      return toast.error("Masukkan 6-digit kode OTP secara lengkap");
    }
    setLoading(true);
    try {
      const res = await verifyOtp(otpCode, phone, name);
      toast.success(`Verifikasi WhatsApp Berhasil! Selamat Datang.`);
      onOpenChange(false);
      setStep(1);
      setOtpCode("");
      if (onSuccess) onSuccess(res?.user || res);
    } catch (err) {
      toast.error("Kode OTP salah atau telah kadaluarsa", {
        description: err?.response?.data?.detail || "Silakan cek kembali pesan WhatsApp Anda.",
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
            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <WhatsappLogo size={22} weight="fill" />
            </div>
            <DialogTitle className="text-xl font-black text-foreground">
              {mode === "register" ? "Daftar" : "Masuk"} via OTP WhatsApp
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-muted-foreground">
            {step === 1
              ? "Masukkan nomor WhatsApp aktif Anda untuk menerima kode OTP verifikasi 6-digit."
              : `Masukkan kode OTP 6-digit yang dikirimkan ke WhatsApp ${phone}.`}
          </DialogDescription>
        </DialogHeader>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="mt-4 space-y-4">
            <div className="space-y-3">
              <div>
                <Label className="text-xs font-semibold">Nama Lengkap (Opsional)</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nama Pemilik Akun"
                  className="mt-1 text-xs"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold">Nomor WhatsApp Aktif *</Label>
                <div className="relative mt-1 flex items-center">
                  <Input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Contoh: 081234567890"
                    className="text-xs font-mono font-bold"
                    required
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Pesan berisi kode verifikasi 6-digit akan dikirimkan langsung ke nomor ini.
                </p>
              </div>

              <Button
                type="submit"
                disabled={loading || !phone}
                className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs py-2.5 shadow-sm"
              >
                {loading ? "Mengirim Kode OTP..." : "Kirim Kode OTP WhatsApp →"}
              </Button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyOtp} className="mt-4 space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <WhatsappLogo size={20} className="text-emerald-600" weight="fill" />
                <div>
                  <div className="font-bold text-foreground">Pesan dikirim ke: {phone}</div>
                  <div className="text-[11px] text-muted-foreground">Kode berlaku selama 5 menit</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-[11px] text-emerald-600 font-bold hover:underline"
              >
                Ubah Nomor
              </button>
            </div>

            <div>
              <Label className="text-xs font-semibold">Kode OTP 6-Digit *</Label>
              <Input
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="123456"
                className="mt-1 text-center font-mono text-xl tracking-widest font-black h-12"
                maxLength={6}
                required
                autoFocus
              />

              <div className="mt-2 flex items-center justify-between text-[11px]">
                <span className="text-muted-foreground">Tidak menerima kode?</span>
                <button
                  type="button"
                  onClick={(e) => handleSendOtp(e)}
                  disabled={countdown > 0 || loading}
                  className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline disabled:opacity-50"
                >
                  {countdown > 0 ? `Kirim Ulang (${countdown}s)` : "Kirim Ulang Kode"}
                </button>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-1/3 rounded-xl text-xs"
                onClick={() => setStep(1)}
              >
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading || otpCode.length < 4}
                className="w-2/3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs"
              >
                {loading ? "Memverifikasi..." : "Verifikasi & Masuk →"}
              </Button>
            </div>

            <div className="pt-2 text-center text-[10px] text-muted-foreground flex items-center justify-center gap-1">
              <ShieldCheck size={14} className="text-emerald-500" /> Otentikasi WhatsApp 2FA Terenkripsi
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
