import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  MagnifyingGlass,
  X,
  Compass,
  Briefcase,
  Storefront,
  MapPin,
  TrendUp,
  CaretRight,
  Sparkle,
} from "@phosphor-icons/react";
import { api, formatRupiah } from "@/lib/api";

export default function SearchBarWithAutocomplete({
  placeholder = "Cari trip, sewa alat, gunung, atau vendor...",
  className = "",
  variant = "navbar",
  onSearch,
}) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState({
    trips: [],
    rentals: [],
    vendors: [],
    destinations: [],
    popular: [
      "Gunung Rinjani",
      "Mt. Prau Dieng",
      "Sailing Komodo",
      "Sewa Tenda Dome",
      "Rinjani Adventure",
      "Gunung Bromo Sunrise",
    ],
  });
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions on query change with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim().length > 0) {
        setLoading(true);
        api
          .get(`/search/suggestions?q=${encodeURIComponent(query.trim())}`)
          .then((res) => {
            if (res.data) setSuggestions(res.data);
          })
          .catch(() => {})
          .finally(() => setLoading(false));
      }
    }, 150);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    if (!query.trim()) return;
    setIsFocused(false);
    if (onSearch) onSearch(query.trim());
    navigate(`/explore?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSelectPopular = (term) => {
    setQuery(term);
    setIsFocused(false);
    navigate(`/explore?q=${encodeURIComponent(term)}`);
  };

  const handleSelectTrip = (item) => {
    setIsFocused(false);
    navigate(`/trip/${item.id}`);
  };

  const handleSelectRental = (item) => {
    setIsFocused(false);
    navigate(`/rental/${item.id}`);
  };

  const handleSelectVendor = (item) => {
    setIsFocused(false);
    navigate(`/@${item.handle || item.id}`);
  };

  const handleSelectDestination = (dest) => {
    setIsFocused(false);
    navigate(`/explore?q=${encodeURIComponent(dest.name)}`);
  };

  const hasResults =
    (suggestions.trips && suggestions.trips.length > 0) ||
    (suggestions.rentals && suggestions.rentals.length > 0) ||
    (suggestions.vendors && suggestions.vendors.length > 0) ||
    (suggestions.destinations && suggestions.destinations.length > 0);

  const isHero = variant === "hero";

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      {/* Input Box */}
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center transition-all duration-200 ${
          isHero
            ? "bg-card border-2 border-emerald-500/30 hover:border-emerald-500 rounded-2xl shadow-xl p-1 sm:p-2"
            : "bg-muted/80 hover:bg-muted border border-border/80 rounded-xl px-3 py-2 text-sm"
        }`}
      >
        <MagnifyingGlass
          size={isHero ? 22 : 18}
          className={`${
            isHero ? "ml-3 text-emerald-500" : "mr-2 text-muted-foreground"
          } shrink-0`}
        />

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          placeholder={placeholder}
          aria-label={placeholder || "Cari destinasi, trip, atau peralatan"}
          data-testid="search-autocomplete-input"
          className={`w-full bg-transparent text-foreground placeholder:text-muted-foreground focus:outline-hidden ${
            isHero ? "text-base font-semibold px-2 py-2" : "text-xs font-medium"
          }`}
        />

        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            aria-label="Bersihkan pencarian"
            className="p-1 hover:bg-muted/80 rounded-full text-muted-foreground hover:text-foreground mr-1 transition-colors"
            title="Bersihkan"
          >
            <X size={16} />
          </button>
        )}

        <button
          type="submit"
          data-testid="search-autocomplete-submit"
          className={`${
            isHero
              ? "bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold px-6 py-3 rounded-xl text-sm shadow-md transition-all shrink-0 ml-1"
              : "bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-3 py-1.5 rounded-lg text-xs shadow-2xs transition-colors shrink-0"
          }`}
        >
          Cari
        </button>
      </form>

      {/* Autocomplete Suggestions Dropdown */}
      {isFocused && (
        <div
          data-testid="search-autocomplete-dropdown"
          className="absolute left-0 right-0 top-full mt-2 bg-card/95 backdrop-blur-md border border-border shadow-2xl rounded-2xl overflow-hidden z-50 animate-in fade-in-50 zoom-in-95 max-h-[480px] overflow-y-auto"
        >
          {loading ? (
            <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
              <Sparkle className="animate-spin text-emerald-500" size={16} />
              Mencari saran petualangan...
            </div>
          ) : query.trim().length === 0 ? (
            /* Empty Query: Popular & Trending Searches */
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                <TrendUp size={16} weight="bold" /> Pencarian Populer
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {(suggestions.popular || []).map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={() => handleSelectPopular(term)}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 hover:border-emerald-500/30 border border-transparent text-xs font-medium text-foreground transition-all cursor-pointer"
                  >
                    <span>{term}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : !hasResults ? (
            /* No Results Found */
            <div className="p-6 text-center space-y-2">
              <p className="text-xs font-bold text-foreground">
                Tidak ada hasil langsung untuk "{query}"
              </p>
              <p className="text-[11px] text-muted-foreground">
                Tekan <strong className="text-emerald-600">Enter</strong> atau tombol{" "}
                <strong>Cari</strong> untuk menjelajah halaman pencarian lengkap.
              </p>
              <button
                onClick={handleSubmit}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:underline"
              >
                Cari "{query}" di Explore →
              </button>
            </div>
          ) : (
            /* Grouped Autocomplete Suggestions */
            <div className="divide-y divide-border/60">
              {/* Trips Section */}
              {suggestions.trips && suggestions.trips.length > 0 && (
                <div className="p-3">
                  <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <Compass size={14} weight="bold" /> Trip & Petualangan
                    </span>
                    <span>{suggestions.trips.length} Hasil</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.trips.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectTrip(item)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-emerald-500/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-foreground group-hover:text-emerald-600 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                              <MapPin size={11} className="text-emerald-500" />
                              {item.destination}
                            </div>
                          </div>
                        </div>
                        <div className="text-right pl-2 shrink-0">
                          <div className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                            {formatRupiah(item.price)}
                          </div>
                          <span className="text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm bg-emerald-500/10 text-emerald-600">
                            {item.badge}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Rental Gear Section */}
              {suggestions.rentals && suggestions.rentals.length > 0 && (
                <div className="p-3">
                  <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                      <Briefcase size={14} weight="bold" /> Sewa Alat Outdoor
                    </span>
                    <span>{suggestions.rentals.length} Hasil</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.rentals.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectRental(item)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-amber-500/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.cover_image}
                            alt={item.title}
                            loading="lazy"
                            className="w-10 h-10 rounded-lg object-cover shrink-0 border border-border"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-foreground group-hover:text-amber-600 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              {item.destination}
                            </div>
                          </div>
                        </div>
                        <div className="text-right pl-2 shrink-0">
                          <div className="text-xs font-black text-amber-600 dark:text-amber-400">
                            {formatRupiah(item.price)}
                            <span className="text-[10px] font-normal text-muted-foreground">/hari</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Vendor & Organizer Section */}
              {suggestions.vendors && suggestions.vendors.length > 0 && (
                <div className="p-3">
                  <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                      <Storefront size={14} weight="bold" /> Vendor & Mitra Verified
                    </span>
                    <span>{suggestions.vendors.length} Hasil</span>
                  </div>
                  <div className="space-y-1">
                    {suggestions.vendors.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => handleSelectVendor(item)}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-blue-500/10 cursor-pointer transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={
                              item.avatar ||
                              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                            }
                            alt={item.title}
                            loading="lazy"
                            className="w-9 h-9 rounded-full object-cover shrink-0 border border-emerald-500/30"
                          />
                          <div className="min-w-0 flex-1">
                            <div className="text-xs font-bold text-foreground group-hover:text-blue-600 transition-colors truncate">
                              {item.title}
                            </div>
                            <div className="text-[11px] text-muted-foreground">
                              @{item.handle} • {item.destination}
                            </div>
                          </div>
                        </div>
                        <CaretRight size={14} className="text-muted-foreground group-hover:text-blue-600" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Destinations Section */}
              {suggestions.destinations && suggestions.destinations.length > 0 && (
                <div className="p-3">
                  <div className="px-2 pb-2 text-[10px] font-black uppercase tracking-wider text-muted-foreground flex items-center justify-between">
                    <span className="flex items-center gap-1 text-emerald-600">
                      <MapPin size={14} weight="bold" /> Destinasi Populer
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {suggestions.destinations.map((dest) => (
                      <button
                        key={dest.name}
                        type="button"
                        onClick={() => handleSelectDestination(dest)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-muted hover:bg-emerald-500/10 hover:text-emerald-600 border border-border/60 text-xs font-bold text-foreground transition-all cursor-pointer"
                      >
                        <MapPin size={13} className="text-emerald-500" />
                        <span>{dest.name}</span>
                        <span className="text-[10px] font-normal text-muted-foreground">
                          ({dest.count})
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Footer search all link */}
              <div className="p-3 bg-muted/40 text-center">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Lihat Semua Hasil Pencarian untuk "{query}" <CaretRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
