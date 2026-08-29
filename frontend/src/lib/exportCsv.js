import { formatDateID, formatRupiah } from "@/lib/api";

/**
 * Downloads data array as a UTF-8 encoded CSV file (with BOM for Microsoft Excel compatibility)
 * @param {Array<Object>} data - Array of data objects
 * @param {Array<{label: string, key: string|Function}>} columns - Column configuration definitions
 * @param {string} filename - Target filename for download
 */
export function exportToCSV(data = [], columns = [], filename = "export.csv") {
  if (!data || !data.length) {
    return false;
  }

  // Header row
  const headerRow = columns.map((col) => `"${col.label.replace(/"/g, '""')}"`).join(",");

  // Body rows
  const bodyRows = data.map((item) => {
    return columns
      .map((col) => {
        let val = "";
        if (typeof col.key === "function") {
          val = col.key(item);
        } else if (col.key && col.key in item) {
          val = item[col.key];
        }
        if (val === null || val === undefined) val = "";
        const strVal = String(val).replace(/"/g, '""');
        return `"${strVal}"`;
      })
      .join(",");
  });

  // UTF-8 BOM (\uFEFF) for proper Excel character encoding
  const csvContent = "\uFEFF" + [headerRow, ...bodyRows].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename.endsWith(".csv") ? filename : `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

/**
 * Vendor Bookings CSV Exporter
 */
export function exportVendorBookingsCSV(bookings = [], vendorName = "Vendor") {
  const columns = [
    { label: "Kode Booking", key: (b) => b.booking_code || b.id || "-" },
    { label: "Nama Pemesan", key: (b) => b.contact_name || b.customer_name || "-" },
    { label: "Email", key: (b) => b.contact_email || b.email || "-" },
    { label: "No. Telepon / WA", key: (b) => b.contact_phone || b.phone || "-" },
    { label: "Produk / Layanan", key: (b) => b.trip_title || b.product_title || b.title || "-" },
    { label: "Tanggal Keberangkatan", key: (b) => b.departure_date ? formatDateID(b.departure_date) : "-" },
    { label: "Jumlah Pax / Qty", key: (b) => b.quantity || b.participants || b.pax || 1 },
    { label: "Total Pembayaran (Rp)", key: (b) => b.total_amount || b.price || 0 },
    { label: "Status Bayar", key: (b) => (b.payment_status || "pending").toUpperCase() },
    { label: "Status Booking", key: (b) => (b.booking_status || b.status || "pending").toUpperCase() },
    { label: "Status Check-in", key: (b) => b.checked_in ? "SUDAH CHECK-IN" : "BELUM" },
    { label: "Waktu Transaksi", key: (b) => b.created_at ? formatDateID(b.created_at) : "-" },
  ];

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan_Booking_${vendorName.replace(/\s+/g, "_")}_${dateStr}.csv`;
  return exportToCSV(bookings, columns, filename);
}

/**
 * Vendor Financial Ledger CSV Exporter
 */
export function exportVendorLedgerCSV(transactions = [], vendorName = "Vendor") {
  const columns = [
    { label: "Tanggal Transaksi", key: (t) => t.date || t.created_at ? formatDateID(t.date || t.created_at) : "-" },
    { label: "ID Transaksi / Ref", key: (t) => t.tx_id || t.booking_code || t.id || "-" },
    { label: "Produk / Deskripsi", key: (t) => t.product || t.product_name || t.description || "-" },
    { label: "Pelanggan", key: (t) => t.customer || t.customer_name || "-" },
    { label: "Tipe Transaksi", key: (t) => t.type || "Layanan" },
    { label: "Status Settlement", key: (t) => (t.status || "COMPLETED").toUpperCase() },
    { label: "Omset Kotor Gross (Rp)", key: (t) => t.gross !== undefined ? t.gross : (t.amount || 0) },
    { label: "Komisi Trexio (Rp)", key: (t) => t.fee !== undefined ? t.fee : (t.trexio_fee || 0) },
    { label: "Pendapatan Bersih Net (Rp)", key: (t) => t.net !== undefined ? t.net : (t.net_amount || 0) },
  ];

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Ledger_Keuangan_${vendorName.replace(/\s+/g, "_")}_${dateStr}.csv`;
  return exportToCSV(transactions, columns, filename);
}

/**
 * Super Admin Global Bookings CSV Exporter
 */
export function exportAdminBookingsCSV(bookings = []) {
  const columns = [
    { label: "Kode Booking", key: (b) => b.booking_code || b.id || "-" },
    { label: "Mitra / Vendor / Tenant", key: (b) => b.vendor_name || b.tenant_name || b.provider || "Mitra Trexio" },
    { label: "Nama Pemesan", key: (b) => b.contact_name || b.customer_name || "-" },
    { label: "Email Pemesan", key: (b) => b.contact_email || b.email || "-" },
    { label: "No. Telepon", key: (b) => b.contact_phone || b.phone || "-" },
    { label: "Produk / Trip", key: (b) => b.trip_title || b.product_title || b.title || "-" },
    { label: "Tanggal Keberangkatan", key: (b) => b.departure_date ? formatDateID(b.departure_date) : "-" },
    { label: "Jumlah Pax", key: (b) => b.quantity || b.participants || b.pax || 1 },
    { label: "Total Transaksi (Rp)", key: (b) => b.total_amount || b.price || 0 },
    { label: "Status Bayar", key: (b) => (b.payment_status || "pending").toUpperCase() },
    { label: "Status Booking", key: (b) => (b.booking_status || b.status || "pending").toUpperCase() },
    { label: "Waktu Transaksi", key: (b) => b.created_at ? formatDateID(b.created_at) : "-" },
  ];

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan_Booking_Global_SuperAdmin_${dateStr}.csv`;
  return exportToCSV(bookings, columns, filename);
}

/**
 * Super Admin Payouts CSV Exporter
 */
export function exportAdminPayoutsCSV(payouts = []) {
  const columns = [
    { label: "ID Payout", key: (p) => p.id || p.payout_id || "-" },
    { label: "Tipe Mitra", key: (p) => (p.target_type || p.payout_type || "Vendor").toUpperCase() },
    { label: "Nama Vendor / Tenant", key: (p) => p.vendor_name || p.tenant_name || p.account_holder || "-" },
    { label: "Bank Tujuan", key: (p) => p.bank_name || "-" },
    { label: "No. Rekening", key: (p) => p.account_number || "-" },
    { label: "Pemilik Rekening", key: (p) => p.account_holder || "-" },
    { label: "Nominal Payout (Rp)", key: (p) => p.amount || 0 },
    { label: "Status Approval", key: (p) => (p.status || "PENDING").toUpperCase() },
    { label: "Tanggal Pengajuan", key: (p) => p.created_at ? formatDateID(p.created_at) : "-" },
    { label: "Tanggal Disetujui", key: (p) => p.approved_at ? formatDateID(p.approved_at) : "-" },
    { label: "Catatan Ref", key: (p) => p.reference_note || p.notes || "-" },
  ];

  const dateStr = new Date().toISOString().split("T")[0];
  const filename = `Laporan_Payout_Settlement_SuperAdmin_${dateStr}.csv`;
  return exportToCSV(payouts, columns, filename);
}
