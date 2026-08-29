import React from "react";
import { FolderOpen, Inbox, FileSpreadsheet, ShieldAlert, Users, Activity, BarChart2, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmptyState({
  icon: Icon = FolderOpen,
  title = "Tidak Ada Data",
  description = "Belum ada informasi yang tersedia untuk ditampilkan saat ini.",
  action = null,
  secondaryAction = null,
  type = "dashed", // "dashed" | "card" | "minimal"
  className = "",
}) {
  const containerStyles = {
    dashed: "py-12 px-6 text-center bg-muted/15 rounded-2xl border-2 border-dashed border-border/80 flex flex-col items-center justify-center space-y-3.5",
    card: "py-10 px-6 text-center bg-card rounded-2xl border border-border shadow-2xs flex flex-col items-center justify-center space-y-3.5",
    minimal: "py-8 px-4 text-center flex flex-col items-center justify-center space-y-2.5",
  };

  return (
    <div className={`${containerStyles[type] || containerStyles.dashed} ${className}`}>
      {/* Icon Badge Container */}
      <div className="relative">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-b from-primary/15 to-primary/5 dark:from-primary/20 dark:to-primary/10 border border-primary/20 flex items-center justify-center shadow-xs text-primary transition-transform hover:scale-105">
          {typeof Icon === "function" || (typeof Icon === "object" && Icon !== null) ? (
            <Icon className="w-7 h-7 text-primary stroke-[1.75]" />
          ) : (
            Icon
          )}
        </div>
        <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-background border border-border flex items-center justify-center">
          <span className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-pulse" />
        </div>
      </div>

      {/* Title & Description */}
      <div className="max-w-md space-y-1">
        <h3 className="font-extrabold text-sm sm:text-base text-foreground tracking-tight">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground leading-relaxed font-normal">{description}</p>
        )}
      </div>

      {/* Action Buttons */}
      {(action || secondaryAction) && (
        <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}
