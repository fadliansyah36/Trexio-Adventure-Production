import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import trexioLogoImg from "@/assets/trexio-logo.png";

export function TrexioLogo({
  variant = "horizontal",
  size = "md",
  showTagline = true,
  className = "",
  textColor = "currentColor",
  logoUrl: customLogoUrl,
}) {
  const [siteBranding, setSiteBranding] = useState(() => {
    try {
      const cached = localStorage.getItem("trexio_site_branding");
      return cached ? JSON.parse(cached) : null;
    } catch (e) {
      return null;
    }
  });
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const handleBrandingChange = (e) => {
      if (e.detail) {
        setSiteBranding(e.detail);
        setImgError(false);
      }
    };
    window.addEventListener("trexio_branding_updated", handleBrandingChange);

    if (!siteBranding) {
      apiFetch("/homepage-config")
        .then((data) => {
          if (data && data.branding) {
            setSiteBranding(data.branding);
            try {
              localStorage.setItem("trexio_site_branding", JSON.stringify(data.branding));
            } catch (e) {}
          }
        })
        .catch(() => {});
    }

    return () => {
      window.removeEventListener("trexio_branding_updated", handleBrandingChange);
    };
  }, []);

  const isDarkBg =
    textColor === "white" ||
    textColor === "#FFFFFF" ||
    textColor === "#fff" ||
    className.includes("text-white") ||
    variant === "splash";

  // Determine active logo URL
  let logoSrc = trexioLogoImg;
  if (customLogoUrl) {
    logoSrc = customLogoUrl;
  } else if (
    siteBranding?.logoUrl &&
    !siteBranding.logoUrl.endsWith(".svg") &&
    siteBranding.logoUrl.trim() !== ""
  ) {
    logoSrc = siteBranding.logoUrl;
  }

  const effectiveLogoUrl = imgError ? trexioLogoImg : logoSrc;
  const platformName = siteBranding?.platformName || "TREXIO";
  const tagline = siteBranding?.tagline || "TRACK EVERY JOURNEY";

  // Size mappings for Icon / Emblem
  const iconSizes = {
    xs: "h-6 w-6",
    sm: "h-8 w-8",
    md: "h-10 w-10",
    lg: "h-14 w-14",
    xl: "h-20 w-20",
    "2xl": "h-28 w-28",
    "3xl": "h-36 w-36",
  };

  const horizontalHeights = {
    xs: "h-6",
    sm: "h-8",
    md: "h-10",
    lg: "h-14",
    xl: "h-20",
    "2xl": "h-28",
  };

  if (variant === "icon") {
    return (
      <div className={`inline-flex items-center justify-center shrink-0 ${iconSizes[size] || "h-10 w-10"} ${className}`}>
        <img
          src={effectiveLogoUrl}
          alt={platformName}
          className="h-full w-full object-contain filter drop-shadow-sm rounded-lg"
          onError={() => setImgError(true)}
        />
      </div>
    );
  }

  if (variant === "splash") {
    return (
      <div className={`flex flex-col items-center justify-center text-center p-4 sm:p-6 ${className}`}>
        <div className="relative mb-3 sm:mb-4">
          <div className="absolute -inset-4 sm:-inset-6 rounded-full bg-emerald-500/25 blur-xl animate-pulse" />
          <img
            src={effectiveLogoUrl}
            alt={platformName}
            className="h-28 sm:h-36 md:h-44 w-auto max-w-[280px] sm:max-w-[340px] relative z-10 object-contain filter drop-shadow-[0_10px_25px_rgba(34,197,94,0.4)] transition-transform duration-500 hover:scale-105"
            onError={() => setImgError(true)}
          />
        </div>
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-black tracking-tight text-white mb-1.5 font-sans drop-shadow-md">
          {platformName}
        </h1>
        <p className="text-xs sm:text-sm md:text-base font-bold text-emerald-400 tracking-wider uppercase drop-shadow-sm">
          Trexio - Adventure Marketplace
        </p>
      </div>
    );
  }

  if (variant === "horizontal") {
    return (
      <div className={`inline-flex items-center gap-2.5 ${horizontalHeights[size] || "h-10"} ${className}`}>
        <img
          src={effectiveLogoUrl}
          alt={platformName}
          className={`object-contain ${horizontalHeights[size] || "h-10"} w-auto max-w-[220px] filter drop-shadow-sm shrink-0`}
          onError={() => setImgError(true)}
        />
        <div className="flex flex-col justify-center leading-none">
          <span className={`font-black tracking-tight ${isDarkBg ? "text-white" : "text-slate-900 dark:text-white"} ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-xl' : 'text-base'}`}>
            {platformName}
          </span>
          {showTagline && (
            <span className="text-[9px] sm:text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 tracking-widest uppercase mt-0.5">
              {tagline}
            </span>
          )}
        </div>
      </div>
    );
  }

  // Default: Vertical Full Logo
  return (
    <div className={`inline-flex flex-col items-center text-center ${className}`}>
      <img
        src={effectiveLogoUrl}
        alt={platformName}
        className={`${horizontalHeights[size] || "h-12"} max-w-[220px] object-contain mb-2 drop-shadow-md`}
        onError={() => setImgError(true)}
      />
      <span className={`font-black tracking-tight ${isDarkBg ? "text-white" : "text-slate-900 dark:text-white"} ${size === 'sm' ? 'text-sm' : 'text-lg'}`}>
        {platformName}
      </span>
      {showTagline && (
        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 tracking-wider uppercase mt-0.5">
          {tagline}
        </span>
      )}
    </div>
  );
}

export default TrexioLogo;
