import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { Eye, X } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ImpersonationBanner() {
  const { user, refresh } = useAuth();
  if (!user?.impersonation?.active) return null;

  async function exit() {
    try {
      await api.post("/super/impersonate/exit");
      toast.success("Impersonation dihentikan");
      await refresh();
      // Force reload to reset UI state cleanly
      setTimeout(() => window.location.assign("/super"), 200);
    } catch {
      toast.error("Gagal keluar impersonation");
    }
  }

  return (
    <div
      className="sticky top-0 z-[100] bg-amber-400 text-black border-b-2 border-amber-500 shadow"
      data-testid="impersonation-banner"
    >
      <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
        <Eye size={18} weight="fill" />
        <div className="text-sm font-semibold flex-1">
          Anda sedang <span className="font-black">bertindak sebagai</span>{" "}
          <span className="font-mono">{user.email}</span> —{" "}
          <span className="opacity-70">
            actor: {user.impersonation.actor_email}
          </span>
        </div>
        <button
          onClick={exit}
          data-testid="impersonation-exit"
          className="inline-flex items-center gap-1 rounded-md bg-black text-amber-400 px-3 py-1.5 text-xs font-bold hover:bg-neutral-800"
        >
          <X size={14} /> Keluar Impersonation
        </button>
      </div>
    </div>
  );
}
