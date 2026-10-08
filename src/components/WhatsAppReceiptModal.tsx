import React, { useState, useEffect } from 'react';
import {
  Check,
  CheckCheck,
  Send,
  Copy,
  Share2,
  CheckCircle2,
  ShieldCheck,
  Printer,
  X,
  ExternalLink,
  Code,
  FileCheck
} from 'lucide-react';
import { WhatsAppNotificationPayload, Candidate } from '../types/election';

interface WhatsAppReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    receiptHash: string;
    voterName: string;
    voterPhone: string;
    voterRt: string;
    timestamp: string;
    waPayload: WhatsAppNotificationPayload;
    candidateSelected?: Candidate;
  } | null;
  onVerifyReceiptInAudit: (hash: string) => void;
}

export const WhatsAppReceiptModal: React.FC<WhatsAppReceiptModalProps> = ({
  isOpen,
  onClose,
  data,
  onVerifyReceiptInAudit
}) => {
  const [deliveryStatus, setDeliveryStatus] = useState<'SENDING' | 'SENT' | 'DELIVERED' | 'READ'>('SENDING');
  const [copiedHash, setCopiedHash] = useState<boolean>(false);
  const [showJsonPayload, setShowJsonPayload] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && data) {
      setDeliveryStatus('SENDING');
      const timer1 = setTimeout(() => setDeliveryStatus('SENT'), 400);
      const timer2 = setTimeout(() => setDeliveryStatus('DELIVERED'), 1100);
      const timer3 = setTimeout(() => setDeliveryStatus('READ'), 2100);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [isOpen, data]);

  if (!isOpen || !data) return null;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(data.receiptHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
  };

  const cleanPhone = data.voterPhone.replace(/\D/g, '').replace(/^0/, '62');
  const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(data.waPayload.rawMessage)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-200 my-6">
        
        {/* Header */}
        <div className="px-5 py-4 bg-emerald-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white font-bold text-sm">
              WA
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Konfirmasi WhatsApp Business API</h2>
              <span className="text-[11px] text-emerald-100">Meta Cloud API v18.0 · KPU RW 14 Pedurungan Tengah</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-emerald-200 hover:text-white hover:bg-emerald-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-4">

          {/* Success Summary Banner */}
          <div className="text-center">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto mb-1.5">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider block">
              Surat Suara Sah & Notifikasi Terkirim
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-0.5">
              Terima Kasih, {data.waPayload.displayName}!
            </h3>
            <p className="text-xs text-slate-500">
              Hak suara Anda telah tercatat aman, dan notifikasi resmi WhatsApp telah diteruskan ke nomor Anda.
            </p>
          </div>

          {/* META WHATSAPP BUSINESS CLOUD API STATUS BAR */}
          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-700" />
                <span className="text-xs font-bold text-emerald-950">
                  Status Pengiriman WhatsApp Business API:
                </span>
              </div>
              <span className="text-xs font-mono font-semibold text-emerald-900">
                {data.voterPhone}
              </span>
            </div>

            {/* Stepper Status Indicator */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] pt-1">
              <div className={`p-1.5 rounded-lg border transition-all ${
                deliveryStatus === 'SENT' || deliveryStatus === 'DELIVERED' || deliveryStatus === 'READ'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  <Check className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Terkirim</span>
                </div>
              </div>

              <div className={`p-1.5 rounded-lg border transition-all ${
                deliveryStatus === 'DELIVERED' || deliveryStatus === 'READ'
                  ? 'bg-emerald-100 border-emerald-300 text-emerald-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Diterima</span>
                </div>
              </div>

              <div className={`p-1.5 rounded-lg border transition-all ${
                deliveryStatus === 'READ'
                  ? 'bg-sky-100 border-sky-300 text-sky-900 font-semibold'
                  : 'bg-white border-slate-200 text-slate-400'
              }`}>
                <div className="flex items-center justify-center gap-1">
                  <CheckCheck className={`w-3.5 h-3.5 ${deliveryStatus === 'READ' ? 'text-sky-600' : 'text-slate-400'}`} />
                  <span>Dibaca (Centang Biru)</span>
                </div>
              </div>
            </div>
          </div>

          {/* CHAT PREVIEW BOX */}
          <div className="bg-[#e5ddd5] rounded-xl p-3 border border-slate-300 shadow-inner">
            <div className="text-[10px] text-center text-slate-600 mb-2 font-medium">
              WhatsApp Business Verified Account · Panitia Pemilihan RW 14 Pedurungan Tengah
            </div>

            <div className="bg-white rounded-lg p-3.5 shadow-sm text-xs text-slate-800 leading-relaxed font-sans max-w-md ml-auto border-l-4 border-emerald-600 space-y-2">
              <div className="font-bold text-emerald-900 border-b border-slate-100 pb-1 flex justify-between items-center">
                <span>KPU RW 14 PEDURUNGAN TENGAH</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-mono">
                  No. 0{data.waPayload.ballotNumber}
                </span>
              </div>

              <div>
                Kepada Yth. <strong>{data.waPayload.displayName}</strong> ({data.voterRt} RW 14),
                <br />
                Surat suara sah Anda telah tercatat pada <strong>{data.timestamp} WIB</strong>.
              </div>

              {/* Candidate chosen listed clearly */}
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-0.5">
                  Kandidat Pilihan Anda:
                </span>
                <span className="text-xs font-extrabold text-slate-900 block">
                  Nomor Urut 0{data.waPayload.candidateNumber} - {data.waPayload.candidateSelectedName}
                </span>
              </div>

              {/* SHA-256 Receipt */}
              <div className="bg-slate-50 p-2 rounded border border-slate-200 font-mono text-[10px] text-slate-700 break-all">
                <span className="text-slate-400 block text-[9px]">KODE STRUK DIGITAL SHA-256:</span>
                {data.receiptHash}
              </div>

              {/* Thank you note */}
              <p className="text-[11px] text-slate-600 italic bg-emerald-50/50 p-2 rounded border border-emerald-100">
                &ldquo;Panitia Pemilihan Ketua RW 14 Kelurahan Pedurungan Tengah mengucapkan terima kasih yang sebesar-besarnya atas partisipasi aktif Bapak/Ibu dalam menyalurkan hak suara secara LUBER JURDIL demi kemajuan lingkungan kita.&rdquo;
              </p>

              <div className="text-[10px] text-slate-400 flex items-center justify-between pt-1">
                <span>{data.timestamp.slice(11, 16)} WIB</span>
                <span className="flex items-center gap-0.5 text-sky-600 font-bold">
                  ✓✓ Dibaca
                </span>
              </div>
            </div>
          </div>

          {/* META CLOUD API JSON PAYLOAD TOGGLE (POLICY COMPLIANCE PROOF) */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowJsonPayload(!showJsonPayload)}
              className="w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 text-left text-xs font-semibold text-slate-700 flex items-center justify-between transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>Inspeksi JSON Meta WhatsApp Business Cloud API Payload</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-mono">
                {showJsonPayload ? 'Sembunyikan' : 'Lihat Payload'}
              </span>
            </button>

            {showJsonPayload && (
              <div className="p-3 bg-slate-900 text-emerald-400 font-mono text-[10px] overflow-x-auto max-h-48 border-t border-slate-800">
                <pre>{JSON.stringify(data.waPayload.metaCloudApiPayload, null, 2)}</pre>
              </div>
            )}
          </div>

          {/* Action CTAs */}
          <div className="space-y-2 pt-1">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer text-center"
            >
              <Share2 className="w-4 h-4" />
              <span>Buka di Aplikasi WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  onVerifyReceiptInAudit(data.receiptHash);
                  onClose();
                }}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Cek di Ledger Publik</span>
              </button>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-1/2 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5 text-slate-600" />
                <span>Cetak Tanda Terima</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
