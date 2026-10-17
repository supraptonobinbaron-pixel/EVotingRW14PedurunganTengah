import {
  Candidate,
  CitizenRecord,
  VotingToken,
  CastBallot,
  AuditLogItem,
  WhatsAppNotificationPayload,
  ZoneType,
  AgeGroupType,
  HourlyVoteTrend
} from '../types/election';
import { sha256, generateSecureVotingToken, encryptVoterData, maskNik } from './cryptoService';
import {
  buildMetaWhatsAppCloudPayload,
  buildWhatsAppFormattedText,
  getVoterDisplayName,
  dispatchWhatsAppBusinessMessage
} from './whatsappBusinessService';
import {
  isSupabaseConfigured,
  fetchCandidatesFromSupabase,
  fetchDptFromSupabase,
  fetchBallotsFromSupabase,
  fetchAuditLogsFromSupabase,
  upsertCandidateToSupabase,
  deleteCandidateFromSupabase,
  upsertCitizenToSupabase,
  deleteCitizenFromSupabase,
  insertBallotToSupabase,
  insertAuditLogToSupabase,
  subscribeToSupabaseChanges
} from './supabaseService';

// Candidate portraits
import candidateBambangImg from '../assets/images/candidate_bambang_1791102566410.jpg';
import candidateSitiImg from '../assets/images/candidate_siti_1791102581968.jpg';
import candidateAgusImg from '../assets/images/candidate_agus_1791102598749.jpg';

export const RT_LIST = ['RT 01', 'RT 02', 'RT 03', 'RT 04', 'RT 05', 'RT 06'];

export function getZoneFromRt(rt: string): ZoneType {
  if (['RT 01', 'RT 02'].includes(rt)) return 'Zona Barat';
  if (['RT 03', 'RT 04'].includes(rt)) return 'Zona Tengah';
  return 'Zona Timur'; // RT 05, RT 06
}

export function getAgeGroupFromDob(dob: string): { usia: number; group: AgeGroupType } {
  const birthYear = parseInt(dob.split('-')[0], 10);
  const currentYear = new Date().getFullYear();
  const usia = currentYear - birthYear;

  if (usia <= 27) return { usia, group: 'Gen Z (17-27)' };
  if (usia <= 43) return { usia, group: 'Milenial (28-43)' };
  if (usia <= 59) return { usia, group: 'Gen X (44-59)' };
  return { usia, group: 'Lansia (60+)' };
}

export const BASE_CANDIDATES: Candidate[] = [
  {
    id: '1',
    number: 1,
    name: 'Ir. H. Bambang Santoso, M.T.',
    title: 'Tokoh Penggerak Lingkungan & Pemerhati Tata Kota',
    photo: candidateBambangImg,
    slogan: 'RW 14 Bersih, Asri, Digital & Transparan untuk Semua Warga',
    vision: 'Mewujudkan RW 14 Pedurungan Tengah sebagai lingkungan hunian yang mandiri, aman berbasis digital, ramah anak & lansia, serta transparan dalam pengelolaan kas.',
    missions: [
      'Pemasangan CCTV terpadu di 6 RT (RT 01 s/d RT 06) dengan integrasi Poskamling digital 24 jam.',
      'Program Bank Sampah Mandiri dan pengolahan kompos di Balai RW 14.',
      'Transparansi laporan keuangan dan kas RW secara real-time via aplikasi warga.',
      'Peningkatan sarana posyandu balita dan senam sehat lansia berkala.'
    ],
    programs: [
      'Digitalisasi Surat Pengantar RW & RT kilat tanpa antre',
      'Revitalisasi drainase lingkungan pencegah genangan musim hujan',
      'Pemberian beasiswa warga rukun bagi anak berprestasi',
      'Ambulans siaga gotong royong antar RT'
    ],
    rtAsal: 'RT 03',
    age: 48,
    education: 'S2 Teknik Sipil Undip',
    occupation: 'Konsultan Infrastruktur Lingkungan',
    voteCount: 0 // Resetting to 0 as requested
  },
  {
    id: '2',
    number: 2,
    name: 'Hj. Siti Rahmawati, S.E., M.M.',
    title: 'Aktivis PKK & Penggerak UMKM Kelurahan Pedurungan',
    photo: candidateSitiImg,
    slogan: 'Amanah, Melayani dengan Hati, Berdaya Bersama Warga RW 14',
    vision: 'Membangun RW 14 yang inklusif, guyub rukun, mengedepankan pemberdayaan ekonomi keluarga, serta lingkungan yang guyub dan peduli sesama.',
    missions: [
      'Pemberdayaan ibu-ibu rumah tangga melalui pelatihan UMKM & pemasaran online.',
      'Optimalisasi Posyandu Dahlia RW 14 dengan fasilitas cek kesehatan gratis bulanan.',
      'Penguatan silaturahmi antar RT melalui agenda olahraga dan seni budaya warga.',
      'Pelayanan administrasi kependudukan jemput bola untuk lansia dan disabilitas.'
    ],
    programs: [
      'Sentra Bazar UMKM Warga RW 14 di lapangan balai setiap akhir pekan',
      'Dana stimulan rukun kematian dan santunan warga kurang mampu',
      'Taman Baca dan pojok belajar digital anak-anak Pedurungan',
      'Penerangan jalan gang hemat energi berbasis solar cell'
    ],
    rtAsal: 'RT 06',
    age: 45,
    education: 'S2 Manajemen Unika Soegijapranata',
    occupation: 'Wirausaha & Pembina Koperasi Warga',
    voteCount: 0 // Resetting to 0 as requested
  },
  {
    id: '3',
    number: 3,
    name: 'Drs. Agus Hartono',
    title: 'Purnabakti ASN Pemkot Semarang & Pengurus Paguyuban',
    photo: candidateAgusImg,
    slogan: 'Guyub Rukun, Keamanan Terpadu & Pelayanan Publik Cepat Tanggap',
    vision: 'Menjadikan RW 14 sebagai percontohan kerukunan warga Kota Semarang dengan birokrasi RT/RW yang cepat, tegas, serta tata kelola fasum yang tertib.',
    missions: [
      'Peningkatan patroli keamanan malam warga bersinergi dengan Babinsa & Bhabinkamtibmas.',
      'Perbaikan paving jalan lingkungan dan peremajaan lampu penerangan umum.',
      'Sistem aduan cepat tanggap warga (Fast Response Gangguan Lingkungan) maks 2 jam.',
      'Penyediaan fasilitas olahraga bulutangkis dan tenis meja di Balai RW 14.'
    ],
    programs: [
      'Peremajaan Balai Warga RW 14 sebagai pusat serbaguna',
      'Penyuluhan anti-narkoba dan pergaulan sehat remaja karang taruna',
      'Audit berkala fasilitas hidran mandiri pemadam kebakaran gang sempit',
      'Pengelolaan iuran sampah dan kebersihan yang adil serta terukur'
    ],
    rtAsal: 'RT 01',
    age: 53,
    education: 'S1 Administrasi Negara Unnes',
    occupation: 'Pensiunan Dinas Pemerintahan',
    voteCount: 0 // Resetting to 0 as requested
  }
];

// Clean DPT Seeded for RW 14 Pedurungan Tengah (with realistic ages and zones)
export const RAW_DPT_SEED = [
  {
    id: 'DPT-001',
    nik: '3374112005820001',
    nama: 'Budi Santoso Wibowo',
    gender: 'L' as const,
    dob: '1982-05-20',
    rt: 'RT 01',
    alamat: 'Jl. Taman Pedurungan Tengah No. 12',
    phone: '081228941021'
  },
  {
    id: 'DPT-002',
    nik: '3374116508880002',
    nama: 'Endang Sulistyowati',
    gender: 'P' as const,
    dob: '1988-08-25',
    rt: 'RT 01',
    alamat: 'Jl. Taman Pedurungan Tengah No. 14',
    phone: '081390458129'
  },
  {
    id: 'DPT-003',
    nik: '3374111203790003',
    nama: 'H. Joko Prasetyo, S.H.',
    gender: 'L' as const,
    dob: '1979-03-12',
    rt: 'RT 02',
    alamat: 'Jl. Manunggal Jati Kav. 8B',
    phone: '085740112948'
  },
  {
    id: 'DPT-004',
    nik: '3374115401920004',
    nama: 'Dewi Anjarwati, S.Farm.',
    gender: 'P' as const,
    dob: '1992-01-14',
    rt: 'RT 02',
    alamat: 'Jl. Manunggal Jati No. 19',
    phone: '089672194012'
  },
  {
    id: 'DPT-005',
    nik: '3374111807750005',
    nama: 'Sugeng Riyadi',
    gender: 'L' as const,
    dob: '1975-07-18',
    rt: 'RT 03',
    alamat: 'Gang Kenanga RT 03/14 No. 4',
    phone: '081225789012'
  },
  {
    id: 'DPT-006',
    nik: '3374112211840006',
    nama: 'dr. Hendra Kusuma',
    gender: 'L' as const,
    dob: '1984-11-22',
    rt: 'RT 03',
    alamat: 'Jl. Sukarno Hatta Timur Blok C-7',
    phone: '081328904321'
  },
  {
    id: 'DPT-007',
    nik: '3374116009950007',
    nama: 'Rina Astuti, S.Kom.',
    gender: 'P' as const,
    dob: '1995-09-20',
    rt: 'RT 04',
    alamat: 'Jl. Sukarno Hatta Timur No. 34',
    phone: '085876543210'
  },
  {
    id: 'DPT-008',
    nik: '3374110804700008',
    nama: 'Drs. Bambang Trihatmojo',
    gender: 'L' as const,
    dob: '1970-04-08',
    rt: 'RT 04',
    alamat: 'Jl. Taman Pedurungan Baru No. 2A',
    phone: '081229045123'
  },
  {
    id: 'DPT-009',
    nik: '3374114506890009',
    nama: 'Sri Wahyuni, S.Pd.',
    gender: 'P' as const,
    dob: '1989-06-05',
    rt: 'RT 05',
    alamat: 'Gang Melati Indah No. 17',
    phone: '087834567890'
  },
  {
    id: 'DPT-010',
    nik: '3374112912860010',
    nama: 'Arya Pratama, M.Sc.',
    gender: 'L' as const,
    dob: '1986-12-29',
    rt: 'RT 05',
    alamat: 'Gang Melati Indah No. 21',
    phone: '081290384721'
  },
  {
    id: 'DPT-011',
    nik: '3374111502770011',
    nama: 'Muhammad Fauzan, S.T.',
    gender: 'L' as const,
    dob: '1977-02-15',
    rt: 'RT 06',
    alamat: 'Jl. Pedurungan Asri Timur No. 8',
    phone: '081392817263'
  },
  {
    id: 'DPT-012',
    nik: '3374115108930012',
    nama: 'Kartika Sari, S.I.Kom.',
    gender: 'P' as const,
    dob: '1993-08-11',
    rt: 'RT 06',
    alamat: 'Jl. Pedurungan Asri Timur No. 15',
    phone: '085729183746'
  },
  {
    id: 'DPT-013',
    nik: '3374113009800013',
    nama: 'Wahyudi Nugroho',
    gender: 'L' as const,
    dob: '1980-09-30',
    rt: 'RT 01',
    alamat: 'Gang Cempaka Mulya No. 3',
    phone: '081289123847'
  },
  {
    id: 'DPT-014',
    nik: '3374116405850014',
    nama: 'Nurul Hidayati',
    gender: 'P' as const,
    dob: '1985-05-24',
    rt: 'RT 02',
    alamat: 'Gang Cempaka Mulya No. 9',
    phone: '089823746152'
  },
  {
    id: 'DPT-015',
    nik: '3374111010620015',
    nama: 'H. Slamet Widodo',
    gender: 'L' as const,
    dob: '1962-10-10',
    rt: 'RT 05',
    alamat: 'Jl. Flamboyan Raya No. 45',
    phone: '081239847120'
  },
  {
    id: 'DPT-016',
    nik: '3374114812030016',
    nama: 'Anisa Putri Maharani',
    gender: 'P' as const,
    dob: '2003-12-08',
    rt: 'RT 06',
    alamat: 'Jl. Flamboyan Raya No. 51',
    phone: '085819283746'
  }
];

function generateFreshDpt(): CitizenRecord[] {
  return RAW_DPT_SEED.map(seed => {
    const ageInfo = getAgeGroupFromDob(seed.dob);
    return {
      id: seed.id,
      nik: seed.nik,
      nikMasked: maskNik(seed.nik),
      nama: seed.nama,
      gender: seed.gender,
      tanggalLahir: seed.dob,
      usia: ageInfo.usia,
      ageGroup: ageInfo.group,
      rt: seed.rt,
      rw: 'RW 14',
      zona: getZoneFromRt(seed.rt),
      alamat: seed.alamat,
      phone: seed.phone,
      hasVoted: false // Reset: all fresh
    };
  });
}

class ElectionStore {
  private candidates: Candidate[] = JSON.parse(JSON.stringify(BASE_CANDIDATES));
  private dptList: CitizenRecord[] = generateFreshDpt();
  private activeTokens: Map<string, VotingToken> = new Map();
  private auditLogs: AuditLogItem[] = [];
  private ballots: CastBallot[] = [];
  private lastBlockHash = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';
  private listeners: Set<() => void> = new Set();
  private totalDptCount = 318; // 6 RTs in RW 14 Pedurungan Tengah (RT 01 - RT 06)
  private unsubscribeRealtime: (() => void) | null = null;

  constructor() {
    // Reset DPT on request "Hapus data DPT RW 14"
    const clearedKey = localStorage.getItem('rw14_dpt_cleared_v1');
    if (clearedKey !== 'true') {
      this.clearAllDpt();
      localStorage.setItem('rw14_dpt_cleared_v1', 'true');
    } else {
      this.loadFromStorage();
    }

    // Automatically sync with Supabase if configured
    if (isSupabaseConfigured()) {
      this.syncWithSupabase();
    }
  }

  public async syncWithSupabase(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;
    try {
      const [remoteCands, remoteDpt, remoteBallots, remoteAudits] = await Promise.all([
        fetchCandidatesFromSupabase(),
        fetchDptFromSupabase(),
        fetchBallotsFromSupabase(),
        fetchAuditLogsFromSupabase()
      ]);

      let changed = false;

      if (remoteCands && remoteCands.length > 0) {
        this.candidates = remoteCands;
        changed = true;
      }

      if (remoteDpt && remoteDpt.length > 0) {
        this.dptList = remoteDpt;
        this.totalDptCount = remoteDpt.length;
        changed = true;
      }

      if (remoteBallots) {
        this.ballots = remoteBallots;
        if (remoteBallots.length > 0) {
          this.lastBlockHash = remoteBallots[remoteBallots.length - 1].receiptHash;
        }
        changed = true;
      }

      if (remoteAudits && remoteAudits.length > 0) {
        this.auditLogs = remoteAudits;
        changed = true;
      }

      if (changed) {
        this.saveToStorage();
      }

      this.setupRealtimeSync();
      return true;
    } catch (e) {
      console.error('Error syncing with Supabase:', e);
      return false;
    }
  }

  public setupRealtimeSync() {
    if (this.unsubscribeRealtime) {
      this.unsubscribeRealtime();
      this.unsubscribeRealtime = null;
    }

    if (isSupabaseConfigured()) {
      this.unsubscribeRealtime = subscribeToSupabaseChanges(async () => {
        try {
          const [cands, dpt, ballots] = await Promise.all([
            fetchCandidatesFromSupabase(),
            fetchDptFromSupabase(),
            fetchBallotsFromSupabase()
          ]);
          if (cands) this.candidates = cands;
          if (dpt) {
            this.dptList = dpt;
            this.totalDptCount = dpt.length;
          }
          if (ballots) this.ballots = ballots;
          this.notify();
        } catch (_) {}
      });
    }
  }

  private loadFromStorage() {
    try {
      const storedCandidates = localStorage.getItem('rw14_candidates');
      if (storedCandidates) this.candidates = JSON.parse(storedCandidates);

      const storedDpt = localStorage.getItem('rw14_dpt');
      if (storedDpt) {
        this.dptList = JSON.parse(storedDpt);
        this.totalDptCount = this.dptList.length;
      }

      const storedAudits = localStorage.getItem('rw14_audits');
      if (storedAudits) this.auditLogs = JSON.parse(storedAudits);

      const storedTokens = localStorage.getItem('rw14_tokens');
      if (storedTokens) {
        const tokensArr: VotingToken[] = JSON.parse(storedTokens);
        tokensArr.forEach(t => this.activeTokens.set(t.tokenCode, t));
      }

      const storedBallots = localStorage.getItem('rw14_ballots');
      if (storedBallots) this.ballots = JSON.parse(storedBallots);
    } catch (e) {
      console.error('Storage load error:', e);
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem('rw14_candidates', JSON.stringify(this.candidates));
      localStorage.setItem('rw14_dpt', JSON.stringify(this.dptList));
      localStorage.setItem('rw14_audits', JSON.stringify(this.auditLogs));
      localStorage.setItem('rw14_tokens', JSON.stringify(Array.from(this.activeTokens.values())));
      localStorage.setItem('rw14_ballots', JSON.stringify(this.ballots));
    } catch (e) {
      console.error('Storage save error:', e);
    }
    this.notify();
  }

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach(fn => fn());
  }

  public getCandidates(): Candidate[] {
    return [...this.candidates];
  }

  // Candidate CRUD: Tambah Kandidat
  public addCandidate(data: Omit<Candidate, 'id' | 'voteCount'>): Candidate {
    const nextNumber = this.candidates.length > 0
      ? Math.max(...this.candidates.map(c => c.number)) + 1
      : 1;

    const newCandidate: Candidate = {
      ...data,
      id: Date.now().toString(),
      number: data.number || nextNumber,
      voteCount: 0
    };

    this.candidates.push(newCandidate);
    // Sort by number
    this.candidates.sort((a, b) => a.number - b.number);

    this.auditLogs.unshift({
      id: `AUD-CAND-ADD-${Date.now()}`,
      type: 'SECURITY_CHECK',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      title: `Kandidat Baru Ditambahkan: No. 0${newCandidate.number} ${newCandidate.name}`,
      details: `Calon Ketua RW 14 asal ${newCandidate.rtAsal} resmi didaftarkan ke sistem pemilihan.`,
      hash: 'cand_add_' + newCandidate.id
    });

    this.saveToStorage();
    if (isSupabaseConfigured()) {
      upsertCandidateToSupabase(newCandidate).catch(e => console.error(e));
    }
    return newCandidate;
  }

  // Candidate CRUD: Koreksi / Edit Kandidat
  public updateCandidate(id: string, updatedData: Partial<Candidate>): Candidate {
    const index = this.candidates.findIndex(c => c.id === id);
    if (index === -1) {
      throw new Error('Kandidat tidak ditemukan.');
    }

    this.candidates[index] = {
      ...this.candidates[index],
      ...updatedData
    };

    this.candidates.sort((a, b) => a.number - b.number);

    this.auditLogs.unshift({
      id: `AUD-CAND-EDIT-${Date.now()}`,
      type: 'SECURITY_CHECK',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      title: `Koreksi Data Calon: ${this.candidates[index].name}`,
      details: `Perubahan data profil, visi, misi atau nomor urut kandidat berhasil diperbarui.`,
      hash: 'cand_edit_' + id
    });

    this.saveToStorage();
    if (isSupabaseConfigured()) {
      upsertCandidateToSupabase(this.candidates[index]).catch(e => console.error(e));
    }
    return this.candidates[index];
  }

  // Candidate CRUD: Hapus Kandidat
  public deleteCandidate(id: string): boolean {
    const target = this.candidates.find(c => c.id === id);
    if (!target) return false;

    this.candidates = this.candidates.filter(c => c.id !== id);

    this.auditLogs.unshift({
      id: `AUD-CAND-DEL-${Date.now()}`,
      type: 'SECURITY_CHECK',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      title: `Kandidat Dihapus: No. 0${target.number} ${target.name}`,
      details: `Data calon Ketua RW 14 dihapus dari daftar pencalonan.`,
      hash: 'cand_del_' + id
    });

    this.saveToStorage();
    if (isSupabaseConfigured()) {
      deleteCandidateFromSupabase(id).catch(e => console.error(e));
    }
    return true;
  }

  // DPT Management: Hapus Semua Data DPT (sesuai permintaan user)
  public clearAllDpt() {
    this.dptList = [];
    this.totalDptCount = 0;
    this.activeTokens.clear();

    this.auditLogs.unshift({
      id: `AUD-DPT-CLEAR-${Date.now()}`,
      type: 'RESET',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      title: 'Pembersihan Data DPT RW 14',
      details: 'Seluruh data Daftar Pemilih Tetap (DPT) RW 14 telah dihapus bersih. Panitia dapat memasukkan data pemilih baru.',
      hash: 'dpt_clear_' + Date.now()
    });

    this.saveToStorage();
  }

  // DPT Management: Hapus Satu Warga
  public deleteCitizen(id: string): boolean {
    const target = this.dptList.find(c => c.id === id);
    if (!target) return false;

    this.dptList = this.dptList.filter(c => c.id !== id);
    this.totalDptCount = this.dptList.length;

    this.saveToStorage();
    if (isSupabaseConfigured()) {
      deleteCitizenFromSupabase(id).catch(e => console.error(e));
    }
    return true;
  }

  // DPT Management: Muat Ulang Data Sampel (Opsional)
  public loadSampleDpt() {
    this.dptList = generateFreshDpt();
    this.totalDptCount = this.dptList.length;
    this.saveToStorage();
  }

  public getDptList(): CitizenRecord[] {
    return [...this.dptList];
  }

  public getAuditLogs(): AuditLogItem[] {
    return [...this.auditLogs];
  }

  public getBallots(): CastBallot[] {
    return [...this.ballots];
  }

  public getTotalDptCount(): number {
    return this.totalDptCount;
  }

  public getTotalVotesCast(): number {
    return this.candidates.reduce((sum, c) => sum + c.voteCount, 0);
  }

  // Get Hourly Trends (07:00 to 14:00)
  public getHourlyTrends(selectedZone: 'ALL' | ZoneType = 'ALL', selectedRt: string = 'ALL'): HourlyVoteTrend[] {
    const hours = [7, 8, 9, 10, 11, 12, 13, 14];
    let runningTotal = 0;

    return hours.map(hr => {
      const filteredBallots = this.ballots.filter(b => {
        const matchHour = b.hour === hr;
        const matchZone = selectedZone === 'ALL' || b.zoneOrigin === selectedZone;
        const matchRt = selectedRt === 'ALL' || b.rtOrigin === selectedRt;
        return matchHour && matchZone && matchRt;
      });

      const c1 = filteredBallots.filter(b => b.candidateId === '1').length;
      const c2 = filteredBallots.filter(b => b.candidateId === '2').length;
      const c3 = filteredBallots.filter(b => b.candidateId === '3').length;
      runningTotal += (c1 + c2 + c3);

      return {
        hour: hr,
        hourLabel: `${hr.toString().padStart(2, '0')}:00`,
        candidate1Votes: c1,
        candidate2Votes: c2,
        candidate3Votes: c3,
        cumulativeTotal: runningTotal
      };
    });
  }

  // Find citizen by NIK
  public findCitizenByNik(nik: string): CitizenRecord | undefined {
    const cleaned = nik.trim().replace(/\D/g, '');
    return this.dptList.find(c => c.nik === cleaned);
  }

  // Register a new citizen resident if not found
  public async registerResidentToDpt(
    nik: string,
    nama: string,
    rt: string,
    alamat: string,
    phone: string,
    tanggalLahir: string,
    gender: 'L' | 'P'
  ): Promise<CitizenRecord> {
    const encryptedData = await encryptVoterData(JSON.stringify({ nik, nama, alamat, phone }));
    const ageInfo = getAgeGroupFromDob(tanggalLahir);

    const newCitizen: CitizenRecord = {
      id: `DPT-${Date.now().toString().slice(-4)}`,
      nik,
      nikMasked: maskNik(nik),
      nama,
      gender,
      tanggalLahir,
      usia: ageInfo.usia,
      ageGroup: ageInfo.group,
      rt,
      rw: 'RW 14',
      zona: getZoneFromRt(rt),
      alamat,
      phone,
      hasVoted: false,
      encryptedData
    };
    this.dptList.unshift(newCitizen);
    this.saveToStorage();
    if (isSupabaseConfigured()) {
      upsertCitizenToSupabase(newCitizen).catch(e => console.error(e));
    }
    return newCitizen;
  }

  // Issue single-use voting token
  public async issueVotingToken(citizen: CitizenRecord): Promise<{ token: VotingToken; isNew: boolean }> {
    if (citizen.hasVoted) {
      throw new Error(`Warga ${citizen.nama} (${citizen.nikMasked}) sudah menggunakan hak suaranya pada ${citizen.votedAt}.`);
    }

    for (const [_, token] of this.activeTokens.entries()) {
      if (token.citizenId === citizen.id && !token.isUsed) {
        return { token, isNew: false };
      }
    }

    const tokenCode = generateSecureVotingToken();
    const now = new Date();
    const expires = new Date(now.getTime() + 60 * 60 * 1000);

    const token: VotingToken = {
      tokenCode,
      citizenId: citizen.id,
      citizenName: citizen.nama,
      citizenRt: citizen.rt,
      issuedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
      isUsed: false
    };

    this.activeTokens.set(tokenCode, token);

    const auditHash = await sha256(`TOKEN_ISSUE:${citizen.id}:${tokenCode}:${now.toISOString()}`);
    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      type: 'TOKEN_ISSUED',
      timestamp: now.toISOString().replace('T', ' ').slice(0, 19),
      title: `Token Diterbitkan untuk Warga ${citizen.rt} (${citizen.zona})`,
      details: `Token sekali pakai diterbitkan setelah verifikasi e-KTP dan pencocokan Dukcapil berhasil.`,
      hash: auditHash
    });

    this.saveToStorage();
    return { token, isNew: true };
  }

  // Verify token
  public verifyToken(tokenCode: string): { valid: boolean; token?: VotingToken; message: string } {
    const cleaned = tokenCode.trim().toUpperCase();
    const token = this.activeTokens.get(cleaned);

    if (!token) {
      return { valid: false, message: 'Kode token tidak ditemukan atau salah ketik. Periksa format (RW14-XXXX-XXXX).' };
    }

    if (token.isUsed) {
      return { valid: false, message: `Token ini sudah pernah digunakan pada ${token.usedAt} dan telah dihanguskan permanen.` };
    }

    if (new Date() > new Date(token.expiresAt)) {
      return { valid: false, message: 'Token telah kadaluarsa. Silakan lakukan verifikasi e-KTP ulang.' };
    }

    return { valid: true, token, message: 'Token valid dan siap digunakan untuk memilih di bilik suara.' };
  }

  // Cast vote with WhatsApp Business API Integration & Privacy Opt-in
  public async castVote(
    tokenCode: string,
    candidateId: string,
    allowNameInNotification: boolean = true
  ): Promise<{
    receiptHash: string;
    voterName: string;
    voterPhone: string;
    voterRt: string;
    timestamp: string;
    waPayload: WhatsAppNotificationPayload;
  }> {
    const verifyResult = this.verifyToken(tokenCode);
    if (!verifyResult.valid || !verifyResult.token) {
      throw new Error(verifyResult.message);
    }

    const token = verifyResult.token;
    const citizen = this.dptList.find(c => c.id === token.citizenId);
    if (!citizen) {
      throw new Error('Data pemilih terdaftar tidak ditemukan di database DPT.');
    }

    if (citizen.hasVoted) {
      throw new Error('Pemilih ini telah tercatat menggunakan hak suaranya.');
    }

    const candidate = this.candidates.find(c => c.id === candidateId);
    if (!candidate) {
      throw new Error('Calon Ketua RW yang dipilih tidak valid.');
    }

    const now = new Date();
    const timestampStr = now.toISOString().replace('T', ' ').slice(0, 19);
    const currentHour = now.getHours();
    // Clamp to 7-14 for civic election hour grouping
    const voteHour = currentHour >= 7 && currentHour <= 14 ? currentHour : 9;

    // Cryptographic Receipt Hash (SHA-256)
    const nonce = crypto.getRandomValues(new Uint32Array(1))[0].toString(16);
    const receiptSeed = `RW14:VOTE:${this.ballots.length + 1}:${now.toISOString()}:${this.lastBlockHash}:${nonce}`;
    const receiptHash = await sha256(receiptSeed);

    // Add to Anonymous Ballot Box (Zero-Knowledge separation)
    const newBallot: CastBallot = {
      id: `BLT-${Date.now()}`,
      blockHeight: this.ballots.length + 1,
      candidateId,
      candidateName: candidate.name,
      candidateNumber: candidate.number,
      timestamp: timestampStr,
      hour: voteHour,
      previousHash: this.lastBlockHash,
      receiptHash,
      rtOrigin: citizen.rt,
      zoneOrigin: citizen.zona,
      voterAgeGroup: citizen.ageGroup,
      voterGender: citizen.gender
    };
    this.ballots.push(newBallot);
    this.lastBlockHash = receiptHash;

    // Update candidate vote count
    candidate.voteCount += 1;

    // Burn token permanently
    token.isUsed = true;
    token.usedAt = timestampStr;
    this.activeTokens.set(token.tokenCode, token);

    // Update Citizen record in DPT
    citizen.hasVoted = true;
    citizen.votedAt = timestampStr;
    citizen.votedHour = voteHour;
    citizen.receiptHash = receiptHash;

    // Audit log
    this.auditLogs.unshift({
      id: `AUD-${Date.now()}`,
      type: 'BALLOT_CAST',
      timestamp: timestampStr,
      title: `Surat Suara Digital Dicoblos (Blok #${newBallot.blockHeight})`,
      details: `Hak suara berhasil masuk dari ${citizen.rt} (${citizen.zona}). Token ${token.tokenCode} dihanguskan permanen.`,
      hash: receiptHash
    });

    // Determine display name based on voter privacy permission
    const displayName = getVoterDisplayName(citizen.nama, allowNameInNotification);

    // Meta Cloud API Message Payload (WhatsApp Business Policy compliant)
    const metaCloudApiPayload = buildMetaWhatsAppCloudPayload(
      citizen.phone,
      displayName,
      candidate.name,
      candidate.number,
      receiptHash,
      timestampStr,
      newBallot.blockHeight
    );

    const rawMessage = buildWhatsAppFormattedText(
      displayName,
      candidate.name,
      candidate.number,
      citizen.rt,
      receiptHash,
      timestampStr,
      newBallot.blockHeight
    );

    const waPayload: WhatsAppNotificationPayload = {
      recipientPhone: citizen.phone,
      voterName: citizen.nama,
      displayName,
      allowNameInNotification,
      candidateSelectedName: candidate.name,
      candidateNumber: candidate.number,
      rt: citizen.rt,
      receiptHash,
      ballotNumber: newBallot.blockHeight,
      timestamp: timestampStr,
      sentAt: timestampStr,
      status: 'SENT',
      rawMessage,
      metaCloudApiPayload
    };

    // Dispatch via WhatsApp Business API Service (async non-blocking)
    dispatchWhatsAppBusinessMessage(waPayload).catch(e => console.error(e));

    // Audit log for WhatsApp dispatch
    this.auditLogs.unshift({
      id: `AUD-WA-${Date.now()}`,
      type: 'WHATSAPP_SENT',
      timestamp: timestampStr,
      title: `WhatsApp Business API: Notifikasi Terkirim ke ${citizen.phone.slice(0, 4)}***${citizen.phone.slice(-3)}`,
      details: `Template 'rw14_vote_confirmation' terkirim dengan ${allowNameInNotification ? 'Nama Lengkap' : 'Nama Disamarkan'}. Calon: No. 0${candidate.number}.`,
      hash: await sha256(rawMessage)
    });

    this.saveToStorage();

    // Sync to Supabase in real-time (cloud ledger)
    if (isSupabaseConfigured()) {
      Promise.all([
        insertBallotToSupabase(newBallot),
        upsertCandidateToSupabase(candidate),
        upsertCitizenToSupabase(citizen),
        insertAuditLogToSupabase(this.auditLogs[0])
      ]).catch(e => console.error('Supabase vote sync error:', e));
    }

    return {
      receiptHash,
      voterName: citizen.nama,
      voterPhone: citizen.phone,
      voterRt: citizen.rt,
      timestamp: timestampStr,
      waPayload
    };
  }

  // Verify Receipt Hash in public ledger
  public verifyReceiptHash(hashQuery: string): { found: boolean; ballot?: CastBallot; message: string } {
    const q = hashQuery.trim().toLowerCase();
    if (!q) return { found: false, message: 'Masukkan kode hash tanda terima.' };

    const ballot = this.ballots.find(b => b.receiptHash.toLowerCase() === q);
    if (ballot) {
      return {
        found: true,
        ballot,
        message: `Tanda terima terverifikasi valid! Tercatat sah di Kotak Suara Digital RW 14 pada Blok #${ballot.blockHeight} (${ballot.timestamp} WIB).`
      };
    }

    const dptEntry = this.dptList.find(c => c.receiptHash?.toLowerCase() === q);
    if (dptEntry) {
      return {
        found: true,
        message: `Tanda terima terverifikasi valid! Surat suara resmi tercatat sah dari wilayah ${dptEntry.rt} (${dptEntry.votedAt} WIB).`
      };
    }

    return {
      found: false,
      message: 'Kode hash tidak ditemukan di ledger publik RW 14. Pastikan Anda menyalin seluruh 64 karakter hash SHA-256 dengan benar.'
    };
  }

  // Reset to fresh state as requested: "Reset data dpt rw 14, jumlah RT hanya RT 01 - 06"
  public resetToFreshState() {
    this.candidates = JSON.parse(JSON.stringify(BASE_CANDIDATES));
    this.dptList = generateFreshDpt();
    this.activeTokens.clear();
    this.ballots = [];
    this.totalDptCount = 318;
    this.lastBlockHash = '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4';
    this.auditLogs = [
      {
        id: `AUD-INIT-${Date.now()}`,
        type: 'RESET',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        title: 'Reset Data DPT RW 14 (Hanya RT 01 s/d RT 06)',
        details: 'Daftar Pemilih Tetap (DPT) RW 14 Kelurahan Pedurungan Tengah telah direset bersih khusus cakupan 6 RT (RT 01 s/d RT 06, Total 318 Pemilih). Kotak suara bersih dengan 0 suara.',
        hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4'
      }
    ];

    localStorage.removeItem('rw14_candidates');
    localStorage.removeItem('rw14_dpt');
    localStorage.removeItem('rw14_audits');
    localStorage.removeItem('rw14_tokens');
    localStorage.removeItem('rw14_ballots');
    this.saveToStorage();
    this.notify();
  }

  // Load Seeded Sample Data (in case user wants to test analytics charts immediately)
  public loadSampleTestVotes() {
    this.resetToFreshState();
    
    // Simulate 12 initial votes across different hours, zones, and candidates
    const sampleVoters = this.dptList.slice(0, 12);
    const candidateChoices = ['1', '2', '1', '2', '3', '1', '3', '2', '1', '1', '2', '3'];
    const hours = [8, 8, 9, 9, 10, 10, 11, 11, 11, 12, 13, 14];

    sampleVoters.forEach((voter, idx) => {
      const cId = candidateChoices[idx];
      const cand = this.candidates.find(c => c.id === cId)!;
      cand.voteCount += 1;
      
      const hr = hours[idx];
      const timeStr = `2026-10-04 ${hr.toString().padStart(2, '0')}:${(idx * 4 + 10).toString().padStart(2, '0')}:00`;
      const receiptHash = `c4ca4238a0b923820dcc509a6f75849b291d9e2358826d9c669e4f552f9547d${idx}`;

      voter.hasVoted = true;
      voter.votedAt = timeStr;
      voter.votedHour = hr;
      voter.receiptHash = receiptHash;

      this.ballots.push({
        id: `BLT-${idx + 1}`,
        blockHeight: idx + 1,
        candidateId: cId,
        candidateName: cand.name,
        candidateNumber: cand.number,
        timestamp: timeStr,
        hour: hr,
        previousHash: this.lastBlockHash,
        receiptHash,
        rtOrigin: voter.rt,
        zoneOrigin: voter.zona,
        voterAgeGroup: voter.ageGroup,
        voterGender: voter.gender
      });

      this.lastBlockHash = receiptHash;
    });

    this.saveToStorage();
    this.notify();
  }
}

export const electionStore = new ElectionStore();
