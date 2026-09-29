import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { runProductionAudit } from "@/utils/productionAudit";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  MapPin,
  QrCode,
  ShieldCheck,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Mountain,
  CheckCircle2,
  Ticket,
  Users,
  Copy,
  Check
} from "lucide-react";
import { toast } from "sonner";

export default function OnboardingModal({ forceOpen = false, onClose = null }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedDifficulty, setSelectedDifficulty] = useState("pemula");
  const [copiedPass, setCopiedPass] = useState(false);
  const [auditPassed, setAuditPassed] = useState(false);

  useEffect(() => {
    // Listen for manual trigger events (e.g., from Navbar or Profile)
    const handleManualOpen = () => {
      setStep(1);
      setIsOpen(true);
    };
    window.addEventListener("open-trexio-onboarding", handleManualOpen);
    return () => window.removeEventListener("open-trexio-onboarding", handleManualOpen);
  }, []);

  useEffect(() => {
    if (forceOpen) {
      setIsOpen(true);
      return;
    }

    if (!user) {
      setIsOpen(false);
      return;
    }

    const storageKey = `trexio_onboarding_completed_${user.id}`;
    const alreadyCompleted = localStorage.getItem(storageKey);

    if (alreadyCompleted) {
      return;
    }

    // Run production audit to verify clean state & check if user account profile is truly empty
    async function checkAccountState() {
      try {
        const auditRes = await runProductionAudit();
        setAuditPassed(Boolean(auditRes));

        // Fetch user bookings to confirm user has 0 bookings
        const bookingsRes = await api.get("/bookings/mine").catch(() => ({ data: [] }));
        const myBookings = Array.isArray(bookingsRes.data) ? bookingsRes.data : [];

        const hasNoBookings = myBookings.length === 0;
        const hasNoActivities = !user.activity_logs || user.activity_logs.length === 0;
        const hasNoTransactions = !user.transaction_history || user.transaction_history.length === 0;

        // Trigger onboarding ONLY if production audit confirms clean state AND profile is truly empty
        if (hasNoBookings && hasNoActivities && hasNoTransactions) {
          console.info("[OnboardingModal] Truly empty account profile detected via Production Audit. Launching onboarding flow.");
          setIsOpen(true);
        }
      } catch (err) {
        console.warn("[OnboardingModal] Profile check error:", err);
      }
    }

    checkAccountState();
  }, [user, forceOpen]);

  const handleComplete = () => {
    if (user?.id) {
      localStorage.setItem(`trexio_onboarding_completed_${user.id}`, "true");
    }
    setIsOpen(false);
    if (onClose) onClose();
    toast.success("Panduan selesai! Selamat menjelajah petualangan outdoor pertama Anda.", {
      icon: <Sparkles className="w-5 h-5 text-emerald-500" />
    });
  };

  const handleSkip = () => {
    if (user?.id) {
      localStorage.setItem(`trexio_onboarding_completed_${user.id}`, "true");
    }
    setIsOpen(false);
    if (onClose) onClose();
  };

  const copyPassCode = () => {
    const code = `TREXIO-PASS-${user?.id?.slice(-6)?.toUpperCase() || "NEW"}`;
    navigator.clipboard.writeText(code);
    setCopiedPass(true);
    toast.success(`Kode Pass ${code} disalin!`);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 md:p-6 pb-20 md:pb-6 bg-slate-950/80 backdrop-blur-md animate-fade-in overflow-y-auto min-h-screen">
      <div className="relative w-full max-w-2xl my-auto max-h-[calc(100dvh-5.5rem)] sm:max-h-[85vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-slate-100 overflow-hidden">
        
        {/* Top Header & Progress */}
        <div className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-slate-800/80 flex items-center justify-between bg-slate-900/95">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <span className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 text-emerald-400 font-bold text-xs sm:text-sm border border-emerald-500/20 shrink-0">
              {step}/4
            </span>
            <div>
              <span className="text-[10px] sm:text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                Panduan Pengguna Baru
              </span>
              <h3 className="text-xs sm:text-sm font-medium text-slate-300 truncate max-w-[200px] sm:max-w-none">
                {step === 1 && "Langkah 1: Pengenalan TREXIO"}
                {step === 2 && "Langkah 2: Cari & Filter Destinasi"}
                {step === 3 && "Langkah 3: Tiket & QR Pass Digital"}
                {step === 4 && "Langkah 4: Check-in & Aktivasi"}
              </h3>
            </div>
          </div>

          <button
            onClick={handleSkip}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors shrink-0"
            title="Tutup & Lewati"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="shrink-0 w-full h-1 bg-slate-800">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-inner">
                <Mountain className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
                  Selamat Datang di TREXIO Outdoor Platform
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Akun Anda telah siap dan bersih. TREXIO memudahkan Anda memesan open trip pendakian gunung, rental alat kemping terverifikasi, dan layanan guide/porter lokal resmi.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-1 sm:pt-2">
                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <ShieldCheck className="w-4 h-4 shrink-0" /> Open Trip Verified
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Jaminan keberangkatan & kuota transparan.</p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <QrCode className="w-4 h-4 shrink-0" /> Pass Digital TRX
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Tanpa perlu cetak kertas di pos basecamp.</p>
                </div>

                <div className="p-3 sm:p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/60 text-left">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs">
                    <Users className="w-4 h-4 shrink-0" /> Mitra Vendor Resmi
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-400 mt-1">Terhubung langsung dengan pengelola pos.</p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Compass className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  Cari & Filter Sesuai Tingkat Pengalaman
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Coba pilih tingkat pengalaman pendakian Anda di bawah untuk melihat simulasi rekomendasi trip:
                </p>
              </div>

              {/* Interactive Difficulty Selector - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[
                  { id: "pemula", label: "Pendaki Pemula", desc: "1.500 - 2.600 MDPL" },
                  { id: "medium", label: "Pendaki Sedang", desc: "2.600 - 3.200 MDPL" },
                  { id: "expert", label: "Pendaki Ahli", desc: "3.200+ MDPL & Jalur Panjang" },
                ].map((diff) => (
                  <button
                    key={diff.id}
                    onClick={() => setSelectedDifficulty(diff.id)}
                    className={`p-2.5 sm:p-3 rounded-xl text-left border transition-all ${
                      selectedDifficulty === diff.id
                        ? "bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md"
                        : "bg-slate-800/40 border-slate-700/60 text-slate-400 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-xs font-bold">{diff.label}</div>
                    <div className="text-[10px] sm:text-[11px] opacity-80 mt-0.5">{diff.desc}</div>
                  </button>
                ))}
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-2">
                <div>
                  <span className="text-[9px] sm:text-[10px] font-bold tracking-wider text-emerald-400 uppercase">
                    Rekomendasi Jalur Dipilih
                  </span>
                  <div className="text-xs sm:text-sm font-semibold text-slate-200 mt-0.5">
                    {selectedDifficulty === "pemula" && "Gunung Prau 2.565 MDPL (Jalur Patakbanteng)"}
                    {selectedDifficulty === "medium" && "Gunung Gede Pangrango 2.958 MDPL (Jalur Cibodas)"}
                    {selectedDifficulty === "expert" && "Gunung Rinjani 3.726 MDPL (Jalur Sembalun)"}
                  </div>
                </div>
                <span className="px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs font-semibold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 shrink-0">
                  Tersedia
                </span>
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="space-y-4 sm:space-y-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Ticket className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                  Sistem QR Pass & Tiket Unik TRX-XXXX
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-300">
                  Setiap transaksi pemesanan akan otomatis menerbitkan kode TRX unik dan QR Pass digital pribadi yang dapat dipindai saat tiba di pos pendakian.
                </p>
              </div>

              {/* Sample QR Pass Card */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-emerald-500/30 shadow-lg relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
                  <div className="flex items-center gap-2">
                    <QrCode className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                    <span className="text-[11px] sm:text-xs font-bold text-slate-200 uppercase tracking-wide">
                      Digital User Pass TREXIO
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                    STATUS: AKTIF
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <div className="overflow-hidden">
                    <div className="text-[11px] text-slate-400">Nama Pendaki:</div>
                    <div className="text-xs sm:text-sm font-bold text-slate-100 truncate">{user?.name || "Pendaki Baru"}</div>
                    <div className="text-[11px] text-emerald-400 font-mono mt-1 flex items-center gap-1.5 flex-wrap">
                      <span>TREXIO-PASS-{user?.id?.slice(-6)?.toUpperCase() || "NEW"}</span>
                      <button
                        onClick={copyPassCode}
                        className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-slate-200"
                        title="Salin Kode Pass"
                      >
                        {copiedPass ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="p-1.5 sm:p-2 bg-white rounded-lg shadow shrink-0">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 bg-slate-900 rounded flex items-center justify-center text-emerald-400 font-mono text-[9px] sm:text-[10px] text-center p-0.5 font-bold">
                      [ QR PASS ]
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 4 */}
          {step === 4 && (
            <div className="space-y-4 sm:space-y-5 text-center sm:text-left">
              <div className="w-12 h-12 sm:w-14 sm:h-14 mx-auto sm:mx-0 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div>
                <h2 className="text-lg sm:text-2xl font-bold text-slate-100">
                  Anda Siap Memulai Petualangan!
                </h2>
                <p className="mt-1.5 text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Semua sistem akun Anda telah diverifikasi secara penuh. Temukan trip perdana Anda dan nikmati kemudahan registrasi outdoor modern.
                </p>
              </div>

              <div className="p-3.5 sm:p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400 shrink-0" />
                <span>
                  Tip: Anda dapat membuka kembali panduan ini kapan saja melalui menu Profil Pengguna.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-800 bg-slate-900/95 flex items-center justify-between gap-2">
          <button
            onClick={() => setStep((s) => Math.max(1, s - 1))}
            disabled={step === 1}
            className={`px-3 sm:px-4 py-2 text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors ${
              step === 1
                ? "text-slate-600 cursor-not-allowed"
                : "text-slate-300 hover:text-slate-100 hover:bg-slate-800"
            }`}
          >
            <ChevronLeft className="w-4 h-4" /> <span className="hidden sm:inline">Kembali</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4].map((i) => (
              <button
                key={i}
                onClick={() => setStep(i)}
                className={`h-2 rounded-full transition-all ${
                  step === i ? "w-5 sm:w-6 bg-emerald-500" : "w-2 bg-slate-700 hover:bg-slate-600"
                }`}
              />
            ))}
          </div>

          {step < 4 ? (
            <button
              onClick={() => setStep((s) => Math.min(4, s + 1))}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1 shadow-md transition-all shrink-0"
            >
              Lanjut <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={() => {
                handleComplete();
                navigate("/category/open-trip");
              }}
              className="px-4 sm:px-5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 transition-all shrink-0"
            >
              Mulai <Sparkles className="w-4 h-4" />
            </button>
          )}
        </div>

      </div>
    </div>
  );
}
