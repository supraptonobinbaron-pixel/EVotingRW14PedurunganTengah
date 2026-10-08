import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, RefreshCw, FileCode, CheckCircle2, Copy } from 'lucide-react';
import { sha256, encryptVoterData, decryptVoterData } from '../services/cryptoService';
import { AuditLogItem } from '../types/election';

interface SecurityAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  auditLogs: AuditLogItem[];
}

export const SecurityAuditModal: React.FC<SecurityAuditModalProps> = ({
  isOpen,
  onClose,
  auditLogs
}) => {
  const [testPlaintext, setTestPlaintext] = useState<string>('NIK: 3374112005820001, NAMA: Budi Santoso, WILAYAH: RT 01 RW 14');
  const [encryptedOutput, setEncryptedOutput] = useState<string>('');
  const [decryptedOutput, setDecryptedOutput] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const [testHashInput, setTestHashInput] = useState<string>('RW14:VOTE:PEDURUNGAN_TENGAH:SEMARANG:2026');
  const [calculatedHash, setCalculatedHash] = useState<string>('');

  if (!isOpen) return null;

  const handleTestEncrypt = async () => {
    setIsProcessing(true);
    try {
      const cipher = await encryptVoterData(testPlaintext);
      setEncryptedOutput(cipher);
      const dec = await decryptVoterData(cipher);
      setDecryptedOutput(dec);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCalculateHash = async () => {
    const hash = await sha256(testHashInput);
    setCalculatedHash(hash);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center text-white">
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Arsitektur Kriptografi & Keamanan Basis Data</h2>
              <span className="text-[11px] text-slate-300">Pilar Anti-Curang Pemilihan RW 14 Kel. Pedurungan Tengah Kota Semarang</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-6">

          {/* 4 Pillars of Integrity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-red-700 uppercase mb-1">
                <Lock className="w-4 h-4" />
                <span>1. Enkripsi AES-256-GCM Basis Data</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Kerahasiaan Identitas Pemilih</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap NIK e-KTP dan data kontak pemilih dienkripsi pada tingkat peramban dan server menggunakan AES-256 bit dengan salt acak 128-bit dan IV unik. Tidak ada NIK terbuka dalam database publik.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 uppercase mb-1">
                <Key className="w-4 h-4" />
                <span>2. Token Sekali Pakai (One-Time Invalidation)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Pencegahan Coblos Ganda (Anti-Curang)</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Token pemilih (format RW14-XXXX-XXXX) hanya dapat diterbitkan setelah verifikasi e-KTP dan biometrik wajah. Begitu surat suara dikirim, token secara kriptografis langsung dihanguskan permanen.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-sky-700 uppercase mb-1">
                <ShieldCheck className="w-4 h-4" />
                <span>3. Pemisahan Zero-Knowledge (LUBER JURDIL)</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Pilihan Suara Terputus dari Nama Pemilih</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ledger DPT hanya mencatat status &ldquo;Sudah Memilih&rdquo;. Pilihan kandidat masuk ke Kotak Suara Anonim tanpa referensi NIK atau nama pemilih, menjamin asas Langsung Umum Bebas Rahasia.
              </p>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-700 uppercase mb-1">
                <FileCode className="w-4 h-4" />
                <span>4. Audit Trail & Tanda Terima SHA-256</span>
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1">Verifikasi Terbuka & Bukti WhatsApp</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Setiap suara yang masuk menghasilkan hash tanda terima digital SHA-256 64-karakter yang diteruskan ke WhatsApp pemilih dan tercantum pada ledger publik yang tidak dapat dimanipulasi.
              </p>
            </div>

          </div>

          {/* INTERACTIVE CRYPTO TEST LABORATORY */}
          <div className="p-4 bg-slate-900 text-white rounded-xl border border-slate-800">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold tracking-wider uppercase text-slate-300">
                  Uji Coba Langsung Enkripsi Web Crypto API
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono">W3C SubtleCrypto Native</span>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Data Sampel Pemilih (Plaintext):</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={testPlaintext}
                    onChange={e => setTestPlaintext(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded text-slate-200 font-mono"
                  />
                  <button
                    onClick={handleTestEncrypt}
                    disabled={isProcessing}
                    className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded text-xs transition-colors whitespace-nowrap cursor-pointer"
                  >
                    {isProcessing ? 'Enkripsi...' : 'Enkripsi AES-256'}
                  </button>
                </div>
              </div>

              {encryptedOutput && (
                <div className="p-2.5 bg-slate-950 rounded border border-slate-800">
                  <span className="text-slate-400 block text-[10px] mb-0.5">Hasil Ciphertext Terenkripsi (Base64 JSON Payload):</span>
                  <div className="font-mono text-[10px] text-amber-300 break-all select-all">
                    {encryptedOutput}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-800 text-[11px] text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Dekripsi Sukses: {decryptedOutput}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* AUDIT LOG TRAIL */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-bold text-slate-900">
                Catatan Log Audit Kriptografis RW 14 Pedurungan Tengah:
              </h3>
              <span className="text-xs text-slate-500">{auditLogs.length} Entri Terekam</span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              <div className="divide-y divide-slate-100 text-xs">
                {auditLogs.map(item => (
                  <div key={item.id} className="p-3 hover:bg-slate-50 transition-colors">
                    <div className="flex items-center justify-between text-slate-500 text-[11px] mb-1">
                      <span className="font-semibold text-slate-800">{item.title}</span>
                      <span className="font-mono">{item.timestamp} WIB</span>
                    </div>
                    <p className="text-slate-600 text-[11px] mb-1">{item.details}</p>
                    <div className="font-mono text-[10px] text-slate-400 truncate bg-slate-50 p-1 rounded border border-slate-200">
                      Hash SHA-256: {item.hash}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
