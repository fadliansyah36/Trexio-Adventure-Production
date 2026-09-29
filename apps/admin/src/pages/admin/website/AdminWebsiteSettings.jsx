import React, { useState } from "react";
import { toast } from "sonner";
import {
  Gear,
  FloppyDisk,
  Code,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
} from "@phosphor-icons/react";

export default function AdminWebsiteSettings() {
  const [gaMeasurementId, setGaMeasurementId] = useState("G-TRX992101");
  const [fbPixelId, setFbPixelId] = useState("3891029102");
  const [removeBranding, setRemoveBranding] = useState(false);
  const [siteOnline, setSiteOnline] = useState(true);
  const [saving, setSaving] = useState(false);

  function handleSave() {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success("Pengaturan umum website & tracking script berhasil disimpan!");
    }, 400);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-6 rounded-2xl shadow-sm">
        <div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
            Website Configuration
          </span>
          <h1 className="text-2xl font-black tracking-tight mt-1">Pengaturan & Script Pelacakan</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Konfigurasi Google Analytics ID, Meta Pixel, mode pemeliharaan website, serta penghapusan branding Trexio.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all cursor-pointer shrink-0"
        >
          <FloppyDisk size={16} />
          <span>{saving ? "Menyimpan..." : "Simpan Pengaturan"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Site Status & Custom Branding */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-5 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Gear size={18} className="text-emerald-500" />
            <span>Status & Visibilitas Site</span>
          </h3>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div>
                <div className="font-bold">Status Website Public</div>
                <div className="text-[11px] text-muted-foreground">Aktifkan atau matikan storefront untuk umum</div>
              </div>
              <button
                onClick={() => setSiteOnline(!siteOnline)}
                className="text-emerald-600 dark:text-emerald-400"
              >
                {siteOnline ? <ToggleRight size={36} weight="fill" /> : <ToggleLeft size={36} className="text-muted-foreground" />}
              </button>
            </div>

            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div>
                <div className="font-bold flex items-center gap-1">
                  <span>Hapus Watermark "Powered by Trexio"</span>
                  <span className="text-[10px] uppercase font-black bg-amber-500/10 text-amber-600 px-1.5 py-0.5 rounded">Pro</span>
                </div>
                <div className="text-[11px] text-muted-foreground">Sembunyikan label footer Trexio untuk white-label murni</div>
              </div>
              <button
                onClick={() => setRemoveBranding(!removeBranding)}
                className="text-emerald-600 dark:text-emerald-400"
              >
                {removeBranding ? <ToggleRight size={36} weight="fill" /> : <ToggleLeft size={36} className="text-muted-foreground" />}
              </button>
            </div>
          </div>
        </div>

        {/* Tracking Scripts */}
        <div className="bg-card border border-border p-6 rounded-2xl space-y-4 shadow-sm">
          <h3 className="font-extrabold text-sm flex items-center gap-2">
            <Code size={18} className="text-emerald-500" />
            <span>Tracking Scripts & Integrasi Analytics</span>
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">Google Analytics Measurement ID</label>
              <input
                type="text"
                value={gaMeasurementId}
                onChange={(e) => setGaMeasurementId(e.target.value)}
                placeholder="G-XXXXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Facebook Meta Pixel ID</label>
              <input
                type="text"
                value={fbPixelId}
                onChange={(e) => setFbPixelId(e.target.value)}
                placeholder="1234567890"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background font-mono text-xs"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
