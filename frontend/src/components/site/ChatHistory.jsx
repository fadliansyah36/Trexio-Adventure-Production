import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ClockCounterClockwise,
  Trash,
  MagnifyingGlass,
  ChatCircleText,
  ArrowLeft,
  Storefront,
  UserCheck,
} from "@phosphor-icons/react";
import { toast } from "sonner";

export default function ChatHistory({
  historyLogs,
  onSelectConversation,
  onClearHistory,
  onBackToChat,
}) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLogs = Object.entries(historyLogs || {}).filter(([convId, data]) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const vendorName = (data.vendor_name || "").toLowerCase();
    const hasMatchingMsg = (data.messages || []).some((m) =>
      (m.text || "").toLowerCase().includes(term)
    );
    return vendorName.includes(term) || hasMatchingMsg;
  });

  function formatTime(isoString) {
    if (!isoString) return "";
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return "";
    }
  }

  return (
    <div className="flex-1 flex flex-col bg-background text-xs overflow-hidden">
      {/* Header bar within history */}
      <div className="p-2.5 bg-muted/60 border-b border-border flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={onBackToChat}
          className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft size={16} weight="bold" />
          <span>Kembali ke Chat</span>
        </button>
        {Object.keys(historyLogs || {}).length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              if (window.confirm("Apakah Anda yakin ingin menghapus seluruh riwayat chat lokal?")) {
                onClearHistory();
                toast.success("Riwayat chat di localStorage berhasil dibersihkan");
              }
            }}
            className="h-7 px-2 text-[11px] text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center gap-1"
          >
            <Trash size={14} weight="bold" />
            <span>Hapus Log</span>
          </Button>
        )}
      </div>

      {/* Search Input */}
      <div className="p-2.5 border-b border-border bg-card shrink-0">
        <div className="relative">
          <MagnifyingGlass
            size={14}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            placeholder="Cari dalam riwayat percakapan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-background text-xs h-8 pl-8 rounded-lg"
          />
        </div>
      </div>

      {/* History List */}
      <div className="flex-1 p-2.5 overflow-y-auto space-y-2">
        {filteredLogs.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
            <ClockCounterClockwise size={36} className="text-muted-foreground/60" />
            <p className="font-bold text-xs text-foreground">
              {searchTerm ? "Riwayat tidak ditemukan" : "Belum ada riwayat tersimpan"}
            </p>
            <p className="text-[11px] leading-relaxed max-w-[220px]">
              {searchTerm
                ? "Coba gunakan kata kunci pencarian yang lain."
                : "Pesan yang Anda kirim atau terima akan tersimpan secara lokal di peramban ini."}
            </p>
          </div>
        ) : (
          filteredLogs.map(([convId, data]) => {
            const lastMsg =
              data.messages && data.messages.length > 0
                ? data.messages[data.messages.length - 1]
                : null;
            const messageCount = data.messages ? data.messages.length : 0;

            return (
              <div
                key={convId}
                onClick={() => onSelectConversation(convId, data)}
                className="p-3 bg-card border border-border hover:border-emerald-500/50 hover:shadow-sm rounded-xl cursor-pointer transition-all flex flex-col gap-1.5 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                      <Storefront size={16} weight="fill" />
                    </div>
                    <span className="font-bold text-xs text-foreground group-hover:text-emerald-600 transition-colors truncate max-w-[170px]">
                      {data.vendor_name || "Mitra TREXIO"}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {formatTime(data.updated_at || lastMsg?.created_at)}
                  </span>
                </div>

                {lastMsg && (
                  <p className="text-[11px] text-muted-foreground line-clamp-2 pl-9">
                    <span className="font-semibold text-foreground/80">
                      {lastMsg.sender_name}:{" "}
                    </span>
                    {lastMsg.text}
                  </p>
                )}

                <div className="flex items-center justify-between pt-1 border-t border-border/50 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <ChatCircleText size={12} className="text-emerald-500" />
                    {messageCount} pesan tersimpan
                  </span>
                  <span className="text-emerald-600 font-semibold group-hover:underline">
                    Buka Diskusi &rarr;
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* LocalStorage Indicator Footer */}
      <div className="p-2 bg-muted/40 border-t border-border text-[10px] text-muted-foreground flex items-center justify-center gap-1.5 shrink-0">
        <UserCheck size={12} className="text-emerald-500" />
        <span>Tersimpan di Penyimpanan Lokal Peramban (localStorage)</span>
      </div>
    </div>
  );
}
