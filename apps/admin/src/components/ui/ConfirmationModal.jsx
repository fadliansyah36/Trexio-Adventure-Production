import { Warning, CheckCircle, X, FloppyDisk, Trash } from "@phosphor-icons/react";

export default function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Konfirmasi Tindakan Krusial",
  description = "Apakah Anda yakin ingin memproses perubahan ini? Perubahan tidak dapat dibatalkan.",
  confirmText = "Konfirmasi & Lanjutkan",
  cancelText = "Batal",
  variant = "emerald", // 'emerald' | 'rose' | 'amber' | 'sky'
  loading = false,
  children,
}) {
  if (!isOpen) return null;

  const colorClasses = {
    emerald: {
      border: "border-emerald-500/40",
      iconBg: "bg-emerald-500/20 text-emerald-400",
      btn: "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold",
      title: "text-emerald-400",
    },
    rose: {
      border: "border-rose-500/40",
      iconBg: "bg-rose-500/20 text-rose-400",
      btn: "bg-rose-600 hover:bg-rose-500 text-white font-extrabold",
      title: "text-rose-400",
    },
    amber: {
      border: "border-amber-500/40",
      iconBg: "bg-amber-500/20 text-amber-400",
      btn: "bg-amber-500 hover:bg-amber-400 text-black font-extrabold",
      title: "text-amber-400",
    },
    sky: {
      border: "border-sky-500/40",
      iconBg: "bg-sky-500/20 text-sky-400",
      btn: "bg-sky-500 hover:bg-sky-400 text-white font-extrabold",
      title: "text-sky-400",
    },
  }[variant] || {
    border: "border-emerald-500/40",
    iconBg: "bg-emerald-500/20 text-emerald-400",
    btn: "bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold",
    title: "text-emerald-400",
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className={`bg-neutral-900 border ${colorClasses.border} rounded-2xl max-w-md w-full p-6 shadow-2xl text-xs text-white space-y-4`}
      >
        <div className="flex justify-between items-center border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${colorClasses.iconBg}`}>
              <Warning size={18} weight="bold" />
            </div>
            <h3 className={`font-black text-sm ${colorClasses.title}`}>{title}</h3>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            aria-label="Tutup Modal"
            className="text-neutral-400 hover:text-white font-bold cursor-pointer p-1"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-neutral-300 text-xs leading-relaxed">{description}</p>

        {children}

        <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 font-bold text-xs border border-white/15 rounded-xl hover:bg-white/10 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={`px-5 py-2 rounded-xl text-xs cursor-pointer shadow-md transition-all flex items-center gap-1.5 ${colorClasses.btn} disabled:opacity-50`}
          >
            {loading ? "Memproses..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
