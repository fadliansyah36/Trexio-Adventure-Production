import React, { useState, useEffect, useCallback } from 'react';
import {
  Database,
  CreditCard,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  RefreshCw,
  ServerCrash,
  CheckCircle2,
  XCircle,
  WifiOff
} from 'lucide-react';

export default function SystemStatusAlert() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [lastCheck, setLastCheck] = useState(null);
  const [errorCount, setErrorCount] = useState(0);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/system/status');
      const data = await res.json();
      setStatus(data);
      setLastCheck(new Date());
      if (data && data.database && data.database.connected) {
        setErrorCount(0);
      } else {
        setErrorCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('[SystemStatus] Failed to check system status:', err);
      setStatus(prev => ({
        ok: false,
        status: 'unhealthy',
        database: {
          connected: false,
          provider: 'Supabase PostgreSQL',
          error: 'Tidak dapat menghubungi server backend / database terputus.'
        },
        payment: { configured: true, provider: 'Midtrans', mode: 'Sandbox' },
        llm: { configured: true, provider: 'Google Gemini' },
        auth: { provider: 'Supabase Auth', configured: true }
      }));
      setErrorCount(prev => prev + 1);
      setLastCheck(new Date());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    checkStatus();
    // Poll every 12 seconds
    const interval = setInterval(checkStatus, 12000);
    return () => clearInterval(interval);
  }, [checkStatus]);

  // If status is not loaded yet, don't block
  if (!status) return null;

  const isDbDisconnected = status.database && status.database.connected === false;
  const isPaymentDegraded = status.payment && status.payment.error;
  const isLlmDegraded = status.llm && status.llm.error;

  // 1. CRITICAL: Database Disconnected -> Full Blocking Guard Screen
  if (isDbDisconnected) {
    return (
      <div
        id="trexio-db-disconnected-guard"
        className="fixed inset-0 z-[99999] bg-stone-950/95 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
      >
        <div className="max-w-xl w-full bg-stone-900 border border-red-500/40 rounded-2xl p-6 sm:p-8 shadow-2xl text-stone-100 animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-3 text-red-400 mb-4">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20">
              <ServerCrash className="w-8 h-8 text-red-500 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-red-400">Strict Connection Guard</span>
              <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Koneksi Database Terputus</h2>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/30 text-red-200 text-sm mb-6 leading-relaxed">
            <p className="font-medium">
              Aplikasi Trexio saat ini <strong>tidak terhubung dengan database Supabase PostgreSQL</strong>.
            </p>
            <p className="mt-2 text-xs text-red-300/90">
              Sesuai dengan protokol integritas data ketat (Strict Mode), seluruh akses data dan transaksi dinonaktifkan sementara agar tidak terjadi korupsi data atau manipulasi data semu.
            </p>
          </div>

          {/* System Diagnostic Breakdown */}
          <div className="space-y-2.5 mb-6">
            <p className="text-xs font-medium uppercase tracking-wider text-stone-400">Status Komponen Sistem:</p>
            
            <div className="grid grid-cols-1 gap-2 text-xs">
              {/* Database */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-red-500/40">
                <div className="flex items-center gap-2.5">
                  <Database className="w-4 h-4 text-red-400" />
                  <div>
                    <span className="font-semibold text-stone-200">Supabase PostgreSQL</span>
                    <span className="block text-[11px] text-red-400/90 truncate max-w-[260px]">
                      {status.database.error || 'Pool connection unreachable'}
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 text-red-400 font-semibold border border-red-500/30">
                  <XCircle className="w-3.5 h-3.5" /> Terputus
                </span>
              </div>

              {/* Payment Gateway */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-stone-200">Payment Gateway</span>
                    <span className="block text-[11px] text-stone-400">
                      Midtrans Snap ({status.payment?.mode || 'Sandbox'})
                    </span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> {status.payment?.configured ? 'Siap' : 'Nonaktif'}
                </span>
              </div>

              {/* LLM & Intelligence */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <div>
                    <span className="font-semibold text-stone-200">AI Intelligence Engine</span>
                    <span className="block text-[11px] text-stone-400">Google Gemini AI</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-semibold border border-emerald-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terhubung
                </span>
              </div>

              {/* Auth */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-stone-950 border border-stone-800">
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-indigo-400" />
                  <div>
                    <span className="font-semibold text-stone-200">Autentikasi</span>
                    <span className="block text-[11px] text-stone-400">Supabase Auth (GoTrue)</span>
                  </div>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/30">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Terkonfigurasi
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-stone-800">
            <span className="text-[11px] text-stone-400">
              Pengecekan terakhir: {lastCheck ? lastCheck.toLocaleTimeString() : '-'}
            </span>
            <button
              id="retry-db-connection-btn"
              onClick={checkStatus}
              disabled={loading}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-medium text-sm transition-all disabled:opacity-50 shadow-lg shadow-orange-600/20"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Memeriksa Koneksi...' : 'Coba Sambungkan Kembali'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Non-blocking warning banner for secondary issues (Payment / LLM) if DB is connected
  if (isPaymentDegraded || isLlmDegraded) {
    return (
      <div
        id="trexio-system-warning-banner"
        className="bg-amber-950/80 border-b border-amber-500/30 px-4 py-2 text-xs text-amber-200 flex items-center justify-between gap-2 z-40"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <span>
            {isPaymentDegraded && 'Layanan Payment Gateway mengalami gangguan. '}
            {isLlmDegraded && 'Layanan AI Engine sedang dalam status terbatas.'}
          </span>
        </div>
        <button
          onClick={checkStatus}
          className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>
    );
  }

  return null;
}
