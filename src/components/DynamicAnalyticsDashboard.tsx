import React, { useState } from 'react';
import {
  BarChart3,
  PieChart as PieIcon,
  TrendingUp,
  Users,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Zap,
  RotateCcw,
  FileText,
  Clock,
  Layers
} from 'lucide-react';
import { Candidate, CastBallot, ZoneType, AgeGroupType } from '../types/election';
import { electionStore, RT_LIST } from '../services/electionStore';

interface DynamicAnalyticsDashboardProps {
  candidates: Candidate[];
  ballots: CastBallot[];
  totalVotes: number;
  totalDpt: number;
  onOpenVoting: () => void;
  onOpenBeritaAcara: () => void;
  onOpenManageCandidates?: () => void;
}

export const DynamicAnalyticsDashboard: React.FC<DynamicAnalyticsDashboardProps> = ({
  candidates,
  ballots,
  totalVotes,
  totalDpt,
  onOpenVoting,
  onOpenBeritaAcara,
  onOpenManageCandidates
}) => {
  // Filters
  const [selectedZone, setSelectedZone] = useState<'ALL' | ZoneType>('ALL');
  const [selectedRt, setSelectedRt] = useState<string>('ALL');
  const [chartViewMode, setChartViewMode] = useState<'BAR' | 'PIE'>('BAR');
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TREND' | 'DEMOGRAPHICS'>('OVERVIEW');

  // Filter ballots based on selected zone and RT
  const filteredBallots = ballots.filter(b => {
    const matchZone = selectedZone === 'ALL' || b.zoneOrigin === selectedZone;
    const matchRt = selectedRt === 'ALL' || b.rtOrigin === selectedRt;
    return matchZone && matchRt;
  });

  const filteredTotal = filteredBallots.length;

  // Calculate votes per candidate within filter
  const candidateStats = candidates.map(c => {
    const count = filteredBallots.filter(b => b.candidateId === c.id).length;
    const overallCount = c.voteCount;
    const displayCount = (selectedZone !== 'ALL' || selectedRt !== 'ALL') ? count : overallCount;
    const pct = filteredTotal > 0
      ? ((count / filteredTotal) * 100).toFixed(1)
      : totalVotes > 0
        ? ((overallCount / totalVotes) * 100).toFixed(1)
        : '0.0';
    return {
      ...c,
      displayCount,
      pct: parseFloat(pct)
    };
  });

  // Candidate colors
  const CANDIDATE_COLORS = [
    { bg: 'bg-red-600', fill: '#dc2626', stroke: '#b91c1c', light: 'bg-red-50 text-red-700' },
    { bg: 'bg-blue-600', fill: '#2563eb', stroke: '#1d4ed8', light: 'bg-blue-50 text-blue-700' },
    { bg: 'bg-emerald-600', fill: '#059669', stroke: '#047857', light: 'bg-emerald-50 text-emerald-700' }
  ];

  // Hourly Trends
  const hourlyTrends = electionStore.getHourlyTrends(selectedZone, selectedRt);
  const maxHourlyCumulative = Math.max(...hourlyTrends.map(h => h.cumulativeTotal), 1);

  // Demographics: Age Group
  const ageGroups: AgeGroupType[] = ['Gen Z (17-27)', 'Milenial (28-43)', 'Gen X (44-59)', 'Lansia (60+)'];
  const ageStats = ageGroups.map(group => {
    const count = filteredBallots.filter(b => b.voterAgeGroup === group).length;
    const pct = filteredTotal > 0 ? ((count / filteredTotal) * 100).toFixed(1) : '0';
    return { group, count, pct };
  });

  // Demographics: Gender
  const genderL = filteredBallots.filter(b => b.voterGender === 'L').length;
  const genderP = filteredBallots.filter(b => b.voterGender === 'P').length;
  const genderLPercent = filteredTotal > 0 ? Math.round((genderL / filteredTotal) * 100) : 50;
  const genderPPercent = filteredTotal > 0 ? 100 - genderLPercent : 50;

  // Donut chart path calculations
  const calculatePieSlices = () => {
    let cumulative = 0;
    const total = candidateStats.reduce((sum, c) => sum + c.displayCount, 0) || 1;
    
    return candidateStats.map((c, idx) => {
      const sliceAngle = (c.displayCount / total) * 360;
      const startAngle = cumulative;
      cumulative += sliceAngle;

      const startRad = ((startAngle - 90) * Math.PI) / 180;
      const endRad = (((startAngle + sliceAngle) - 90) * Math.PI) / 180;

      const x1 = 100 + 70 * Math.cos(startRad);
      const y1 = 100 + 70 * Math.sin(startRad);
      const x2 = 100 + 70 * Math.cos(endRad);
      const y2 = 100 + 70 * Math.sin(endRad);

      const largeArc = sliceAngle > 180 ? 1 : 0;
      const pathData = totalVotes === 0
        ? ''
        : `M 100 100 L ${x1} ${y1} A 70 70 0 ${largeArc} 1 ${x2} ${y2} Z`;

      return {
        candidate: c,
        pathData,
        color: CANDIDATE_COLORS[idx]
      };
    });
  };

  const pieSlices = calculatePieSlices();

  // Reset Data action
  const handleResetData = () => {
    if (confirm('Apakah Anda yakin ingin mereset seluruh data contoh pemilihan ke status awal bersih?')) {
      electionStore.resetToFreshState();
    }
  };

  // Load sample test data action
  const handleLoadSample = () => {
    electionStore.loadSampleTestVotes();
  };

  return (
    <div className="space-y-6">

      {/* TOP BAR FILTER & ACTION STRIP */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Zone & RT Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-2 sm:gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Filter className="w-4 h-4 text-red-700 shrink-0" />
            <span>Filter Wilayah:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full sm:w-auto">
            {/* Zone Selector */}
            <select
              value={selectedZone}
              onChange={e => {
                setSelectedZone(e.target.value as 'ALL' | ZoneType);
                setSelectedRt('ALL');
              }}
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-red-600 focus:outline-none min-h-[38px]"
            >
              <option value="ALL">Semua Zona (RW 14 Pedurungan Tengah)</option>
              <option value="Zona Barat">Zona Barat (RT 01, 02)</option>
              <option value="Zona Tengah">Zona Tengah (RT 03, 04)</option>
              <option value="Zona Timur">Zona Timur (RT 05, 06)</option>
            </select>

            {/* Specific RT Selector */}
            <select
              value={selectedRt}
              onChange={e => setSelectedRt(e.target.value)}
              className="w-full sm:w-auto px-3 py-2 sm:py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-50 focus:ring-2 focus:ring-red-600 focus:outline-none min-h-[38px]"
            >
              <option value="ALL">Semua RT di Zona</option>
              {RT_LIST.filter(rt => {
                if (selectedZone === 'Zona Barat') return ['RT 01', 'RT 02'].includes(rt);
                if (selectedZone === 'Zona Tengah') return ['RT 03', 'RT 04'].includes(rt);
                if (selectedZone === 'Zona Timur') return ['RT 05', 'RT 06'].includes(rt);
                return true;
              }).map(rt => (
                <option key={rt} value={rt}>{rt}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Controls: Mobile 2x2 grid, Desktop inline */}
        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full md:w-auto">
          <button
            type="button"
            onClick={handleResetData}
            title="Reset data contoh pemilihan ke status bersih"
            className="px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Reset Data</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSample}
            title="Muat contoh suara simulasi untuk menguji grafik & tren"
            className="px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">Isi Sampel</span>
          </button>

          {onOpenManageCandidates && (
            <button
              type="button"
              onClick={onOpenManageCandidates}
              title="Kelola Calon Ketua RW 14 (Tambah, Koreksi, Hapus)"
              className="px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs min-h-[38px]"
            >
              <Users className="w-3.5 h-3.5 text-red-600 shrink-0" />
              <span className="truncate">Kelola Calon</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenBeritaAcara}
            className="px-2.5 sm:px-3 py-2 sm:py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer min-h-[38px]"
          >
            <FileText className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Berita Acara</span>
          </button>
        </div>

      </div>

      {/* DASHBOARD TAB SWITCHER (Full width responsive grid) */}
      <div className="grid grid-cols-3 sm:flex items-center gap-1 sm:gap-2 p-1 bg-slate-100 rounded-xl max-w-md w-full">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-h-[36px] ${
            activeTab === 'OVERVIEW'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600 shrink-0" />
          <span className="truncate">Suara</span>
        </button>

        <button
          onClick={() => setActiveTab('TREND')}
          className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-h-[36px] ${
            activeTab === 'TREND'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-sky-600 shrink-0" />
          <span className="truncate">Tren Waktu</span>
        </button>

        <button
          onClick={() => setActiveTab('DEMOGRAPHICS')}
          className={`py-2 px-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1 sm:gap-1.5 cursor-pointer min-h-[36px] ${
            activeTab === 'DEMOGRAPHICS'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-600 shrink-0" />
          <span className="truncate">Demografi</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW (BAR & PIE/DONUT CHART) */}
      {activeTab === 'OVERVIEW' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Main Chart Card (Takes 2 cols) */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Hasil Perolehan Suara Kandidat Ketua RW 14
                </h3>
                <span className="text-xs text-slate-500">
                  Wilayah: {selectedZone === 'ALL' ? 'Seluruh RW 14' : selectedZone} {selectedRt !== 'ALL' && `(${selectedRt})`}
                </span>
              </div>

              {/* Chart View Toggle: Bar vs Pie */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg">
                <button
                  onClick={() => setChartViewMode('BAR')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    chartViewMode === 'BAR' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Grafik Batang"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setChartViewMode('PIE')}
                  className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                    chartViewMode === 'PIE' ? 'bg-white text-red-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                  title="Grafik Lingkaran / Pie"
                >
                  <PieIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* BAR CHART VIEW */}
            {chartViewMode === 'BAR' && (
              <div className="space-y-6">
                {candidateStats.map((c, idx) => {
                  const colors = CANDIDATE_COLORS[idx];
                  return (
                    <div key={c.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={c.photo}
                            alt={c.name}
                            className="w-10 h-10 rounded-lg object-cover border border-slate-300"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-5 h-5 rounded bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center">
                                0{c.number}
                              </span>
                              <span className="text-sm font-bold text-slate-900">
                                {c.name}
                              </span>
                            </div>
                            <span className="text-xs text-slate-500">Asal {c.rtAsal}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-extrabold text-slate-900 tabular-nums">
                            {c.displayCount} <span className="text-xs font-normal text-slate-500">suara</span>
                          </span>
                          <span className="block text-xs font-bold text-red-700 tabular-nums">
                            {c.pct}%
                          </span>
                        </div>
                      </div>

                      {/* Bar Fill */}
                      <div className="w-full bg-slate-200 h-3 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.bg} rounded-full transition-all duration-700`}
                          style={{ width: `${Math.max(c.pct, c.displayCount > 0 ? 3 : 0)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* PIE / DONUT CHART VIEW */}
            {chartViewMode === 'PIE' && (
              <div className="flex flex-col sm:flex-row items-center justify-around gap-6 py-4">
                <div className="relative w-48 h-48">
                  {totalVotes === 0 ? (
                    <div className="w-48 h-48 rounded-full border-4 border-dashed border-slate-300 flex items-center justify-center text-xs text-slate-400 text-center p-4">
                      Belum ada suara masuk untuk zona ini
                    </div>
                  ) : (
                    <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                      {pieSlices.map((slice, i) => (
                        <path
                          key={i}
                          d={slice.pathData}
                          fill={slice.color.fill}
                          stroke="#ffffff"
                          strokeWidth="2"
                          className="transition-all duration-500 hover:opacity-90"
                        />
                      ))}
                      {/* Donut center hole */}
                      <circle cx="100" cy="100" r="45" fill="#ffffff" />
                    </svg>
                  )}

                  {totalVotes > 0 && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-xs text-slate-400 font-semibold uppercase">Total</span>
                      <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                        {filteredTotal || totalVotes}
                      </span>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="space-y-3">
                  {candidateStats.map((c, idx) => {
                    const colors = CANDIDATE_COLORS[idx];
                    return (
                      <div key={c.id} className="flex items-center gap-3 text-xs">
                        <span className="w-3.5 h-3.5 rounded-sm shrink-0" style={{ backgroundColor: colors.fill }} />
                        <div>
                          <div className="font-bold text-slate-900">
                            0{c.number}. {c.name}
                          </div>
                          <span className="text-slate-500 tabular-nums">
                            {c.displayCount} Suara ({c.pct}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Quick Metrics & WhatsApp API Status Card */}
          <div className="space-y-6">
            
            {/* Quick Metrics */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
              <h3 className="text-sm font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
                <span>Partisipasi Wilayah Ini</span>
                <Users className="w-4 h-4 text-slate-500" />
              </h3>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Total Suara Masuk:</span>
                <span className="text-base font-extrabold text-slate-900 tabular-nums">
                  {filteredTotal} Suara
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Tingkat Partisipasi:</span>
                <span className="text-base font-extrabold text-emerald-600 tabular-nums">
                  {totalDpt > 0 ? ((filteredTotal / (totalDpt / 3)) * 100).toFixed(1) : 0}%
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-500">Metode Validasi:</span>
                <span className="text-xs font-semibold text-slate-800">
                  e-KTP & Biometrik Wajah
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenVoting}
                className="w-full mt-2 py-2.5 bg-red-700 hover:bg-red-800 text-white font-semibold text-xs rounded-xl transition-all shadow-sm cursor-pointer"
              >
                Buka Bilik Suara Digital &gt;
              </button>
            </div>

            {/* WhatsApp Business API Live Health */}
            <div className="bg-emerald-950 text-white rounded-2xl p-5 border border-emerald-900 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold tracking-wider uppercase text-emerald-400">
                  WhatsApp Business API
                </span>
                <span className="flex items-center gap-1 text-[10px] text-emerald-300 bg-emerald-900/60 px-2 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  Meta Cloud API Aktif
                </span>
              </div>

              <h4 className="text-sm font-bold text-white mb-1">
                Notifikasi Konfirmasi Otomatis
              </h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed mb-3">
                Setiap pemilih yang mencoblos otomatis menerima struk digital resmi berisi nama (jika diizinkan), kandidat yang dipilih, dan tanda terima SHA-256.
              </p>

              <div className="text-[11px] bg-emerald-900/40 p-2.5 rounded-lg border border-emerald-800 text-emerald-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-300">Template ID:</span>
                  <span className="font-mono">rw14_vote_confirmation</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-emerald-300">Kategori Pesan:</span>
                  <span>UTILITY (Transaksional Resmi)</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* TAB 2: HOURLY TREND TIMELINE (07:00 - 14:00) */}
      {activeTab === 'TREND' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900">
                Tren Perolehan Suara dari Waktu ke Waktu (07.00 - 14.00 WIB)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Pemantauan dinamika suara masuk per jam untuk melihat antusiasme pemilih di TPS RW 14.
              </p>
            </div>
            <Clock className="w-5 h-5 text-sky-600" />
          </div>

          {/* Hourly Timeline Chart Visual (Horizontally scrollable on mobile) */}
          <div className="space-y-4">
            <div className="overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0">
              <div className="min-w-[500px] sm:min-w-0 space-y-3">
                <div className="grid grid-cols-8 gap-2 text-center text-xs pb-2 border-b border-slate-100 font-bold text-slate-600">
                  {hourlyTrends.map(h => (
                    <div key={h.hour}>{h.hourLabel}</div>
                  ))}
                </div>

                {/* Visual Bars per hour */}
                <div className="grid grid-cols-8 gap-2 h-44 items-end bg-slate-50 p-3 rounded-xl border border-slate-200">
                  {hourlyTrends.map(h => {
                    const heightPct = maxHourlyCumulative > 0
                      ? Math.round((h.cumulativeTotal / maxHourlyCumulative) * 100)
                      : 0;

                    return (
                      <div key={h.hour} className="flex flex-col items-center justify-end h-full">
                        <span className="text-[10px] font-bold text-slate-700 mb-1 tabular-nums">
                          {h.cumulativeTotal}
                        </span>
                        <div
                          className="w-full max-w-[32px] bg-sky-600 rounded-t-md transition-all duration-500 hover:bg-sky-500"
                          style={{ height: `${Math.max(heightPct, 4)}%` }}
                        />
                        <span className="text-[9px] text-slate-400 mt-1">{h.hourLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Detailed Hourly Breakdown Table */}
            <div className="overflow-x-auto pt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Jam Pemilihan</th>
                    <th className="py-2 px-3">Paslon 01 (Bambang)</th>
                    <th className="py-2 px-3">Paslon 02 (Siti)</th>
                    <th className="py-2 px-3">Paslon 03 (Agus)</th>
                    <th className="py-2 px-3 text-right">Akumulasi Suara</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {hourlyTrends.map(h => (
                    <tr key={h.hour} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-semibold text-slate-800">{h.hourLabel} WIB</td>
                      <td className="py-2 px-3 text-red-700 font-medium">+{h.candidate1Votes}</td>
                      <td className="py-2 px-3 text-blue-700 font-medium">+{h.candidate2Votes}</td>
                      <td className="py-2 px-3 text-emerald-700 font-medium">+{h.candidate3Votes}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-900 tabular-nums">
                        {h.cumulativeTotal} Suara
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}

      {/* TAB 3: DEMOGRAPHICS (AGE GROUPS & GENDER) */}
      {activeTab === 'DEMOGRAPHICS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Age Group Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Partisipasi Berdasarkan Kelompok Usia
            </h3>
            <span className="text-xs text-slate-500 block mb-5">
              Distribusi generasi pemilih di RW 14 Pedurungan Tengah
            </span>

            <div className="space-y-4">
              {ageStats.map(stat => (
                <div key={stat.group} className="text-xs">
                  <div className="flex justify-between font-semibold text-slate-700 mb-1">
                    <span>{stat.group}</span>
                    <span className="tabular-nums">
                      {stat.count} Pemilih ({stat.pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stat.pct}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Gender Ratio Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 sm:p-6">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              Rasio Gender Pemilih
            </h3>
            <span className="text-xs text-slate-500 block mb-5">
              Perbandingan partisipasi pemilih Laki-laki vs Perempuan
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="text-sky-700">Laki-laki ({genderLPercent}%)</span>
                <span className="text-pink-700">Perempuan ({genderPPercent}%)</span>
              </div>

              {/* Dual Color Bar */}
              <div className="w-full h-5 rounded-full overflow-hidden flex shadow-inner">
                <div
                  className="bg-sky-600 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ width: `${genderLPercent}%` }}
                >
                  {genderL}
                </div>
                <div
                  className="bg-pink-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-bold"
                  style={{ width: `${genderPPercent}%` }}
                >
                  {genderP}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                Data diperoleh langsung dari tanggal lahir pada NIK e-KTP (Digit ke-7 NIK perempuan ditambah 40 sesuai standar kependudukan Dukcapil).
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
