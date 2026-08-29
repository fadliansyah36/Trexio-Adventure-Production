import React, { useState, useMemo } from "react";
import {
  MagnifyingGlass,
  Funnel,
  DownloadSimple,
  CheckCircle,
  Clock,
  XCircle,
  ArrowUpRight,
  ArrowDownLeft,
  ArrowsLeftRight,
  CaretDown,
  Copy,
  Receipt,
  FileText,
  Sparkle,
} from "@phosphor-icons/react";
import { formatRupiah, formatDateID } from "@/lib/api";
import { toast } from "sonner";
import { exportVendorLedgerCSV } from "@/lib/exportCsv";

/**
 * Reusable TransactionLedger Table Component
 * Displays financial ledger transactions with columns:
 * - Date
 * - Transaction ID
 * - Product / Service
 * - Status (Color-coded badge)
 * - Net Amount (with gross & fee breakdown)
 */
export function TransactionLedger({
  transactions = [],
  loading = false,
  onRefresh,
  showFilters = true,
  showTitle = true,
  className = "",
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedTx, setSelectedTx] = useState(null);

  const rawList = useMemo(() => {
    if (Array.isArray(transactions)) return transactions;
    return [];
  }, [transactions]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return rawList.filter((item) => {
      const txId = (item.tx_id || item.booking_code || item.id || "").toLowerCase();
      const product = (item.product || item.product_name || item.description || "").toLowerCase();
      const customer = (item.customer || item.customer_name || "").toLowerCase();
      const matchSearch =
        txId.includes(searchTerm.toLowerCase()) ||
        product.includes(searchTerm.toLowerCase()) ||
        customer.includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      const normStatus = (item.status || "COMPLETED").toUpperCase();
      if (statusFilter === "ALL") return true;
      if (statusFilter === "COMPLETED" && (normStatus === "COMPLETED" || normStatus === "SETTLED" || normStatus === "PAID")) return true;
      if (statusFilter === "PENDING" && (normStatus === "PENDING" || normStatus === "ESCROW" || normStatus === "HOLDING")) return true;
      if (statusFilter === "REFUNDED" && (normStatus === "REFUNDED" || normStatus === "CANCELLED")) return true;
      if (statusFilter === "WITHDRAWAL" && (normStatus === "WITHDRAWAL" || item.type === "Withdrawal" || (item.net && item.net < 0))) return true;

      return normStatus === statusFilter;
    });
  }, [rawList, searchTerm, statusFilter]);

  // Copy helper
  const copyTxId = (code) => {
    navigator.clipboard.writeText(code);
    toast.success(`ID Transaksi ${code} disalin!`);
  };

  // Helper for Status Badge
  const renderStatusBadge = (status, netVal) => {
    const s = (status || "COMPLETED").toUpperCase();
    if (netVal < 0 || s === "WITHDRAWAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-neutral-100 text-neutral-800 border border-neutral-300">
          <ArrowUpRight size={13} className="text-neutral-600" /> Penarikan Dana
        </span>
      );
    }
    if (s === "COMPLETED" || s === "SETTLED" || s === "PAID" || s === "BERHASIL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 text-emerald-800 border border-emerald-200">
          <CheckCircle size={13} weight="fill" className="text-emerald-600" /> Selesai / Cair
        </span>
      );
    }
    if (s === "PENDING" || s === "ESCROW" || s === "HOLDING" || s === "MENUNGGU") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-amber-50 text-amber-800 border border-amber-200">
          <Clock size={13} weight="fill" className="text-amber-600" /> Escrow Holding
        </span>
      );
    }
    if (s === "REFUNDED" || s === "DIKEMBALIKAN") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-purple-50 text-purple-800 border border-purple-200">
          <ArrowsLeftRight size={13} className="text-purple-600" /> Refunded
        </span>
      );
    }
    if (s === "FAILED" || s === "CANCELLED" || s === "GAGAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black bg-rose-50 text-rose-800 border border-rose-200">
          <XCircle size={13} weight="fill" className="text-rose-600" /> Batal / Gagal
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-extrabold bg-neutral-100 text-neutral-700">
        {status}
      </span>
    );
  };

  // Export to CSV
  const exportLedgerCSV = () => {
    if (!filteredList || filteredList.length === 0) {
      toast.error("Tidak ada data ledger untuk di-export.");
      return;
    }
    exportVendorLedgerCSV(filteredList);
    toast.success("Ledger keuangan CSV berhasil di-download!");
  };

  return (
    <div className={`bg-white border border-border rounded-2xl p-6 space-y-5 shadow-xs ${className}`}>
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {showTitle && (
          <div>
            <div className="trx-overline text-muted-foreground flex items-center gap-1 font-bold">
              <Receipt size={14} className="text-emerald-600" /> Double-Entry Audit Trail
            </div>
            <h2 className="text-lg font-black tracking-tight text-foreground">
              Transaction Ledger & Financial History
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mutasi finansial otomatis real-time mencakup omset, skema komisi platform 7%, dan settlement.
            </p>
          </div>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={exportLedgerCSV}
            className="inline-flex items-center gap-1.5 text-xs font-extrabold bg-neutral-900 text-white px-3.5 py-2 rounded-xl hover:bg-neutral-800 transition-all shadow-xs"
          >
            <DownloadSimple size={15} /> Export Ledger CSV
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      {showFilters && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1">
            <MagnifyingGlass size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari ID transaksi, nama produk, atau pembeli..."
              className="w-full pl-10 pr-4 py-2 border border-border rounded-xl text-xs font-medium focus:outline-none focus:border-[hsl(var(--primary))]"
            />
          </div>

          {/* Status Dropdown Filter */}
          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="appearance-none bg-neutral-50 border border-border rounded-xl px-3.5 py-2 pr-8 text-xs font-extrabold text-foreground focus:outline-none cursor-pointer"
              >
                <option value="ALL">Semua Status (All)</option>
                <option value="COMPLETED">Selesai / Cair (Completed)</option>
                <option value="PENDING">Escrow Holding (Pending)</option>
                <option value="WITHDRAWAL">Penarikan (Withdrawal)</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <CaretDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500" />
            </div>

            {onRefresh && (
              <button
                onClick={onRefresh}
                className="p-2 border border-border rounded-xl text-muted-foreground hover:text-foreground hover:bg-neutral-100"
                title="Refresh Ledger"
              >
                <ArrowsLeftRight size={16} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Table */}
      <div className="overflow-x-auto border border-border rounded-xl w-full">
        <table className="w-full min-w-[700px] text-xs text-left border-collapse">
          <thead className="bg-neutral-50 text-neutral-600 font-extrabold uppercase text-[10px] tracking-wider border-b border-border">
            <tr>
              <th className="px-4 py-3">Tanggal & Waktu</th>
              <th className="px-4 py-3">ID Transaksi</th>
              <th className="px-4 py-3">Produk / Layanan</th>
              <th className="px-4 py-3 text-center">Status</th>
              <th className="px-4 py-3 text-right">Rincian Gross / Fee</th>
              <th className="px-4 py-3 text-right">Net Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-muted-foreground font-bold">
                  Memuat data ledger transaksi...
                </td>
              </tr>
            ) : filteredList.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-muted-foreground space-y-2">
                  <FileText size={32} className="mx-auto text-neutral-300" />
                  <div className="font-bold text-sm text-foreground">Tidak Ada Transaksi Ditemukan</div>
                  <p className="text-xs">Coba ubah kata kunci pencarian atau filter status transaksi Anda.</p>
                </td>
              </tr>
            ) : (
              filteredList.map((item) => {
                const txCode = item.tx_id || item.booking_code || item.id;
                const productName = item.product || item.product_name || item.description || "Layanan Trexio";
                const grossAmount = item.gross || item.amount || 0;
                const feeAmount = item.fee !== undefined ? item.fee : (item.trexio_fee !== undefined ? item.trexio_fee : (item.platform_fee ?? 0));
                const netAmount = item.net !== undefined ? item.net : (item.net_amount !== undefined ? item.net_amount : Math.max(0, grossAmount - feeAmount));

                return (
                  <tr
                    key={item.id || txCode}
                    onClick={() => setSelectedTx(item)}
                    className="hover:bg-neutral-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Date */}
                    <td className="px-4 py-3.5 font-medium text-neutral-700 whitespace-nowrap">
                      {formatDateID(item.date || item.created_at)}
                    </td>

                    {/* Transaction ID */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-black text-xs text-[hsl(var(--primary))] bg-primary/10 px-2 py-0.5 rounded-md">
                          {txCode}
                        </span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyTxId(txCode);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200 transition-all"
                          title="Salin ID"
                        >
                          <Copy size={13} />
                        </button>
                      </div>
                    </td>

                    {/* Product & Type */}
                    <td className="px-4 py-3.5 max-w-[240px]">
                      <div className="font-extrabold text-foreground truncate">{productName}</div>
                      <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1.5 mt-0.5">
                        <span>{item.type || "Order"}</span>
                        {item.customer && <span>• {item.customer}</span>}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="px-4 py-3.5 text-center whitespace-nowrap">
                      {renderStatusBadge(item.status, netAmount)}
                    </td>

                    {/* Gross & Fee Details */}
                    <td className="px-4 py-3.5 text-right font-medium text-neutral-600 whitespace-nowrap">
                      {netAmount < 0 ? (
                        <span className="text-[11px] text-neutral-400">Withdrawal Transfer</span>
                      ) : (
                        <div className="text-[11px]">
                          <div>Gross: <span className="font-bold">{formatRupiah(grossAmount)}</span></div>
                          <div className="text-rose-600 text-[10px]">Fee (7%): -{formatRupiah(feeAmount)}</div>
                        </div>
                      )}
                    </td>

                    {/* Net Amount */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <span
                        className={`font-black text-sm ${
                          netAmount < 0
                            ? "text-rose-600"
                            : netAmount > 0
                            ? "text-emerald-700"
                            : "text-foreground"
                        }`}
                      >
                        {netAmount > 0 ? `+${formatRupiah(netAmount)}` : formatRupiah(netAmount)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Total Footer Summary */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 text-xs text-muted-foreground font-medium">
        <div>Menampilkan <strong className="text-foreground">{filteredList.length}</strong> dari <strong className="text-foreground">{rawList.length}</strong> catatan ledger</div>
        <div className="flex items-center gap-4 text-xs font-bold">
          <span>Net Accumulated: <strong className="text-emerald-700">{formatRupiah(filteredList.reduce((acc, curr) => acc + (curr.net || 0), 0))}</strong></span>
        </div>
      </div>

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="relative bg-white rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl animate-in zoom-in-95 my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex justify-between items-center border-b border-border pb-3 mb-3">
              <div className="flex items-center gap-2 font-black text-base text-foreground">
                <Receipt size={20} className="text-[hsl(var(--primary))]" /> Detail Transaksi Ledger
              </div>
              <button onClick={() => setSelectedTx(null)} aria-label="Tutup detail transaksi" className="text-muted-foreground hover:text-foreground font-bold text-sm p-1">
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 text-xs pr-1">
              <div className="bg-neutral-50 p-3.5 rounded-xl border border-border space-y-2">
                <div className="text-[10px] font-bold text-muted-foreground uppercase">ID Transaksi & Tanggal</div>
                <div className="font-mono font-black text-sm sm:text-base text-[hsl(var(--primary))] flex items-center gap-2 flex-wrap break-all">
                  <span>{selectedTx.tx_id || selectedTx.booking_code || selectedTx.id}</span>
                  <button onClick={() => copyTxId(selectedTx.tx_id || selectedTx.booking_code)} aria-label="Salin ID Transaksi" className="text-neutral-400 hover:text-foreground">
                    <Copy size={16} />
                  </button>
                </div>
                <div className="text-neutral-600 font-medium">{formatDateID(selectedTx.date || selectedTx.created_at)}</div>
              </div>

              <div className="space-y-1.5 p-1">
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Deskripsi / Produk:</span>
                  <span className="font-bold text-foreground text-right break-words">{selectedTx.product || selectedTx.product_name || selectedTx.description}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Pelanggan:</span>
                  <span className="font-bold text-foreground text-right">{selectedTx.customer || "Anonym"}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-muted-foreground shrink-0">Metode Pembayaran:</span>
                  <span className="font-bold text-foreground text-right">{selectedTx.payment_method || "Online PG"}</span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-border">
                  <span className="text-muted-foreground">Status Transaksi:</span>
                  <div>{renderStatusBadge(selectedTx.status, selectedTx.net)}</div>
                </div>
              </div>

              {/* Breakdown */}
              <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-1.5 font-bold text-emerald-950">
                <div className="flex justify-between text-neutral-600">
                  <span>Gross Sales:</span>
                  <span>{formatRupiah(selectedTx.gross || 0)}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Potongan Fee Trexio (7%):</span>
                  <span>-{formatRupiah(selectedTx.fee || selectedTx.trexio_fee || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-black text-emerald-800 pt-1 border-t border-emerald-200">
                  <span>Net Revenue Mitra:</span>
                  <span>{formatRupiah(selectedTx.net || 0)}</span>
                </div>
              </div>
            </div>

            <div className="shrink-0 pt-3 border-t border-border mt-3 text-center">
              <button
                onClick={() => setSelectedTx(null)}
                className="w-full bg-neutral-900 text-white font-extrabold text-xs py-2.5 rounded-xl hover:bg-neutral-800"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransactionLedger;
