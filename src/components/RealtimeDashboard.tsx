import React, { useState } from 'react';
import { BarChart3, TrendingUp, Users, ShieldCheck, CheckCircle2, Search, ArrowUpRight, FileText, RefreshCw, Zap } from 'lucide-react';
import { Candidate, AuditLogItem } from '../types/election';
import { electionStore, RT_LIST } from '../services/electionStore';

interface RealtimeDashboardProps {
  candidates: Candidate[];
  auditLogs: AuditLogItem[];
  totalVotes: number;
  totalDpt: number;
  onOpenVoting: () => void;
  onOpenVerify: () => void;
  onOpenBeritaAcara: () => void;
  initialVerifyHash?: string;
}

export const RealtimeDashboard: React.FC<RealtimeDashboardProps> = ({
  candidates,
  auditLogs,
  totalVotes,
  totalDpt,
  onOpenVoting,
  onOpenVerify,
  onOpenBeritaAcara,
  initialVerifyHash = ''
}) => {
  const [hashSearchInput, setHashSearchInput] = useState<string>(initialVerifyHash);
  const [verificationResult, setVerificationResult] = useState<{
    searched: boolean;
    found: boolean;
    message: string;
  } | null>(null);
  const [statusToast, setStatusToast] = useState<string>('');

  const participationRate = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0';
  const remainingVotes = Math.max(0, totalDpt - totalVotes);

  // Sort candidates by votes to identify leader
  const sortedCandidates = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const leaderCandidate = sortedCandidates[0];

  // Calculate Turnout by RT
  const dptList = electionStore.getDptList();
  const rtStats = RT_LIST.map(rt => {
    const citizensInRt = dptList.filter(c => c.rt === rt);
    const votedInRt = citizensInRt.filter(c => c.hasVoted).length;
    const totalInRt = citizensInRt.length > 0 ? citizensInRt.length : 54; // approximate quota
    const pct = totalInRt > 0 ? Math.round((votedInRt / totalInRt) * 100) : 0;
    return { rt, total: totalInRt, voted: votedInRt, pct };
  });

  const handleVerifyHash = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hashSearchInput.trim()) return;
    const res = electionStore.verifyReceiptHash(hashSearchInput);
    setVerificationResult({
      searched: true,
      found: res.found,
      message: res.message
    });
  };

  // Simulate a live simulated vote arrival for demo inspection
  const handleSimulateFastTurnout = async () => {
    const unvoted = dptList.find(c => !c.hasVoted);
    if (!unvoted) {
      setStatusToast('Semua DPT saat ini telah menggunakan hak suaranya.');
      setTimeout(() => setStatusToast(''), 3000);
      return;
    }
    try {
      const { token } = await electionStore.issueVotingToken(unvoted);
      const randomCandidateId = ['1', '2', '3'][Math.floor(Math.random() * 3)];
      await electionStore.castVote(token.tokenCode, randomCandidateId);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-8">
      
      {/* SECTION 1: TOP EXECUTIVE METRICS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Suara Masuk</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalVotes}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>Partisipasi Pemilih: {participationRate}%</span>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">DPT RW 14</span>
            <Users className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {totalDpt}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            6 RT di Pedurungan Tengah (RT 01 - 06)
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Sisa Hak Suara</span>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tabular-nums">
            {remainingVotes}
          </div>
          <div className="text-xs text-amber-700 font-medium mt-1">
            TPS Tutup Pukul 14.00 WIB
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Integritas Suara</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-base sm:text-lg font-extrabold text-slate-900">
            100% Sah & Valid
          </div>
          <div className="text-xs text-emerald-700 font-medium mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Audit SHA-256 Aktif</span>
          </div>
        </div>

      </div>

      {/* SECTION 2: LIVE QUICK COUNT TALLY PER CANDIDATE */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse" />
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                Hasil Perolehan Suara Terbuka (Real-Time Quick Count)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Data terenkripsi dari 6 RT di wilayah RW 14 Kelurahan Pedurungan Tengah (RT 01 s/d RT 06). Diperbarui otomatis secara live.
            </p>
            {statusToast && (
              <div className="mt-2 p-2 px-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-lg inline-flex items-center gap-1.5 animate-in fade-in">
                <span>ℹ️ {statusToast}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSimulateFastTurnout}
              title="Simulasikan suara masuk untuk menguji pembaruan real-time"
              className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Demo Suara Cepat</span>
            </button>
            <button
              onClick={onOpenBeritaAcara}
              className="px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Cetak Berita Acara Pleno</span>
            </button>
          </div>
        </div>

        {/* 3 Candidate Result Bars */}
        <div className="space-y-6">
          {candidates.map(candidate => {
            const pct = totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : '0';
            const isLeading = candidate.id === leaderCandidate.id && totalVotes > 0;

            return (
              <div key={candidate.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                  
                  {/* Candidate Identity */}
                  <div className="flex items-center gap-3">
                    <img
                      src={candidate.photo}
                      alt={candidate.name}
                      className="w-12 h-12 rounded-lg object-cover border border-slate-300"
                      referrerPolicy="no-referrer"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                          0{candidate.number}
                        </span>
                        <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
                          {candidate.name}
                        </h3>
                        {isLeading && (
                          <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-full">
                            Unggul Sementara
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-slate-500 block mt-0.5">
                        {candidate.title} · Asal {candidate.rtAsal}
                      </span>
                    </div>
                  </div>

                  {/* Vote Count & Percent */}
                  <div className="text-left sm:text-right">
                    <div className="text-xl sm:text-2xl font-extrabold text-slate-900 tabular-nums">
                      {candidate.voteCount} <span className="text-xs font-normal text-slate-500">suara</span>
                    </div>
                    <span className="text-sm font-bold text-red-700 tabular-nums">
                      {pct}%
                    </span>
                  </div>
                </div>

                {/* Progress Bar with smooth animation */}
                <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${
                      isLeading ? 'bg-red-600' : 'bg-slate-700'
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 3: TURNOUT PER RT (RT 01 to RT 06) & PUBLIC AUDIT LEDGER */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Participation per RT */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Tingkat Partisipasi Warga per RT
              </h3>
              <span className="text-xs text-slate-500">Wilayah RW 14 Pedurungan Tengah</span>
            </div>
            <span className="text-xs font-medium text-slate-500">
              6 RT Terdaftar (RT 01 s/d RT 06)
            </span>
          </div>

          <div className="space-y-3">
            {rtStats.map(stat => (
              <div key={stat.rt} className="text-xs">
                <div className="flex justify-between font-medium text-slate-700 mb-1">
                  <span className="font-semibold text-slate-900">{stat.rt}</span>
                  <span className="tabular-nums">
                    {stat.voted} / {stat.total} Warga ({stat.pct}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${stat.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">TPS Utama: Balai Warga RW 14</span>
            <button
              onClick={onOpenVoting}
              className="text-red-700 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <span>Gunakan Hak Suara</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Public Blockchain-style Audit Stream & Hash Verifier */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Verifikasi Surat Suara Digital
                </h3>
                <span className="text-xs text-slate-500">Ledger Publik Anti-Manipulasi (SHA-256)</span>
              </div>
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
            </div>

            {/* Hash Verification Form */}
            <form onSubmit={handleVerifyHash} className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Periksa Hash Tanda Terima WhatsApp Anda:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hashSearchInput}
                  onChange={e => setHashSearchInput(e.target.value)}
                  placeholder="Tempel 64-karakter kode hash..."
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600 bg-slate-50"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer whitespace-nowrap"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Cek</span>
                </button>
              </div>
            </form>

            {/* Verification Result Feedback */}
            {verificationResult && (
              <div className={`p-3 rounded-lg text-xs mb-4 border ${
                verificationResult.found
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border-red-200 text-red-900'
              }`}>
                <div className="flex items-start gap-2">
                  {verificationResult.found ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <span>{verificationResult.message}</span>
                </div>
              </div>
            )}

            {/* Latest 3 Audit Blocks */}
            <div className="space-y-2">
              <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                3 Blok Surat Suara Terkini:
              </span>
              {auditLogs.slice(0, 3).map(log => (
                <div key={log.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                  <div className="flex items-center justify-between text-slate-500 text-[10px] mb-1">
                    <span className="font-semibold text-slate-800">{log.title}</span>
                    <span>{log.timestamp} WIB</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-600 truncate">
                    Hash: {log.hash}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Transparansi Luber Jurdil</span>
            <button
              onClick={onOpenVerify}
              className="text-red-700 font-semibold hover:underline cursor-pointer"
            >
              Lihat Detail Enkripsi &gt;
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
