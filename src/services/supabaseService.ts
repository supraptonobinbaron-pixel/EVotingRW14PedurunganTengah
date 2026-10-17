import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Candidate, CitizenRecord, CastBallot, AuditLogItem } from '../types/election';
import { maskNik } from './cryptoService';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  isEnabled: boolean;
}

const STORAGE_KEY = 'rw14_supabase_config';

let cachedClient: SupabaseClient | null = null;
let realtimeSubscription: any = null;

// Read config from localStorage or vite env
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.anonKey) {
        return {
          url: parsed.url.trim(),
          anonKey: parsed.anonKey.trim(),
          isEnabled: parsed.isEnabled ?? true
        };
      }
    }
  } catch (e) {
    console.error('Error reading Supabase config from storage:', e);
  }

  // Fallback to Vite env variables if provided
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  if (envUrl && envKey) {
    return {
      url: envUrl.trim(),
      anonKey: envKey.trim(),
      isEnabled: true
    };
  }

  return {
    url: '',
    anonKey: '',
    isEnabled: false
  };
}

export function saveSupabaseConfig(url: string, anonKey: string, isEnabled = true): void {
  const cleanUrl = url.trim().replace(/\/+$/, '');
  const cleanKey = anonKey.trim();

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({
      url: cleanUrl,
      anonKey: cleanKey,
      isEnabled
    })
  );

  // Invalidate cached client
  cleanupRealtime();
  cachedClient = null;
}

export function clearSupabaseConfig(): void {
  localStorage.removeItem(STORAGE_KEY);
  cleanupRealtime();
  cachedClient = null;
}

export function isSupabaseConfigured(): boolean {
  const config = getSupabaseConfig();
  return Boolean(config.isEnabled && config.url && config.anonKey);
}

// Get or initialize client
export function getSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  if (!config.isEnabled || !config.url || !config.anonKey) {
    return null;
  }

  if (cachedClient) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

// Test connection
export async function testSupabaseConnection(
  testUrl?: string,
  testKey?: string
): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const url = (testUrl || getSupabaseConfig().url).trim().replace(/\/+$/, '');
    const key = (testKey || getSupabaseConfig().anonKey).trim();

    if (!url || !key) {
      return { success: false, message: 'URL Proyek Supabase dan Anon Key wajib diisi.' };
    }

    if (!url.startsWith('https://')) {
      return { success: false, message: 'URL Proyek Supabase harus diawali dengan https://' };
    }

    const testClient = createClient(url, key, {
      auth: { persistSession: false }
    });

    // Check if we can query the database or REST endpoint
    const { data, error } = await testClient.from('candidates').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, we still know authentication succeeded if error code is 42P01 (relation does not exist)
      if (error.code === '42P01' || error.message.includes('relation "candidates" does not exist') || error.message.includes('relation "public.candidates" does not exist')) {
        return {
          success: true,
          message: 'Terhubung ke Supabase! Namun tabel database belum dibuat. Silakan jalankan Skrip SQL di bawah.'
        };
      }
      return {
        success: false,
        message: `Gagal mengakses Supabase: ${error.message} (Kode: ${error.code || 'UNKNOWN'})`
      };
    }

    return {
      success: true,
      message: 'Koneksi ke Supabase Berhasil! Tabel database aktif dan siap sinkronisasi.',
      details: { sampleCount: data?.length ?? 0 }
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Koneksi gagal: ${err.message || 'Periksa kembali URL dan API Key.'}`
    };
  }
}

// Subscribe to realtime database changes
export function subscribeToSupabaseChanges(onUpdate: (payload: any) => void): () => void {
  const client = getSupabaseClient();
  if (!client) return () => {};

  try {
    cleanupRealtime();
    realtimeSubscription = client
      .channel('rw14-db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'candidates' }, payload => {
        onUpdate({ targetTable: 'candidates', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dpt' }, payload => {
        onUpdate({ targetTable: 'dpt', payload });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ballots' }, payload => {
        onUpdate({ targetTable: 'ballots', payload });
      })
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('📡 Realtime Supabase RW 14 aktif terhubung.');
        }
      });

    return cleanupRealtime;
  } catch (err) {
    console.error('Error starting Supabase realtime subscription:', err);
    return () => {};
  }
}

function cleanupRealtime() {
  if (realtimeSubscription && cachedClient) {
    try {
      cachedClient.removeChannel(realtimeSubscription);
    } catch (_) {}
    realtimeSubscription = null;
  }
}

// CANDIDATES API
export async function fetchCandidatesFromSupabase(): Promise<Candidate[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('candidates')
      .select('*')
      .order('number', { ascending: true });

    if (error) {
      console.warn('Supabase fetch candidates error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: item.id,
      number: item.number,
      name: item.name,
      title: item.title || '',
      photo: item.photo || '',
      slogan: item.slogan || '',
      vision: item.vision || '',
      missions: Array.isArray(item.missions) ? item.missions : [],
      programs: Array.isArray(item.programs) ? item.programs : [],
      rtAsal: item.rt_asal || 'RT 01',
      age: item.age || 40,
      education: item.education || '',
      occupation: item.occupation || '',
      voteCount: item.vote_count ?? 0
    }));
  } catch (err) {
    console.error('fetchCandidatesFromSupabase error:', err);
    return null;
  }
}

export async function upsertCandidateToSupabase(cand: Candidate): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('candidates').upsert({
      id: cand.id,
      number: cand.number,
      name: cand.name,
      title: cand.title,
      photo: cand.photo,
      slogan: cand.slogan,
      vision: cand.vision,
      missions: cand.missions,
      programs: cand.programs,
      rt_asal: cand.rtAsal,
      age: cand.age,
      education: cand.education,
      occupation: cand.occupation,
      vote_count: cand.voteCount,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('upsertCandidateToSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertCandidateToSupabase error:', err);
    return false;
  }
}

export async function deleteCandidateFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('candidates').delete().eq('id', id);
    if (error) {
      console.warn('deleteCandidateFromSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('deleteCandidateFromSupabase error:', err);
    return false;
  }
}

// DPT API
export async function fetchDptFromSupabase(): Promise<CitizenRecord[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('dpt')
      .select('*')
      .order('id', { ascending: true });

    if (error) {
      console.warn('Supabase fetch DPT error:', error.message);
      return null;
    }

    if (!data || data.length === 0) return null;

    return data.map((item: any) => ({
      id: item.id,
      nik: item.nik,
      nikMasked: maskNik(item.nik || ''),
      nama: item.nama,
      gender: item.gender,
      tanggalLahir: item.dob || '1990-01-01',
      usia: item.age || 35,
      ageGroup: item.age_group || 'Milenial (28-43)',
      rt: item.rt,
      rw: item.rw || 'RW 14',
      zona: item.zona || 'Zona Barat',
      alamat: item.alamat || '',
      phone: item.phone || '',
      hasVoted: Boolean(item.has_voted),
      votedAt: item.voted_at || undefined,
      votedHour: item.voted_hour || undefined,
      receiptHash: item.receipt_hash || undefined
    }));
  } catch (err) {
    console.error('fetchDptFromSupabase error:', err);
    return null;
  }
}

export async function upsertCitizenToSupabase(citizen: CitizenRecord): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('dpt').upsert({
      id: citizen.id,
      nik: citizen.nik,
      nama: citizen.nama,
      gender: citizen.gender,
      dob: citizen.tanggalLahir,
      rt: citizen.rt,
      rw: citizen.rw || 'RW 14',
      zona: citizen.zona,
      alamat: citizen.alamat,
      phone: citizen.phone,
      has_voted: citizen.hasVoted,
      voted_at: citizen.votedAt || null,
      voted_hour: citizen.votedHour || null,
      receipt_hash: citizen.receiptHash || null,
      updated_at: new Date().toISOString()
    });

    if (error) {
      console.warn('upsertCitizenToSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('upsertCitizenToSupabase error:', err);
    return false;
  }
}

export async function deleteCitizenFromSupabase(id: string): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('dpt').delete().eq('id', id);
    return !error;
  } catch (err) {
    console.error('deleteCitizenFromSupabase error:', err);
    return false;
  }
}

// BALLOTS API (Coblos Suara)
export async function fetchBallotsFromSupabase(): Promise<CastBallot[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('ballots')
      .select('*')
      .order('block_height', { ascending: true });

    if (error) {
      console.warn('fetchBallotsFromSupabase error:', error.message);
      return null;
    }

    if (!data) return null;

    return data.map((b: any) => ({
      id: b.id,
      blockHeight: b.block_height,
      candidateId: b.candidate_id,
      candidateName: b.candidate_name,
      candidateNumber: b.candidate_number,
      timestamp: b.timestamp,
      hour: b.hour,
      previousHash: b.previous_hash,
      receiptHash: b.receipt_hash,
      rtOrigin: b.rt_origin,
      zoneOrigin: b.zone_origin,
      voterAgeGroup: b.voter_age_group,
      voterGender: b.voter_gender
    }));
  } catch (err) {
    console.error('fetchBallotsFromSupabase error:', err);
    return null;
  }
}

export async function insertBallotToSupabase(ballot: CastBallot): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('ballots').insert({
      id: ballot.id,
      block_height: ballot.blockHeight,
      candidate_id: ballot.candidateId,
      candidate_name: ballot.candidateName,
      candidate_number: ballot.candidateNumber,
      timestamp: ballot.timestamp,
      hour: ballot.hour,
      previous_hash: ballot.previousHash,
      receipt_hash: ballot.receiptHash,
      rt_origin: ballot.rtOrigin,
      zone_origin: ballot.zoneOrigin,
      voter_age_group: ballot.voterAgeGroup,
      voter_gender: ballot.voterGender
    });

    if (error) {
      console.warn('insertBallotToSupabase error:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('insertBallotToSupabase error:', err);
    return false;
  }
}

// AUDIT LOGS API
export async function fetchAuditLogsFromSupabase(): Promise<AuditLogItem[] | null> {
  const client = getSupabaseClient();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('audit_logs')
      .select('*')
      .order('timestamp', { ascending: false });

    if (error) return null;
    return data;
  } catch (_) {
    return null;
  }
}

export async function insertAuditLogToSupabase(item: AuditLogItem): Promise<boolean> {
  const client = getSupabaseClient();
  if (!client) return false;

  try {
    const { error } = await client.from('audit_logs').insert({
      id: item.id,
      type: item.type,
      timestamp: item.timestamp,
      title: item.title,
      details: item.details,
      hash: item.hash
    });
    return !error;
  } catch (_) {
    return false;
  }
}

// Bulk Upload Seed/Local data to Supabase
export async function pushAllLocalDataToSupabase(
  candidates: Candidate[],
  dpt: CitizenRecord[],
  ballots: CastBallot[],
  auditLogs: AuditLogItem[]
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { success: false, message: 'Supabase belum terhubung.' };
  }

  try {
    // 1. Candidates
    if (candidates.length > 0) {
      const candPayload = candidates.map(c => ({
        id: c.id,
        number: c.number,
        name: c.name,
        title: c.title,
        photo: c.photo,
        slogan: c.slogan,
        vision: c.vision,
        missions: c.missions,
        programs: c.programs,
        rt_asal: c.rtAsal,
        age: c.age,
        education: c.education,
        occupation: c.occupation,
        vote_count: c.voteCount,
        updated_at: new Date().toISOString()
      }));
      const { error: cErr } = await client.from('candidates').upsert(candPayload);
      if (cErr) throw new Error(`Gagal upload kandidat: ${cErr.message}`);
    }

    // 2. DPT (batch by 50 to avoid payload size limit)
    if (dpt.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < dpt.length; i += batchSize) {
        const chunk = dpt.slice(i, i + batchSize).map(citizen => ({
          id: citizen.id,
          nik: citizen.nik,
          nama: citizen.nama,
          gender: citizen.gender,
          dob: citizen.tanggalLahir,
          rt: citizen.rt,
          rw: citizen.rw || 'RW 14',
          zona: citizen.zona,
          alamat: citizen.alamat,
          phone: citizen.phone,
          has_voted: citizen.hasVoted,
          voted_at: citizen.votedAt || null,
          voted_hour: citizen.votedHour || null,
          receipt_hash: citizen.receiptHash || null,
          updated_at: new Date().toISOString()
        }));
        const { error: dErr } = await client.from('dpt').upsert(chunk);
        if (dErr) throw new Error(`Gagal upload DPT: ${dErr.message}`);
      }
    }

    // 3. Ballots
    if (ballots.length > 0) {
      const ballotPayload = ballots.map(b => ({
        id: b.id,
        block_height: b.blockHeight,
        candidate_id: b.candidateId,
        candidate_name: b.candidateName,
        candidate_number: b.candidateNumber,
        timestamp: b.timestamp,
        hour: b.hour,
        previous_hash: b.previousHash,
        receipt_hash: b.receiptHash,
        rt_origin: b.rtOrigin,
        zone_origin: b.zoneOrigin,
        voter_age_group: b.voterAgeGroup,
        voter_gender: b.voterGender
      }));
      const { error: bErr } = await client.from('ballots').upsert(ballotPayload);
      if (bErr) throw new Error(`Gagal upload surat suara: ${bErr.message}`);
    }

    return {
      success: true,
      message: `Berhasil sinkronisasi: ${candidates.length} Calon, ${dpt.length} DPT, dan ${ballots.length} Surat Suara tersimpan di Supabase!`
    };
  } catch (err: any) {
    return {
      success: false,
      message: err.message || 'Terjadi kesalahan saat mengunggah data ke Supabase.'
    };
  }
}

// SQL Script generator for easy setup in Supabase SQL Editor
export function getSupabaseSchemaSql(): string {
  return `-- ==============================================================
-- SKRIP SKEMA DATABASE E-VOTING RW 14 PEDURUNGAN TENGAH (SUPABASE)
-- Jalankan skrip ini di menu: Supabase Dashboard > SQL Editor > New Query
-- ==============================================================

-- 1. TABEL KANDIDAT KETUA RW 14
CREATE TABLE IF NOT EXISTS public.candidates (
    id TEXT PRIMARY KEY,
    number INTEGER NOT NULL,
    name TEXT NOT NULL,
    title TEXT,
    photo TEXT,
    slogan TEXT,
    vision TEXT,
    missions JSONB DEFAULT '[]'::jsonb,
    programs JSONB DEFAULT '[]'::jsonb,
    rt_asal TEXT DEFAULT 'RT 01',
    age INTEGER DEFAULT 40,
    education TEXT,
    occupation TEXT,
    vote_count INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABEL DAFTAR PEMILIH TETAP (DPT) RW 14 (RT 01 s/d RT 06)
CREATE TABLE IF NOT EXISTS public.dpt (
    id TEXT PRIMARY KEY,
    nik TEXT,
    nama TEXT NOT NULL,
    gender TEXT,
    dob TEXT,
    rt TEXT NOT NULL,
    rw TEXT DEFAULT 'RW 14',
    zona TEXT,
    alamat TEXT,
    phone TEXT,
    has_voted BOOLEAN DEFAULT FALSE,
    voted_at TEXT,
    voted_hour INTEGER,
    receipt_hash TEXT,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABEL KOTAK SUARA DIGITAL (BALLOTS / LEDGER PEMILIHAN)
CREATE TABLE IF NOT EXISTS public.ballots (
    id TEXT PRIMARY KEY,
    block_height INTEGER NOT NULL,
    candidate_id TEXT NOT NULL,
    candidate_name TEXT NOT NULL,
    candidate_number INTEGER NOT NULL,
    timestamp TEXT NOT NULL,
    hour INTEGER NOT NULL,
    previous_hash TEXT NOT NULL,
    receipt_hash TEXT NOT NULL UNIQUE,
    rt_origin TEXT NOT NULL,
    zone_origin TEXT NOT NULL,
    voter_age_group TEXT,
    voter_gender TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL AUDIT LOG KRIPTOGRAFI & NOTIFIKASI
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    title TEXT NOT NULL,
    details TEXT,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AKTIFKAN ROW LEVEL SECURITY (RLS) & IZIN AKSES PUBLIK (ANON)
ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpt ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ballots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Buat Policy Akses untuk anon/public
DROP POLICY IF EXISTS "Public access for candidates" ON public.candidates;
CREATE POLICY "Public access for candidates" ON public.candidates FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for dpt" ON public.dpt;
CREATE POLICY "Public access for dpt" ON public.dpt FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for ballots" ON public.ballots;
CREATE POLICY "Public access for ballots" ON public.ballots FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public access for audit_logs" ON public.audit_logs;
CREATE POLICY "Public access for audit_logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

-- 6. REALTIME REPLICATION (Agar Data Otomatis Update Tanpa Refresh)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'candidates'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.candidates;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'dpt'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.dpt;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'ballots'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ballots;
  END IF;
END $$;
`;
}
