import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api, formatRupiah, formatDateID } from "@/lib/api";
import { Users, Star, ChatTeardropText, PaperPlaneTilt, CheckCircle } from "@phosphor-icons/react";
import { toast } from "sonner";
import EmptyState from "@/components/EmptyState";
import { UserX, MessageSquareX } from "lucide-react";

export default function VendorCustomers() {
  const { vendor } = useOutletContext();
  const [tab, setTab] = useState("customers"); // customers | reviews
  const [customers, setCustomers] = useState([]);
  const [reviewsData, setReviewsData] = useState({ avg_rating: 5, total_reviews: 0, distribution: {}, reviews: [] });
  const [loading, setLoading] = useState(true);
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        api.get("/vendor/customers").catch(() => ({ data: [] })),
        api.get("/vendor/reviews").catch(() => ({ data: { avg_rating: 5, total_reviews: 0, reviews: [] } })),
      ]);
      setCustomers(Array.isArray(cRes.data) ? cRes.data : []);
      setReviewsData(rRes.data || {});
    } finally {
      setLoading(false);
    }
  }

  async function sendReply(reviewId) {
    if (!replyText.trim()) return;
    try {
      await api.post(`/vendor/reviews/${reviewId}/reply`, { reply: replyText });
      toast.success("Balasan ulasan berhasil dikirim!");
      setReplyingId(null);
      setReplyText("");
      loadData();
    } catch (e) {
      toast.error("Gagal mengirim balasan.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="trx-overline text-muted-foreground">Pelanggan & Ulasan</div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Mini CRM & Reputasi Mitra</h1>
        <p className="text-xs text-muted-foreground mt-1">Kelola direktori pelanggan dan tanggapi ulasan dari pendaki & traveler Anda.</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border gap-6 text-sm font-bold">
        <button
          onClick={() => setTab("customers")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            tab === "customers" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users size={18} /> Direktori Pelanggan ({customers.length})
        </button>
        <button
          onClick={() => setTab("reviews")}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            tab === "reviews" ? "border-[hsl(var(--primary))] text-[hsl(var(--primary))]" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Star size={18} /> Ulasan & Rating ({reviewsData.total_reviews})
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-sm text-neutral-500 font-bold">Memuat data...</div>
      ) : tab === "customers" ? (
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          {customers.length === 0 ? (
            <EmptyState
              title="Belum Ada Data Pelanggan"
              description="Pendaki atau traveler yang memesan produk atau layanan Anda akan otomatis terdata di CRM ini."
              icon={UserX}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-neutral-50 text-neutral-500 font-bold uppercase tracking-wider border-b border-border">
                  <tr>
                    <th className="px-4 py-3">Pelanggan</th>
                    <th className="px-4 py-3">Kontak</th>
                    <th className="px-4 py-3 text-center">Total Trip</th>
                    <th className="px-4 py-3 text-center">Selesai</th>
                    <th className="px-4 py-3 text-right">Lifetime Value (LTV)</th>
                    <th className="px-4 py-3 text-right">Terakhir Booking</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customers.map((c, i) => (
                    <tr key={i} className="hover:bg-neutral-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-foreground">{c.name}</td>
                      <td className="px-4 py-3 text-muted-foreground">
                        <div>{c.email}</div>
                        <div>{c.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{c.total_bookings}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-block bg-emerald-100 text-emerald-800 rounded-full px-2 py-0.5 font-bold">
                          {c.completed_bookings}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-black text-emerald-700">{formatRupiah(c.total_spend)}</td>
                      <td className="px-4 py-3 text-right text-muted-foreground">{c.last_booking_date ? formatDateID(c.last_booking_date) : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-white border border-border rounded-xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="text-center md:text-left">
              <div className="text-4xl font-black text-amber-500 flex items-center justify-center md:justify-start gap-2">
                {reviewsData.avg_rating} <Star weight="fill" size={32} />
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">Berdasarkan {reviewsData.total_reviews} ulasan terverifikasi</div>
            </div>
            <div className="col-span-2 space-y-1.5 border-t md:border-t-0 md:border-l border-border pt-4 md:pt-0 md:pl-6">
              {[5, 4, 3, 2, 1].map((st) => {
                const count = reviewsData.distribution?.[st] || 0;
                const pct = reviewsData.total_reviews ? Math.round((count / reviewsData.total_reviews) * 100) : 0;
                return (
                  <div key={st} className="flex items-center gap-3 text-xs">
                    <span className="font-bold w-12 flex items-center gap-1">{st} <Star weight="fill" size={12} className="text-amber-400" /></span>
                    <div className="flex-1 h-2 bg-neutral-100 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-400" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-muted-foreground font-semibold w-12 text-right">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* List Reviews */}
          <div className="space-y-4">
            {!reviewsData.reviews || reviewsData.reviews.length === 0 ? (
              <EmptyState
                title="Belum Ada Ulasan"
                description="Ulasan dari pendaki atau traveler setelah menyelesaikan trip/sewa akan muncul di sini."
                icon={MessageSquareX}
              />
            ) : (
              reviewsData.reviews?.map((r) => (
              <div key={r.id} className="bg-white border border-border rounded-xl p-5 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-bold text-sm">{r.customer_name}</div>
                    <div className="text-xs text-muted-foreground">{r.trip_title} • {formatDateID(r.date)}</div>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                    {r.rating} <Star weight="fill" size={16} />
                  </div>
                </div>
                <p className="text-xs text-neutral-700 bg-neutral-50 p-3 rounded-lg">{r.comment}</p>

                {r.reply ? (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-xs space-y-1">
                    <div className="font-bold text-emerald-900 flex items-center gap-1">
                      <CheckCircle weight="fill" size={14} /> Balasan Mitra ({vendor.brand_name}):
                    </div>
                    <div className="text-emerald-800">{r.reply}</div>
                  </div>
                ) : replyingId === r.id ? (
                  <div className="space-y-2 pt-2">
                    <textarea
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder="Tulis balasan sopan & profesional..."
                      className="w-full text-xs p-3 border border-border rounded-lg focus:outline-none focus:border-[hsl(var(--primary))]"
                      rows={2}
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => setReplyingId(null)}
                        className="px-3 py-1.5 text-xs font-bold border border-border rounded-lg hover:bg-neutral-100"
                      >
                        Batal
                      </button>
                      <button
                        onClick={() => sendReply(r.id)}
                        className="px-3 py-1.5 text-xs font-bold bg-[hsl(var(--primary))] text-white rounded-lg hover:opacity-90 flex items-center gap-1"
                      >
                        <PaperPlaneTilt size={14} /> Kirim Balasan
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => { setReplyingId(r.id); setReplyText(""); }}
                    className="text-xs font-bold text-[hsl(var(--primary))] hover:underline flex items-center gap-1"
                  >
                    <ChatTeardropText size={14} /> Balas Ulasan Ini
                  </button>
                )}
              </div>
            ))
          )}
          </div>
        </div>
      )}
    </div>
  );
}
