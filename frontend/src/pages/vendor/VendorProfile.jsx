import { useState } from "react";
import { useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { api, formatApiError } from "@/lib/api";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import VendorVerifiedBadge from "@/components/site/VendorVerifiedBadge";
import RoleProfileEditor from "@/components/RoleProfileEditor";
import VendorCoverImageManager from "@/components/vendor/VendorCoverImageManager";
import {
  UploadSimple,
  CheckCircle,
  ArrowSquareOut,
  Copy,
  PencilSimple,
  ShieldCheck,
  FileText,
  Clock,
  Paperclip,
} from "@phosphor-icons/react";

export default function VendorProfile() {
  const context = useOutletContext();
  const vendor = context?.vendor || {};
  const refresh = context?.refresh || (() => {});

  const [slugForm, setSlugForm] = useState(vendor.slug || "");
  const [slugStatus, setSlugStatus] = useState(null); // {available, reason}
  const [savingSlug, setSavingSlug] = useState(false);

  // KYC Verification state
  const [uploadingDoc, setUploadingDoc] = useState(null); // 'ktp' | 'nib' | 'legal_doc'
  const [submittingVerification, setSubmittingVerification] = useState(false);

  async function checkSlug(v) {
    setSlugForm(v);
    if (!v || v === vendor.slug) {
      setSlugStatus(null);
      return;
    }
    try {
      const { data } = await api.get(`/vendor/slug/check?slug=${encodeURIComponent(v)}`);
      setSlugStatus(data);
    } catch {
      setSlugStatus(null);
    }
  }

  async function saveSlug() {
    if (!slugForm || slugForm === vendor.slug) return;
    setSavingSlug(true);
    try {
      const { data } = await api.patch("/vendor/me/slug", { slug: slugForm });
      toast.success(`Handle diubah ke @${data.slug}`);
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setSavingSlug(false);
    }
  }

  function copyLink() {
    const url = `${window.location.origin}/@${vendor.slug}`;
    navigator.clipboard.writeText(url);
    toast.success("Link storefront tersalin");
  }

  async function handleDocUpload(e, docType) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDoc(docType);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const { data } = await api.post(`/vendor/me/documents/${docType}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      toast.success(`Dokumen ${docType.toUpperCase()} berhasil diunggah`);
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal mengunggah dokumen");
    } finally {
      setUploadingDoc(null);
    }
  }

  async function handleRequestVerification() {
    setSubmittingVerification(true);
    try {
      const { data } = await api.post("/vendor/me/request-verification");
      toast.success(data.message || "Pengajuan verifikasi berhasil dikirim ke Super Admin!");
      refresh();
    } catch (err) {
      toast.error(formatApiError(err?.response?.data?.detail) || "Gagal mengajukan verifikasi");
    } finally {
      setSubmittingVerification(false);
    }
  }

  const { isVerified, isPending } = useVerificationStatus(vendor);

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <div className="trx-overline text-muted-foreground">Mitra & Partner Trexio</div>
        <div className="mt-2 flex items-center flex-wrap gap-3">
          <h1 className="text-3xl font-black tracking-tighter">Profil Brand & Akun Vendor</h1>
          <VendorVerifiedBadge
            verified={isVerified}
            status={vendor.status}
            showUnverified={true}
            dataTestId="vendor-profile-verified-badge"
          />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Kelola foto sampul petualangan (cover image), foto logo brand, data PIC, informasi payout rekening, serta pengajuan Lencana Terverifikasi Super Admin.
        </p>
      </div>

      {/* Verification & KYC Documents Card */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs space-y-5" data-testid="vendor-kyc-block">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
          <div>
            <h2 className="font-bold text-base flex items-center gap-2 text-foreground">
              <ShieldCheck size={20} className="text-emerald-500" /> Verifikasi Legitimasi Usaha & Badge Official
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Lengkapi dokumen legalitas usaha untuk mengajukan Lencana Terverifikasi resmi dari Super Admin TREXIO.
            </p>
          </div>
          <div>
            {isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs border border-emerald-500/30">
                <CheckCircle size={16} weight="fill" /> Status: Terverifikasi Official
              </span>
            ) : isPending ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300 font-extrabold text-xs border border-amber-500/30">
                <Clock size={16} weight="fill" /> Dalam Tinjauan Super Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 font-bold text-xs border border-neutral-500/30">
                Belum Terverifikasi
              </span>
            )}
          </div>
        </div>

        {/* Uploaded Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* KTP Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <FileText size={16} className="text-emerald-500" /> KTP PIC / Pemilik <span className="text-rose-500">*</span>
              </div>
              {vendor.documents?.ktp ? (
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  ✓ Diunggah
                </span>
              ) : (
                <span className="text-[10px] font-bold text-rose-500 bg-rose-500/10 px-2 py-0.5 rounded-full">
                  Wajib
                </span>
              )}
            </div>
            <p className="text-[11px] text-muted-foreground">Foto KTP penanggung jawab usaha sesuai identitas akun.</p>
            {vendor.documents?.ktp && (
              <a
                href={vendor.documents.ktp}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-emerald-600 hover:underline flex items-center gap-1 truncate"
              >
                <Paperclip size={12} /> Lihat Dokumen KTP
              </a>
            )}
            <label className="block">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleDocUpload(e, "ktp")}
                className="hidden"
                disabled={uploadingDoc === "ktp"}
              />
              <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-2 text-xs font-bold cursor-pointer transition-all">
                <UploadSimple size={14} />
                {uploadingDoc === "ktp" ? "Mengunggah..." : vendor.documents?.ktp ? "Ganti KTP" : "Unggah KTP"}
              </span>
            </label>
          </div>

          {/* NIB Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <FileText size={16} className="text-blue-500" /> NIB / SIUP Usaha
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                Opsional
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Nomor Induk Berusaha / Surat Izin Usaha Perdagangan.</p>
            {vendor.documents?.nib && (
              <a
                href={vendor.documents.nib}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-blue-600 hover:underline flex items-center gap-1 truncate"
              >
                <Paperclip size={12} /> Lihat Dokumen NIB
              </a>
            )}
            <label className="block">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleDocUpload(e, "nib")}
                className="hidden"
                disabled={uploadingDoc === "nib"}
              />
              <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-2 text-xs font-bold cursor-pointer transition-all">
                <UploadSimple size={14} />
                {uploadingDoc === "nib" ? "Mengunggah..." : vendor.documents?.nib ? "Ganti NIB" : "Unggah NIB"}
              </span>
            </label>
          </div>

          {/* Legal Doc Card */}
          <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-black uppercase text-foreground flex items-center gap-1.5">
                <FileText size={16} className="text-purple-500" /> Akta PT / CV
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-neutral-200 dark:bg-neutral-800 px-2 py-0.5 rounded-full">
                Opsional
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">Akta pendirian badan hukum usaha PT, CV, atau Koperasi.</p>
            {vendor.documents?.legal_doc && (
              <a
                href={vendor.documents.legal_doc}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] font-bold text-purple-600 hover:underline flex items-center gap-1 truncate"
              >
                <Paperclip size={12} /> Lihat Akta Pendirian
              </a>
            )}
            <label className="block">
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleDocUpload(e, "legal_doc")}
                className="hidden"
                disabled={uploadingDoc === "legal_doc"}
              />
              <span className="w-full inline-flex items-center justify-center gap-1.5 rounded-lg border border-border bg-background hover:bg-muted px-3 py-2 text-xs font-bold cursor-pointer transition-all">
                <UploadSimple size={14} />
                {uploadingDoc === "legal_doc" ? "Mengunggah..." : vendor.documents?.legal_doc ? "Ganti Akta" : "Unggah Akta"}
              </span>
            </label>
          </div>
        </div>

        {/* Verification Request Action */}
        {!isVerified && (
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 bg-amber-500/5 p-4 rounded-xl border border-amber-500/20">
            <div className="space-y-0.5 text-center sm:text-left">
              <div className="text-xs font-bold text-amber-900 dark:text-amber-200">
                {isPending ? "Pengajuan Verifikasi Sedang Diproses" : "Ajukan Verifikasi Lencana Mitra"}
              </div>
              <p className="text-[11px] text-muted-foreground">
                {isPending
                  ? "Dokumen Anda sedang diaudit oleh Super Admin TREXIO. Lencana Terverifikasi akan tampil secara otomatis setelah disetujui."
                  : "Setelah mengunggah KTP PIC, klik tombol di kanan untuk mengirimkan berkas verifikasi ke Super Admin."}
              </p>
            </div>
            <button
              onClick={handleRequestVerification}
              disabled={submittingVerification || isPending || !vendor.documents?.ktp}
              data-testid="vendor-request-verification-btn"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-md disabled:opacity-50 transition-all cursor-pointer shrink-0"
            >
              {submittingVerification
                ? "Mengirim..."
                : isPending
                ? "Dalam Pengajuan Audit"
                : "Ajukan Verifikasi Sekarang"}
            </button>
          </div>
        )}
      </section>

      {/* Cover Image Petualangan Storefront Manager (CRUD) */}
      <VendorCoverImageManager vendor={vendor} onRefresh={refresh} />

      {/* Public Handle Storefront Section */}
      <section className="rounded-2xl border border-border bg-card p-6 shadow-xs" data-testid="vendor-slug-block">
        <h2 className="font-bold text-base flex items-center gap-2 text-foreground">
          <PencilSimple size={18} className="text-emerald-500" /> Handle Storefront Publik
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          URL publik brand Anda — bagikan di media sosial untuk mendapatkan traffic pelanggan.
        </p>
        <div className="mt-4 flex flex-col md:flex-row md:items-end gap-3">
          <div className="flex-1">
            <label className="text-xs uppercase font-bold text-muted-foreground">Handle URL</label>
            <div className="mt-1.5 flex items-center rounded-xl border border-border bg-background overflow-hidden">
              <span className="px-3 text-xs font-mono text-muted-foreground border-r border-border py-2 bg-muted/40">trexio.id/@</span>
              <input
                data-testid="vendor-slug-input"
                value={slugForm}
                onChange={(e) => checkSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                className="flex-1 px-3 py-2 text-xs font-mono font-bold focus:outline-none bg-background text-foreground"
              />
            </div>
            {slugStatus && slugForm !== vendor.slug && (
              <div className={`mt-1 text-xs font-semibold ${slugStatus.available ? "text-emerald-600" : "text-rose-600"}`} data-testid="vendor-slug-check">
                {slugStatus.available ? "✓ Tersedia" : `✕ ${slugStatus.reason}`}
              </div>
            )}
          </div>
          <button
            onClick={saveSlug}
            disabled={savingSlug || !slugStatus?.available || slugForm === vendor.slug}
            data-testid="vendor-slug-save"
            className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 text-white px-4 py-2.5 text-xs font-bold hover:bg-emerald-500 disabled:opacity-40 cursor-pointer"
          >
            {savingSlug ? "Menyimpan..." : "Simpan Handle"}
          </button>
          {vendor.slug && (
            <div className="flex items-center gap-2">
              <a
                href={`/@${vendor.slug}`}
                target="_blank" rel="noreferrer"
                data-testid="vendor-storefront-view"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold hover:bg-muted"
              >
                <ArrowSquareOut size={16} /> Buka Storefront
              </a>
              <button
                onClick={copyLink}
                data-testid="vendor-storefront-copy"
                className="inline-flex items-center gap-1.5 rounded-xl border border-border px-3 py-2.5 text-xs font-bold hover:bg-muted cursor-pointer"
              >
                <Copy size={16} /> Salin Link
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Role Profile Editor component for Vendor */}
      <RoleProfileEditor
        role="vendor"
        initialData={vendor}
        onSaveSuccess={() => {
          refresh();
        }}
      />
    </div>
  );
}
