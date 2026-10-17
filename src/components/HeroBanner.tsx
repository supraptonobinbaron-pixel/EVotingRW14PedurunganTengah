import React from 'react';
import { ScanLine, Vote, Search, ShieldCheck, CheckCircle2, MessageSquare, Users, Database } from 'lucide-react';
import heroBalaiImg from '../assets/images/hero_balai_rw_1791102609909.jpg';
import { RwLogo } from './RwLogo';
import { isSupabaseConfigured } from '../services/supabaseService';

interface HeroBannerProps {
  onVerifyClick: () => void;
  onVoteClick: () => void;
  onDptClick: () => void;
  onOpenWhatsAppConfig: () => void;
  onOpenManageCandidates: () => void;
  onOpenSupabaseConfig?: () => void;
  totalVotes: number;
  totalDpt: number;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onVerifyClick,
  onVoteClick,
  onDptClick,
  onOpenWhatsAppConfig,
  onOpenManageCandidates,
  onOpenSupabaseConfig,
  totalVotes,
  totalDpt
}) => {
  const participationRate = totalDpt > 0 ? ((totalVotes / totalDpt) * 100).toFixed(1) : '0.0';

  return (
    <div className="relative overflow-hidden bg-slate-900 text-white rounded-2xl sm:rounded-3xl mb-6 sm:mb-8 border border-slate-800 shadow-xl">
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroBalaiImg}
          alt="Balai Warga RW 14 Pedurungan Tengah Semarang"
          className="w-full h-full object-cover opacity-25"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-900/85" />
      </div>

      <div className="relative z-10 px-4 sm:px-6 md:px-8 py-5 sm:py-7 md:py-9 max-w-5xl">
        {/* Civic Location Badge & Status */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-3 sm:mb-4 text-[11px] sm:text-xs">
          <span className="font-semibold tracking-wider uppercase text-red-400 bg-red-950/80 border border-red-800/80 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded">
            Pemerintah Kota Semarang
          </span>
          <span className="text-slate-400 hidden xs:inline">·</span>
          <span className="text-slate-300">
            Kel. Pedurungan Tengah, Kec. Pedurungan
          </span>
          <span className="text-slate-400 hidden sm:inline">·</span>
          <span className="text-emerald-400 font-medium flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            TPS Digital Dibuka (07.00 - 14.00 WIB)
          </span>
        </div>

        {/* Logo and Main Headline Lockup */}
        <div className="flex items-start sm:items-center gap-3 sm:gap-5 mb-3 sm:mb-4">
          <RwLogo className="w-13 h-13 sm:w-16 sm:h-16 md:w-20 md:h-20 shrink-0 drop-shadow-md rounded-full bg-white/5 p-1" />
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-extrabold tracking-tight text-white leading-tight">
              Pemilihan Ketua RW 14 Kelurahan Pedurungan Tengah
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Gunakan hak pilih Anda secara aman dan transparan. Dilengkapi verifikasi e-KTP dengan pencocokan string ketat, token sekali pakai anti-curang, dasbor analitik suara dinamis, serta notifikasi resmi WhatsApp Business API.
            </p>
          </div>
        </div>

        {/* Quick Action Buttons (Mobile-first responsive grid to flex) */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 sm:gap-2.5 mb-5 sm:mb-6 pt-1 sm:pt-2">
          <button
            onClick={onVerifyClick}
            className="px-3 sm:px-4 py-2.5 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer min-h-[42px]"
          >
            <ScanLine className="w-4 h-4 shrink-0" />
            <span>1. Verifikasi e-KTP</span>
          </button>

          <button
            onClick={onVoteClick}
            className="px-3 sm:px-4 py-2.5 bg-white text-slate-900 hover:bg-slate-100 active:scale-[0.98] font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center justify-center gap-1.5 sm:gap-2 shadow-md cursor-pointer min-h-[42px]"
          >
            <Vote className="w-4 h-4 text-red-600 shrink-0" />
            <span>2. Bilik Suara</span>
          </button>

          <button
            onClick={onOpenManageCandidates}
            className="px-3 sm:px-3.5 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-white font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Users className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Kelola Calon</span>
          </button>

          <button
            onClick={onDptClick}
            className="px-3 sm:px-3.5 py-2.5 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-medium text-xs sm:text-sm rounded-xl border border-slate-700 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <Search className="w-4 h-4 text-slate-400 shrink-0" />
            <span>DPT (RT 01-06)</span>
          </button>

          <button
            onClick={onOpenWhatsAppConfig}
            className="px-3 sm:px-3.5 py-2.5 bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 font-medium text-xs sm:text-sm rounded-xl border border-emerald-800 transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px]"
          >
            <MessageSquare className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>WhatsApp API</span>
          </button>

          {onOpenSupabaseConfig && (
            <button
              onClick={onOpenSupabaseConfig}
              className={`col-span-2 sm:col-span-1 px-3 sm:px-3.5 py-2.5 font-medium text-xs sm:text-sm rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer min-h-[42px] ${
                isSupabaseConfigured()
                  ? 'bg-emerald-900/90 hover:bg-emerald-800 text-emerald-200 border-emerald-600'
                  : 'bg-slate-800/90 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <Database className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{isSupabaseConfigured() ? 'Supabase Terhubung' : 'Hubungkan Supabase'}</span>
            </button>
          )}
        </div>

        {/* Live Mini Metric Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5 pt-4 sm:pt-5 border-t border-slate-800/80 text-xs">
          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block mb-0.5 text-[11px]">DPT RW 14</span>
            <span className="text-base sm:text-lg font-bold text-white tabular-nums block">{totalDpt} Pemilih</span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">6 RT (RT 01 s/d RT 06)</span>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block mb-0.5 text-[11px]">Total Suara Masuk</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 tabular-nums block">{totalVotes} Suara</span>
            <span className="text-[10px] sm:text-[11px] text-emerald-300 block">Partisipasi {participationRate}%</span>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block mb-0.5 text-[11px]">Verifikasi e-KTP</span>
            <span className="text-base sm:text-lg font-bold text-sky-400 flex items-center gap-1">
              <ShieldCheck className="w-4 h-4" />
              <span>Strict Match</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">Validasi NIK Semarang</span>
          </div>

          <div className="bg-white/5 p-2.5 sm:p-3 rounded-xl border border-white/5">
            <span className="text-slate-400 block mb-0.5 text-[11px]">WhatsApp API</span>
            <span className="text-base sm:text-lg font-bold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Meta Cloud</span>
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-400 block">Kategori UTILITY Resmi</span>
          </div>
        </div>
      </div>
    </div>
  );
};
