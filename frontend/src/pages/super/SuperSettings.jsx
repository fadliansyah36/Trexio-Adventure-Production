import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Gear,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Lightning,
  FloppyDisk,
  SlidersHorizontal,
  Plugs,
  Database,
  CloudCheck,
  QrCode,
  Key,
  CheckCircle,
  WarningCircle,
} from "@phosphor-icons/react";

export default function SuperSettings() {
  const [flags, setFlags] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // 2FA Management state
  const [twoFactorStatus, setTwoFactorStatus] = useState({ totp_enabled: false });
  const [qrCodeData, setQrCodeData] = useState(null);
  const [testTotpCode, setTestTotpCode] = useState("");
  const [testing2Fa, setTesting2Fa] = useState(false);

  useEffect(() => {
    api.get("/super/settings/feature-flags")
      .then((r) => setFlags(r.data || {}))
      .catch(() => toast.error("Gagal memuat feature flags"))
      .finally(() => setLoading(false));

    api.get("/auth/2fa/status")
      .then((r) => setTwoFactorStatus(r.data || {}))
      .catch(() => {});
  }, []);

  async function handleGenerateNew2Fa() {
    try {
      const { data } = await api.post("/auth/2fa/generate-secret");
      setQrCodeData(data);
      toast.success("Secret Key 2FA baru berhasil dibuat!");
    } catch (e) {
      toast.error("Gagal membuat Secret Key 2FA");
    }
  }

  async function handleConfirm2FaSetup() {
    if (!testTotpCode || testTotpCode.length < 6) {
      toast.error("Masukkan 6 digit kode dari aplikasi Authenticator");
      return;
    }
    setTesting2Fa(true);
    try {
      const { data } = await api.post("/auth/2fa/confirm-setup", { totp_code: testTotpCode });
      toast.success(data.message || "2FA Authenticator berhasil dikonfirmasi!");
      setTwoFactorStatus({ totp_enabled: true });
      setQrCodeData(null);
      setTestTotpCode("");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Kode 2FA tidak valid.");
    } finally {
      setTesting2Fa(false);
    }
  }

  function toggleFlag(key) {
    setFlags((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSaveFlags() {
    setSaving(true);
    try {
      const { data } = await api.post("/super/settings/feature-flags", flags);
      toast.success(data.message || "Feature flags platform berhasil diperbarui!");
    } catch (e) {
      toast.error("Gagal menyimpan feature flags");
    } finally {
      setSaving(false);
    }
  }

  const flagLabels = [
    { key: "wishlist", title: "Wishlist & Favorites Module", desc: "Aktifkan kemampuan traveler menyimpan trip favorit" },
    { key: "reviews", title: "User Reviews & Ratings Engine", desc: "Sistem ulasan & rating pasca trip selesai" },
    { key: "private_trip", title: "Private Trip Request Module", desc: "Layanan kustomisasi rombongan perjalanan privat" },
    { key: "rental", title: "Outdoor Equipment Rental Gear", desc: "Modul persewaan alat pendakian & camping" },
    { key: "camping", title: "Camping Ground & Basecamp Booking", desc: "Reservasi simaksi & tempat perkemahan" },
    { key: "featured_listing", title: "Featured Listing & Promotion", desc: "Sistem iklan berbayar promosi trip vendor" },
    { key: "promo_vouchers", title: "Platform Vouchers & Promos", desc: "Kode kupon diskon global Trexio" },
    { key: "disputes_resolution", title: "Dispute Mediation Center", desc: "Pusat mediasi perselisihan transaksi" },
  ];

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-neutral-900 to-neutral-900 border border-white/10 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-white/10 text-white border border-white/15">
            <Gear size={14} weight="fill" />
            <span>Platform Governance</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            Pengaturan Sistem & Dynamic Feature Flags
          </h1>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Aktifkan/nonaktifkan modul fitur secara runtime, pantau integrasi backend & kelola batas keamanan global platform Trexio.
          </p>
        </div>

        <button
          onClick={handleSaveFlags}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-xs font-extrabold shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} weight="bold" />
          <span>{saving ? "Menyimpan..." : "Simpan Feature Flags"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Feature Flags Grid */}
        <div className="md:col-span-2 bg-black/40 border border-white/10 p-6 rounded-2xl space-y-5">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <SlidersHorizontal size={18} className="text-amber-400" /> Control Module Feature Flags (Runtime)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {flagLabels.map((item) => {
              const isEnabled = !!flags[item.key];
              return (
                <div
                  key={item.key}
                  onClick={() => toggleFlag(item.key)}
                  className={`p-4 rounded-xl border flex items-start justify-between cursor-pointer transition-all ${
                    isEnabled
                      ? "bg-amber-950/20 border-amber-500/30 text-white"
                      : "bg-neutral-900/40 border-white/10 text-neutral-400 opacity-60"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="font-bold">{item.title}</div>
                    <div className="text-[10px] opacity-70 leading-relaxed">{item.desc}</div>
                  </div>
                  <div className="shrink-0 ml-3">
                    {isEnabled ? (
                      <ToggleRight size={28} className="text-amber-400" weight="fill" />
                    ) : (
                      <ToggleLeft size={28} className="text-neutral-600" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* System Integrations Health */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Plugs size={18} className="text-emerald-400" /> Core System Integrations
          </h3>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Lightning size={16} className="text-amber-400" /> Sistem Pembayaran Trexio
                </div>
                <div className="text-[10px] text-neutral-400">Payment Gateway API (Production Ready)</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>

            <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Database size={16} className="text-sky-400" /> In-Memory & File Storage
                </div>
                <div className="text-[10px] text-neutral-400">Database & Upload Engine</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>

            <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <CloudCheck size={16} className="text-purple-400" /> Multi-Tenant Router Engine
                </div>
                <div className="text-[10px] text-neutral-400">Subdomain & Slug Mapping</div>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Connected
              </span>
            </div>
          </div>
        </div>

        {/* Two-Factor Authentication (2FA) Governance Card */}
        <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4 md:col-span-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-400" /> Super Admin 2FA Security Governance
            </h3>
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              twoFactorStatus.totp_enabled
                ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
            }`}>
              {twoFactorStatus.totp_enabled ? "2FA ENFORCED & ACTIVE" : "2FA INITIALIZING"}
            </span>
          </div>

          <p className="text-xs text-neutral-400 leading-relaxed">
            Keamanan portal tingkat lanjut menggunakan token otentikasi berbasis waktu (TOTP) Google Authenticator atau Authy.
          </p>

          <div className="space-y-3 text-xs pt-1">
            <div className="p-3 bg-neutral-900/60 rounded-xl border border-white/10 flex items-center justify-between">
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <Key size={16} className="text-amber-400" /> Status Authenticator Token
                </div>
                <div className="text-[10px] text-neutral-400">Google Authenticator / Authy TOTP App</div>
              </div>
              <span className="font-mono text-[11px] text-emerald-400 font-bold">
                {twoFactorStatus.totp_enabled ? "Terproteksi 2FA" : "Menunggu Registrasi"}
              </span>
            </div>

            {qrCodeData && (
              <div className="p-4 bg-neutral-900 rounded-xl border border-emerald-500/30 space-y-3">
                <div className="text-emerald-400 font-bold text-xs flex items-center gap-1.5">
                  <QrCode size={16} /> QR Code Authenticator
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <img src={qrCodeData.qr_code_url} alt="2FA QR" className="w-28 h-28 bg-white p-1 rounded-lg shrink-0" />
                  <div className="space-y-2 flex-1 w-full">
                    <div className="text-[11px] text-neutral-300 font-mono">Secret Key: <span className="text-amber-300 font-bold">{qrCodeData.secret_key}</span></div>
                    <input
                      type="text"
                      placeholder="Masukkan 6 digit kode dari HP Anda"
                      maxLength={6}
                      value={testTotpCode}
                      onChange={(e) => setTestTotpCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="w-full bg-black/60 border border-neutral-700 rounded-lg px-3 py-1.5 text-center font-mono text-emerald-400 font-bold text-sm"
                    />
                    <button
                      onClick={handleConfirm2FaSetup}
                      disabled={testing2Fa || testTotpCode.length < 6}
                      className="w-full py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold rounded-lg text-xs uppercase transition-colors cursor-pointer"
                    >
                      {testing2Fa ? "Verifikasi..." : "Konfirmasi & Kunci 2FA"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {!qrCodeData && (
              <button
                onClick={handleGenerateNew2Fa}
                className="w-full py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer border border-white/10"
              >
                <QrCode size={16} className="text-emerald-400" />
                <span>{twoFactorStatus.totp_enabled ? "Tampilkan QR Code / Regenerate Key" : "Inisialisasi QR Code 2FA"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
