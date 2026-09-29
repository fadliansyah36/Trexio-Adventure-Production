import React from "react";
import RoleProfileEditor from "@/components/RoleProfileEditor";
import { Building, UserCircle, ShieldCheck } from "@phosphor-icons/react";

export default function AdminProfile() {
  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1">
            <Building size={16} /> PENGELOLA TENANT & BASECAMP
          </div>
          <h1 className="text-2xl font-black text-foreground flex items-center gap-2">
            Profil Tenant & Pengaturan Akun Admin
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Kelola logo/foto tenant, nama organisasi, kata sandi terkonfirmasi, jam operasional, dan kontak support pelanggan.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold shrink-0">
          <ShieldCheck size={18} />
          <span>Tenant Admin Authorized</span>
        </div>
      </div>

      {/* Role Profile Editor for Admin Tenant */}
      <RoleProfileEditor role="tenant" />
    </div>
  );
}
