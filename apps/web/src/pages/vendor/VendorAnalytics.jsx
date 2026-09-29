import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { api } from "@/lib/api";
import AnalyticsDashboard from "@/components/vendor/AnalyticsDashboard";

export default function VendorAnalytics() {
  const { vendor } = useOutletContext();

  return (
    <div className="space-y-6">
      <div>
        <div className="trx-overline text-muted-foreground">Analitik & Intelligence Portal</div>
        <h1 className="text-2xl md:text-3xl font-black tracking-tighter">Performa Bisnis Partner</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Laporan visual waktu nyata mengenai traffic, tren pendaftaran, rasio konversi, dan revenue mitra {vendor?.brand_name || "Trexio"}.
        </p>
      </div>

      {/* Interactive Visual Analytics Dashboard */}
      <AnalyticsDashboard showTitle={false} />
    </div>
  );
}

