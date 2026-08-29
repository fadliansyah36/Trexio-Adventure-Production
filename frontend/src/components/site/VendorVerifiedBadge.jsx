import { BadgeCheck, ShieldCheck, Clock, CheckCircle2 } from "lucide-react";
import { useVerificationStatus } from "@/hooks/useVerificationStatus";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export default function VendorVerifiedBadge({
  verified = false,
  status = "unverified",
  size = "md",
  showUnverified = false,
  className = "",
  dataTestId = "storefront-verified-badge",
}) {
  const { isVerified, isPending, statusLabel } = useVerificationStatus({
    verified,
    status,
    vendor_verified: verified,
    verification_status: status,
  });

  // Public rule: Unverified vendors or tenants display NO badge on public UI
  if (!isVerified && !showUnverified) return null;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[11px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-xs sm:text-sm gap-2",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16,
  }[size] || 14;

  if (isVerified) {
    return (
      <TooltipProvider delayDuration={150}>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              data-testid={dataTestId}
              className={`inline-flex items-center rounded-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 text-white font-bold shadow-sm hover:shadow-md border border-emerald-400/30 cursor-help transition-all transform hover:-translate-y-0.5 ${sizeClasses} ${className}`}
            >
              <ShieldCheck size={iconSizes} className="fill-emerald-100 text-emerald-800 shrink-0" />
              <span>Terverifikasi</span>
            </span>
          </TooltipTrigger>
          <TooltipContent
            side="top"
            align="center"
            className="max-w-xs bg-slate-900 border border-emerald-500/30 text-slate-100 p-3.5 rounded-xl shadow-2xl z-50"
          >
            <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
              <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
                <BadgeCheck size={18} />
              </span>
              <div>
                <div className="font-bold text-xs text-white">Akun Terverifikasi Super Admin</div>
                <div className="text-[10px] text-emerald-400 font-semibold">Telah Melewati Audit Legitimasi Official</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
              Mitra ini terbukti resmi, valid, dan memenuhi kualifikasi standar verifikasi Super Admin TREXIO.
            </p>
            <ul className="mt-2 space-y-1 text-[10px] text-slate-300">
              <li className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>Dokumen KTP, NIB & PT/CV Terverifikasi</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>Garansi Rekening Payout Pihak Ketiga</span>
              </li>
              <li className="flex items-center gap-1.5 text-emerald-300 font-medium">
                <CheckCircle2 size={12} className="text-emerald-400 shrink-0" />
                <span>Jaminan Safe Booking & Layanan Pendaki 100%</span>
              </li>
            </ul>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  // Fallback for internal management dashboards when showUnverified is explicitly requested
  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            data-testid={dataTestId}
            className={`inline-flex items-center rounded-full font-bold cursor-help transition-all ${
              isPending
                ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30"
                : "bg-neutral-500/10 text-neutral-600 dark:text-neutral-400 border border-neutral-500/30"
            } ${sizeClasses} ${className}`}
          >
            <Clock size={iconSizes} className="shrink-0" />
            <span>{isPending ? "Menunggu Verifikasi" : "Belum Diverifikasi"}</span>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs bg-slate-900 border border-amber-500/30 text-slate-100 p-3.5 rounded-xl shadow-2xl z-50"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
              <Clock size={18} />
            </span>
            <div>
              <div className="font-bold text-xs text-white">Status Verifikasi Internal</div>
              <div className="text-[10px] text-amber-400 font-semibold">
                {isPending ? "Dalam Tinjauan Super Admin" : "Lengkapi Dokumen KTP, NIB, atau PT/CV"}
              </div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
            {isPending
              ? "Dokumen verifikasi Anda telah dikirim dan sedang dalam proses audit Super Admin TREXIO."
              : "Unggah foto KTP (Wajib) serta NIB / Dokumen Pendirian PT/CV (Opsional) untuk mengajukan Badge Terverifikasi."}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export function BnspApgiBadge({ vendor, size = "md", className = "" }) {
  const hasBnsp = vendor?.bnsp_verified || vendor?.documents?.bnsp_cert_url || vendor?.documents?.bnsp_number;
  const hasApgi = vendor?.apgi_verified || vendor?.documents?.apgi_cert_url || vendor?.documents?.apgi_number;
  const hasGuides = Array.isArray(vendor?.guides) && vendor.guides.length > 0;

  if (!hasBnsp && !hasApgi && !hasGuides) return null;

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] gap-1",
    md: "px-2.5 py-1 text-xs gap-1.5",
    lg: "px-3 py-1.5 text-xs sm:text-sm gap-2",
  }[size] || "px-2.5 py-1 text-xs gap-1.5";

  return (
    <TooltipProvider delayDuration={150}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`inline-flex items-center rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 font-black shadow-xs cursor-help hover:bg-emerald-900 transition-all ${sizeClasses} ${className}`}
          >
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>Guide BNSP & APGI Certified</span>
          </span>
        </TooltipTrigger>
        <TooltipContent
          side="top"
          align="center"
          className="max-w-xs bg-slate-900 border border-emerald-500/30 text-slate-100 p-3.5 rounded-xl shadow-2xl z-50"
        >
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
            <span className="p-1 rounded-lg bg-emerald-500/20 text-emerald-400">
              <BadgeCheck size={18} />
            </span>
            <div>
              <div className="font-bold text-xs text-white">Sertifikasi Pemandu Gunung Terverifikasi</div>
              <div className="text-[10px] text-emerald-400 font-semibold">BNSP & APGI Mountain Guide</div>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-slate-300 leading-relaxed">
            Pemandu gunung mitra ini memiliki sertifikat kompetensi BNSP (Badan Nasional Sertifikasi Profesi) dan/atau lisensi APGI (Asosiasi Pemandu Gunung Indonesia) resmi.
          </p>
          <div className="mt-2 space-y-1 text-[10px] text-emerald-300 font-medium">
            {hasBnsp && <div className="flex items-center gap-1">✓ Sertifikat Kompetensi Kerja BNSP</div>}
            {hasApgi && <div className="flex items-center gap-1">✓ Lisensi Anggota Pemandu APGI</div>}
            {hasGuides && <div className="flex items-center gap-1">✓ {vendor.guides.length} Tim Guide Terlisensi Didaftarkan</div>}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
