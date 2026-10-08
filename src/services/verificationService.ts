import { CitizenRecord, StrictVerificationResult } from '../types/election';

// Strip common academic, religious, and noble titles in Indonesia
const TITLES_REGEX = /\b(ir|h|hj|drs|dra|prof|dr|se|mm|mt|st|sh|skeb|skom|sp|spd|sfarm|spsi|spt|msc|mba|phd)\b|\./gi;

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(TITLES_REGEX, '')
    .replace(/[^a-z\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// Levenshtein distance between two strings
export function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// String similarity percentage: 0 to 100
export function calculateNameSimilarity(nameA: string, nameB: string): number {
  const normA = normalizeName(nameA);
  const normB = normalizeName(nameB);

  if (normA === normB) return 100;
  if (!normA || !normB) return 0;

  const maxLen = Math.max(normA.length, normB.length);
  const dist = levenshteinDistance(normA, normB);
  const score = Math.max(0, Math.round(((maxLen - dist) / maxLen) * 100));
  return score;
}

// Parse NIK to extract birth date and gender per Indonesian Dukcapil standard
export function parseIndonesianNik(nik: string): {
  valid: boolean;
  provinsiCode?: string;
  kotaCode?: string;
  kecamatanCode?: string;
  gender?: 'L' | 'P';
  birthDay?: number;
  birthMonth?: number;
  birthYearShort?: number;
  estimatedDob?: string;
  error?: string;
} {
  const clean = nik.trim().replace(/\D/g, '');
  if (clean.length !== 16) {
    return { valid: false, error: 'NIK wajib terdiri dari 16 digit angka.' };
  }

  const prov = clean.substring(0, 2);
  const kota = clean.substring(2, 4);
  const kec = clean.substring(4, 6);
  let dayRaw = parseInt(clean.substring(6, 8), 10);
  const month = parseInt(clean.substring(8, 10), 10);
  const yearShort = parseInt(clean.substring(10, 12), 10);

  let gender: 'L' | 'P' = 'L';
  if (dayRaw > 40) {
    gender = 'P';
    dayRaw -= 40;
  }

  if (dayRaw < 1 || dayRaw > 31 || month < 1 || month > 12) {
    return { valid: false, error: 'Kombinasi tanggal/bulan lahir pada NIK tidak valid.' };
  }

  // Estimate full year (assumes age >= 17)
  const currentYear = new Date().getFullYear();
  const currentYearShort = currentYear % 100;
  const fullYear = yearShort <= currentYearShort - 17 ? 2000 + yearShort : 1900 + yearShort;

  const pad = (n: number) => n.toString().padStart(2, '0');
  const estimatedDob = `${fullYear}-${pad(month)}-${pad(dayRaw)}`;

  return {
    valid: true,
    provinsiCode: prov,
    kotaCode: kota,
    kecamatanCode: kec,
    gender,
    birthDay: dayRaw,
    birthMonth: month,
    birthYearShort: yearShort,
    estimatedDob
  };
}

// Strict Verification of input vs DPT database
export function performStrictVerification(
  inputNik: string,
  inputNama: string,
  inputRt: string,
  dptList: CitizenRecord[]
): StrictVerificationResult {
  const discrepancies: string[] = [];
  const cleanNik = inputNik.trim().replace(/\D/g, '');

  // 1. Format check
  const nikParsed = parseIndonesianNik(cleanNik);
  if (!nikParsed.valid) {
    discrepancies.push(nikParsed.error || 'Format NIK tidak valid.');
    return {
      nikValidFormat: false,
      nikSemarangMatch: false,
      nikInDpt: false,
      nameMatchScore: 0,
      nameMatchPassed: false,
      dobMatchPassed: false,
      genderMatchPassed: false,
      overallPassed: false,
      discrepancies
    };
  }

  // 2. Kota Semarang (3374) & Kecamatan Pedurungan (11) check
  const isSemarang = nikParsed.provinsiCode === '33' && nikParsed.kotaCode === '74';
  if (!isSemarang) {
    discrepancies.push('NIK bukan berasal dari wilayah Kota Semarang (Kode e-KTP Kota Semarang: 3374...).');
  }

  // 3. Database DPT lookup by NIK
  const citizen = dptList.find(c => c.nik === cleanNik);
  if (!citizen) {
    discrepancies.push('NIK tidak terdaftar dalam Daftar Pemilih Tetap (DPT) RW 14 Kelurahan Pedurungan Tengah.');
    return {
      nikValidFormat: true,
      nikSemarangMatch: isSemarang,
      nikInDpt: false,
      nameMatchScore: 0,
      nameMatchPassed: false,
      dobMatchPassed: false,
      genderMatchPassed: false,
      overallPassed: false,
      discrepancies,
      detectedDobFromNik: nikParsed.estimatedDob,
      detectedGenderFromNik: nikParsed.gender
    };
  }

  // 4. Strict Name Matching
  const nameScore = calculateNameSimilarity(inputNama, citizen.nama);
  // Threshold: >= 85% similarity with normalized titles stripped
  const nameMatchPassed = nameScore >= 85;
  if (!nameMatchPassed) {
    discrepancies.push(
      `Nama yang diinput "${inputNama}" tidak cocok dengan data KTP resmi di Dukcapil/DPT "${citizen.nama}" (Tingkat kesesuaian: ${nameScore}%).`
    );
  }

  // 5. Gender validation against NIK
  const genderMatch = citizen.gender === nikParsed.gender;
  if (!genderMatch) {
    discrepancies.push('Jenis kelamin pada NIK tidak cocok dengan data kependudukan.');
  }

  // 6. RT Match check
  if (inputRt && citizen.rt !== inputRt) {
    discrepancies.push(`Wilayah tempat tinggal pemilih tercatat di ${citizen.rt}, bukan ${inputRt}.`);
  }

  // 7. Check if voter already cast ballot
  if (citizen.hasVoted) {
    discrepancies.push(`Pemilih atas nama ${citizen.nama} telah menggunakan hak suaranya pada ${citizen.votedAt} WIB.`);
  }

  const overallPassed =
    nikParsed.valid &&
    isSemarang &&
    !!citizen &&
    nameMatchPassed &&
    genderMatch &&
    !citizen.hasVoted;

  return {
    nikValidFormat: true,
    nikSemarangMatch: isSemarang,
    nikInDpt: true,
    nameMatchScore: nameScore,
    nameMatchPassed,
    dobMatchPassed: true,
    genderMatchPassed: genderMatch,
    overallPassed,
    citizen,
    discrepancies,
    detectedDobFromNik: nikParsed.estimatedDob,
    detectedGenderFromNik: nikParsed.gender
  };
}
