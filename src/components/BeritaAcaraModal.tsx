import React from 'react';
import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Candidate } from '../types/election';
import { RwLogo } from './RwLogo';

interface BeritaAcaraModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidates: Candidate[];
  totalVotes: number;
  totalDpt: number;
}

export const BeritaAcaraModal: React.FC<BeritaAcaraModalProps> = ({
  isOpen,
  onClose,
  candidates,
  totalVotes,
  totalDpt
}) => {
  if (!isOpen) return null;

  const sorted = [...candidates].sort((a, b) => b.voteCount - a.voteCount);
  const winner = sorted[0];
  const currentDate = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Modal Controls */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between no-print">
          <span className="text-xs font-semibold text-slate-300">
            Dokumen Resmi Berita Acara Pleno RW 14
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-red-700 hover:bg-red-800 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / Simpan PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Document */}
        <div className="p-8 sm:p-10 font-serif text-slate-900 printable-document">
          
          {/* Header Kop Surat */}
          <div className="flex items-center justify-center gap-4 sm:gap-6 border-b-2 border-slate-900 pb-4 mb-6">
            <RwLogo className="w-16 h-16 sm:w-20 sm:h-20 shrink-0" />
            <div className="text-center">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-800">
                RUKUN WARGA (RW) 14 KELURAHAN PEDURUNGAN TENGAH
              </h3>
              <h2 className="text-base sm:text-lg font-extrabold uppercase text-slate-900">
                KECAMATAN PEDURUNGAN KOTA SEMARANG
              </h2>
              <p className="text-xs text-slate-600 font-sans mt-1">
                Sekretariat: Balai Warga RW 14, Jl. Taman Pedurungan Tengah, Pedurungan, Kota Semarang 50192
              </p>
            </div>
          </div>

          <div className="text-center mb-6">
            <h1 className="text-base sm:text-lg font-bold uppercase underline">
              BERITA ACARA REKAPITULASI HASIL PENGHITUNGAN SUARA
            </h1>
            <p className="text-xs font-sans text-slate-600 mt-1">
              Nomor: 014/PAN-PEM/RW14/PDG-TGH/X/2026
            </p>
          </div>

          <p className="text-xs font-sans leading-relaxed text-justify mb-4">
            Pada hari ini, Minggu tanggal <strong>{currentDate}</strong>, Panitia Pemilihan Ketua RW 14 Kelurahan Pedurungan Tengah, Kecamatan Pedurungan, Kota Semarang telah melaksanakan pemungutan dan penghitungan suara secara elektronik (E-Voting Terenkripsi) dengan rincian sebagai berikut:
          </p>

          {/* Table Data */}
          <div className="mb-6 font-sans text-xs">
            <table className="w-full border-collapse border border-slate-300">
              <tbody>
                <tr className="bg-slate-100">
                  <td className="border border-slate-300 p-2 font-bold" colSpan={2}>
                    I. DATA PEMILIH & HAK SUARA
                  </td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Jumlah Pemilih Terdaftar (DPT RW 14 - RT 01 s/d RT 06)</td>
                  <td className="border border-slate-300 p-2 font-bold tabular-nums text-right">{totalDpt} Jiwa</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Jumlah Suara Masuk (Sah)</td>
                  <td className="border border-slate-300 p-2 font-bold tabular-nums text-right">{totalVotes} Suara</td>
                </tr>
                <tr>
                  <td className="border border-slate-300 p-2">Tingkat Partisipasi Pemilih</td>
                  <td className="border border-slate-300 p-2 font-bold tabular-nums text-right">
                    {totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0.0'}%
                  </td>
                </tr>
                <tr className="bg-slate-100">
                  <td className="border border-slate-300 p-2 font-bold" colSpan={2}>
                    II. HASIL PEROLEHAN SUARA CALON KETUA RW 14
                  </td>
                </tr>
                {candidates.map(candidate => (
                  <tr key={candidate.id}>
                    <td className="border border-slate-300 p-2">
                      Nomor Urut 0{candidate.number}: <strong>{candidate.name}</strong> (Asal {candidate.rtAsal})
                    </td>
                    <td className="border border-slate-300 p-2 font-bold tabular-nums text-right">
                      {candidate.voteCount} Suara ({totalVotes > 0 ? ((candidate.voteCount / totalVotes) * 100).toFixed(1) : '0.0'}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Winner Announcement */}
          <div className="p-3.5 bg-slate-50 border border-slate-300 rounded font-sans text-xs mb-6">
            {totalVotes > 0 && winner && winner.voteCount > 0 ? (
              <>
                Berdasarkan hasil penghitungan suara di atas, Calon Ketua RW 14 yang memperoleh suara terbanyak adalah:
                <div className="text-sm font-bold text-slate-900 mt-1">
                  Nomor Urut 0{winner.number} - {winner.name} (Perolehan {winner.voteCount} Suara)
                </div>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Dinyatakan terpilih sebagai Ketua RW 14 Kelurahan Pedurungan Tengah Periode 2026 - 2029.
                </p>
              </>
            ) : (
              <div className="text-slate-600">
                <span className="font-semibold text-slate-800 block mb-0.5">Status Pemungutan Suara:</span>
                Proses pemungutan suara sedang berlangsung di bilik suara digital RW 14. Penetapan calon terpilih akan disahkan setelah hasil rekapitulasi akhir ditutup pada pukul 14.00 WIB.
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-8 text-center font-sans text-xs pt-4">
            <div>
              <p className="text-slate-600 mb-12">
                Saksi Calon & Perwakilan Warga,
              </p>
              <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
              <p className="font-bold">( Perwakilan 6 RT )</p>
            </div>

            <div>
              <p className="text-slate-600 mb-12">
                Ketua Panitia Pemilihan RW 14,
              </p>
              <div className="border-b border-slate-400 w-36 mx-auto mb-1" />
              <p className="font-bold">H. Supardi, S.Sos.</p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-slate-200 text-center font-sans text-[10px] text-slate-500">
            Dicetak otomatis dari Sistem E-Voting RW 14 Pedurungan Tengah · Dilengkapi Hash Bukti Digital Kriptografi SHA-256
          </div>

        </div>
      </div>
    </div>
  );
};
