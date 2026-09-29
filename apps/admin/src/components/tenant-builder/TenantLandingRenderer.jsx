import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  MoneyWavy,
  UserCheck,
  Camera,
  Tree,
  Recycle,
  UsersThree,
  Heart,
  Crown,
  ForkKnife,
  Waves,
  FirstAid,
  CookingPot,
  ShieldWarning,
  Compass,
  FileText,
  Briefcase,
  Palette,
  Scroll,
  HouseSimple,
  Lightning,
  InstagramLogo,
  Smiley,
  Star,
  MapPin,
  Calendar,
  WhatsappLogo,
  CheckCircle,
  ArrowRight,
  Phone,
  Envelope,
  Question,
  Tag,
  Sparkle,
} from "@phosphor-icons/react";

// Icon lookup map to prevent runtime errors
const ICON_MAP = {
  ShieldCheck,
  MoneyWavy,
  UserCheck,
  Camera,
  Tree,
  Recycle,
  UsersThree,
  Heart,
  Crown,
  ForkKnife,
  Waves,
  FirstAid,
  CookingPot,
  ShieldWarning,
  Compass,
  FileText,
  Briefcase,
  Palette,
  Scroll,
  HouseSimple,
  Lightning,
  InstagramLogo,
  Smiley,
  Sparkle,
};

function renderIcon(iconName, props = { size: 24 }) {
  const Component = ICON_MAP[iconName] || CheckCircle;
  return <Component {...props} />;
}

export default function TenantLandingRenderer({
  config,
  onBookingClick,
  onContactClick,
  isInteractive = true,
}) {
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [liveTrips, setLiveTrips] = useState([]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/trips')
      .then(res => res.ok ? res.json() : [])
      .then(data => {
        if (isMounted && Array.isArray(data)) {
          setLiveTrips(data);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  if (!config) return <div className="p-8 text-center text-muted-foreground">Konfigurasi template belum siap.</div>;

  const { theme, sections, tenantInfo } = config;
  const primary = theme?.primaryColor || "#047857";
  const bgMode = theme?.bgMode || "light";

  // Dynamic Background Theme Classes
  let containerBg = "bg-background text-foreground";
  let cardBg = "bg-card border-border";
  let sectionAltBg = "bg-slate-50 dark:bg-neutral-900/50";

  if (bgMode === "dark-luxe") {
    containerBg = "bg-[#09111e] text-slate-100";
    cardBg = "bg-[#0f1d32] border-slate-800 text-slate-100";
    sectionAltBg = "bg-[#0c1627]";
  } else if (bgMode === "dark-slate") {
    containerBg = "bg-[#0f172a] text-slate-100";
    cardBg = "bg-[#1e293b] border-slate-700 text-slate-100";
    sectionAltBg = "bg-[#0b1120]";
  } else if (bgMode === "dark-neon") {
    containerBg = "bg-[#0b0f19] text-slate-100";
    cardBg = "bg-[#131b2e] border-pink-500/20 text-slate-100";
    sectionAltBg = "bg-[#080c14]";
  } else if (bgMode === "eco-tint") {
    containerBg = "bg-[#f4fbf7] text-slate-900 dark:bg-[#07160e] dark:text-slate-100";
    cardBg = "bg-white border-emerald-900/10 dark:bg-[#0d2217] dark:border-emerald-800/40";
    sectionAltBg = "bg-[#e8f6ef] dark:bg-[#0a1c12]";
  } else if (bgMode === "warm-parchment") {
    containerBg = "bg-[#fdfbf7] text-amber-950 dark:bg-[#1a120c] dark:text-amber-100";
    cardBg = "bg-[#f7f2e9] border-amber-900/10 dark:bg-[#261b12] dark:border-amber-900/30";
    sectionAltBg = "bg-[#f2ebd9] dark:bg-[#20160e]";
  }

  const enabledSections = (sections || []).filter((s) => s.enabled);

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 ${containerBg} ${theme?.fontStyle || "font-sans"}`}>
      {/* Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-opacity-90 border-b border-white/10 px-4 md:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {tenantInfo?.logo ? (
            <img src={tenantInfo.logo} alt="Logo" className="h-9 w-auto object-contain rounded" />
          ) : (
            <div
              className="h-9 px-3 rounded-lg flex items-center justify-center font-black text-white text-sm shadow-sm"
              style={{ backgroundColor: primary }}
            >
              {tenantInfo?.name ? tenantInfo.name.substring(0, 2).toUpperCase() : "TR"}
            </div>
          )}
          <div>
            <div className="font-extrabold text-base tracking-tight leading-tight">
              {tenantInfo?.name || "Trexio Tenant"}
            </div>
            {tenantInfo?.tagline && (
              <div className="text-[11px] opacity-70 line-clamp-1">{tenantInfo.tagline}</div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onContactClick && onContactClick(tenantInfo?.phone || "628123456789")}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 transition-all"
          >
            <WhatsappLogo size={16} className="text-emerald-500" />
            <span>WhatsApp Admin</span>
          </button>
          <button
            onClick={() => onBookingClick && onBookingClick()}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md hover:opacity-95 transition-all"
            style={{ backgroundColor: primary }}
          >
            Katalog Trip
          </button>
        </div>
      </header>

      {/* Dynamic Sections */}
      {enabledSections.map((sec) => {
        switch (sec.type) {
          case "hero":
            return (
              <section key={sec.id} className="relative overflow-hidden py-12 md:py-20 px-4 md:px-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                  <div className="lg:col-span-7 space-y-5">
                    {sec.badgeText && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                        <Sparkle size={14} className="animate-spin text-amber-500" />
                        <span>{sec.badgeText}</span>
                      </div>
                    )}
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight leading-[1.15]">
                      {sec.title}
                    </h1>
                    <p className="text-sm md:text-base opacity-80 leading-relaxed max-w-2xl">
                      {sec.subtitle}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        onClick={() => onBookingClick && onBookingClick()}
                        className="px-6 py-3.5 rounded-2xl text-sm font-extrabold text-white shadow-lg hover:shadow-xl hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                        style={{ backgroundColor: primary }}
                      >
                        <span>{sec.mainCtaText || "Pesan Trip Sekarang"}</span>
                        <ArrowRight size={18} />
                      </button>

                      <button
                        onClick={() => onContactClick && onContactClick(tenantInfo?.phone || "628123456789")}
                        className="px-5 py-3.5 rounded-2xl text-sm font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/20 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <WhatsappLogo size={18} className="text-emerald-500" />
                        <span>{sec.secondaryCtaText || "Tanya via WA"}</span>
                      </button>
                    </div>

                    {/* Stats Badges */}
                    {sec.statsBadges && sec.statsBadges.length > 0 && (
                      <div className="pt-6 grid grid-cols-3 gap-3 border-t border-white/10">
                        {sec.statsBadges.map((sb, idx) => (
                          <div key={idx} className="space-y-0.5">
                            <div className="text-xl md:text-2xl font-black" style={{ color: primary }}>
                              {sb.value}
                            </div>
                            <div className="text-[11px] opacity-75 font-medium">{sb.label}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="lg:col-span-5 relative">
                    <div className="relative rounded-3xl overflow-hidden border-4 border-white/20 shadow-2xl group">
                      <img
                        src={sec.heroImage || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80"}
                        alt="Hero"
                        className="w-full h-[320px] md:h-[420px] object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex items-end p-6">
                        <div className="text-white space-y-1">
                          <div className="text-xs uppercase font-bold tracking-widest text-emerald-400 flex items-center gap-1">
                            <CheckCircle size={14} /> Terverifikasi Official Partner
                          </div>
                          <div className="font-bold text-sm">
                            {tenantInfo?.name || "Trexio Authorized Tenant"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "badges":
            return (
              <section key={sec.id} className={`py-12 px-4 md:px-8 border-y border-white/10 ${sectionAltBg}`}>
                <div className="max-w-6xl mx-auto space-y-8">
                  {sec.title && (
                    <div className="text-center space-y-2 max-w-2xl mx-auto">
                      <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight">{sec.title}</h2>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                    {(sec.items || []).map((item, idx) => (
                      <div
                        key={idx}
                        className={`p-5 rounded-2xl ${cardBg} shadow-sm space-y-3 hover:-translate-y-1 transition-transform duration-300`}
                      >
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold shadow-md"
                          style={{ backgroundColor: primary }}
                        >
                          {renderIcon(item.icon, { size: 22 })}
                        </div>
                        <h3 className="font-bold text-sm md:text-base leading-snug">{item.title}</h3>
                        <p className="text-xs opacity-75 leading-relaxed">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "catalog":
            return (
              <section key={sec.id} className="py-14 px-4 md:px-8">
                <div className="max-w-6xl mx-auto space-y-8">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="text-xs uppercase tracking-widest font-bold text-amber-500 mb-1">
                        Katalog Pilihan
                      </div>
                      <h2 className="text-2xl md:text-3xl font-black">{sec.title || "Katalog Open Trip"}</h2>
                      {sec.subtitle && <p className="text-xs md:text-sm opacity-75 mt-1">{sec.subtitle}</p>}
                    </div>

                    <button
                      onClick={() => onBookingClick && onBookingClick()}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      <span>Lihat Semua Paket</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {(() => {
                      const displayTrips = liveTrips.length > 0 ? liveTrips.slice(0, 6).map(t => ({
                        id: t.id,
                        title: t.title || t.name,
                        destination: t.destination || t.location || "Indonesia",
                        price: `Rp ${Number(t.price || 0).toLocaleString('id-ID')}`,
                        originalPrice: t.original_price ? `Rp ${Number(t.original_price).toLocaleString('id-ID')}` : null,
                        seatsLeft: t.available_seats || t.seats_left || 5,
                        image: t.cover_image || t.image || "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=600&q=80",
                        tag: t.tag || (t.is_featured ? "Featured" : null)
                      })) : (sec.sampleTrips || []);

                      if (displayTrips.length === 0) {
                        return (
                          <div className="col-span-3 text-center py-8 text-muted-foreground">
                            Belum ada paket trip yang dipublikasikan.
                          </div>
                        );
                      }

                      return displayTrips.map((trip) => (
                        <div
                          key={trip.id}
                          className={`rounded-2xl overflow-hidden ${cardBg} shadow-sm hover:shadow-xl transition-all flex flex-col group border`}
                        >
                          <div className="relative h-48 overflow-hidden">
                            <img
                              src={trip.image}
                              alt={trip.title}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                            {trip.tag && (
                              <span
                                className="absolute top-3 left-3 px-2.5 py-1 rounded-md text-[10px] font-black uppercase text-white shadow-md"
                                style={{ backgroundColor: primary }}
                              >
                                {trip.tag}
                              </span>
                            )}
                            <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[11px] font-bold text-white flex items-center gap-1">
                              <Tag size={12} className="text-amber-400" />
                              <span>Sisa {trip.seatsLeft} Seat</span>
                            </div>
                          </div>

                          <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-1 text-[11px] opacity-75">
                                <MapPin size={12} className="text-emerald-500" />
                                <span>{trip.destination}</span>
                              </div>
                              <h3 className="font-bold text-sm leading-snug line-clamp-2">{trip.title}</h3>
                            </div>

                            <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                              <div>
                                {trip.originalPrice && <div className="text-[10px] opacity-60 line-through">{trip.originalPrice}</div>}
                                <div className="text-base font-black text-amber-500">{trip.price}</div>
                              </div>

                              <button
                                onClick={() => onBookingClick && onBookingClick(trip.id)}
                                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white hover:opacity-90 transition-all cursor-pointer"
                                style={{ backgroundColor: primary }}
                              >
                                Detail & Booking
                              </button>
                            </div>
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </section>
            );

          case "impact_or_metrics":
            return (
              <section key={sec.id} className={`py-12 px-4 md:px-8 border-y border-white/10 ${sectionAltBg}`}>
                <div className="max-w-6xl mx-auto space-y-6 text-center">
                  <h2 className="text-2xl md:text-3xl font-extrabold">{sec.title}</h2>
                  {sec.subtitle && <p className="text-xs md:text-sm opacity-75 max-w-xl mx-auto">{sec.subtitle}</p>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
                    {(sec.metricItems || []).map((m, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl ${cardBg} shadow-sm space-y-1`}>
                        <div className="text-2xl md:text-3xl font-black text-emerald-500">{m.number}</div>
                        <div className="text-xs opacity-80 font-medium">{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "testimonials":
            return (
              <section key={sec.id} className="py-12 px-4 md:px-8">
                <div className="max-w-5xl mx-auto space-y-8">
                  <div className="text-center space-y-1">
                    <div className="text-xs font-bold uppercase tracking-widest text-amber-500">Testimoni Verified</div>
                    <h2 className="text-2xl md:text-3xl font-black">{sec.title || "Ulasan Traveler"}</h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(sec.reviewItems || []).map((rev, idx) => (
                      <div key={idx} className={`p-6 rounded-2xl ${cardBg} shadow-sm space-y-4 border`}>
                        <div className="flex items-center gap-1 text-amber-400">
                          {[...Array(rev.rating || 5)].map((_, i) => (
                            <Star key={i} size={16} weight="fill" />
                          ))}
                        </div>
                        <p className="text-xs md:text-sm opacity-90 italic leading-relaxed">"{rev.comment}"</p>
                        <div className="flex items-center gap-3 pt-2 border-t border-white/10">
                          <img
                            src={rev.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80"}
                            alt={rev.name}
                            className="w-10 h-10 rounded-full object-cover border"
                          />
                          <div>
                            <div className="font-bold text-xs">{rev.name}</div>
                            <div className="text-[10px] opacity-70">{rev.role}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "gallery":
            return (
              <section key={sec.id} className={`py-12 px-4 md:px-8 ${sectionAltBg}`}>
                <div className="max-w-6xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold text-center">{sec.title || "Galeri Perjalanan"}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(sec.photos || []).map((photo, idx) => (
                      <div key={idx} className="h-40 md:h-48 rounded-xl overflow-hidden border shadow-sm group">
                        <img
                          src={photo}
                          alt="Gallery"
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </section>
            );

          case "cta_banner":
            return (
              <section key={sec.id} className="py-14 px-4 md:px-8">
                <div
                  className="max-w-5xl mx-auto rounded-3xl p-8 md:p-12 text-center text-white space-y-5 shadow-2xl relative overflow-hidden"
                  style={{
                    background: `linear-gradient(135deg, ${primary} 0%, #0f172a 100%)`,
                  }}
                >
                  <div className="relative z-10 max-w-2xl mx-auto space-y-3">
                    <h2 className="text-2xl md:text-4xl font-black">{sec.title}</h2>
                    <p className="text-xs md:text-sm opacity-90 leading-relaxed">{sec.text}</p>

                    <div className="pt-3">
                      <button
                        onClick={() => onBookingClick && onBookingClick()}
                        className="px-8 py-4 rounded-2xl bg-white text-slate-900 font-black text-sm shadow-xl hover:bg-slate-100 hover:scale-105 transition-all cursor-pointer"
                      >
                        {sec.buttonLabel || "Pesan Sekarang"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            );

          case "faq":
            return (
              <section key={sec.id} className="py-12 px-4 md:px-8 border-t border-white/10">
                <div className="max-w-3xl mx-auto space-y-6">
                  <h2 className="text-2xl font-bold text-center">{sec.title || "FAQ (Pertanyaan Umum)"}</h2>
                  <div className="space-y-3">
                    {(sec.faqItems || []).map((faq, idx) => {
                      const isOpen = openFaqIndex === idx;
                      return (
                        <div key={idx} className={`rounded-xl ${cardBg} border overflow-hidden`}>
                          <button
                            onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                            className="w-full text-left p-4 font-bold text-xs md:text-sm flex items-center justify-between cursor-pointer"
                          >
                            <span>{faq.q}</span>
                            <span className="text-emerald-500 font-mono font-bold text-base">{isOpen ? "−" : "+"}</span>
                          </button>
                          {isOpen && (
                            <div className="p-4 pt-0 text-xs opacity-80 border-t border-white/10 leading-relaxed">
                              {faq.a}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </section>
            );

          default:
            return null;
        }
      })}

      {/* Footer */}
      <footer className="py-8 px-4 md:px-8 border-t border-white/10 text-xs opacity-75 text-center space-y-2 bg-black/20">
        <div>
          © {new Date().getFullYear()} {tenantInfo?.name || "Trexio Tenant"} - Powered by Trexio White-Label Multitenant Platform.
        </div>
        <div className="flex items-center justify-center gap-4 text-[11px] text-muted-foreground">
          <Link to="/terms" className="hover:underline">Syarat & Ketentuan</Link>
          <span>•</span>
          <Link to="/privacy" className="hover:underline">Kebijakan Privasi</Link>
          <span>•</span>
          <Link to="/contact" className="hover:underline">Bantuan Customer Service</Link>
        </div>
      </footer>
    </div>
  );
}
