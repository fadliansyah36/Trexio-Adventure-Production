import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, CameraRotate, Image, QrCode, Warning, Check, X, Sparkle, StopCircle } from "@phosphor-icons/react";
import { toast } from "sonner";

export default function CameraQrScanner({ onScanSuccess, onClose, title = "Scan QR Pass Basecamp" }) {
  const [cameraRequested, setCameraRequested] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState(null);
  const [manualCode, setManualCode] = useState("");
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Complete MediaStream Track Cleanup Utility
  const releaseCameraTracks = useCallback(() => {
    try {
      const videoElem = document.querySelector("#trexio-camera-reader video");
      if (videoElem && videoElem.srcObject) {
        const stream = videoElem.srcObject;
        if (stream && stream.getTracks) {
          stream.getTracks().forEach((track) => {
            try {
              track.stop();
            } catch (e) {}
          });
        }
        videoElem.srcObject = null;
      }
    } catch (e) {
      console.warn("Error releasing video tracks:", e);
    }
  }, []);

  // Stop Camera Session completely
  const stopCameraSession = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Error stopping scanner instance:", e);
      }
      scannerRef.current = null;
    }
    releaseCameraTracks();
    setIsScanning(false);
    setCameraRequested(false);
  }, [releaseCameraTracks]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      stopCameraSession();
    };
  }, [stopCameraSession]);

  // Start Camera Session on Explicit User Action
  async function startCameraSession(overrideCamId = null) {
    setCameraError(null);
    setCameraRequested(true);

    // Release any lingering prior sessions
    await stopCameraSession();

    const targetElement = document.getElementById("trexio-camera-reader");
    if (!targetElement) return;

    try {
      // List cameras if not listed yet
      let deviceList = cameras;
      if (!deviceList || deviceList.length === 0) {
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            setCameras(devices);
            deviceList = devices;
            if (!overrideCamId && !selectedCameraId) {
              const backCam = devices.find(
                (d) =>
                  d.label.toLowerCase().includes("back") ||
                  d.label.toLowerCase().includes("rear") ||
                  d.label.toLowerCase().includes("environment")
              );
              setSelectedCameraId(backCam ? backCam.id : devices[0].id);
            }
          }
        } catch (e) {
          console.warn("Could not enumerate cameras prior to start:", e);
        }
      }

      const html5QrCode = new Html5Qrcode("trexio-camera-reader");
      scannerRef.current = html5QrCode;

      const qrConfig = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
      };

      const camIdToUse = overrideCamId || selectedCameraId;
      const constraintCandidates = [];
      if (camIdToUse) {
        constraintCandidates.push({ deviceId: camIdToUse });
        constraintCandidates.push({ deviceId: { exact: camIdToUse } });
      }
      constraintCandidates.push({ facingMode: "environment" });
      constraintCandidates.push({ facingMode: "user" });

      let started = false;
      let lastErr = null;

      for (const config of constraintCandidates) {
        try {
          await html5QrCode.start(
            config,
            qrConfig,
            (decodedText) => {
              if (decodedText) {
                handleDecodedPayload(decodedText);
              }
            },
            () => {}
          );
          started = true;
          setIsScanning(true);
          setCameraError(null);
          break;
        } catch (err) {
          lastErr = err;
        }
      }

      if (!started) {
        console.error("Camera start failed:", lastErr);
        setIsScanning(false);
        const errMsg = lastErr?.message || String(lastErr) || "";
        if (errMsg.includes("NotReadableError") || errMsg.includes("Could not start video source")) {
          setCameraError("Kamera sedang digunakan oleh aplikasi/tab lain. Tutup aplikasi kamera lain lalu coba lagi.");
        } else if (errMsg.includes("NotAllowedError") || errMsg.includes("Permission denied")) {
          setCameraError("Izin kamera ditolak oleh browser. Buka Pengaturan Situs / Browser untuk mengizinkan akses kamera.");
        } else {
          setCameraError("Kamera tidak dapat diakses saat ini. Gunakan fitur Unggah Gambar QR atau Masukkan Kode Manual di bawah.");
        }
      }
    } catch (globalErr) {
      console.error("Camera initiation error:", globalErr);
      setIsScanning(false);
      setCameraError("Gagal mengaktifkan kamera. Silakan pilih opsi unggah file atau masukkan kode.");
    }
  }

  function handleDecodedPayload(decodedText) {
    let extractedCode = decodedText;
    try {
      const parsed = JSON.parse(decodedText);
      if (parsed.booking_code) extractedCode = parsed.booking_code;
      else if (parsed.ver_code) extractedCode = parsed.ver_code;
      else if (parsed.code) extractedCode = parsed.code;
    } catch (e) {
      // Raw string
    }

    if (navigator.vibrate) {
      navigator.vibrate(100);
    }

    toast.success(`QR Code Terdeteksi: ${extractedCode}`);
    stopCameraSession();

    if (onScanSuccess) {
      onScanSuccess(extractedCode, decodedText);
    }
  }

  async function handleSwitchCamera() {
    if (cameras.length <= 1) {
      toast.info("Hanya 1 kamera yang terdeteksi di perangkat ini.");
      return;
    }
    const currentIndex = cameras.findIndex((c) => c.id === selectedCameraId);
    const nextIndex = (currentIndex + 1) % cameras.length;
    const nextCamId = cameras[nextIndex].id;
    setSelectedCameraId(nextCamId);
    if (isScanning || cameraRequested) {
      await startCameraSession(nextCamId);
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const html5QrCode = new Html5Qrcode("trexio-camera-reader");
      const decodedText = await html5QrCode.scanFile(file, true);
      handleDecodedPayload(decodedText);
    } catch (err) {
      toast.error("Gagal membaca QR Code dari file gambar. Pastikan gambar jelas.");
    }
  }

  function handleManualSubmit(e) {
    e.preventDefault();
    if (!manualCode.trim()) return;
    handleDecodedPayload(manualCode.trim());
  }

  return (
    <div className="space-y-4">
      {/* Header Info */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div className="flex items-center gap-2 font-black text-sm sm:text-base text-foreground">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
            <QrCode size={20} weight="bold" />
          </div>
          <span>{title}</span>
        </div>
        {onClose && (
          <button
            onClick={() => {
              stopCameraSession();
              onClose();
            }}
            aria-label="Tutup Scanner"
            className="p-1.5 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Main Viewfinder Box */}
      <div className="relative bg-slate-950 text-white rounded-2xl overflow-hidden border border-slate-800 shadow-xl min-h-[300px] flex flex-col justify-center items-center">
        {/* Camera Viewport Container */}
        <div id="trexio-camera-reader" className={`w-full h-full max-w-sm overflow-hidden ${!isScanning ? "hidden" : "block"}`} />

        {/* 1. Inactive State (Default when modal opens - NO automatic permission request) */}
        {!cameraRequested && !isScanning && !cameraError && (
          <div className="p-6 text-center space-y-4 max-w-xs animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/20 shadow-inner">
              <Camera size={32} weight="duotone" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-extrabold text-slate-100">Kamera Belum Aktif</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Akses kamera hanya digunakan untuk memindai QR Pass secara langsung saat Anda menekan tombol di bawah.
              </p>
            </div>
            <button
              type="button"
              onClick={() => startCameraSession()}
              className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Camera size={18} weight="bold" /> Mulai Scan Kamera
            </button>
          </div>
        )}

        {/* 2. Camera Active - Viewfinder Overlay */}
        {isScanning && !cameraError && (
          <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-4">
            <div className="w-52 h-52 border-2 border-emerald-400/80 rounded-2xl relative shadow-[0_0_30px_rgba(16,185,129,0.3)] bg-emerald-500/5">
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-lg" />
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-bounce top-1/2 absolute" />
            </div>
            <span className="mt-3 text-[11px] font-extrabold text-emerald-300 bg-slate-900/90 backdrop-blur-md px-3 py-1 rounded-full border border-emerald-500/30">
              Posisikan QR Code di Dalam Kotak
            </span>
          </div>
        )}

        {/* 3. Camera Error / Permission Denied View */}
        {cameraError && (
          <div className="p-6 text-center space-y-3 max-w-xs animate-fade-in">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Warning size={24} weight="bold" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-200">Akses Kamera Ditolak / Tidak Tersedia</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">{cameraError}</p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => startCameraSession()}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer"
              >
                Coba Lagi Akses Kamera
              </button>
            </div>
          </div>
        )}

        {/* Camera Controls Bar */}
        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-white/10 text-xs z-10">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 font-semibold transition-colors cursor-pointer text-[11px]"
          >
            <Image size={15} /> Upload File / Gambar
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept="image/*"
            className="hidden"
          />

          {isScanning && (
            <button
              type="button"
              onClick={stopCameraSession}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-semibold transition-colors cursor-pointer text-[11px]"
            >
              <StopCircle size={15} /> Hentikan Kamera
            </button>
          )}

          {cameras.length > 1 && isScanning && (
            <button
              type="button"
              onClick={handleSwitchCamera}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-semibold transition-colors cursor-pointer text-[11px]"
            >
              <CameraRotate size={15} /> Ganti Kamera ({cameras.length})
            </button>
          )}
        </div>
      </div>

      {/* Manual Input Fallback */}
      <form onSubmit={handleManualSubmit} className="space-y-2 pt-1 border-t border-border">
        <label className="text-[11px] font-bold text-muted-foreground uppercase block">
          Atau Masukkan Kode / Tempel Hasil Scan:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Contoh: TRX-981240 atau TREXIO-PASS-..."
            aria-label="Atau Masukkan Kode / Tempel Hasil Scan"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            className="flex-1 p-2.5 rounded-xl border border-border bg-background text-xs font-mono font-bold text-foreground focus:ring-2 focus:ring-emerald-500"
          />
          <button
            type="submit"
            disabled={!manualCode.trim()}
            className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all shrink-0 cursor-pointer"
          >
            Verifikasi
          </button>
        </div>
      </form>
    </div>
  );
}

