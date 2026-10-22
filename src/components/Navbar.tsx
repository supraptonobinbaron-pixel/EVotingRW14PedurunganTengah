import React from 'react';
import { ShieldCheck, Vote, ScanLine, Search, Lock, BarChart3, MessageSquare, RotateCcw, Users, Database } from 'lucide-react';
import { electionStore } from '../services/electionStore';
import { RwLogo } from './RwLogo';
import { isSupabaseConfigured } from '../services/supabaseService';

interface NavbarProps {
  activeTab: 'dashboard' | 'voting' | 'verify' | 'dpt' | 'security';
  setActiveTab: (tab: 'dashboard' | 'voting' | 'verify' | 'dpt' | 'security') => void;
  onOpenQuickVote: () => void;
  onOpenWhatsAppConfig: () => void;
  onOpenManageCandidates: () => void;
  onOpenSupabaseConfig?: () => void;
  onResetRequest?: () => void;
  hasActiveToken: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenQuickVote,
  onOpenWhatsAppConfig,
  onOpenManageCandidates,
  onOpenSupabaseConfig,
  onResetRequest,
  hasActiveToken
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-15 sm:h-16 flex items-center justify-between gap-2">
        
        {/* Zone 1: Wordmark with Official Logo */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className="text-left group cursor-pointer flex items-center gap-2 sm:gap-3 min-w-0"
        >
          <RwLogo className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 drop-shadow-xs group-hover:scale-105 transition-transform" />
          <div className="min-w-0">
            <span className="text-xs sm:text-base md:text-lg font-bold tracking-tight text-slate-900 block leading-tight truncate">
              E-Voting RW 14
            </span>
            <span className="text-[10px] sm:text-[11px] text-slate-500 truncate block">
              Pedurungan Tengah, Semarang
            </span>
          </div>
        </button>

        {/* Zone 2: Clean desktop text navigation links */}
        <nav className="hidden lg:flex items-center gap-5 text-sm font-medium text-slate-600">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dashboard'
                ? 'text-red-700 font-semibold border-b-2 border-red-700 -mb-[2px]'
                : 'hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Dasbor Analitik</span>
          </button>

          <button
            onClick={() => setActiveTab('voting')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'voting'
                ? 'text-red-700 font-semibold border-b-2 border-red-700 -mb-[2px]'
                : 'hover:text-slate-900'
            }`}
          >
            <Vote className="w-4 h-4" />
            <span>Bilik Suara</span>
            {hasActiveToken && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            onClick={onOpenManageCandidates}
            className="transition-colors py-1 cursor-pointer flex items-center gap-1.5 hover:text-slate-900"
          >
            <Users className="w-4 h-4 text-slate-500" />
            <span>Kelola Kandidat</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'verify'
                ? 'text-red-700 font-semibold border-b-2 border-red-700 -mb-[2px]'
                : 'hover:text-slate-900'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            <span>Verifikasi e-KTP</span>
          </button>

          <button
            onClick={() => setActiveTab('dpt')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dpt'
                ? 'text-red-700 font-semibold border-b-2 border-red-700 -mb-[2px]'
                : 'hover:text-slate-900'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>DPT RW 14</span>
          </button>

          <button
            onClick={() => setActiveTab('security')}
            className={`transition-colors py-1 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'security'
                ? 'text-red-700 font-semibold border-b-2 border-red-700 -mb-[2px]'
                : 'hover:text-slate-900'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Audit</span>
          </button>
        </nav>

        {/* Zone 3: Primary actions (responsive for Android to Desktop) */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Kelola Kandidat (Icon on mobile, labeled on desktop) */}
          <button
            onClick={onOpenManageCandidates}
            title="Kelola Calon Ketua RW (Tambah, Koreksi, Hapus)"
            className="flex items-center justify-center gap-1 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors cursor-pointer min-h-[38px] min-w-[38px]"
          >
            <Users className="w-4 h-4 text-slate-600 shrink-0" />
            <span className="hidden md:inline">Kandidat</span>
          </button>

          {/* Supabase Database Settings Trigger */}
          {onOpenSupabaseConfig && (
            <button
              onClick={onOpenSupabaseConfig}
              title={isSupabaseConfigured() ? 'Database Supabase: Terhubung & Real-time Aktif' : 'Hubungkan Database Supabase (Cloud)'}
              className={`p-2 rounded-lg border transition-all cursor-pointer min-h-[38px] flex items-center justify-center gap-1.5 ${
                isSupabaseConfigured()
                  ? 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border-emerald-300'
                  : 'text-slate-600 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <Database className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="hidden lg:inline text-xs font-semibold">
                {isSupabaseConfigured() ? 'Supabase' : 'Supabase'}
              </span>
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  isSupabaseConfigured() ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                }`}
              />
            </button>
          )}

          {/* WhatsApp API Settings Trigger */}
          <button
            onClick={onOpenWhatsAppConfig}
            title="Pengaturan WhatsApp Business API (Meta Cloud)"
            className="p-2 text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          {/* Reset Data Button */}
          {onResetRequest && (
            <button
              onClick={onResetRequest}
              title="Reset data contoh pemilihan (RT 01 - RT 06)"
              className="p-2 text-slate-500 hover:text-red-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer min-h-[38px] min-w-[38px] flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}

          {/* Primary Action Button */}
          <button
            onClick={onOpenQuickVote}
            className="px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-semibold text-white bg-red-700 hover:bg-red-800 active:scale-[0.98] rounded-lg transition-all flex items-center gap-1.5 shadow-sm whitespace-nowrap cursor-pointer min-h-[38px]"
          >
            <Vote className="w-4 h-4 shrink-0" />
            <span className="hidden sm:inline">Coblos Sekarang</span>
            <span className="sm:hidden">Coblos</span>
          </button>
        </div>

      </div>
    </header>
  );
};
