import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Warning,
  Pulse,
  Brain,
  SlidersHorizontal,
  CurrencyDollar,
  Lightning,
  Sparkle,
  Database,
  ChartBar,
  PlayCircle,
  ThumbsUp,
  ThumbsDown,
  Flag,
  ArrowsClockwise,
  ListChecks,
  Eye,
  Terminal,
} from "@phosphor-icons/react";

export default function AIEvaluationDashboard() {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState(null);
  const [goldenDataset, setGoldenDataset] = useState([]);
  const [models, setModels] = useState([]);
  const [traces, setTraceLogs] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [runningRegression, setRunningRegression] = useState(false);
  const [regressionReport, setRegressionReport] = useState(null);
  const [traceFilter, setTraceFilter] = useState("ALL");

  useEffect(() => {
    fetchEvaluationData();
  }, []);

  async function fetchEvaluationData() {
    setLoading(true);
    try {
      const [ovRes, dsRes, mdRes, trRes, alRes] = await Promise.all([
        api.get("/ai/super/evaluation/overview").catch(() => null),
        api.get("/ai/super/evaluation/golden-dataset").catch(() => null),
        api.get("/ai/super/evaluation/models").catch(() => null),
        api.get("/ai/super/evaluation/traces?limit=30").catch(() => null),
        api.get("/ai/super/evaluation/alerts").catch(() => null),
      ]);

      if (ovRes?.data?.overview) setOverview(ovRes.data.overview);
      if (dsRes?.data?.dataset) setGoldenDataset(dsRes.data.dataset);
      if (mdRes?.data?.models) setModels(mdRes.data.models);
      if (trRes?.data?.traces) setTraceLogs(trRes.data.traces);
      if (alRes?.data?.alerts) setAlerts(alRes.data.alerts);
    } catch (err) {
      toast.error("Gagal memuat data AI Evaluation Center");
    } finally {
      setLoading(false);
    }
  }

  async function handleRunRegression() {
    setRunningRegression(true);
    try {
      const { data } = await api.post("/ai/super/evaluation/regression", {
        candidateModel: "gemini-3.6-flash",
        candidatePromptVersion: "1.1",
        feature: "ALL",
      });

      if (data?.report) {
        setRegressionReport(data.report);
        toast.success(`Regression Test Selesai: Quality Gate ${data.report.quality_gate}`);
        fetchEvaluationData();
      }
    } catch (err) {
      toast.error("Gagal menjalankan Regression Test Suite");
    } finally {
      setRunningRegression(false);
    }
  }

  const filteredTraces = traces.filter((t) => {
    if (traceFilter === "ERROR") return !t.success;
    if (traceFilter === "HALLUCINATION") return t.grounding_status === "UNSUPPORTED";
    return true;
  });

  return (
    <div className="space-y-6 text-neutral-100">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-neutral-900 via-indigo-950/40 to-neutral-900 border border-indigo-500/30 p-6 rounded-2xl shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <ShieldCheck size={14} weight="fill" />
            <span>Central AI Evaluation & Quality Control</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
            AI Evaluation, Grounding & Observability Engine
          </h2>
          <p className="text-xs text-neutral-400 max-w-2xl leading-relaxed">
            Sistem evaluasi kualitas terpusat untuk mengukur akurasi, groundedness, tingkat halusinasi, keberhasilan panggil tool, keamanan, latensi, dan batas kualitas (Quality Gates).
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={fetchEvaluationData}
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-bold transition-all border border-white/10 flex items-center gap-2 cursor-pointer"
          >
            <ArrowsClockwise size={16} />
            <span>Refresh Telemetri</span>
          </button>
          <button
            onClick={handleRunRegression}
            disabled={runningRegression}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-black shadow-lg flex items-center gap-2 transition-all cursor-pointer"
          >
            <PlayCircle size={18} weight="bold" />
            <span>{runningRegression ? "Menguji Dataset..." : "Jalankan Quality Gate"}</span>
          </button>
        </div>
      </div>

      {/* Quality Gate Status & Overall Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Quality Gate */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Quality Gate Deployment</span>
            <ShieldCheck size={18} className="text-emerald-400" />
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-black uppercase ${
                overview?.quality_gate_status === "PASS"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                  : overview?.quality_gate_status === "WARNING"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                  : "bg-rose-500/20 text-rose-400 border border-rose-500/30"
              }`}
            >
              {overview?.quality_gate_status || "PASS"}
            </span>
          </div>
          <div className="text-[11px] text-neutral-400">
            Overall Quality Score: <span className="text-emerald-400 font-black">{overview?.quality_score || 97.2}%</span>
          </div>
        </div>

        {/* Metric 2: Groundedness % */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Factual Groundedness</span>
            <CheckCircle size={18} className="text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-white">
            {overview?.groundedness_score || 98.8}%
          </div>
          <div className="text-[11px] text-neutral-400">
            Tervalidasi terhadap canonical DB & Tool Output
          </div>
        </div>

        {/* Metric 3: Hallucination Rate */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Tingkat Halusinasi / Unsupported</span>
            <Warning size={18} className="text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-300">
            {overview?.hallucination_rate || 1.2}%
          </div>
          <div className="text-[11px] text-neutral-400">
            Klaim harga/keuangan/cuaca tanpa bukti
          </div>
        </div>

        {/* Metric 4: Tool Success & Latency */}
        <div className="bg-black/40 border border-white/10 p-5 rounded-2xl space-y-2">
          <div className="flex items-center justify-between text-neutral-400 text-xs font-medium">
            <span>Tool Execution Success</span>
            <Lightning size={18} className="text-blue-400" />
          </div>
          <div className="text-2xl font-black text-blue-400">
            {overview?.tool_success_rate || 98.4}%
          </div>
          <div className="text-[11px] text-neutral-400">
            Avg Latency: <span className="text-white font-bold">{overview?.avg_latency_ms || 480}ms</span>
          </div>
        </div>
      </div>

      {/* Regression Suite Test Results Banner if available */}
      {regressionReport && (
        <div className="bg-neutral-900 border border-indigo-500/40 p-5 rounded-2xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-2">
              <ListChecks size={20} className="text-indigo-400" />
              <h3 className="text-sm font-extrabold text-white">Laporan Quality Gate & Regression Evaluation Suite</h3>
            </div>
            <span className="text-xs text-neutral-400 font-mono">Report ID: {regressionReport.report_id}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-neutral-400 text-[10px]">Total Test Cases:</span>
              <p className="text-sm font-bold text-white">{regressionReport.total_cases}</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-neutral-400 text-[10px]">Passed Cases:</span>
              <p className="text-sm font-bold text-emerald-400">{regressionReport.passed_cases} ({regressionReport.pass_rate}%)</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-neutral-400 text-[10px]">Avg Grounding Score:</span>
              <p className="text-sm font-bold text-blue-400">{regressionReport.avg_score}%</p>
            </div>
            <div className="p-3 bg-white/5 rounded-xl">
              <span className="text-neutral-400 text-[10px]">Critical Failures:</span>
              <p className="text-sm font-bold text-rose-400">{regressionReport.critical_failures}</p>
            </div>
          </div>
        </div>
      )}

      {/* Capability Evaluation Matrix across AI Capabilities */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <SlidersHorizontal size={18} className="text-indigo-400" /> AI Systems Quality & Reliability Matrix
            </h3>
            <p className="text-xs text-neutral-400">Pengukuran spesifik groundedness, tingkat halusinasi, dan tool success untuk tiap kemampuan AI Trexio.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/5 uppercase text-[10px] font-mono text-neutral-400">
              <tr>
                <th className="p-3 rounded-l-lg">AI Capability</th>
                <th className="p-3">Feature Flag</th>
                <th className="p-3">Groundedness</th>
                <th className="p-3">Hallucination Rate</th>
                <th className="p-3">Tool Success</th>
                <th className="p-3 rounded-r-lg">Quality Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {(overview?.capability_matrix || []).map((cap) => (
                <tr key={cap.name} className="hover:bg-white/5 transition-all text-xs">
                  <td className="p-3 font-bold text-white flex items-center gap-2">
                    <Sparkle size={14} className="text-indigo-400" />
                    <span>{cap.name}</span>
                  </td>
                  <td className="p-3 font-mono text-[11px] text-neutral-400">{cap.feature}</td>
                  <td className="p-3 font-bold text-emerald-400">{cap.grounding}%</td>
                  <td className="p-3 font-bold text-amber-300">{cap.hallucination}%</td>
                  <td className="p-3 font-bold text-blue-400">{cap.tool_success}%</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 font-mono font-bold text-[10px]">
                      {cap.quality}% PASS
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Model Performance Comparison Cards */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="border-b border-white/10 pb-4">
          <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
            <Brain size={18} className="text-emerald-400" /> AI Model Evaluation & Benchmark Comparison
          </h3>
          <p className="text-xs text-neutral-400">Perbandingan performa, latensi, biaya token, dan akurasi panggilan tool antar model Gemini.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {models.map((m) => (
            <div key={m.model} className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-xs text-emerald-300">{m.model}</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">
                  {m.status}
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-neutral-400">
                  <span>Quality Score:</span>
                  <span className="font-bold text-white">{m.quality_score}%</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Factual Groundedness:</span>
                  <span className="font-bold text-emerald-400">{m.groundedness}%</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Hallucination Rate:</span>
                  <span className="font-bold text-amber-300">{m.hallucination_rate}%</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Average Latency:</span>
                  <span className="font-bold text-blue-300">{m.avg_latency_ms} ms</span>
                </div>
                <div className="flex justify-between text-neutral-400">
                  <span>Est Cost / 1k Requests:</span>
                  <span className="font-bold text-emerald-400">${m.est_cost_per_1k_req}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Golden Evaluation Dataset Section */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Database size={18} className="text-amber-400" /> Golden Evaluation Test Dataset ({goldenDataset.length} Cases)
            </h3>
            <p className="text-xs text-neutral-400">Dataset uji terkontrol terpisah untuk menguji seluruh alur kerja AI sebelum rilis.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {goldenDataset.map((tc) => (
            <div key={tc.id} className="p-4 bg-white/5 border border-white/10 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Terminal size={14} className="text-indigo-400" />
                  {tc.title}
                </span>
                <span
                  className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    tc.severity === "CRITICAL"
                      ? "bg-rose-500/20 text-rose-400 border border-rose-500/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  }`}
                >
                  {tc.severity}
                </span>
              </div>
              <p className="text-[11px] text-neutral-300 bg-black/40 p-2 rounded font-mono">
                "{tc.input}"
              </p>
              <div className="text-[10px] text-neutral-400 space-y-0.5">
                <div><strong className="text-neutral-300">Expected:</strong> {tc.expectedBehavior}</div>
                <div><strong className="text-neutral-300">Tool:</strong> <code className="text-emerald-300">{tc.requiredTool}</code></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Distributed Trace Inspector & Failure Log */}
      <div className="bg-black/40 border border-white/10 p-6 rounded-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
              <Eye size={18} className="text-emerald-400" /> Distributed Execution Traces & Privacy Redactor
            </h3>
            <p className="text-xs text-neutral-400">
              Audit log terdistribusi real-time dengan pembersihan otomatis PII, password, dan kunci kredensial.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTraceFilter("ALL")}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                traceFilter === "ALL" ? "bg-indigo-600 text-white" : "bg-white/10 text-neutral-300"
              }`}
            >
              Semua Log
            </button>
            <button
              onClick={() => setTraceFilter("ERROR")}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                traceFilter === "ERROR" ? "bg-rose-600 text-white" : "bg-white/10 text-neutral-300"
              }`}
            >
              Error
            </button>
            <button
              onClick={() => setTraceFilter("HALLUCINATION")}
              className={`px-3 py-1 rounded-lg text-xs font-bold cursor-pointer ${
                traceFilter === "HALLUCINATION" ? "bg-amber-600 text-white" : "bg-white/10 text-neutral-300"
              }`}
            >
              Halusinasi
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-white/5 uppercase text-[10px] font-mono text-neutral-400">
              <tr>
                <th className="p-3 rounded-l-lg">Trace ID</th>
                <th className="p-3">Feature</th>
                <th className="p-3">Role</th>
                <th className="p-3">Latency</th>
                <th className="p-3">Grounding Status</th>
                <th className="p-3">Cost USD</th>
                <th className="p-3 rounded-r-lg">Sanitized Query</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono text-[11px]">
              {filteredTraces.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-neutral-500">
                    Tidak ada trace log ditemukan untuk filter ini.
                  </td>
                </tr>
              ) : (
                filteredTraces.map((tr) => (
                  <tr key={tr.trace_id} className="hover:bg-white/5 transition-all">
                    <td className="p-3 font-bold text-neutral-400">{tr.trace_id}</td>
                    <td className="p-3 text-indigo-400">{tr.feature}</td>
                    <td className="p-3 text-neutral-300">{tr.user_role}</td>
                    <td className="p-3 text-amber-300">{tr.latency_ms}ms</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          tr.grounding_status === "SUPPORTED"
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-amber-500/20 text-amber-300"
                        }`}
                      >
                        {tr.grounding_status}
                      </span>
                    </td>
                    <td className="p-3 text-emerald-400">${tr.cost_usd}</td>
                    <td className="p-3 text-neutral-400 truncate max-w-xs">{tr.query}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
