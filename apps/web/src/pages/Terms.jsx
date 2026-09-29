export default function Terms() {
  return (
    <div className="pb-24 pt-10">
      <div className="trx-container max-w-4xl">
        <div className="trx-overline text-emerald-600">Ketentuan Layanan</div>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Syarat & Ketentuan Penggunaan TREXIO</h1>
        <p className="text-xs text-muted-foreground mt-2">Terakhir Diperbarui: 31 Juli 2026</p>

        <div className="mt-8 space-y-8 text-sm text-foreground/80 leading-relaxed bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Ketentuan Umum</h2>
            <p>
              Dengan mengakses dan menggunakan platform TREXIO, Anda menyetujui seluruh Syarat dan Ketentuan yang berlaku. TREXIO menyediakan platform marketplace pencarian, pemesanan, dan pengelolaan kegiatan eksplorasi alam / open trip.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Pemesanan & Pembayaran</h2>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Setiap pemesanan trip dianggap sah setelah pembayaran terverifikasi oleh sistem TREXIO atau admin.</li>
              <li>Peserta wajib mengisi data identitas diri yang valid (Nama Lengkap, Kontak WA, Kontak Darurat) untuk keperluan verifikasi dan asuransi perjalanan.</li>
              <li>Metode pembayaran dapat menggunakan Transfer Bank Virtual Account, QRIS, E-Wallet, dan Dompet TREXIO. Pembayaran melalui Trexio Dijamin Aman.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Kebijakan Pembatalan & Refund</h2>
            <ul className="list-disc pl-5 space-y-1 text-xs sm:text-sm">
              <li>Pembatalan oleh peserta lebih dari H-7 keberangkatan berhak menerima pengembalian dana sesuai syarat pihak organizer.</li>
              <li>Apabila trip dibatalkan oleh organizer karena faktor cuaca ekstrem / force majeure, peserta berhak atas reschedule penuh atau refund 100%.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">4. Tanggung Jawab & Keamanan</h2>
            <p>
              Setiap kegiatan outdoor mengandung risiko bawaan. Peserta diwajibkan mengikuti instruksi pemandu wisata / tour leader demi keselamatan bersama.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
