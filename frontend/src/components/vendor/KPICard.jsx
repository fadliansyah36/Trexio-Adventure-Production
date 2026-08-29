import React from "react";
import { TrendUp, TrendDown, Minus } from "@phosphor-icons/react";

/**
 * Reusable KPICard component for partner and admin portal dashboards.
 * Displays core metrics (e.g. Gross Sales, Net Revenue, Active Bookings)
 * with percentage-based growth indicators and customizable visual styles.
 */
export function KPICard({
  title,
  value,
  growth,
  growthType = "positive", // 'positive' | 'negative' | 'neutral'
  growthLabel = "vs. periode sebelumnya",
  icon: Icon,
  iconBg = "bg-primary/10 text-primary",
  badge,
  description,
  className = "",
  onClick,
}) {
  const isPositive = growthType === "positive" || (typeof growth === "number" && growth > 0) || (typeof growth === "string" && growth.startsWith("+"));
  const isNegative = growthType === "negative" || (typeof growth === "number" && growth < 0) || (typeof growth === "string" && growth.startsWith("-"));

  return (
    <div
      onClick={onClick}
      className={`bg-card border border-border rounded-2xl p-4 sm:p-5 space-y-2.5 sm:space-y-3 shadow-xs hover:shadow-md hover:border-neutral-300 transition-all ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      <div className="flex justify-between items-start gap-2">
        <div className="space-y-1 min-w-0">
          <span className="text-[10px] sm:text-[11px] font-black uppercase tracking-wider text-muted-foreground block truncate">
            {title}
          </span>
          {badge && (
            <span className="inline-block text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700 border border-neutral-200">
              {badge}
            </span>
          )}
        </div>
        {Icon && (
          <div className={`p-2 sm:p-2.5 rounded-xl text-lg font-bold shrink-0 ${iconBg}`}>
            <Icon size={18} weight="fill" className="sm:w-5 sm:h-5" />
          </div>
        )}
      </div>

      <div>
        <div className="text-xl sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight break-words">
          {value}
        </div>

        {(growth !== undefined && growth !== null) && (
          <div className="flex flex-wrap items-center gap-1.5 mt-2 text-xs font-bold">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black shrink-0 ${
                isPositive
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                  : isNegative
                  ? "bg-rose-50 text-rose-700 border border-rose-200/60"
                  : "bg-neutral-100 text-neutral-700 border border-neutral-200"
              }`}
            >
              {isPositive && <TrendUp size={12} weight="bold" />}
              {isNegative && <TrendDown size={12} weight="bold" />}
              {!isPositive && !isNegative && <Minus size={12} weight="bold" />}
              {growth}
            </span>
            <span className="text-[10px] sm:text-[11px] text-muted-foreground font-medium truncate">
              {growthLabel}
            </span>
          </div>
        )}

        {description && (
          <p className="text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 font-normal leading-relaxed">
            {description}
          </p>
        )}
      </div>
    </div>
  );
}

/**
 * Container grid for KPICards ensuring uniform responsive layout.
 */
export function KPIGrid({ children, className = "" }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
}

export default KPICard;
