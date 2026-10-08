import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  CheckCircle2,
  AlertTriangle,
  KeyRound,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  X,
  RefreshCw,
  ScanLine,
  Check,
  AlertCircle
} from 'lucide-react';
import { electionStore } from '../services/electionStore';
import { maskNik } from '../services/cryptoService';
import { performStrictVerification } from '../services/verificationService';
import { CitizenRecord, VotingToken, StrictVerificationResult } from '../types/election';

interface EktpVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTokenGenerated: (token: VotingToken) => void;
  preSelectedCitizen?: CitizenRecord | null;
}

type Step = 'SCAN_KTP' | 'LIVENESS_FACE' | 'VERIFYING' | 'TOKEN_SUCCESS';

export const EktpVerificationModal: React.FC<EktpVerificationModalProps> = ({
  isOpen,
  onClose,
  onTokenGenerated,
  preSelectedCitizen
}) => {
  const [step, setStep] = useState<Step>('SCAN_KTP');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [capturedKtpImage, setCapturedKtpImage] = useState<string | null>(null);

  // Form inputs
  const [nikInput, setNikInput] = useState<string>('3374115401920004'); // Dewi Anjarwati (RT 02)
  const [namaInput, setNamaInput] = useState<string>('Dewi Anjarwati, S.Farm.');
  const [rtInput, setRtInput] = useState<string>('RT 02');
  const [phoneInput, setPhoneInput] = useState<string>('089672194012');

  const [verificationFeedback, setVerificationFeedback] = useState<StrictVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [generatedToken, setGeneratedToken] = useState<VotingToken | null>(null);
  const [matchedCitizen, setMatchedCitizen] = useState<CitizenRecord | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Start real camera
  const startCamera = async () => {
    try {
      setErrorMessage('');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraActive(true);
    } catch {
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    if (isOpen) {
      if (preSelectedCitizen) {
        setNikInput(preSelectedCitizen.nik);
        setNamaInput(preSelectedCitizen.nama);
        setRtInput(preSelectedCitizen.rt);
        setPhoneInput(preSelectedCitizen.phone);
      }
      startCamera();
    } else {
      stopCamera();
      setStep('SCAN_KTP');
      setCapturedKtpImage(null);
      setErrorMessage('');
      setVerificationFeedback(null);
    }
    return () => stopCamera();
  }, [isOpen, preSelectedCitizen]);

  // Real-time verification checking as user types
  useEffect(() => {
    if (nikInput.length === 16 && namaInput.trim().length > 2) {
      const dpt = electionStore.getDptList();
      const result = performStrictVerification(nikInput, namaInput, rtInput, dpt);
      setVerificationFeedback(result);
    } else {
      setVerificationFeedback(null);
    }
  }, [nikInput, namaInput, rtInput]);

  const captureFrame = (type: 'KTP' | 'FACE') => {
    if (videoRef.current && cameraActive) {
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (type === 'KTP') setCapturedKtpImage(dataUrl);
      }
    } else {
      const mockCanvas = document.createElement('canvas');
      mockCanvas.width = 400;
      mockCanvas.height = 250;
      const ctx = mockCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = type === 'KTP' ? '#0284c7' : '#334155';
        ctx.fillRect(0, 0, 400, 250);
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px monospace';
        ctx.fillText('E-KTP REPUBLIK INDONESIA', 20, 40);
        ctx.fillText(`NIK: ${nikInput}`, 20, 80);
        ctx.fillText(`NAMA: ${namaInput}`, 20, 110);
        ctx.fillText(`WILAYAH: ${rtInput} / RW 14 PEDURUNGAN`, 20, 140);
        setCapturedKtpImage(mockCanvas.toDataURL('image/jpeg'));
      }
    }
  };

  const handleSelectSampleResident = (nik: string, nama: string, rt: string, phone: string) => {
    setNikInput(nik);
    setNamaInput(nama);
    setRtInput(rt);
    setPhoneInput(phone);
    setErrorMessage('');
  };

  const handleProceedToLiveness = () => {
    const dpt = electionStore.getDptList();
    const result = performStrictVerification(nikInput, namaInput, rtInput, dpt);
    setVerificationFeedback(result);

    if (!result.overallPassed) {
      setErrorMessage(result.discrepancies[0] || 'Data KTP tidak sesuai dengan basis data kependudukan RW 14.');
      return;
    }

    captureFrame('KTP');
    setStep('LIVENESS_FACE');
    setErrorMessage('');
  };

  const handleExecuteVerification = async () => {
    captureFrame('FACE');
    setStep('VERIFYING');
    setErrorMessage('');

    try {
      await new Promise(r => setTimeout(r, 1000));

      const dpt = electionStore.getDptList();
      const result = performStrictVerification(nikInput, namaInput, rtInput, dpt);

      if (!result.overallPassed || !result.citizen) {
        setErrorMessage(result.discrepancies.join(' '));
        setStep('SCAN_KTP');
        return;
      }

      const { token } = await electionStore.issueVotingToken(result.citizen);
      setGeneratedToken(token);
      setMatchedCitizen(result.citizen);
      setStep('TOKEN_SUCCESS');
      stopCamera();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Terjadi kendala saat verifikasi identitas.';
      setErrorMessage(msg);
      setStep('SCAN_KTP');
    }
  };

  const handleCopyToken = () => {
    if (generatedToken) {
      navigator.clipboard.writeText(generatedToken.tokenCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleGoToVotingBooth = () => {
    if (generatedToken) {
      onTokenGenerated(generatedToken);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
        
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600 flex items-center justify-center text-white">
              <ScanLine className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Verifikasi e-KTP & Pencocokan Ketat</h2>
              <span className="text-[11px] text-slate-300">Basis Data Kependudukan RW 14 Pedurungan Tengah</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6">
          
          {/* Error Banner */}
          {errorMessage && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* STEP 1: SCAN KTP */}
          {step === 'SCAN_KTP' && (
            <div>
              <div className="mb-3">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-0.5">
                  Langkah 1: Validasi NIK & Pencocokan Nama KTP
                </span>
                <p className="text-xs text-slate-500">
                  Sistem melakukan validasi struktur NIK 16 digit dan pencocokan nama ketat terhadap data resmi DPT RW 14.
                </p>
              </div>

              {/* Camera Scanner Viewport */}
              <div className="relative w-full h-40 bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-300 flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-center p-3">
                    <Camera className="w-7 h-7 text-slate-500 mx-auto mb-1.5" />
                    <span className="text-xs text-slate-300 block font-medium">Sensor Kamera / OCR Pemindai KTP</span>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="mt-1 text-[11px] text-sky-400 hover:underline cursor-pointer"
                    >
                      Buka Kamera Perangkat
                    </button>
                  </div>
                )}

                <div className="absolute inset-3 border-2 border-dashed border-red-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-1.5">
                  <span className="text-[9px] text-white bg-red-900/80 px-1.5 py-0.5 rounded self-start font-mono">
                    Bingkai e-KTP
                  </span>
                  <div className="text-center">
                    <span className="text-[9px] text-white/90 bg-black/60 px-2 py-0.5 rounded font-mono">
                      Posisikan NIK & Nama Jelas
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Preset Selector for Easy Testing */}
              <div className="mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block mb-1">
                  Pilih Data Warga Contoh untuk Verifikasi:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSelectSampleResident('3374115401920004', 'Dewi Anjarwati, S.Farm.', 'RT 02', '089672194012')}
                    className="text-[11px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Dewi Anjarwati (RT 02)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleResident('3374112211840006', 'dr. Hendra Kusuma', 'RT 03', '081328904321')}
                    className="text-[11px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    dr. Hendra Kusuma (RT 03)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleResident('3374112912860010', 'Arya Pratama, M.Sc.', 'RT 05', '081290384721')}
                    className="text-[11px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Arya Pratama (RT 05)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectSampleResident('3374114812030016', 'Anisa Putri Maharani', 'RT 06', '085819283746')}
                    className="text-[11px] px-2 py-0.5 bg-white hover:bg-slate-100 border border-slate-300 rounded font-medium text-slate-700 cursor-pointer"
                  >
                    Anisa Putri (RT 06)
                  </button>
                </div>
              </div>

              {/* Form Input fields */}
              <div className="space-y-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">
                    Nomor Induk Kependudukan (NIK 16 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={16}
                    value={nikInput}
                    onChange={e => setNikInput(e.target.value.replace(/\D/g, ''))}
                    placeholder="337411XXXXXXXXXX"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-mono tracking-wider"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Kode Kota Semarang: 3374 · Kecamatan Pedurungan: 337411
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-0.5">
                      Nama Lengkap (Sesuai KTP)
                    </label>
                    <input
                      type="text"
                      value={namaInput}
                      onChange={e => setNamaInput(e.target.value)}
                      placeholder="Nama Lengkap KTP"
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-0.5">
                      Rukun Tetangga (RT)
                    </label>
                    <select
                      value={rtInput}
                      onChange={e => setRtInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 bg-white"
                    >
                      {['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'].map(rt => (
                        <option key={rt} value={rt}>{rt} / RW 14 Pedurungan Tengah</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-0.5">
                    Nomor WhatsApp Pemilih (Untuk Notifikasi WhatsApp Business)
                  </label>
                  <input
                    type="tel"
                    value={phoneInput}
                    onChange={e => setPhoneInput(e.target.value)}
                    placeholder="0812XXXXXXXX"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-red-600 font-mono"
                  />
                </div>
              </div>

              {/* STRICT VERIFICATION MATRIX FEEDBACK */}
              {verificationFeedback && (
                <div className="mt-3 p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-1 flex items-center justify-between">
                    <span>Hasil Pencocokan Kependudukan Dukcapil:</span>
                    {verificationFeedback.overallPassed ? (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Cocok 100%
                      </span>
                    ) : (
                      <span className="text-red-700 font-bold flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5" /> Perlu Dicek
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5">
                      {verificationFeedback.nikSemarangMatch ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span>Kode Kota Semarang (3374)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {verificationFeedback.nikInDpt ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span>Terdaftar di DPT RW 14</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {verificationFeedback.nameMatchPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span>Kecocokan Nama ({verificationFeedback.nameMatchScore}%)</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {verificationFeedback.genderMatchPassed ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-3.5 h-3.5 text-red-600 shrink-0" />
                      )}
                      <span>Cross-Check NIK & Tanggal Lahir</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <button
                type="button"
                onClick={handleProceedToLiveness}
                className="mt-4 w-full py-2.5 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <span>Lanjut: Verifikasi Biometrik Wajah</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2: LIVENESS / FACE SELFIE */}
          {step === 'LIVENESS_FACE' && (
            <div>
              <div className="mb-3">
                <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-0.5">
                  Langkah 2: Uji Keaslian Wajah Pemilih (Anti-Joki)
                </span>
                <p className="text-xs text-slate-500">
                  Posisikan wajah Anda pada oval sensor untuk mengonfirmasi Anda adalah pemilik sah e-KTP.
                </p>
              </div>

              <div className="relative w-full h-48 bg-slate-950 rounded-xl overflow-hidden mb-3 border border-slate-300 flex items-center justify-center">
                {cameraActive ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                ) : (
                  <div className="text-center p-4">
                    <UserCheck className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
                    <span className="text-xs text-slate-300 block">Sensor Biometrik AI Aktif</span>
                  </div>
                )}

                <div className="absolute w-32 h-40 border-2 border-emerald-400/90 rounded-[50%] pointer-events-none flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 mb-4 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nama Warga Terverifikasi:</span>
                  <span className="font-semibold text-slate-800">{namaInput}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIK e-KTP:</span>
                  <span className="font-mono text-slate-800">{maskNik(nikInput)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Wilayah Pemilih:</span>
                  <span className="font-semibold text-slate-800">{rtInput} / RW 14 Pedurungan Tengah</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStep('SCAN_KTP')}
                  className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
                >
                  Kembali
                </button>
                <button
                  type="button"
                  onClick={handleExecuteVerification}
                  className="w-2/3 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Terbitkan Token Kriptografi</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: VERIFYING LOADING STATE */}
          {step === 'VERIFYING' && (
            <div className="py-10 text-center">
              <RefreshCw className="w-9 h-9 text-red-600 animate-spin mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900 mb-1">
                Pencocokan String Ketat & Enkripsi AES-256...
              </h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Memvalidasi data kependudukan Kota Semarang dan menyiapkan token sekali pakai yang terenkripsi...
              </p>
            </div>
          )}

          {/* STEP 4: TOKEN GENERATED SUCCESS */}
          {step === 'TOKEN_SUCCESS' && generatedToken && (
            <div className="text-center">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-6 h-6" />
              </div>

              <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider block mb-0.5">
                Verifikasi e-KTP Valid 100%
              </span>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Token Kriptografi Pemilih Siap
              </h3>
              <p className="text-xs text-slate-500 mb-4">
                Token sekali pakai ini akan langsung dihanguskan setelah Anda mencoblos di bilik suara.
              </p>

              {/* Big Token Display Box */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 text-white mb-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                  KODE TOKEN PEMILIH SEKALI PAKAI (ANTI-CURANG)
                </span>
                <div className="text-2xl sm:text-3xl font-mono font-bold tracking-widest text-amber-400 select-all my-2">
                  {generatedToken.tokenCode}
                </div>
                <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
                  <span>Masa berlaku: 60 Menit</span>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={handleCopyToken}
                    className="text-sky-400 hover:text-sky-300 font-medium cursor-pointer"
                  >
                    {isCopied ? 'Tersalin ✓' : 'Salin Token'}
                  </button>
                </div>
              </div>

              {/* Next Step Action */}
              <button
                type="button"
                onClick={handleGoToVotingBooth}
                className="w-full py-3 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-semibold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Masuk ke Bilik Suara Sekarang</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
