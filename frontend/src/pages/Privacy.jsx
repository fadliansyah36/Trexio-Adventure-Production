export default function Privacy() {
  return (
    <div className="pb-24 pt-10">
      <div className="trx-container max-w-4xl">
        <div className="trx-overline text-emerald-600">Kebijakan Privasi</div>
        <h1 className="text-3xl sm:text-4xl font-black mt-2">Kebijakan Privasi Pengguna TREXIO</h1>
        <p className="text-xs text-muted-foreground mt-2">Terakhir Diperbarui: 31 Juli 2026</p>

        <div className="mt-8 space-y-8 text-sm text-foreground/80 leading-relaxed bg-card border border-border rounded-2xl p-6 sm:p-10 shadow-sm">
          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">1. Pengumpulan Informasi</h2>
            <p>
              TREXIO mengumpulkan informasi pribadi seperti nama, alamat email, nomor telepon, dan data peserta perjalanan yang Anda berikan secara langsung saat pendaftaran akun atau proses booking trip.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">2. Penggunaan Informasi</h2>
            <p>
              Informasi yang dikumpulkan digunakan untuk memproses reservasi tiket, menerbitkan invoice, mengoordinasikan manifes peserta dengan organizer/pemandu, dan memberikan layanan purna jual.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-foreground mb-2">3. Perlindungan & Keamanan Data</h2>
            <p>
              Kami menerapkan enkripsi standar industri dan pengamanan server ketat. Data Anda tidak akan diperjualbelikan kepada pihak ketiga di luar kebutuhan operasional perjalanan.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
