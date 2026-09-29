import { Link } from "react-router-dom";
import { Compass, InstagramLogo, TwitterLogo, YoutubeLogo, ShieldCheck, CreditCard } from "@phosphor-icons/react";
import { TrexioLogo } from "@/components/site/TrexioLogo";

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-slate-800 bg-slate-950 text-slate-300">
      <div className="trx-container grid grid-cols-1 md:grid-cols-5 gap-10 py-16">
        <div className="md:col-span-2">
          <Link to="/" aria-label="Trexio Beranda" className="inline-block">
            <TrexioLogo variant="horizontal" size="md" showTagline={true} className="text-white" />
          </Link>
          <p className="mt-4 text-sm text-slate-400 max-w-sm leading-relaxed">
            Marketplace Open Trip & Perlengkapan Outdoor No. 1 di Indonesia. Hubungkan pendaki, traveler, pemandu gunung, dan vendor lokal dalam satu platform terpercaya.
          </p>

          <div className="mt-6 flex items-center gap-3">
            <a data-testid="footer-ig" href="#" aria-label="Instagram Trexio" className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
              <InstagramLogo size={20} />
            </a>
            <a data-testid="footer-tw" href="#" aria-label="Twitter Trexio" className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
              <TwitterLogo size={20} />
            </a>
            <a data-testid="footer-yt" href="#" aria-label="YouTube Trexio" className="h-9 w-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-emerald-400 hover:border-emerald-500/50 transition-all">
              <YoutubeLogo size={20} />
            </a>
          </div>

          <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-800/50 text-emerald-300 text-xs font-semibold">
            <ShieldCheck size={16} className="text-emerald-400" />
            Keamanan Transaksi Garansi 100%
          </div>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">Layanan Marketplace</div>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/explore" className="hover:text-emerald-400 transition-colors">Semua Paket Trip</Link></li>
            <li><Link to="/category/open-trip" className="hover:text-emerald-400 transition-colors">Open Trip Gabungan</Link></li>
            <li><Link to="/category/private-trip" className="hover:text-emerald-400 transition-colors">Private Tour Kustom</Link></li>
            <li><Link to="/category/guide" className="hover:text-emerald-400 transition-colors">Pemandu Gunung APGI</Link></li>
            <li><Link to="/rental" className="hover:text-emerald-400 transition-colors">Sewa Alat Outdoor</Link></li>
            <li><Link to="/destinations" className="hover:text-emerald-400 transition-colors">Destinasi Populer</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">Pusat Bantuan</div>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li><Link to="/help" className="hover:text-emerald-400 transition-colors">Cara Pemesanan & FAQ</Link></li>
            <li><Link to="/promos" className="hover:text-emerald-400 transition-colors">Voucher & Diskon Promo</Link></li>
            <li><Link to="/communities" className="hover:text-emerald-400 transition-colors">Komunitas Pendaki</Link></li>
            <li><Link to="/contact" className="hover:text-emerald-400 transition-colors">Hubungi Customer Service</Link></li>
            <li><Link to="/about" className="hover:text-emerald-400 transition-colors">Tentang TREXIO</Link></li>
          </ul>
        </div>

        <div>
          <div className="text-xs font-bold uppercase tracking-wider text-white mb-4">Mitra & Kemitraan</div>
          <ul className="space-y-2.5 text-xs text-slate-400">
            <li>
              <Link to="/partner/register" className="text-emerald-400 font-bold hover:underline flex items-center gap-1">
                Registrasi Vendor / Tenant →
              </Link>
            </li>
            <li><Link to="/partner/login" className="hover:text-emerald-400 transition-colors">Portal Login Mitra</Link></li>
            <li><Link to="/terms" className="hover:text-emerald-400 transition-colors">Syarat & Ketentuan</Link></li>
            <li><Link to="/privacy" className="hover:text-emerald-400 transition-colors">Kebijakan Privasi</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-900 bg-slate-950/80 py-6">
        <div className="trx-container flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} TREXIO Outdoor Marketplace. Hak Cipta Dilindungi Undang-Undang.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span>Metode Pembayaran: Bank Transfer, E-Wallet, QRIS, Credit Card</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

