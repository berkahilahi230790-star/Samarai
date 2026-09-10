import React, { useState, useEffect, useRef, useCallback } from 'react';
import jsQR from 'jsqr';
import {
  Camera,
  CameraOff,
  RefreshCw,
  Upload,
  AlertCircle,
  ExternalLink,
  Zap,
  Sparkles,
  CheckCircle2,
  ScanLine,
} from 'lucide-react';

interface QRCameraScannerProps {
  onScan: (decodedText: string) => void;
  title?: string;
  subtitle?: string;
  accentColor?: 'blue' | 'emerald';
  autoCloseOnSuccess?: boolean;
  isActive?: boolean;
  onActiveChange?: (active: boolean) => void;
  minHeight?: string;
}

export const QRCameraScanner: React.FC<QRCameraScannerProps> = ({
  onScan,
  title = 'Pemindai Kamera Langsung',
  subtitle = 'Arahkan QR Code Member ke dalam kotak pemindai',
  accentColor = 'blue',
  autoCloseOnSuccess = false,
  isActive: controlledIsActive,
  onActiveChange,
  minHeight = 'min-h-[260px]',
}) => {
  const [internalIsActive, setInternalIsActive] = useState<boolean>(false);
  const isCameraActive = controlledIsActive !== undefined ? controlledIsActive : internalIsActive;

  const setIsCameraActive = useCallback(
    (val: boolean) => {
      if (onActiveChange) {
        onActiveChange(val);
      }
      setInternalIsActive(val);
    },
    [onActiveChange]
  );

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [errorType, setErrorType] = useState<'permission' | 'device' | 'unsupported' | 'general' | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [hasMultipleCameras, setHasMultipleCameras] = useState<boolean>(false);
  const [lastScanSuccess, setLastScanSuccess] = useState<string | null>(null);
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastScannedTimeRef = useRef<number>(0);
  const lastScannedCodeRef = useRef<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Check if inside iframe
  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  // Check available video devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then(devices => {
          const videoInputs = devices.filter(d => d.kind === 'videoinput');
          setHasMultipleCameras(videoInputs.length > 1);
        })
        .catch(() => {
          // ignore device enumeration errors
        });
    }
  }, []);

  // Play audio beep on QR scan success
  const playBeep = useCallback(() => {
    try {
      const AudioContextClass =
        window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) return;
      const ctx = new AudioContextClass();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1760, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.25, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // Audio playback silently ignored
    }
  }, []);

  // Stop camera helper
  const stopCamera = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {
          // ignore
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setIsLoading(false);
  }, [setIsCameraActive]);

  // Handle scanned decoded text
  const handleDecodedQR = useCallback(
    (codeText: string) => {
      const now = Date.now();
      // Debounce if same code within 2 seconds, or any scan within 0.8 seconds
      if (
        codeText === lastScannedCodeRef.current &&
        now - lastScannedTimeRef.current < 2000
      ) {
        return;
      }
      if (now - lastScannedTimeRef.current < 800) {
        return;
      }

      lastScannedTimeRef.current = now;
      lastScannedCodeRef.current = codeText;

      playBeep();
      setLastScanSuccess(`QR Terdeteksi: ${codeText.substring(0, 24)}...`);
      setTimeout(() => setLastScanSuccess(null), 3000);

      onScan(codeText);

      if (autoCloseOnSuccess) {
        stopCamera();
      }
    },
    [autoCloseOnSuccess, onScan, playBeep, stopCamera]
  );

  // Scan video frame continuous loop
  const scanVideoFrame = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA && ctx) {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        // Optimize resolution for fast jsQR decoding (max 640px)
        const scale = Math.min(1, 640 / video.videoWidth);
        const targetWidth = Math.floor(video.videoWidth * scale);
        const targetHeight = Math.floor(video.videoHeight * scale);

        if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
          canvas.width = targetWidth;
          canvas.height = targetHeight;
        }

        ctx.drawImage(video, 0, 0, targetWidth, targetHeight);
        const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight);
        const code = jsQR(imageData.data, targetWidth, targetHeight, {
          inversionAttempts: 'dontInvert',
        });

        if (code && code.data && code.data.trim().length > 0) {
          handleDecodedQR(code.data);
        }
      }
    }

    animFrameRef.current = requestAnimationFrame(scanVideoFrame);
  }, [handleDecodedQR]);

  // Request camera stream with progressive fallbacks
  const startCamera = async (overrideFacingMode?: 'environment' | 'user') => {
    setIsLoading(true);
    setCameraError('');
    setErrorType(null);

    const mode = overrideFacingMode || facingMode;

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoading(false);
      setErrorType('unsupported');
      setCameraError(
        'Browser atau perangkat ini tidak mendukung WebRTC Camera. Pastikan halaman dibuka melalui HTTPS atau localhost.'
      );
      return;
    }

    // Stop existing stream if any
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    let stream: MediaStream | null = null;

    // Constraint trial 1: preferred facing mode with optimal resolution
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch {
      // Constraint trial 2: relaxed facing mode
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: mode },
          audio: false,
        });
      } catch {
        // Constraint trial 3: any video device (e.g. desktop webcam)
        try {
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false,
          });
        } catch (finalErr: unknown) {
          setIsLoading(false);
          const err = finalErr as { name?: string; message?: string };
          const errName = err?.name || '';
          const errMsg = err?.message || '';

          if (
            errName === 'NotAllowedError' ||
            errName === 'PermissionDeniedError' ||
            errMsg.toLowerCase().includes('permission') ||
            errMsg.toLowerCase().includes('denied')
          ) {
            setErrorType('permission');
            setCameraError(
              'Izin akses kamera ditolak oleh browser. Klik ikon gembok/kamera di samping URL browser untuk mengizinkan akses kamera, lalu coba lagi.'
            );
          } else if (
            errName === 'NotFoundError' ||
            errName === 'DevicesNotFoundError' ||
            errMsg.toLowerCase().includes('not found')
          ) {
            setErrorType('device');
            setCameraError('Tidak ada sensor kamera atau webcam yang terhubung ke perangkat ini.');
          } else {
            setErrorType('general');
            setCameraError(
              'Gagal membuka kamera (' +
                (errName || 'Error') +
                '). Pastikan tidak ada aplikasi lain yang sedang menggunakan kamera, atau buka aplikasi di tab baru.'
            );
          }
          return;
        }
      }
    }

    if (!stream) {
      setIsLoading(false);
      setErrorType('general');
      setCameraError('Tidak dapat memperoleh aliran video kamera.');
      return;
    }

    streamRef.current = stream;

    // Ensure state is updated so the container adapts
    setIsCameraActive(true);
    setIsLoading(false);

    // Attach stream to video element
    if (videoRef.current) {
      const vid = videoRef.current;
      vid.srcObject = stream;
      vid.setAttribute('playsinline', 'true');
      vid.muted = true;
      try {
        await vid.play();
      } catch {
        // user interaction might be needed on some browsers
      }
      animFrameRef.current = requestAnimationFrame(scanVideoFrame);
    }
  };

  // Flip / switch camera between front & back
  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Process uploaded image file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const offscreenCanvas = document.createElement('canvas');
        offscreenCanvas.width = img.width;
        offscreenCanvas.height = img.height;
        const ctx = offscreenCanvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imgData = ctx.getImageData(0, 0, img.width, img.height);
          const code = jsQR(imgData.data, imgData.width, imgData.height);
          if (code && code.data) {
            handleDecodedQR(code.data);
          } else {
            alert('Tidak dapat membaca QR Code pada gambar ini. Pastikan foto QR terlihat tajam, cukup terang, dan tidak buram.');
          }
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const isBlue = accentColor === 'blue';

  return (
    <div className="w-full space-y-3">
      {/* Hidden processing canvas & file input */}
      <canvas ref={canvasRef} className="hidden" />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Main Viewport Box */}
      <div
        className={`relative rounded-3xl overflow-hidden bg-slate-950 text-white flex flex-col items-center justify-center border border-slate-800 shadow-xl transition-all ${minHeight}`}
      >
        {/* VIDEO ELEMENT (Always present in DOM so ref is NEVER null) */}
        <video
          ref={videoRef}
          className={`w-full h-full object-cover absolute inset-0 ${
            isCameraActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          playsInline
          muted
        />

        {/* SCAN OVERLAY WHEN CAMERA ACTIVE */}
        {isCameraActive && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-between p-4 pointer-events-none bg-radial from-transparent via-black/20 to-black/60">
            {/* Top Bar inside Camera */}
            <div className="w-full flex items-center justify-between pointer-events-auto">
              <div className="flex items-center gap-2 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-slate-700/80">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[11px] font-bold text-white tracking-wide">
                  Kamera Aktif • Memindai...
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {hasMultipleCameras && (
                  <button
                    type="button"
                    onClick={handleSwitchCamera}
                    className="p-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-white border border-slate-700 transition-all cursor-pointer shadow-md"
                    title="Ganti Kamera Depan/Belakang"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 rounded-full bg-rose-600/90 hover:bg-rose-600 text-white text-[11px] font-bold border border-rose-500 transition-all cursor-pointer shadow-md flex items-center gap-1.5"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Tutup Kamera
                </button>
              </div>
            </div>

            {/* Target Reticle in Center */}
            <div className="relative w-52 h-52 sm:w-60 sm:h-60 rounded-3xl border-2 border-dashed border-white/40 flex items-center justify-center overflow-hidden">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-emerald-400 rounded-tl-xl" />
              <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-emerald-400 rounded-tr-xl" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-emerald-400 rounded-bl-xl" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-emerald-400 rounded-br-xl" />

              {/* Animated scanning laser bar */}
              <div className="absolute inset-x-2 h-0.5 bg-emerald-400 shadow-[0_0_12px_#34d399] animate-bounce top-1/2" />

              {/* Guide icon */}
              <ScanLine className="w-10 h-10 text-white/20" />
            </div>

            {/* Bottom info inside camera */}
            <div className="w-full flex items-center justify-between text-[11px] text-slate-300 pointer-events-auto bg-slate-900/70 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-slate-700/60">
              <span className="truncate">Arahkan QR ke dalam bingkai hijau</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-blue-400 hover:text-blue-300 font-bold shrink-0 flex items-center gap-1"
              >
                <Upload className="w-3 h-3" />
                Upload Foto
              </button>
            </div>
          </div>
        )}

        {/* IDLE / NOT ACTIVE VIEWPORT */}
        {!isCameraActive && (
          <div className="relative z-10 flex flex-col items-center justify-center p-6 text-center space-y-3.5 max-w-sm">
            <div
              className={`w-16 h-16 rounded-3xl flex items-center justify-center shadow-lg transition-transform hover:scale-105 ${
                isBlue
                  ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                  : 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30'
              }`}
            >
              <Camera className="w-8 h-8" />
            </div>

            <div>
              <h4 className="text-sm font-black text-white tracking-tight">{title}</h4>
              <p className="text-xs text-slate-400 font-medium mt-1 leading-relaxed">
                {subtitle}
              </p>
            </div>

            {/* Primary Action Button: Buka Kamera */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1 w-full">
              <button
                type="button"
                onClick={() => startCamera()}
                disabled={isLoading}
                className={`px-5 py-2.5 rounded-2xl font-black text-xs text-white shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98 ${
                  isBlue
                    ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/40'
                    : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/40'
                }`}
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Menghubungkan Kamera...
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Buka Kamera Scan
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                title="Pilih foto/screenshot QR dari penyimpanan"
              >
                <Upload className="w-3.5 h-3.5 text-slate-400" />
                Upload Foto QR
              </button>
            </div>

            <div className="flex items-center gap-2 text-[10px] text-slate-400">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Mendukung kamera HP Android, iPhone, dan Webcam Laptop</span>
            </div>
          </div>
        )}

        {/* SCAN SUCCESS BANNER OVERLAY */}
        {lastScanSuccess && (
          <div className="absolute top-4 inset-x-4 z-20 p-3 bg-emerald-500 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span className="truncate">{lastScanSuccess}</span>
          </div>
        )}
      </div>

      {/* CAMERA ERROR / PERMISSION HELPER BOX */}
      {cameraError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 space-y-2 animate-fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold block">
                {errorType === 'permission'
                  ? 'Izin Kamera Diblokir'
                  : errorType === 'device'
                  ? 'Kamera Tidak Ditemukan'
                  : 'Kendala Membuka Kamera'}
              </span>
              <p className="text-slate-600 mt-1 leading-relaxed font-medium">{cameraError}</p>
            </div>
          </div>

          <div className="pt-2 border-t border-rose-100 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => startCamera()}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Coba Buka Ulang Kamera
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              Gunakan File Foto QR
            </button>

            {isInIframe && (
              <a
                href={window.location.href}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Buka di tab browser baru untuk izin kamera tanpa batasan iframe"
              >
                <ExternalLink className="w-3 h-3" />
                Buka di Tab Baru (Akses Kamera Penuh)
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
