import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { CheckCircle, ArrowLeft, ArrowRight, Storefront, ShieldCheck, ArrowSquareOut } from "@phosphor-icons/react";
import { ValidatedInput, FormCompletionBanner } from "@/components/vendor/ValidatedInput";
import { useAutoSave, AutoSaveBadge } from "@/components/vendor/AutoSaveIndicator";

const TYPE_OPTIONS = [
  { key: "open-trip", label: "Open Trip", desc: "Jual paket trip gabungan hemat dengan jadwal terstruktur" },
  { key: "private-trip", label: "Private Trip", desc: "Tour kustom eksklusif khusus grup & keluarga" },
  { key: "guide", label: "Guide / Pemandu", desc: "Tawarkan jasa pemandu tersertifikasi APGI / BNSP" },
  { key: "porter", label: "Porter Pendakian", desc: "Jasa angkut logistik & perlengkapan pendakian" },
  { key: "rental-gear", label: "Rental Outdoor Gear", desc: "Sewakan tenda, carrier, kompor, & alat camping" },
  { key: "basecamp", label: "Basecamp & Pos", desc: "Pos registrasi resmi, SIMAKSI, & rest area pendaki" },
  { key: "camping-ground", label: "Camping Ground", desc: "Spot kemping, glamping, & lokasi berkemah" },
  { key: "homestay", label: "Homestay & Penginapan", desc: "Akomodasi penginapan lokal ramah pendaki" },
  { key: "shuttle", label: "Shuttle & Travel", desc: "Layanan shuttle travel antar-jemput stasiun/bandara" },
  { key: "transportasi", label: "Transportasi Offroad", desc: "Sewa Jeep 4x4, pick-up bak, & kendaraan offroad" },
  { key: "wisata-alam", label: "Wisata Alam", desc: "Ekowisata, tur air terjun, & ekskursi kawah" },
  { key: "event", label: "Outdoor Event", desc: "Outdoor festival, clean-up action, & trail run" },
];

export default function VendorOnboard() {
  const nav = useNavigate();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [existingVendor, setExistingVendor] = useState(null);
  const [loadingInitial, setLoadingInitial] = useState(true);

  const [form, setForm] = useState({
    types: [],
    brand_name: "",
    tagline: "",
    description: "",
    contact_email: "",
    contact_phone: "",
    contact_whatsapp: "",
    website: "",
    nik: "",
    npwp: "",
    address: "",
    city: "",
    province: "",
    postal_code: "",
    bank_name: "",
    bank_account_number: "",
    bank_account_holder: "",
  });

  useEffect(() => {
    let isMounted = true;
    async function loadInitialData() {
      try {
        const [vRes, uRes] = await Promise.allSettled([
          api.get("/vendor/me"),
          api.get("/auth/me")
        ]);

        const vendorData = vRes.status === "fulfilled" ? vRes.value?.data : null;
        const userData = uRes.status === "fulfilled" ? uRes.value?.data : null;

        if (isMounted && vendorData) {
          setExistingVendor(vendorData);
          setForm({
            types: Array.isArray(vendorData.types) && vendorData.types.length > 0 ? vendorData.types : ["open-trip"],
            brand_name: vendorData.brand_name || userData?.name || "",
            tagline: vendorData.tagline || "",
            description: vendorData.description || "",
            contact_email: vendorData.contact?.email || userData?.email || "",
            contact_phone: vendorData.contact?.phone || userData?.phone || "",
            contact_whatsapp: vendorData.contact?.whatsapp || userData?.phone || "",
            website: vendorData.contact?.website || "",
            nik: vendorData.legal?.nik || userData?.nik || "",
            npwp: vendorData.legal?.npwp || "",
            address: vendorData.legal?.address || userData?.address || "",
            city: vendorData.legal?.city || "Malang",
            province: vendorData.legal?.province || "Jawa Timur",
            postal_code: vendorData.legal?.postal_code || "",
            bank_name: vendorData.payout?.bank_name || "BCA",
            bank_account_number: vendorData.payout?.account_number || "",
            bank_account_holder: vendorData.payout?.account_holder || vendorData.brand_name || userData?.name || "",
          });
        } else if (isMounted && userData) {
          setForm((f) => ({
            ...f,
            brand_name: userData.name || "",
            contact_email: userData.email || "",
            contact_phone: userData.phone || "",
            contact_whatsapp: userData.phone || "",
            nik: userData.nik || "",
            address: userData.address || "",
            bank_account_holder: userData.name || "",
          }));
        }

        // Check if local draft exists
        if (isMounted && !vendorData) {
          try {
            const draftRaw = localStorage.getItem("trx_vendor_onboard_draft");
            if (draftRaw) {
              const draft = JSON.parse(draftRaw);
              if (draft && typeof draft === "object") {
                setForm((prev) => ({ ...prev, ...draft }));
              }
            }
          } catch {
            // ignore
          }
        }
      } catch {
        // Ignore fallback
      } finally {
        if (isMounted) setLoadingInitial(false);
      }
    }
    loadInitialData();
    return () => { isMounted = false; };
  }, []);

  const handleAutoSaveOnboard = async (formData) => {
    if (!formData.brand_name && (!formData.types || formData.types.length === 0)) return;
    try {
      await api.patch("/vendor/me", formData);
    } catch {
      // Local storage backup handles offline draft
    }
  };

  const { status: onboardAutoSaveStatus, lastSavedAt: onboardAutoSaveTime } = useAutoSave({
    data: form,
    onSave: handleAutoSaveOnboard,
    storageKey: "trx_vendor_onboard_draft",
    debounceMs: 600,
  });

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  function toggleType(k) {
    setForm((f) => ({
      ...f,
      types: f.types.includes(k) ? f.types.filter((x) => x !== k) : [...f.types, k],
    }));
  }

  function validateStep() {
    if (step === 1 && form.types.length === 0) return "Pilih minimal 1 tipe vendor";
    if (step === 2) {
      if (!form.brand_name.trim()) return "Nama brand wajib diisi";
      if (!form.contact_email.trim()) return "Email kontak wajib diisi";
      if (!form.contact_phone.trim()) return "Nomor telepon wajib diisi";
    }
    if (step === 3) {
      if (!form.nik.trim() || form.nik.length < 8) return "NIK wajib diisi (min 8 digit)";
      if (!form.address.trim() || !form.city.trim() || !form.province.trim())
        return "Alamat, kota, dan provinsi wajib diisi";
    }
    if (step === 4) {
      if (!form.bank_name.trim() || !form.bank_account_number.trim() || !form.bank_account_holder.trim())
        return "Data rekening payout wajib diisi lengkap";
    }
    return null;
  }

  function next() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setStep((s) => Math.min(4, s + 1));
  }

  async function submit() {
    const err = validateStep();
    if (err) { toast.error(err); return; }
    setSubmitting(true);
    try {
      const { data } = await api.post("/vendor/onboard", form);
      toast.success(data?.message || "Data pendaftaran vendor berhasil disimpan!");
      nav("/vendor");
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setSubmitting(false);
    }
  }

  if (loadingInitial) {
    return <div className="min-h-screen flex items-center justify-center text-sm font-bold text-muted-foreground">Memuat formulir pendaftaran vendor...</div>;
  }

  return (
    <div className="min-h-screen bg-[hsl(var(--muted))] py-10 px-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link to="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={14} /> Kembali ke Beranda
        </Link>

        {/* Existing Vendor Status Banner */}
        {existingVendor && (
          <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-emerald-900 dark:text-emerald-100 flex flex-col md:flex-row md:items-center justify-between gap-4" data-testid="vendor-registered-banner">
            <div className="space-y-1">
              <div className="flex items-center gap-2 font-black text-base">
                <ShieldCheck size={22} weight="fill" className="text-emerald-600 dark:text-emerald-400" />
                Akun Vendor Terdaftar: {existingVendor.brand_name}
              </div>
              <p className="text-xs text-muted-foreground">
                Data pendaftaran Anda sudah tersimpan dan terhubung dengan akun ini. Anda dapat memperbarui informasi formulir di bawah ini kapan saja.
              </p>
            </div>
            <Link
              to="/vendor"
              data-testid="vendor-registered-dashboard-btn"
              className="inline-flex items-center gap-2 shrink-0 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-emerald-500 shadow-xs"
            >
              Ke Dashboard Vendor <ArrowRight size={16} />
            </Link>
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-11 w-11 items-center justify-center rounded-md bg-[hsl(var(--primary))] text-white">
              <Storefront size={22} weight="fill" />
            </span>
            <div>
              <div className="trx-overline text-muted-foreground">Jadi Mitra TREXIO</div>
              <h1 className="text-3xl font-black tracking-tighter">
                {existingVendor ? "Edit Formulir Pendaftaran Vendor" : "Daftar Vendor"}
              </h1>
            </div>
          </div>
          <AutoSaveBadge status={onboardAutoSaveStatus} lastSavedAt={onboardAutoSaveTime} testid="vendor-onboard-autosave-badge" />
        </div>

        {/* Stepper */}
        <div className="mt-8 grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={`h-1.5 rounded-full ${s <= step ? "bg-[hsl(var(--secondary))]" : "bg-neutral-200"}`} />
          ))}
        </div>
        <div className="mt-2 text-xs uppercase tracking-widest text-muted-foreground">
          Langkah {step} dari 4 —{" "}
          {step === 1 && "Pilih Tipe Vendor"}
          {step === 2 && "Info Brand & Kontak"}
          {step === 3 && "Identitas Legal"}
          {step === 4 && "Rekening Payout"}
        </div>

        <div className="mt-6 bg-white border border-border rounded-md p-6 md:p-8">
          <div className="mb-6">
            <FormCompletionBanner
              validCount={[
                form.types.length >= 1,
                form.brand_name.trim().length >= 3,
                /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contact_email.trim()),
                form.contact_phone.replace(/\D/g, "").length >= 9,
                form.nik.replace(/\D/g, "").length >= 8,
                form.address.trim().length >= 5,
                form.city.trim().length >= 2,
                form.province.trim().length >= 2,
                form.bank_name.trim().length >= 2,
                form.bank_account_number.replace(/\D/g, "").length >= 5,
                form.bank_account_holder.trim().length >= 3,
              ].filter(Boolean).length}
              totalCount={11}
              label="Progres Kelengkapan Onboarding Vendor"
            />
          </div>

          {step === 1 && (
            <div>
              <p className="text-sm text-muted-foreground">Pilih satu atau lebih tipe usaha yang Anda kelola.</p>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                {TYPE_OPTIONS.map((t) => {
                  const active = form.types.includes(t.key);
                  return (
                    <button
                      key={t.key}
                      type="button"
                      data-testid={`onboard-type-${t.key}`}
                      onClick={() => toggleType(t.key)}
                      className={`text-left rounded-md border p-4 transition ${active
                        ? "border-[hsl(var(--secondary))] bg-[hsl(var(--secondary))]/5 ring-1 ring-[hsl(var(--secondary))]"
                        : "border-border hover:border-neutral-300"}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold">{t.label}</div>
                          <div className="mt-1 text-xs text-muted-foreground">{t.desc}</div>
                        </div>
                        {active && <CheckCircle size={20} weight="fill" className="text-[hsl(var(--secondary))]" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <ValidatedInput
                label="Nama Brand"
                required
                value={form.brand_name}
                onChange={(v) => set("brand_name", v)}
                minLength={3}
                placeholder="Contoh: Bromo Tour Organizer"
                testid="onboard-brand-name"
              />

              <ValidatedInput
                label="Tagline"
                value={form.tagline}
                onChange={(v) => set("tagline", v)}
                placeholder="Spesialis open trip & private tour"
                testid="onboard-tagline"
              />

              <ValidatedInput
                label="Email Kontak"
                type="email"
                required
                value={form.contact_email}
                onChange={(v) => set("contact_email", v)}
                placeholder="kontak@brand.com"
                testid="onboard-email"
              />

              <ValidatedInput
                label="Nomor Telepon Kantor/HP"
                type="tel"
                required
                value={form.contact_phone}
                onChange={(v) => set("contact_phone", v)}
                placeholder="081234567890"
                minLength={9}
                testid="onboard-phone"
              />

              <ValidatedInput
                label="WhatsApp"
                type="tel"
                value={form.contact_whatsapp}
                onChange={(v) => set("contact_whatsapp", v)}
                placeholder="081234567890"
                validator={(val) => {
                  if (!val.trim()) return { isValid: true, message: "Opsional" };
                  if (val.replace(/\D/g, "").length < 9) return { isValid: false, message: "Minimal 9 digit" };
                  return { isValid: true, message: "Nomor WA valid" };
                }}
                testid="onboard-whatsapp"
              />

              <ValidatedInput
                label="Website"
                value={form.website}
                onChange={(v) => set("website", v)}
                placeholder="https://..."
                validator={(val) => {
                  if (!val.trim()) return { isValid: true, message: "Opsional" };
                  if (!val.includes(".")) return { isValid: false, message: "Format URL web tidak valid" };
                  return { isValid: true, message: "URL Website valid" };
                }}
                testid="onboard-website"
              />

              <div className="md:col-span-2">
                <ValidatedInput
                  label="Deskripsi Brand"
                  isTextArea
                  rows={4}
                  value={form.description}
                  onChange={(v) => set("description", v)}
                  placeholder="Jelaskan keunggulan dan pengalaman usaha travel Anda..."
                  testid="onboard-description"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <ValidatedInput
                label="NIK Penanggung Jawab"
                required
                value={form.nik}
                onChange={(v) => set("nik", v.replace(/\D/g, ""))}
                placeholder="3515000000000000"
                minLength={8}
                inputMode="numeric"
                helperText="Digit NIK KTP Anda (8-16 digit)"
                testid="onboard-nik"
              />

              <ValidatedInput
                label="NPWP (Opsional)"
                value={form.npwp}
                onChange={(v) => set("npwp", v)}
                placeholder="00.000.000.0-000.000"
                testid="onboard-npwp"
              />

              <div className="md:col-span-2">
                <ValidatedInput
                  label="Alamat Operasional Usaha"
                  required
                  value={form.address}
                  onChange={(v) => set("address", v)}
                  placeholder="Jl. Raya Bromo No. 12"
                  minLength={5}
                  testid="onboard-address"
                />
              </div>

              <ValidatedInput
                label="Kota / Kabupaten"
                required
                value={form.city}
                onChange={(v) => set("city", v)}
                placeholder="Malang"
                minLength={2}
                testid="onboard-city"
              />

              <ValidatedInput
                label="Provinsi"
                required
                value={form.province}
                onChange={(v) => set("province", v)}
                placeholder="Jawa Timur"
                minLength={2}
                testid="onboard-province"
              />

              <ValidatedInput
                label="Kode Pos"
                value={form.postal_code}
                onChange={(v) => set("postal_code", v)}
                placeholder="65100"
                testid="onboard-postal"
              />

              <div className="md:col-span-2 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-800 dark:text-amber-200">
                Dokumen KTP & Surat Izin Usaha dapat diupload dari menu <b>Profil</b> setelah pengajuan onboarding.
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <ValidatedInput
                label="Nama Bank"
                required
                value={form.bank_name}
                onChange={(v) => set("bank_name", v)}
                placeholder="Bank BCA / Mandiri / BRI"
                minLength={2}
                testid="onboard-bank-name"
              />

              <ValidatedInput
                label="Nomor Rekening"
                required
                value={form.bank_account_number}
                onChange={(v) => set("bank_account_number", v.replace(/\D/g, ""))}
                placeholder="1234567890"
                inputMode="numeric"
                validator={(val) => {
                  const digits = val.replace(/\D/g, "");
                  if (digits.length < 5) return { isValid: false, message: "Minimal 5 digit angka" };
                  return { isValid: true, message: "Nomor rekening valid" };
                }}
                testid="onboard-bank-account"
              />

              <div className="md:col-span-2">
                <ValidatedInput
                  label="Nama Pemilik Rekening"
                  required
                  value={form.bank_account_holder}
                  onChange={(v) => set("bank_account_holder", v)}
                  placeholder="Sesuai buku tabungan"
                  minLength={3}
                  testid="onboard-bank-holder"
                />
              </div>

              <div className="md:col-span-2 rounded-xl bg-muted border border-border p-3.5 text-xs text-muted-foreground leading-relaxed">
                Pendapatan dari penjualan trip akan ditransfer ke rekening ini secara otomatis setelah dipotong komisi platform. Detail rincian komisi dijelaskan di dashboard setelah verifikasi akun.
              </div>
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              disabled={step === 1}
              onClick={() => setStep((s) => Math.max(1, s - 1))}
              data-testid="onboard-prev"
              className="inline-flex items-center gap-1 text-sm font-semibold disabled:opacity-30"
            >
              <ArrowLeft size={16} /> Kembali
            </button>
            {step < 4 ? (
              <button
                onClick={next}
                data-testid="onboard-next"
                className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--secondary))] text-white px-5 py-2.5 text-sm font-bold hover:opacity-90"
              >
                Lanjut <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={submit}
                disabled={submitting}
                data-testid="onboard-submit"
                className="inline-flex items-center gap-2 rounded-md bg-[hsl(var(--primary))] text-white px-5 py-2.5 text-sm font-bold hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, set, testid, placeholder, type = "text" }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        data-testid={testid}
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => set(e.target.value)}
        className="mt-2 w-full rounded-md border border-border bg-white px-3 py-2 text-sm focus:outline-none focus:border-[hsl(var(--secondary))]"
      />
    </label>
  );
}
