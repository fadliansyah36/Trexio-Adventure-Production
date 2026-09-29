import React, { useState } from "react";
import {
  Funnel,
  SlidersHorizontal,
  X,
  ArrowsDownUp,
  Mountains,
  MapPin,
  CurrencyCircleDollar,
  ArrowClockwise,
  CaretDown,
  CaretUp,
  Check,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function formatRupiah(num) {
  if (num === null || num === undefined) return "Rp0";
  return "Rp" + Number(num).toLocaleString("id-ID");
}

export default function CatalogFilterSidebar({
  priceRange = [0, 10000000],
  setPriceRange,
  maxPossiblePrice = 10000000,
  selectedDifficulty = "Semua",
  setSelectedDifficulty,
  selectedLocation = "Semua",
  setSelectedLocation,
  difficultyOptions = ["Semua", "Pemula", "Menengah", "Ekstrem"],
  locationOptions = ["Semua", "Jawa Barat", "Jawa Tengah", "Jawa Timur", "NTB / Lombok", "Bali", "Sumatra"],
  sortBy = "populer",
  setSortBy,
  resetFilters,
  activeFiltersCount = 0,
  isCollapsed = false,
  setIsCollapsed,
}) {
  const [openSections, setOpenSections] = useState({
    price: true,
    difficulty: true,
    location: true,
    sort: true,
  });

  const toggleSection = (section) => {
    setOpenSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const isDifficultyActive = selectedDifficulty !== "Semua";
  const isLocationActive = selectedLocation !== "Semua";
  const isPriceActive = priceRange[0] > 0 || priceRange[1] < maxPossiblePrice;

  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs transition-all space-y-5">
      {/* HEADER SIDEBAR FILTER */}
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={20} className="text-emerald-600 dark:text-emerald-400" weight="bold" />
          <h2 className="font-extrabold text-sm sm:text-base text-foreground">Filter Catalog</h2>
          {activeFiltersCount > 0 && (
            <span
              data-testid="filter-active-count"
              className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-700 text-white animate-pulse"
            >
              {activeFiltersCount} Aktif
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {activeFiltersCount > 0 && (
            <button
              onClick={resetFilters}
              data-testid="reset-filters-btn"
              className="text-xs font-bold text-rose-500 hover:text-rose-600 dark:hover:text-rose-400 flex items-center gap-1 hover:underline transition-colors"
            >
              <ArrowClockwise size={13} /> Reset
            </button>
          )}

          {setIsCollapsed && (
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted md:hidden"
              title="Tutup Filter"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* SECTION 1: PRICE RANGE FILTER */}
      <div className="border-b border-border/60 pb-4">
        <button
          onClick={() => toggleSection("price")}
          className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-3 hover:text-emerald-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <CurrencyCircleDollar size={16} className="text-emerald-600" />
            <span>Rentang Harga (Rp)</span>
            {isPriceActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </span>
          {openSections.price ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {openSections.price && (
          <div className="space-y-3 pt-1">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Min (Rp)
                </label>
                <Input
                  type="number"
                  min={0}
                  max={priceRange[1]}
                  step={50000}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value));
                    setPriceRange([val, priceRange[1]]);
                  }}
                  className="h-8 text-xs font-semibold px-2 bg-background"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">
                  Max (Rp)
                </label>
                <Input
                  type="number"
                  min={priceRange[0]}
                  max={maxPossiblePrice * 2}
                  step={100000}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setPriceRange([priceRange[0], val]);
                  }}
                  className="h-8 text-xs font-semibold px-2 bg-background"
                />
              </div>
            </div>

            {/* Price Slider */}
            <input
              type="range"
              min={0}
              max={maxPossiblePrice}
              step={100000}
              value={priceRange[1]}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
              className="w-full accent-emerald-600 cursor-pointer h-1.5 bg-muted rounded-lg"
            />

            <div className="flex items-center justify-between text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1.5 rounded-lg border border-emerald-500/20">
              <span>{formatRupiah(priceRange[0])}</span>
              <span>-</span>
              <span>{formatRupiah(priceRange[1])}</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DIFFICULTY LEVEL */}
      <div className="border-b border-border/60 pb-4">
        <button
          onClick={() => toggleSection("difficulty")}
          className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-3 hover:text-emerald-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <Mountains size={16} className="text-emerald-600" />
            <span>Tingkat Kesulitan</span>
            {isDifficultyActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </span>
          {openSections.difficulty ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {openSections.difficulty && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {difficultyOptions.map((diff) => {
              const isSelected = selectedDifficulty === diff;
              return (
                <button
                  key={diff}
                  onClick={() => setSelectedDifficulty(diff)}
                  data-testid={`filter-diff-${diff}`}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1 ${
                    isSelected
                      ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                      : "bg-background hover:bg-muted text-muted-foreground hover:text-foreground border-border"
                  }`}
                >
                  {isSelected && <Check size={12} weight="bold" />}
                  <span>{diff}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 3: LOCATION / REGION */}
      <div className="border-b border-border/60 pb-4">
        <button
          onClick={() => toggleSection("location")}
          className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-3 hover:text-emerald-600 transition-colors"
        >
          <span className="flex items-center gap-1.5">
            <MapPin size={16} className="text-emerald-600" />
            <span>Lokasi & Wilayah</span>
            {isLocationActive && <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />}
          </span>
          {openSections.location ? <CaretUp size={14} /> : <CaretDown size={14} />}
        </button>

        {openSections.location && (
          <div className="space-y-1 pt-1 max-h-48 overflow-y-auto no-scrollbar">
            {locationOptions.map((loc) => {
              const isSelected = selectedLocation === loc;
              return (
                <button
                  key={loc}
                  onClick={() => setSelectedLocation(loc)}
                  data-testid={`filter-loc-${loc}`}
                  className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-all flex items-center justify-between ${
                    isSelected
                      ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-extrabold border border-emerald-500/30"
                      : "hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span>{loc}</span>
                  {isSelected && <Check size={14} weight="bold" className="text-emerald-600" />}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* SECTION 4: SORT BY */}
      {setSortBy && (
        <div>
          <button
            onClick={() => toggleSection("sort")}
            className="w-full flex items-center justify-between text-xs font-bold text-foreground mb-3 hover:text-emerald-600 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <ArrowsDownUp size={16} className="text-emerald-600" />
              <span>Urutkan Hasil</span>
            </span>
            {openSections.sort ? <CaretUp size={14} /> : <CaretDown size={14} />}
          </button>

          {openSections.sort && (
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { id: "populer", label: "Populer" },
                { id: "termurah", label: "Harga Terendah" },
                { id: "termahal", label: "Harga Tertinggi" },
                { id: "rating", label: "Rating Terbaik" },
              ].map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSortBy(s.id)}
                  data-testid={`sort-${s.id}`}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all text-center ${
                    sortBy === s.id
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-slate-900 dark:border-slate-100 shadow-2xs"
                      : "bg-background hover:bg-muted text-muted-foreground border-border"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
