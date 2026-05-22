/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, X, Check, AlertCircle, Sparkles } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (base64Photo: string) => void;
  onClose: () => void;
}

// Simulated high quality snapshots of typical maintenance issues for simulation fallback
const SIMULATED_PHOTOS = [
  {
    name: 'AC Netes Air',
    category: 'AC',
    url: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&q=80&w=400',
    description: 'Unit AC indoor meneteskan air deras di dinding.'
  },
  {
    name: 'MCB Korsleting Terbakar',
    category: 'Electrical',
    url: 'https://images.unsplash.com/photo-1558211583-d26f610c1eb1?auto=format&fit=crop&q=80&w=400',
    description: 'Sekring MCB panas berbau hangus.'
  },
  {
    name: 'Wastafel Mampet Penuh',
    category: 'Plumbing',
    url: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&q=80&w=400',
    description: 'Air wastafel meluap tersumbat kotoran.'
  },
  {
    name: 'Engsel Pintu Rusak',
    category: 'Civil',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&q=80&w=400',
    description: 'Engsel pintu retak berdecit keras.'
  }
];

export default function CameraCapture({ onCapture, onClose }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [capturedImg, setCapturedImg] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);
  const [simSelectedIdx, setSimSelectedIdx] = useState(0);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setErrorMsg(null);
    setCapturedImg(null);
    setIsSimulated(false);

    try {
      // In sandbox frames, getUserMedia might throw security or permission errors
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err: any) {
      console.warn('Camera API blocked or unavailable. Falling back to high-fidelity Simulator:', err);
      setIsSimulated(true);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const takeSnapshot = () => {
    if (isSimulated) {
      // Direct base64 simulation using a beautiful stock category photo
      // To bypass CORS or loading issues, we can convert simulated photos directly
      const photo = SIMULATED_PHOTOS[simSelectedIdx];
      setCapturedImg(photo.url);
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    // Draw the current frame of the video
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImg(dataUrl);
    stopCamera();
  };

  const retake = () => {
    setCapturedImg(null);
    if (!isSimulated) {
      startCamera();
    }
  };

  const saveAndConfirm = () => {
    if (capturedImg) {
      onCapture(capturedImg);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div id="camera-modal-box" className="w-full max-w-md bg-zinc-900 text-white rounded-2xl overflow-hidden shadow-2xl border border-zinc-700 flex flex-col h-[520px]">
        {/* Header */}
        <div className="p-3 bg-zinc-800 flex items-center justify-between border-b border-zinc-700">
          <div className="flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Kamera Khusus General Affair
            </span>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-1 text-zinc-400 hover:text-white rounded hover:bg-zinc-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Camera Stage */}
        <div className="relative flex-1 bg-black flex items-center justify-center overflow-hidden">
          {capturedImg ? (
            // Captured View
            <div className="relative w-full h-full flex flex-col items-center justify-center bg-zinc-950">
              <img
                src={capturedImg}
                alt="Captured maintenance issue"
                className="max-h-[340px] max-w-full object-contain"
                referrerPolicy="no-referrer"
              />
              <div className="absolute top-2 left-2 bg-emerald-500/80 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                Foto Berhasil Diambil
              </div>
            </div>
          ) : isSimulated ? (
            // Simulation Fallback View
            <div className="w-full h-full p-4 flex flex-col justify-between bg-zinc-950">
              <div className="text-center p-2 bg-yellow-500/10 border border-yellow-500/20 rounded">
                <p className="text-[11px] text-yellow-400 flex items-center justify-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Mode Simulator Kamera Aktif (Aman & Lancar)
                </p>
                <p className="text-[9px] text-zinc-400 mt-0.5">
                  Karena kendala perizinan Sandbox iFrame, gunakan simulator kami untuk mengambil foto.
                </p>
              </div>

              {/* Simulated Live Feed */}
              <div className="flex-1 flex flex-col items-center justify-center py-2">
                <div className="relative w-48 h-48 border-2 border-dashed border-emerald-500 rounded-lg overflow-hidden flex items-center justify-center bg-zinc-900 group">
                  <img
                    src={SIMULATED_PHOTOS[simSelectedIdx].url}
                    alt="simulate"
                    className="w-full h-full object-cover opacity-80"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-emerald-500/10 pointer-events-none" />
                  <div className="absolute top-1 left-1 flex items-center gap-1 bg-red-600 px-1 py-0.5 rounded text-[8px] animate-pulse">
                    <span className="w-1.5 h-1.5 rounded-full bg-white inline-block"></span>
                    REC SIMULATOR
                  </div>
                  <div className="absolute bottom-1 right-1 bg-black/60 px-1 py-0.5 rounded text-[9px]">
                    {SIMULATED_PHOTOS[simSelectedIdx].name}
                  </div>
                </div>
              </div>

              {/* Simulated photo selectors */}
              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {SIMULATED_PHOTOS.map((p, idx) => (
                  <button
                    key={p.name}
                    onClick={() => setSimSelectedIdx(idx)}
                    className={`p-1 rounded text-center border transition-all ${
                      simSelectedIdx === idx
                        ? 'border-emerald-500 bg-emerald-500/20 text-emerald-400 font-bold'
                        : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700 text-[10px]'
                    }`}
                  >
                    <div className="truncate text-[9px] font-medium">{p.name}</div>
                    <div className="text-[8px] opacity-75">{p.category}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            // Real camera stream feed
            <div className="relative w-full h-full">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              {/* Overlay guides */}
              <div className="absolute inset-0 border-4 border-emerald-500/20 flex flex-col items-center justify-between p-4 pointer-events-none">
                <div className="bg-black/60 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                  Kamera Aktif • Arahkan pada Kerusakan
                </div>
                <div className="w-48 h-48 border border-white/20 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                </div>
                <div className="text-[10px] text-zinc-400 bg-black/40 px-2 py-0.5 rounded text-center">
                  Pastikan objek terfokus dan pencahayaan terang
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Hidden Canvas for captures */}
        <canvas ref={canvasRef} className="hidden" />

        {/* Action Controls */}
        <div className="p-4 bg-zinc-800 border-t border-zinc-700 flex items-center justify-around">
          {capturedImg ? (
            <>
              <button
                onClick={retake}
                className="flex items-center gap-1 px-4 py-2 text-xs font-semibold bg-zinc-700 rounded-lg hover:bg-zinc-600 text-zinc-200 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Foto Ulang
              </button>
              <button
                onClick={saveAndConfirm}
                className="flex items-center gap-1 px-5 py-2 text-xs font-bold bg-emerald-600 rounded-lg hover:bg-emerald-500 text-white shadow-lg transition-colors"
              >
                <Check className="w-3.5 h-3.5" />
                Gunakan Foto
              </button>
            </>
          ) : (
            <button
              onClick={takeSnapshot}
              className="flex items-center gap-1.5 px-6 py-3 text-sm font-bold bg-emerald-600 hover:bg-emerald-500 rounded-full text-white shadow-lg shadow-emerald-900/30 transition-shadow active:scale-95 duration-75"
            >
              <Camera className="w-4 h-4" />
              Ambil Gambar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
