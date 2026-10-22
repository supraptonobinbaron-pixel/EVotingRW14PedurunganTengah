import React, { useState, useEffect } from 'react';
import {
  X,
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  ExternalLink,
  RefreshCw,
  UploadCloud,
  DownloadCloud,
  KeyRound,
  Globe,
  Trash2,
  Code2
} from 'lucide-react';
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  getSupabaseSchemaSql,
  pushAllLocalDataToSupabase
} from '../services/supabaseService';
import { electionStore } from '../services/electionStore';
import { ConfirmationModal } from './ConfirmationModal';

interface SupabaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncComplete?: () => void;
}

export const SupabaseConfigModal: React.FC<SupabaseConfigModalProps> = ({
  isOpen,
  onClose,
  onSyncComplete
}) => {
  const [url, setUrl] = useState('');
  const [anonKey, setAnonKey] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [activeTab, setActiveTab] = useState<'config' | 'sql' | 'guide'>('config');

  useEffect(() => {
    if (isOpen) {
      const config = getSupabaseConfig();
      setUrl(config.url);
      setAnonKey(config.anonKey);
      setIsEnabled(config.isEnabled);
      setStatusMessage(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleTestAndSave = async () => {
    if (!url.trim() || !anonKey.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Harap isi URL Proyek Supabase dan Anon Public Key.'
      });
      return;
    }

    setIsTesting(true);
    setStatusMessage(null);

    const result = await testSupabaseConnection(url, anonKey);
    setIsTesting(false);

    if (result.success) {
      saveSupabaseConfig(url, anonKey, isEnabled);
      setStatusMessage({
        type: 'success',
        text: result.message
      });
      // Trigger electionStore sync
      electionStore.syncWithSupabase();
      if (onSyncComplete) onSyncComplete();
    } else {
      setStatusMessage({
        type: 'error',
        text: result.message
      });
    }
  };

  const handlePushData = async () => {
    const config = getSupabaseConfig();
    if (!config.url || !config.anonKey) {
      setStatusMessage({
        type: 'error',
        text: 'Simpan konfigurasi koneksi terlebih dahulu sebelum mengunggah data.'
      });
      return;
    }

    setIsSyncing(true);
    setStatusMessage({
      type: 'info',
      text: 'Sedang mengunggah data Calon, DPT RW 14, dan Kotak Suara ke Supabase...'
    });

    const res = await pushAllLocalDataToSupabase(
      electionStore.getCandidates(),
      electionStore.getDptList(),
      electionStore.getBallots(),
      electionStore.getAuditLogs()
    );

    setIsSyncing(false);

    if (res.success) {
      setStatusMessage({
        type: 'success',
        text: res.message
      });
      if (onSyncComplete) onSyncComplete();
    } else {
      setStatusMessage({
        type: 'error',
        text: res.message
      });
    }
  };

  const handlePullData = async () => {
    setIsSyncing(true);
    setStatusMessage({
      type: 'info',
      text: 'Menarik data terbaru dari Supabase...'
    });

    const success = await electionStore.syncWithSupabase();
    setIsSyncing(false);

    if (success) {
      setStatusMessage({
        type: 'success',
        text: 'Data berhasil disinkronkan dari database Supabase!'
      });
      if (onSyncComplete) onSyncComplete();
    } else {
      setStatusMessage({
        type: 'error',
        text: 'Gagal menarik data dari Supabase. Pastikan tabel telah dibuat di Supabase.'
      });
    }
  };

  const handleDisconnect = () => {
    setShowDisconnectConfirm(true);
  };

  const confirmDisconnect = () => {
    clearSupabaseConfig();
    setUrl('');
    setAnonKey('');
    setShowDisconnectConfirm(false);
    setStatusMessage({
      type: 'info',
      text: 'Koneksi Supabase dinonaktifkan. Mode penyimpanan lokal aktif.'
    });
    if (onSyncComplete) onSyncComplete();
  };

  const copySqlToClipboard = () => {
    const sql = getSupabaseSchemaSql();
    navigator.clipboard.writeText(sql).then(() => {
      setCopiedSql(true);
      setTimeout(() => setCopiedSql(false), 2500);
    });
  };

  const isConfigured = Boolean(url && anonKey);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 via-slate-900 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">Koneksi Database Supabase</h2>
                <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded-full ${
                  isConfigured
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}>
                  {isConfigured ? 'Terhubung' : 'Lokal (Belum Terhubung)'}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Sinkronisasi DPT, Kandidat, dan Kotak Suara Digital RW 14 secara Real-time Cloud
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-4 shrink-0 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>Pengaturan Kredensial</span>
          </button>
          <button
            onClick={() => setActiveTab('sql')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'sql'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Code2 className="w-4 h-4" />
            <span>Skrip SQL Skema DB</span>
          </button>
          <button
            onClick={() => setActiveTab('guide')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 cursor-pointer transition-colors ${
              activeTab === 'guide'
                ? 'border-emerald-600 text-emerald-800'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Globe className="w-4 h-4" />
            <span>Panduan Supabase</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">

          {/* Status Message */}
          {statusMessage && (
            <div
              className={`p-3.5 rounded-xl text-xs sm:text-sm flex items-start gap-2.5 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : statusMessage.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200'
                  : 'bg-blue-50 text-blue-800 border-blue-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : statusMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              ) : (
                <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />
              )}
              <div className="flex-1">{statusMessage.text}</div>
            </div>
          )}

          {/* TAB 1: CONFIG */}
          {activeTab === 'config' && (
            <div className="space-y-4">
              <div className="bg-emerald-50/60 border border-emerald-100 rounded-xl p-3.5 text-xs text-emerald-900 flex items-start gap-2.5">
                <Database className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p>
                  Dengan menghubungkan Supabase, seluruh data DPT (RT 01 s/d RT 06), Calon Ketua RW 14, dan suara yang masuk akan tersimpan aman di cloud PostgreSQL dan otomatis tersinkronisasi antar perangkat panitia secara real-time.
                </p>
              </div>

              {/* Project URL */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-slate-500" />
                  Supabase Project URL
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://xyzprojectref.supabase.co"
                  className="w-full px-3.5 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Ditemukan di Supabase Dashboard: <b>Project Settings &gt; API &gt; Project URL</b>
                </p>
              </div>

              {/* Anon Public Key */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-slate-500" />
                  Supabase Anon (Public) Key
                </label>
                <textarea
                  rows={3}
                  value={anonKey}
                  onChange={(e) => setAnonKey(e.target.value)}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all font-mono"
                />
                <p className="text-[11px] text-slate-500">
                  Gunakan public <b>anon key</b> (bukan service_role secret key) agar aman di client.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <button
                  type="button"
                  disabled={isTesting || !url || !anonKey}
                  onClick={handleTestAndSave}
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm font-semibold text-white bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-300 disabled:cursor-not-allowed rounded-lg shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isTesting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Menguji Koneksi...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Uji Koneksi & Simpan</span>
                    </>
                  )}
                </button>

                {isConfigured && (
                  <button
                    type="button"
                    onClick={handleDisconnect}
                    className="px-3.5 py-2.5 text-xs font-semibold text-slate-600 hover:text-red-700 bg-slate-100 hover:bg-red-50 rounded-lg border border-slate-200 hover:border-red-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Putuskan koneksi dan kembali ke penyimpanan lokal"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Putus Koneksi</span>
                  </button>
                )}
              </div>

              {/* Data Sync Section (When configured) */}
              {isConfigured && (
                <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        Aksi Sinkronisasi Data
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Sinkronkan data contoh RW 14 antara browser dan Supabase
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handlePushData}
                      className="px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      <span>Unggah Data Lokal ke Supabase</span>
                    </button>

                    <button
                      type="button"
                      disabled={isSyncing}
                      onClick={handlePullData}
                      className="px-3 py-2 text-xs font-semibold text-blue-800 bg-blue-100 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <DownloadCloud className="w-4 h-4" />
                      <span>Tarik Data dari Supabase</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SQL SCHEMA */}
          {activeTab === 'sql' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                    Skrip SQL Skema Database RW 14
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Jalankan skrip ini sekali di menu <b>SQL Editor</b> proyek Supabase Anda.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copySqlToClipboard}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
                    copiedSql
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
                >
                  {copiedSql ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Tersalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Salin Skrip SQL</span>
                    </>
                  )}
                </button>
              </div>

              <div className="relative">
                <pre className="bg-slate-900 text-slate-200 p-4 rounded-xl text-xs font-mono overflow-x-auto max-h-72 border border-slate-800 leading-relaxed">
                  {getSupabaseSchemaSql()}
                </pre>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
                <p className="font-semibold">Perhatian:</p>
                <p>
                  Skrip di atas membuat 4 tabel: <code className="bg-amber-100 px-1 rounded">candidates</code>, <code className="bg-amber-100 px-1 rounded">dpt</code>, <code className="bg-amber-100 px-1 rounded">ballots</code>, dan <code className="bg-amber-100 px-1 rounded">audit_logs</code> lengkap dengan Row Level Security (RLS) serta Realtime streaming.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: STEP-BY-STEP GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <h3 className="font-bold text-slate-900 text-sm">
                Langkah Cepat Menghubungkan Proyek Supabase:
              </h3>
              
              <ol className="list-decimal pl-5 space-y-2 text-xs">
                <li>
                  Buka{' '}
                  <a
                    href="https://supabase.com/dashboard"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-700 font-semibold hover:underline inline-flex items-center gap-0.5"
                  >
                    Supabase Dashboard <ExternalLink className="w-3 h-3" />
                  </a>{' '}
                  dan buat proyek baru (contoh nama: <code>evoting-rw14</code>).
                </li>
                <li>
                  Buka tab <b>SQL Editor</b> di sidebar kiri Supabase, buat query baru (<i>New query</i>), salin skrip dari tab <b>Skrip SQL Skema DB</b> di atas, lalu klik <b>Run</b>.
                </li>
                <li>
                  Buka <b>Project Settings &gt; API</b> di sidebar kiri.
                </li>
                <li>
                  Salin <b>Project URL</b> (contoh: <code>https://xyz...supabase.co</code>) dan masukkan ke tab <b>Pengaturan Kredensial</b>.
                </li>
                <li>
                  Salin <b>anon public key</b> dan masukkan ke form.
                </li>
                <li>
                  Klik tombol <b>Uji Koneksi &amp; Simpan</b>.
                </li>
                <li>
                  Klik <b>Unggah Data Lokal ke Supabase</b> agar 3 kandidat dan data DPT RT 01-RT 06 otomatis tersimpan di cloud!
                </li>
              </ol>

              <div className="mt-3 p-3 bg-slate-100 rounded-xl text-[11px] text-slate-600">
                <b>Keuntungan Mode Supabase:</b> Real-time multi-device, tidak hilang saat ganti perangkat atau clear browser cache, terenkripsi di PostgreSQL cloud, dan memiliki audit log permanen.
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>E-Voting RW 14 &bull; Kelurahan Pedurungan Tengah</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Tutup
          </button>
        </div>

      </div>

      <ConfirmationModal
        isOpen={showDisconnectConfirm}
        title="Putus Koneksi Supabase?"
        message="Aplikasi akan beralih ke penyimpanan browser lokal (localStorage). Data lokal yang belum diunggah ke Supabase tetap tersimpan di perangkat ini."
        confirmText="Ya, Putuskan"
        cancelText="Batal"
        variant="warning"
        onConfirm={confirmDisconnect}
        onCancel={() => setShowDisconnectConfirm(false)}
      />
    </div>
  );
};
