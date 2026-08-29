import React, { useState } from "react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import {
  Globe,
  CheckCircle,
  ShieldCheck,
  WarningCircle,
  Copy,
  FloppyDisk,
  ArrowClockwise,
  LockKey,
} from "@phosphor-icons/react";

const RESERVED_SLUGS = [
  "admin",
  "api",
  "support",
  "payment",
  "app",
  "auth",
  "super",
  "www",
  "mail",
  "billing",
  "dashboard",
  "system",
  "static",
  "assets",
  "trexio",
  "checkout",
  "help",
  "docs",
];

export default function AdminWebsiteDomain() {
  const [subdomain, setSubdomain] = useState("rinjani-adventure");
  const [customDomain, setCustomDomain] = useState("www.rinjaniadventure.com");
  const [dnsStatus, setDnsStatus] = useState("verified"); // verified | pending | error
  const [sslStatus, setSslStatus] = useState("active");
  const [checkingDns, setCheckingDns] = useState(false);
  const [subdomainError, setSubdomainError] = useState("");

  function validateSubdomain(val) {
    const slug = val.toLowerCase().trim();
    if (slug.length < 3) {
      setSubdomainError("Minimal 3 karakter");
      return false;
    }
    if (slug.length > 30) {
      setSubdomainError("Maksimal 30 karakter");
      return false;
    }
    if (!/^[a-z0-9-]+$/.test(slug)) {
      setSubdomainError("Hanya boleh huruf kecil, angka, dan tanda hubung (-)");
      return false;
    }
    if (RESERVED_SLUGS.includes(slug)) {
      setSubdomainError(`Kata "${slug}" dilindungi oleh sistem Trexio`);
      return false;
    }
    setSubdomainError("");
    return true;
  }

  function handleSubdomainChange(e) {
    const val = e.target.value.toLowerCase().replace(/\s+/g, "-");
    setSubdomain(val);
    validateSubdomain(val);
  }

  function handleSaveSubdomain() {
    if (!validateSubdomain(subdomain)) {
      return toast.error("Format subdomain tidak valid");
    }
    toast.success(`Subdomain berhasil diperbarui menjadi ${subdomain}.trexio.id`);
  }

  function handleVerifyDns() {
    setCheckingDns(true);
    setTimeout(() => {
      setCheckingDns(false);
      setDnsStatus("verified");
      setSslStatus("active");
      toast.success("DNS record & Sertifikat SSL TLS berhasil diverifikasi dan terhubung!");
    }, 1200);
  }

  function copyToClipboard(text, label) {
    navigator.clipboard.writeText(text);
    toast.info(`${label} berhasil disalin!`);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-2">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Domain & SSL Engine
          </span>
          <span className="text-xs text-muted-foreground">Trexio Multitenant Router</span>
        </div>
        <h1 className="text-2xl font-black tracking-tight">Pengaturan Domain Storefront</h1>
        <p className="text-xs text-muted-foreground max-w-2xl leading-relaxed">
          Atur subdomain gratis dari Trexio atau hubungkan Custom Domain sendiri (contoh: www.rinjaniadventure.com) dengan otomatisasi SSL TLS HTTPS.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subdomain Trexio */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <Globe size={18} className="text-emerald-500" />
              <span>Subdomain Gratis Trexio</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              ● Active
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Setiap tenant terverifikasi mendapatkan subdomain publik gratis.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">Subdomain Slug</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 flex items-center border border-border rounded-xl bg-background overflow-hidden focus-within:ring-1 focus-within:ring-emerald-500">
                  <input
                    type="text"
                    value={subdomain}
                    onChange={handleSubdomainChange}
                    className="w-full px-3 py-2 bg-transparent font-mono font-bold text-xs"
                  />
                  <span className="bg-muted px-3 py-2 font-mono text-[11px] text-muted-foreground border-l border-border">
                    .trexio.id
                  </span>
                </div>
                <button
                  onClick={handleSaveSubdomain}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all cursor-pointer shrink-0"
                >
                  Simpan
                </button>
              </div>

              {subdomainError ? (
                <div className="text-[11px] text-red-500 font-semibold mt-1 flex items-center gap-1">
                  <WarningCircle size={14} />
                  <span>{subdomainError}</span>
                </div>
              ) : (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
                  <CheckCircle size={14} weight="fill" />
                  <span>Subdomain "{subdomain}.trexio.id" tersedia dan dapat digunakan</span>
                </div>
              )}
            </div>

            <div className="p-3.5 rounded-xl bg-muted/40 border border-border text-xs space-y-1">
              <div className="font-bold">Reserved Words Restriction:</div>
              <p className="text-[11px] opacity-75">
                Subdomain seperti admin, api, support, payment, app, billing, system tidak dapat digunakan untuk alasan keamanan platform.
              </p>
            </div>
          </div>
        </div>

        {/* Custom Domain Connection */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm flex items-center gap-2">
              <ShieldCheck size={18} className="text-emerald-500" />
              <span>Connect Your Own Domain (Custom Domain)</span>
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              Pro Feature
            </span>
          </div>

          <p className="text-xs text-muted-foreground leading-relaxed">
            Gunakan domain utama bisnis Anda sendiri dengan automatic SSL/TLS encryption.
          </p>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">Custom Domain Name</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customDomain}
                  onChange={(e) => setCustomDomain(e.target.value)}
                  placeholder="www.rinjaniadventure.com"
                  className="flex-1 px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
                />
                <button
                  onClick={handleVerifyDns}
                  disabled={checkingDns}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <ArrowClockwise size={14} className={checkingDns ? "animate-spin" : ""} />
                  <span>{checkingDns ? "Mengecek..." : "Cek DNS"}</span>
                </button>
              </div>
            </div>

            {/* DNS Records Table Instructions */}
            <div className="p-4 rounded-xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3">
              <div className="font-bold text-xs flex items-center justify-between">
                <span>Konfigurasi DNS Provider (Niagahoster/Godaddy/Cloudflare)</span>
                <span className="text-[10px] font-mono text-emerald-400">Target Server</span>
              </div>

              <div className="space-y-2 font-mono text-[11px]">
                <div className="p-2 rounded bg-black/50 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-amber-400 font-bold">CNAME Record:</span> <span className="text-white">cname.trexio.id</span>
                  </div>
                  <button onClick={() => copyToClipboard("cname.trexio.id", "CNAME Record")} className="text-slate-400 hover:text-white">
                    <Copy size={14} />
                  </button>
                </div>

                <div className="p-2 rounded bg-black/50 border border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-amber-400 font-bold">A Record:</span> <span className="text-white">103.150.190.10</span>
                  </div>
                  <button onClick={() => copyToClipboard("103.150.190.10", "A Record")} className="text-slate-400 hover:text-white">
                    <Copy size={14} />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/10 text-[11px]">
                <div>
                  <span className="opacity-60 block">DNS:</span>
                  <span className="font-bold text-emerald-400">✓ Verified</span>
                </div>
                <div>
                  <span className="opacity-60 block">SSL:</span>
                  <span className="font-bold text-emerald-400">✓ Active</span>
                </div>
                <div>
                  <span className="opacity-60 block">Status:</span>
                  <span className="font-bold text-emerald-400">● Connected</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
