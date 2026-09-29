import React from "react";
import RoleProfileEditor from "@/components/RoleProfileEditor";
import { ShieldCheck, UserCircle, Key } from "@phosphor-icons/react";

export default function SuperProfile() {
  return (
    <div className="p-6 md:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-emerald-400 mb-1">
            <ShieldCheck size={16} /> EXECUTIVE GOVERNANCE
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-white font-['Cabinet_Grotesk'] flex items-center gap-2">
            Profil & Keamanan Super Admin
          </h1>
          <p className="text-xs text-neutral-400 mt-1 font-['Manrope']">
            Kelola foto profil resmi, identitas eksekutif, kata sandi terverifikasi, dan atribut governance platform Trexio.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold shrink-0">
          <UserCircle size={18} />
          <span>Super Admin Access</span>
        </div>
      </div>

      {/* RoleProfileEditor for Super Admin */}
      <RoleProfileEditor role="super_admin" />
    </div>
  );
}
