/**
 * E-Voting RW 14 Kelurahan Pedurungan Tengah
 * Kecamatan Pedurungan, Kota Semarang
 * Sistem Pemilihan Ketua RW 14 Berbasis Token Kriptografi & Verifikasi e-KTP
 */

import React, { useState, useEffect } from 'react';
import { electionStore } from './services/electionStore';
import {
  Candidate,
  VotingToken,
  AuditLogItem,
  WhatsAppNotificationPayload,
  CitizenRecord,
  CastBallot
} from './types/election';

// Components
import { Navbar } from './components/Navbar';
import { HeroBanner } from './components/HeroBanner';
import { DynamicAnalyticsDashboard } from './components/DynamicAnalyticsDashboard';
import { VotingBooth } from './components/VotingBooth';
import { EktpVerificationModal } from './components/EktpVerificationModal';
import { WhatsAppReceiptModal } from './components/WhatsAppReceiptModal';
import { WhatsAppConfigModal } from './components/WhatsAppConfigModal';
import { DptLookupModal } from './components/DptLookupModal';
import { SecurityAuditModal } from './components/SecurityAuditModal';
import { BeritaAcaraModal } from './components/BeritaAcaraModal';
import { CandidateManageModal } from './components/CandidateManageModal';
import { SupabaseConfigModal } from './components/SupabaseConfigModal';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  const [candidates, setCandidates] = useState<Candidate[]>(electionStore.getCandidates());
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(electionStore.getAuditLogs());
  const [ballots, setBallots] = useState<CastBallot[]>(electionStore.getBallots());
  const [totalVotes, setTotalVotes] = useState<number>(electionStore.getTotalVotesCast());
  const [totalDpt, setTotalDpt] = useState<number>(electionStore.getTotalDptCount());

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'voting' | 'verify' | 'dpt' | 'security'>('dashboard');

  // Modals & States
  const [activeToken, setActiveToken] = useState<VotingToken | null>(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState<boolean>(false);
  const [isDptModalOpen, setIsDptModalOpen] = useState<boolean>(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState<boolean>(false);
  const [isBeritaAcaraOpen, setIsBeritaAcaraOpen] = useState<boolean>(false);
  const [isCandidateManageOpen, setIsCandidateManageOpen] = useState<boolean>(false);
  const [isWhatsAppConfigOpen, setIsWhatsAppConfigOpen] = useState<boolean>(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState<boolean>(false);
  const [preSelectedCitizen, setPreSelectedCitizen] = useState<CitizenRecord | null>(null);

  // WhatsApp receipt modal state
  const [whatsAppModalData, setWhatsAppModalData] = useState<{
    receiptHash: string;
    voterName: string;
    voterPhone: string;
    voterRt: string;
    timestamp: string;
    waPayload: WhatsAppNotificationPayload;
    candidateSelected: Candidate;
  } | null>(null);

  // Subscribe to store changes
  useEffect(() => {
    const unsubscribe = electionStore.subscribe(() => {
      setCandidates(electionStore.getCandidates());
      setAuditLogs(electionStore.getAuditLogs());
      setBallots(electionStore.getBallots());
      setTotalVotes(electionStore.getTotalVotesCast());
      setTotalDpt(electionStore.getTotalDptCount());
    });
    return () => unsubscribe();
  }, []);

  // When tab changes to modal-driven tab
  useEffect(() => {
    if (activeTab === 'verify') {
      setIsVerifyModalOpen(true);
    } else if (activeTab === 'dpt') {
      setIsDptModalOpen(true);
    } else if (activeTab === 'security') {
      setIsSecurityModalOpen(true);
    }
  }, [activeTab]);

  // Handle Token Generated from e-KTP Verification
  const handleTokenGenerated = (token: VotingToken) => {
    setActiveToken(token);
    setActiveTab('voting');
  };

  // Handle Vote Successfully Cast
  const handleVoteCastSuccess = (result: {
    receiptHash: string;
    voterName: string;
    voterPhone: string;
    voterRt: string;
    timestamp: string;
    waPayload: WhatsAppNotificationPayload;
    candidateSelected: Candidate;
  }) => {
    setActiveToken(null);
    setWhatsAppModalData(result);
  };

  // Handle Verify Receipt from WhatsApp Modal
  const handleVerifyReceiptInAudit = (hash: string) => {
    setIsSecurityModalOpen(true);
  };

  // Direct voter verification from DPT modal
  const handleVerifyCitizenFromDpt = (citizen: CitizenRecord) => {
    setPreSelectedCitizen(citizen);
    setIsDptModalOpen(false);
    setIsVerifyModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Navigation Top Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenQuickVote={() => {
          if (activeToken) {
            setActiveTab('voting');
          } else {
            setIsVerifyModalOpen(true);
          }
        }}
        onOpenWhatsAppConfig={() => setIsWhatsAppConfigOpen(true)}
        onOpenManageCandidates={() => setIsCandidateManageOpen(true)}
        onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
        hasActiveToken={!!activeToken}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 md:py-8 pb-24 lg:pb-12">
        
        {/* Hero Section */}
        <HeroBanner
          onVerifyClick={() => {
            setPreSelectedCitizen(null);
            setIsVerifyModalOpen(true);
          }}
          onVoteClick={() => setActiveTab('voting')}
          onDptClick={() => setIsDptModalOpen(true)}
          onOpenWhatsAppConfig={() => setIsWhatsAppConfigOpen(true)}
          onOpenManageCandidates={() => setIsCandidateManageOpen(true)}
          onOpenSupabaseConfig={() => setIsSupabaseModalOpen(true)}
          totalVotes={totalVotes}
          totalDpt={totalDpt}
        />

        {/* View Switcher based on Active Tab */}
        {activeTab === 'dashboard' && (
          <DynamicAnalyticsDashboard
            candidates={candidates}
            ballots={ballots}
            totalVotes={totalVotes}
            totalDpt={totalDpt}
            onOpenVoting={() => setActiveTab('voting')}
            onOpenBeritaAcara={() => setIsBeritaAcaraOpen(true)}
            onOpenManageCandidates={() => setIsCandidateManageOpen(true)}
          />
        )}

        {activeTab === 'voting' && (
          <VotingBooth
            candidates={candidates}
            activeToken={activeToken}
            onVoteCastSuccess={handleVoteCastSuccess}
            onOpenVerification={() => {
              setPreSelectedCitizen(null);
              setIsVerifyModalOpen(true);
            }}
            onOpenManageCandidates={() => setIsCandidateManageOpen(true)}
          />
        )}

        {/* Floating Quick Action indicator for active token */}
        {activeToken && activeTab !== 'voting' && (
          <div className="fixed bottom-20 lg:bottom-6 right-4 z-30 max-w-sm bg-slate-900 text-white p-3.5 rounded-xl shadow-xl border border-slate-700 flex items-center justify-between gap-3 animate-bounce">
            <div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider block">
                Token e-KTP Aktif
              </span>
              <span className="text-xs font-mono font-bold text-amber-300">
                {activeToken.tokenCode}
              </span>
            </div>
            <button
              onClick={() => setActiveTab('voting')}
              className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg cursor-pointer whitespace-nowrap"
            >
              Masuk Bilik Suara &gt;
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 px-4 sm:px-6 lg:px-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="font-bold text-slate-800 block text-sm">
              Panitia Pemilihan Ketua RW 14 Kelurahan Pedurungan Tengah
            </span>
            <span>
              Sekretariat: Balai Warga RW 14, Jl. Taman Pedurungan Tengah, Kec. Pedurungan, Kota Semarang 50192
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <button
              onClick={() => setIsWhatsAppConfigOpen(true)}
              className="text-emerald-700 font-semibold hover:underline cursor-pointer"
            >
              WhatsApp Business API
            </button>
            <span>·</span>
            <button
              onClick={() => setIsSecurityModalOpen(true)}
              className="hover:text-slate-900 hover:underline cursor-pointer"
            >
              Inspeksi Kriptografi
            </button>
            <span>·</span>
            <button
              onClick={() => setIsBeritaAcaraOpen(true)}
              className="hover:text-slate-900 hover:underline cursor-pointer"
            >
              Berita Acara Pleno
            </button>
            <span>·</span>
            <button
              onClick={() => {
                if (confirm('Reset seluruh data contoh pemilihan ke status bersih?')) {
                  electionStore.resetToFreshState();
                  setActiveToken(null);
                }
              }}
              className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
            >
              Reset Data Contoh
            </button>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        setActiveTab={tab => {
          setActiveTab(tab);
          if (tab === 'verify') setIsVerifyModalOpen(true);
          else if (tab === 'dpt') setIsDptModalOpen(true);
          else if (tab === 'security') setIsSecurityModalOpen(true);
        }}
        hasActiveToken={!!activeToken}
      />

      {/* MODALS */}
      <EktpVerificationModal
        isOpen={isVerifyModalOpen}
        onClose={() => {
          setIsVerifyModalOpen(false);
          setPreSelectedCitizen(null);
          if (activeTab === 'verify') setActiveTab('dashboard');
        }}
        onTokenGenerated={handleTokenGenerated}
        preSelectedCitizen={preSelectedCitizen}
      />

      <WhatsAppReceiptModal
        isOpen={!!whatsAppModalData}
        onClose={() => setWhatsAppModalData(null)}
        data={whatsAppModalData}
        onVerifyReceiptInAudit={handleVerifyReceiptInAudit}
      />

      <WhatsAppConfigModal
        isOpen={isWhatsAppConfigOpen}
        onClose={() => setIsWhatsAppConfigOpen(false)}
      />

      <DptLookupModal
        isOpen={isDptModalOpen}
        onClose={() => {
          setIsDptModalOpen(false);
          if (activeTab === 'dpt') setActiveTab('dashboard');
        }}
        onVerifyCitizen={handleVerifyCitizenFromDpt}
      />

      <SecurityAuditModal
        isOpen={isSecurityModalOpen}
        onClose={() => {
          setIsSecurityModalOpen(false);
          if (activeTab === 'security') setActiveTab('dashboard');
        }}
        auditLogs={auditLogs}
      />

      <BeritaAcaraModal
        isOpen={isBeritaAcaraOpen}
        onClose={() => setIsBeritaAcaraOpen(false)}
        candidates={candidates}
        totalVotes={totalVotes}
        totalDpt={totalDpt}
      />

      <CandidateManageModal
        isOpen={isCandidateManageOpen}
        onClose={() => setIsCandidateManageOpen(false)}
        candidates={candidates}
      />

      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onSyncComplete={() => {
          setCandidates(electionStore.getCandidates());
          setAuditLogs(electionStore.getAuditLogs());
          setBallots(electionStore.getBallots());
          setTotalVotes(electionStore.getTotalVotesCast());
          setTotalDpt(electionStore.getTotalDptCount());
        }}
      />

    </div>
  );
}
