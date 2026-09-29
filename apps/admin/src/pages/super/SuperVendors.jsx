import { useEffect, useState } from "react";
import { toast } from "sonner";
import { api, formatApiError, ASSET_BASE, safeArray } from "@/lib/api";
import { CheckCircle, X, Pause, ArrowSquareOut, Envelope, Phone, MapPin, Bank, User } from "@phosphor-icons/react";

const TYPE_LABEL = {
  organizer: "Organizer", guide: "Guide", merchant: "Merchant",
  rental: "Rental", community: "Community", event_org: "Event Org",
};

const STATUS_STYLE = {
  pending: "bg-amber-400/20 text-amber-300",
  verified: "bg-emerald-400/20 text-emerald-300",
  rejected: "bg-rose-400/20 text-rose-300",
  suspended: "bg-neutral-600/40 text-neutral-300",
};

export default function SuperVendors() {
  const [vendors, setVendors] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [action, setAction] = useState("");

  async function refresh() {
    setLoading(true);
    try {
      const q = filter === "all" ? "" : `?status=${filter}`;
      const { data } = await api.get(`/super/vendors${q}`);
      setVendors(data);
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => { refresh(); }, [filter]);

  async function openDetail(v) {
    setSelected(v);
    setDetail(null);
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/super/vendors/${v.id}`);
      setDetail(data);
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setDetailLoading(false);
    }
  }

  async function doAction(kind) {
    if (!selected) return;
    setAction(kind);
    try {
      if (kind === "verify") {
        await api.post(`/super/vendors/${selected.id}/verify`);
        toast.success("Vendor diverifikasi");
      } else if (kind === "reject") {
        if (!rejectReason.trim()) { toast.error("Isi alasan penolakan"); setAction(""); return; }
        await api.post(`/super/vendors/${selected.id}/reject`, { reason: rejectReason });
        toast.success("Vendor ditolak");
        setShowReject(false);
        setRejectReason("");
      } else if (kind === "suspend") {
        if (!confirm("Suspend vendor ini?")) { setAction(""); return; }
        await api.post(`/super/vendors/${selected.id}/suspend`);
        toast.success("Vendor di-suspend");
      } else if (kind === "impersonate") {
        if (!detail?.user_id) { toast.error("User ID tidak tersedia"); setAction(""); return; }
        await api.post(`/super/impersonate/${detail.user_id}`);
        toast.success(`Anda kini bertindak sebagai ${detail.user_email}`);
        setTimeout(() => window.location.assign("/vendor"), 300);
        return;
      }
      await openDetail(selected);
      refresh();
    } catch (e) {
      toast.error(formatApiError(e?.response?.data?.detail));
    } finally {
      setAction("");
    }
  }

  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400">Vendor Moderation</div>
      <h1 className="mt-2 text-3xl md:text-4xl font-black tracking-tighter">Verifikasi Vendor</h1>
      <p className="mt-2 text-neutral-400 text-sm">Approve, reject, atau suspend pengajuan vendor dari seluruh tenant.</p>

      <div className="mt-6 flex gap-2 flex-wrap">
        {["all", "pending", "verified", "rejected", "suspended"].map((s) => (
          <button
            key={s}
            data-testid={`super-vendor-filter-${s}`}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === s
              ? "bg-amber-400 text-black border-amber-400"
              : "bg-transparent text-neutral-300 border-white/10 hover:bg-white/5"}`}
          >
            {s === "all" ? "Semua" : s}
          </button>
        ))}
      </div>

      <div className="mt-6 rounded-md border border-white/5 bg-white/5 overflow-x-auto w-full">
        <table className="w-full min-w-[650px] text-sm">
          <thead className="bg-white/5 text-neutral-400 uppercase text-[10px] tracking-widest">
            <tr>
              <th className="text-left px-4 py-3">Brand</th>
              <th className="text-left px-4 py-3">Pemilik</th>
              <th className="text-left px-4 py-3">Tipe</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Diajukan</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Memuat...</td></tr>}
            {!loading && vendors.map((v) => (
              <tr key={v.id} className="border-t border-white/5" data-testid={`super-vendor-row-${v.id}`}>
                <td className="px-4 py-3 font-semibold">{v.brand_name}</td>
                <td className="px-4 py-3 text-xs">
                  <div>{v.user_name || "—"}</div>
                  <div className="text-neutral-500">{v.user_email}</div>
                </td>
                <td className="px-4 py-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {safeArray(v.types).map((t) => (
                      <span key={t} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px]">{TYPE_LABEL[t] || t}</span>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${STATUS_STYLE[v.status]}`}>
                    {v.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-xs text-neutral-500">{v.created_at ? new Date(v.created_at).toLocaleDateString("id-ID") : "—"}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => openDetail(v)}
                    data-testid={`super-vendor-view-${v.id}`}
                    className="text-amber-400 hover:underline text-xs font-semibold"
                  >
                    Detail →
                  </button>
                </td>
              </tr>
            ))}
            {!loading && vendors.length === 0 && (
              <tr><td colSpan={6} className="text-center py-8 text-neutral-500">Tidak ada vendor pada filter ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-2 sm:p-4 overflow-y-auto" data-testid="super-vendor-modal">
          <div className="relative bg-neutral-900 border border-white/10 rounded-xl w-full max-w-3xl my-auto max-h-[90vh] flex flex-col">
            <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-white/10">
              <div>
                <div className="text-xs uppercase tracking-widest text-neutral-500">Vendor Detail</div>
                <h3 className="font-bold text-base sm:text-lg text-white">{selected.brand_name}</h3>
              </div>
              <button onClick={() => { setSelected(null); setDetail(null); setShowReject(false); }} className="text-neutral-400 hover:text-white p-1" data-testid="super-vendor-close">
                <X size={22} />
              </button>
            </div>
            {detailLoading || !detail ? (
              <div className="p-8 text-center text-neutral-500">Memuat detail...</div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm">
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${STATUS_STYLE[detail.status]}`}>{detail.status}</span>
                  {safeArray(detail.types).map((t) => (
                    <span key={t} className="rounded-full bg-white/5 px-2.5 py-1 text-[10px]">{TYPE_LABEL[t] || t}</span>
                  ))}
                </div>

                {detail.tagline && <div className="text-neutral-300">{detail.tagline}</div>}
                {detail.description && <div className="text-xs text-neutral-500">{detail.description}</div>}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <InfoRow icon={Envelope} label="Email" value={detail.contact?.email} />
                  <InfoRow icon={Phone} label="Telepon" value={detail.contact?.phone} />
                  <InfoRow icon={Phone} label="WhatsApp" value={detail.contact?.whatsapp || "—"} />
                  <InfoRow icon={ArrowSquareOut} label="Website" value={detail.contact?.website || "—"} link={detail.contact?.website} />
                  <InfoRow icon={MapPin} label="Alamat" value={`${detail.legal?.address || ""}, ${detail.legal?.city || ""}, ${detail.legal?.province || ""}`} />
                  <InfoRow icon={MapPin} label="NIK / NPWP" value={`${detail.legal?.nik || "—"} / ${detail.legal?.npwp || "—"}`} />
                  <InfoRow icon={Bank} label="Bank" value={`${detail.payout?.bank_name || "—"} — ${detail.payout?.account_number || "—"}`} />
                  <InfoRow icon={Bank} label="Atas Nama" value={detail.payout?.account_holder || "—"} />
                </div>

                <div>
                  <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2 font-bold flex items-center justify-between">
                    <span>Dokumen Legalitas & Sertifikasi</span>
                    {(detail.documents?.bnsp_cert_url || detail.documents?.apgi_cert_url) && (
                      <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30">
                        Sertifikasi BNSP / APGI Ada
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <DocLink label="KTP" url={detail.documents?.ktp_url} />
                    <DocLink label="Surat Izin" url={detail.documents?.izin_usaha_url} />
                    <DocLink
                      label={`BNSP (${detail.documents?.bnsp_number || "Pemandu Gunung"})`}
                      url={detail.documents?.bnsp_cert_url}
                      extra={detail.documents?.bnsp_holder_name ? `a.n ${detail.documents.bnsp_holder_name}` : ""}
                    />
                    <DocLink
                      label={`APGI (${detail.documents?.apgi_level || "Mountain Guide"})`}
                      url={detail.documents?.apgi_cert_url}
                      extra={detail.documents?.apgi_number ? `No: ${detail.documents.apgi_number}` : ""}
                    />
                  </div>
                </div>

                {Array.isArray(detail.guides) && detail.guides.length > 0 && (
                  <div>
                    <div className="text-xs uppercase tracking-widest text-neutral-500 mb-2 font-bold">
                      Tim Pemandu Gunung Terlisensi ({detail.guides.length} Guide)
                    </div>
                    <div className="space-y-2">
                      {detail.guides.map((g) => (
                        <div key={g.id} className="p-2.5 rounded-lg border border-white/10 bg-black/40 text-xs flex items-center justify-between">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{g.name}</span>
                              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 font-extrabold px-2 py-0.5 rounded">
                                {g.cert_type || "BNSP/APGI"}
                              </span>
                            </div>
                            <div className="text-[11px] text-neutral-400 mt-0.5">
                              {g.bnsp_number && <span>BNSP: {g.bnsp_number} </span>}
                              {g.apgi_number && <span>APGI ({g.apgi_level}): {g.apgi_number}</span>}
                            </div>
                          </div>
                          {g.cert_url ? (
                            <a
                              href={`${ASSET_BASE}${g.cert_url}`}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded bg-emerald-500/20 text-emerald-300 font-bold hover:bg-emerald-500/30 text-[11px] inline-flex items-center gap-1"
                            >
                              <ArrowSquareOut size={12} /> Sertifikat
                            </a>
                          ) : (
                            <span className="text-[10px] text-neutral-500 italic">Tanpa File</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {detail.rejection_reason && (
                  <div className="rounded border border-rose-500/40 bg-rose-500/10 p-3 text-xs text-rose-300">
                    <div className="font-bold uppercase tracking-widest text-[10px]">Alasan Penolakan</div>
                    <div className="mt-1">{detail.rejection_reason}</div>
                  </div>
                )}

                <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-end gap-2">
                  {detail.slug && (
                    <a
                      href={`/@${detail.slug}`}
                      target="_blank" rel="noreferrer"
                      data-testid="super-vendor-storefront"
                      className="inline-flex items-center gap-1 rounded-md border border-white/10 text-neutral-300 px-3 py-2 text-xs font-bold hover:bg-white/5"
                    >
                      <ArrowSquareOut size={14} /> @{detail.slug}
                    </a>
                  )}
                  <button
                    onClick={() => doAction("impersonate")}
                    disabled={action === "impersonate"}
                    data-testid="super-vendor-impersonate"
                    className="inline-flex items-center gap-1 rounded-md border border-amber-400/40 text-amber-300 px-3 py-2 text-xs font-bold hover:bg-amber-400/10 disabled:opacity-50"
                  >
                    <User size={14} /> Login As
                  </button>
                  {detail.status !== "verified" && (
                    <button
                      onClick={() => doAction("verify")}
                      disabled={action === "verify"}
                      data-testid="super-vendor-approve"
                      className="inline-flex items-center gap-2 rounded-md bg-emerald-500 text-black px-4 py-2 text-sm font-bold hover:bg-emerald-400 disabled:opacity-50"
                    >
                      <CheckCircle size={16} weight="fill" /> Verifikasi
                    </button>
                  )}
                  {detail.status !== "rejected" && (
                    <button
                      onClick={() => setShowReject(true)}
                      data-testid="super-vendor-reject-open"
                      className="inline-flex items-center gap-2 rounded-md border border-rose-500/40 text-rose-300 px-4 py-2 text-sm font-bold hover:bg-rose-500/10"
                    >
                      <X size={16} /> Tolak
                    </button>
                  )}
                  {detail.status === "verified" && (
                    <button
                      onClick={() => doAction("suspend")}
                      data-testid="super-vendor-suspend"
                      className="inline-flex items-center gap-2 rounded-md border border-white/10 text-neutral-300 px-4 py-2 text-sm font-bold hover:bg-white/5"
                    >
                      <Pause size={16} /> Suspend
                    </button>
                  )}
                </div>

                {showReject && (
                  <div className="rounded-md border border-rose-500/40 bg-rose-500/5 p-4">
                    <div className="text-xs uppercase tracking-widest text-rose-300 mb-2">Alasan Penolakan</div>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      rows={3}
                      data-testid="super-vendor-reject-reason"
                      className="w-full rounded bg-black/40 border border-white/10 px-3 py-2 text-sm focus:outline-none focus:border-rose-400"
                      placeholder="Contoh: NIK tidak sesuai, dokumen KTP tidak jelas."
                    />
                    <div className="mt-2 flex justify-end gap-2">
                      <button onClick={() => { setShowReject(false); setRejectReason(""); }} className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white">Batal</button>
                      <button
                        onClick={() => doAction("reject")}
                        disabled={action === "reject"}
                        data-testid="super-vendor-reject-submit"
                        className="rounded-md bg-rose-500 text-black px-3 py-1.5 text-xs font-bold hover:bg-rose-400 disabled:opacity-50"
                      >
                        {action === "reject" ? "Menolak..." : "Kirim Penolakan"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, link }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-neutral-500 flex items-center gap-1">
        <Icon size={12} /> {label}
      </div>
      {link ? (
        <a href={link} target="_blank" rel="noreferrer" className="mt-1 block font-mono text-xs text-amber-400 truncate hover:underline">
          {value}
        </a>
      ) : (
        <div className="mt-1 text-sm text-neutral-200 break-words">{value || "—"}</div>
      )}
    </div>
  );
}

function DocLink({ label, url, extra }) {
  if (!url) {
    return (
      <div className="rounded border border-white/10 bg-black/30 p-3 text-xs text-neutral-500">
        {label}: <span className="italic">belum diupload</span>
      </div>
    );
  }
  return (
    <a
      href={`${ASSET_BASE}${url}`}
      target="_blank" rel="noreferrer"
      className="rounded border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs text-emerald-300 hover:bg-emerald-500/20 flex flex-col gap-1"
    >
      <div className="inline-flex items-center gap-1 font-bold">
        <ArrowSquareOut size={14} /> Lihat {label}
      </div>
      {extra && <div className="text-[10px] text-emerald-400/80 font-mono">{extra}</div>}
    </a>
  );
}
