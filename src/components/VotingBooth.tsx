import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import { Vote, CheckCircle2, AlertCircle, Lock, ShieldCheck, ChevronDown, ChevronUp, UserCheck, MessageSquare, Users } from 'lucide-react';
import { Candidate, VotingToken, WhatsAppNotificationPayload } from '../types/election';
import { electionStore } from '../services/electionStore';

interface VotingBoothProps {
  candidates: Candidate[];
  activeToken: VotingToken | null;
  onVoteCastSuccess: (result: {
    receiptHash: string;
    voterName: string;
    voterPhone: string;
    voterRt: string;
    timestamp: string;
    waPayload: WhatsAppNotificationPayload;
    candidateSelected: Candidate;
  }) => void;
  onOpenVerification: () => void;
  onOpenManageCandidates?: () => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  candidates,
  activeToken,
  onVoteCastSuccess,
  onOpenVerification,
  onOpenManageCandidates
}) => {
  const [tokenInput, setTokenInput] = useState<string>(activeToken?.tokenCode || '');
  const [validatedToken, setValidatedToken] = useState<VotingToken | null>(activeToken);
  const [tokenError, setTokenError] = useState<string>('');
  
  // Selection state
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);
  const [isCasting, setIsCasting] = useState<boolean>(false);
  const [castError, setCastError] = useState<string>('');
  const [expandedCandidateId, setExpandedCandidateId] = useState<string | null>(null);

  // Privacy Opt-In: Allow full name on WhatsApp notification
  const [allowNameInNotification, setAllowNameInNotification] = useState<boolean>(true);

  // Sync if activeToken prop changes
  React.useEffect(() => {
    if (activeToken) {
      setTokenInput(activeToken.tokenCode);
      setValidatedToken(activeToken);
      setTokenError('');
    }
  }, [activeToken]);

  // Handle Token Validation
  const handleValidateToken = () => {
    setTokenError('');
    if (!tokenInput.trim()) {
      setTokenError('Masukkan kode token pemilihan.');
      return;
    }
    const res = electionStore.verifyToken(tokenInput);
    if (!res.valid || !res.token) {
      setTokenError(res.message);
      setValidatedToken(null);
    } else {
      setValidatedToken(res.token);
      setTokenError('');
    }
  };

  const toggleExpand = (id: string) => {
    setExpandedCandidateId(prev => (prev === id ? null : id));
  };

  const handleChooseCandidate = (candidate: Candidate) => {
    if (!validatedToken) {
      setTokenError('Anda harus memvalidasi token e-KTP terlebih dahulu sebelum memilih.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSelectedCandidate(candidate);
    setShowConfirmModal(true);
  };

  // Final Cast Execution
  const handleConfirmCastVote = async () => {
    if (!validatedToken || !selectedCandidate) return;

    setIsCasting(true);
    try {
      const result = await electionStore.castVote(
        validatedToken.tokenCode,
        selectedCandidate.id,
        allowNameInNotification
      );
      
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe if canvas unavailable
      }

      setIsCasting(false);
      setShowConfirmModal(false);
      setValidatedToken(null);
      setTokenInput('');

      onVoteCastSuccess({
        ...result,
        candidateSelected: selectedCandidate
      });
    } catch (err: unknown) {
      setIsCasting(false);
      const msg = err instanceof Error ? err.message : 'Gagal mengirimkan surat suara.';
      setCastError(msg);
      setTokenError(msg);
    }
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Title & Privacy Banner */}
      <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-red-700 uppercase tracking-wider mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Bilik Suara Digital Rahasia & Bebas (LUBER JURDIL)</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Surat Suara Pemilihan Ketua RW 14
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang. Pilihan Anda dijamin rahasia melalui pemisahan identitas matematis (Zero-Knowledge) dan dienkripsi sebelum masuk kotak suara.
          </p>
        </div>

        {onOpenManageCandidates && (
          <button
            type="button"
            onClick={onOpenManageCandidates}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-all shadow-sm flex items-center gap-1.5 shrink-0 cursor-pointer"
          >
            <span>+ Kelola / Tambah Calon</span>
          </button>
        )}
      </div>

      {/* TOKEN AUTHORIZATION BAR */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-800 mb-1">
              Token Kriptografi Pemilih (Single-Use Token):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tokenInput}
                onChange={e => {
                  setTokenInput(e.target.value.toUpperCase());
                  setValidatedToken(null);
                }}
                placeholder="Contoh: RW14-8X92-KL41"
                className="w-full sm:max-w-xs px-3.5 py-2 text-sm font-mono tracking-wider uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50"
              />
              <button
                type="button"
                onClick={handleValidateToken}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors whitespace-nowrap cursor-pointer"
              >
                Validasi Token
              </button>
            </div>
            
            {tokenError && (
              <span className="text-xs text-red-600 mt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{tokenError}</span>
              </span>
            )}
          </div>

          {/* Token Status Badge / Verification Trigger */}
          <div className="sm:text-right w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
            {validatedToken ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-left sm:text-right">
                <div className="flex items-center sm:justify-end gap-1.5 text-xs font-bold text-emerald-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Token Terverifikasi Sah</span>
                </div>
                <span className="text-[11px] text-slate-600 block mt-0.5">
                  Warga: <strong className="text-slate-800">{validatedToken.citizenName}</strong> ({validatedToken.citizenRt})
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Belum punya token?</span>
                <button
                  type="button"
                  onClick={onOpenVerification}
                  className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors cursor-pointer"
                >
                  Verifikasi e-KTP Sekarang
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* WHATSAPP PRIVACY OPT-IN PREFERENCE BAR */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 mb-8 flex items-start gap-3">
        <MessageSquare className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-emerald-950">
            <input
              type="checkbox"
              checked={allowNameInNotification}
              onChange={e => setAllowNameInNotification(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
            <span>
              Izinkan panitia mencantumkan Nama Lengkap saya pada notifikasi WhatsApp konfirmasi suara
            </span>
          </label>
          <p className="text-[11px] text-emerald-800 mt-1 leading-relaxed">
            {allowNameInNotification
              ? 'Pesan WhatsApp Business resmi akan menyebutkan nama lengkap Anda, kandidat yang Anda pilih, dan ucapan terima kasih panitia RW 14.'
              : 'Privasi Aktif: Nama lengkap Anda akan disamarkan (contoh: Budi S***) dalam pesan WhatsApp konfirmasi suara.'}
          </p>
        </div>
      </div>

      {/* CANDIDATE CARDS HEADER & GRID */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900">
            Daftar Calon Ketua RW 14 Pedurungan Tengah
          </h2>
          <span className="text-xs text-slate-500">
            Pilih satu calon pilihan Anda lalu konfirmasikan pencoblosan surat suara.
          </span>
        </div>
        {onOpenManageCandidates && (
          <button
            type="button"
            onClick={onOpenManageCandidates}
            className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <Users className="w-3.5 h-3.5 text-red-600" />
            <span>Kelola Kandidat (Tambah / Koreksi / Hapus)</span>
          </button>
        )}
      </div>

      {candidates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {candidates.map(candidate => {
            const isExpanded = expandedCandidateId === candidate.id;

            return (
              <div
                key={candidate.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between hover:border-slate-300 transition-all group"
              >
                <div>
                  {/* Header with Candidate Number */}
                  <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-md bg-red-700 text-white font-extrabold text-sm flex items-center justify-center">
                        0{candidate.number}
                      </span>
                      <span className="text-xs font-medium text-slate-300">
                        Calon Ketua RW 14
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      Asal {candidate.rtAsal}
                    </span>
                  </div>

                  {/* Candidate Photo */}
                  <div className="relative aspect-square w-full bg-slate-100 overflow-hidden">
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
                    <div className="absolute bottom-3 left-3 right-3 text-white text-xs font-medium italic drop-shadow-md">
                      &ldquo;{candidate.slogan}&rdquo;
                    </div>
                  </div>

                  {/* Candidate Info */}
                  <div className="p-4 sm:p-5">
                    <h3 className="text-base font-bold text-slate-900 leading-snug mb-1">
                      {candidate.name}
                    </h3>
                    <span className="text-xs text-red-700 font-medium block mb-3">
                      {candidate.title}
                    </span>

                    {/* Profile metadata */}
                    <div className="text-[11px] text-slate-500 space-y-1 mb-4 pb-3 border-b border-slate-100">
                      <div>Pendidikan: <span className="text-slate-700 font-medium">{candidate.education}</span></div>
                      <div>Profesi: <span className="text-slate-700 font-medium">{candidate.occupation}</span></div>
                      <div>Usia: <span className="text-slate-700 font-medium">{candidate.age} Tahun</span></div>
                    </div>

                    {/* Visi */}
                    <div className="mb-3">
                      <span className="text-xs font-bold text-slate-800 block mb-1">Visi Utama:</span>
                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                        {candidate.vision}
                      </p>
                    </div>

                    {/* Accordion Trigger */}
                    <button
                      type="button"
                      onClick={() => toggleExpand(candidate.id)}
                      className="text-xs font-semibold text-red-700 hover:text-red-800 flex items-center gap-1 cursor-pointer mb-2"
                    >
                      <span>{isExpanded ? 'Tutup Misi & Program' : 'Lihat Misi & Program Kerja'}</span>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {isExpanded && (
                      <div className="mt-2 pt-2 border-t border-slate-100 text-xs space-y-3">
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">Misi:</span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {candidate.missions.map((m, idx) => (
                              <li key={idx}>{m}</li>
                            ))}
                          </ul>
                        </div>
                        <div>
                          <span className="font-bold text-slate-800 block mb-1">Program Unggulan:</span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600">
                            {candidate.programs.map((p, idx) => (
                              <li key={idx}>{p}</li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Action Button: Coblos */}
                <div className="p-4 pt-0">
                  <button
                    type="button"
                    onClick={() => handleChooseCandidate(candidate)}
                    className="w-full py-3 bg-red-700 hover:bg-red-800 active:scale-[0.98] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                  >
                    <Vote className="w-4 h-4" />
                    <span>Coblos No. 0{candidate.number}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center my-8">
          <p className="text-base font-bold text-slate-900 mb-1">
            Belum Ada Calon Ketua RW 14 yang Terdaftar
          </p>
          <p className="text-xs text-slate-500 mb-4 max-w-md mx-auto">
            Silakan tambahkan calon ketua RW 14 baru melalui tombol di bawah ini untuk memulai proses pemilihan.
          </p>
          {onOpenManageCandidates && (
            <button
              type="button"
              onClick={onOpenManageCandidates}
              className="px-5 py-2.5 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-xl shadow-md cursor-pointer"
            >
              + Tambah Calon Ketua RW 14
            </button>
          )}
        </div>
      )}

      {/* CONFIRMATION MODAL */}
      {showConfirmModal && selectedCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200 p-6 text-center">
            
            <div className="w-12 h-12 bg-red-100 text-red-700 rounded-full flex items-center justify-center mx-auto mb-2">
              <Vote className="w-6 h-6" />
            </div>

            <span className="text-xs font-semibold text-red-700 uppercase tracking-wider block mb-1">
              Konfirmasi Surat Suara Digital
            </span>
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Pastikan Pilihan Anda Sudah Mantap
            </h3>

            {castError && (
              <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl text-left flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{castError}</span>
              </div>
            )}

            {/* Candidate Summary Card */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left my-3 flex items-center gap-3">
              <img
                src={selectedCandidate.photo}
                alt={selectedCandidate.name}
                className="w-16 h-16 rounded-lg object-cover border border-slate-300"
                referrerPolicy="no-referrer"
              />
              <div>
                <span className="text-xs font-bold text-red-700 block">
                  NOMOR URUT 0{selectedCandidate.number}
                </span>
                <div className="text-sm font-extrabold text-slate-900 leading-tight">
                  {selectedCandidate.name}
                </div>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  Calon Ketua RW 14 Pedurungan Tengah
                </span>
              </div>
            </div>

            {/* WhatsApp Notification preview note */}
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-left text-xs text-emerald-900 mb-4 space-y-1">
              <div className="flex items-center gap-1 font-bold text-emerald-950">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-700" />
                <span>Notifikasi WhatsApp Business API:</span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Pesan WhatsApp akan mencantumkan: <strong>{allowNameInNotification ? validatedToken?.citizenName : 'Nama Disamarkan'}</strong>, Calon Terpilih: <strong>No. 0{selectedCandidate.number} - {selectedCandidate.name}</strong>, kode tanda terima SHA-256, dan ucapan terima kasih panitia RW 14.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                type="button"
                disabled={isCasting}
                onClick={() => setShowConfirmModal(false)}
                className="w-1/3 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all cursor-pointer"
              >
                Batal / Ganti
              </button>
              <button
                type="button"
                disabled={isCasting}
                onClick={handleConfirmCastVote}
                className="w-2/3 py-2.5 bg-red-700 hover:bg-red-800 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50"
              >
                {isCasting ? (
                  <span>Mengirimkan Suara...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Suara Sah Sekarang</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
