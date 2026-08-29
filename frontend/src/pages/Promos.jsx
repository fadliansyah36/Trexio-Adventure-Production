import { useState } from "react";
import { Link } from "react-router-dom";
import { Tag, Copy, Check, ArrowRight, Sparkle, Ticket } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function Promos() {
  const [copiedCode, setCopiedCode] = useState(null);

  const promos = [
    {
      code: "TREXIO100",
      title: "Diskon Pengguna Baru TREXIO",
      discount: "Diskon Rp 100.000",
      minSpend: "Rp 500.000",
      expiry: "31 Des 2026",
      category: "Semua Trip",
      badge: "Paling Populer",
      description: "Nikmati potongan harga spesial Rp 100.000 untuk pemesanan trip pertama kamu di platform TREXIO.",
    },
    {
      code: "EXPLOREMORE",
      title: "Promo Jelajah Nusantara",
      discount: "Diskon 15% (Maks. Rp 250.000)",
      minSpend: "Rp 1.000.000",
      expiry: "15 Agu 2026",
      category: "Gunung & Laut",
      badge: "Terbatas",
      description: "Potongan 15% khusus untuk trip pendakian gunung dan ekspedisi bahari pilihan.",
    },
    {
      code: "GIFT100K",
      title: "Voucher Cashback Saldo Dompet",
      discount: "Cashback Rp 50.000",
      minSpend: "Rp 350.000",
      expiry: "30 Sep 2026",
      category: "Semua Produk",
      badge: "Cashback",
      description: "Cashback instan masuk ke Saldo Dompet TREXIO setelah pembayaran selesai.",
    },
    {
      code: "COMMUNITY10",
      title: "Special Bonus Komunitas Pendaki",
      discount: "Diskon Rp 75.000",
      minSpend: "Rp 400.000",
      expiry: "31 Des 2026",
      category: "Komunitas",
      badge: "Member Special",
      description: "Khusus untuk anggota komunitas terverifikasi di TREXIO.",
    },
  ];

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Kode promo ${code} berhasil disalin!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  return (
    <div className="pb-24">
      {/* Hero Header */}
      <div className="bg-gradient-to-b from-emerald-950 via-slate-900 to-background text-white py-16">
        <div className="trx-container text-center max-w-3xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30 mb-4">
            <Sparkle size={14} weight="fill" /> Promo & Kode Voucher Spesial
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Hemat Lebih Banyak untuk Petualangan Impianmu
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300">
            Gunakan kode promo dan voucher eksklusif TREXIO saat checkout untuk mendapatkan potongan harga langsung dan cashback instan.
          </p>
        </div>
      </div>

      {/* Promos Grid */}
      <div className="trx-container -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {promos.map((p) => (
            <div
              key={p.code}
              data-testid={`promo-card-${p.code}`}
              className="bg-card border border-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    {p.badge}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Ticket size={14} /> Kategori: {p.category}
                  </span>
                </div>

                <h3 className="text-xl font-bold">{p.title}</h3>
                <p className="mt-1 text-sm font-black text-emerald-600 dark:text-emerald-400 text-lg">
                  {p.discount}
                </p>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                  {p.description}
                </p>

                <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
                  <span>Min. Transaksi: <strong className="text-foreground">{p.minSpend}</strong></span>
                  <span>Berlaku hingga: <strong className="text-foreground">{p.expiry}</strong></span>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <div className="flex-1 bg-muted px-3 py-2 rounded-lg border border-border font-mono font-bold text-sm text-center tracking-widest text-foreground">
                  {p.code}
                </div>
                <button
                  onClick={() => handleCopy(p.code)}
                  data-testid={`copy-promo-${p.code}`}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedCode === p.code ? (
                    <>
                      <Check size={16} weight="bold" /> Tersalin
                    </>
                  ) : (
                    <>
                      <Copy size={16} /> Salin Kode
                    </>
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* CTA Banner */}
        <div className="mt-12 bg-gradient-to-r from-emerald-900 to-slate-900 text-white rounded-2xl p-8 text-center flex flex-col items-center justify-center">
          <Tag size={36} className="text-emerald-400 mb-2" />
          <h2 className="text-2xl font-bold">Siap Menggunakan Promomu?</h2>
          <p className="mt-2 text-sm text-slate-300 max-w-lg">
            Pilih trip atau rental favoritmu, isi data pemesan, lalu masukkan kode voucher saat di halaman checkout.
          </p>
          <Link
            to="/explore"
            className="mt-6 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl transition-all"
          >
            Cari & Booking Trip Sekarang <ArrowRight size={18} weight="bold" />
          </Link>
        </div>
      </div>
    </div>
  );
}
