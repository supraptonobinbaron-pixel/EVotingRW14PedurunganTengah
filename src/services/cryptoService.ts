/**
 * Layanan Kriptografi & Keamanan Data Pemilu RW 14 Pedurungan Tengah
 * Menggunakan Web Crypto API (Standard W3C SubtlyCrypto):
 * - Hash SHA-256 untuk Audit Trail & Tanda Terima Surat Suara (Receipt Hash)
 * - Enkripsi AES-256-GCM untuk Data Pribadi Pemilih (NIK, Kontak, Foto)
 * - Token Kriptografis Unik Sekali Pakai (One-Time Voting Token)
 */

export async function sha256(message: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate Secure Random Token: Format RW14-XXXX-XXXX
export function generateSecureVotingToken(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude ambiguous chars (O, 0, I, 1)
  const randomBytes = new Uint8Array(8);
  crypto.getRandomValues(randomBytes);
  
  let part1 = '';
  let part2 = '';
  for (let i = 0; i < 4; i++) {
    part1 += chars[randomBytes[i] % chars.length];
  }
  for (let i = 4; i < 8; i++) {
    part2 += chars[randomBytes[i] % chars.length];
  }
  return `RW14-${part1}-${part2}`;
}

// Derive a Cryptographic Key from a Passphrase using PBKDF2
async function deriveKey(passphrase: string, salt: Uint8Array): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(passphrase),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt as unknown as ArrayBuffer,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

// AES-256-GCM Encryption for Voter Records
export async function encryptVoterData(
  plainText: string,
  passphrase: string = 'KPU-RW14-PEDURUNGAN-TENGAH-SEMARANG-2026'
): Promise<string> {
  try {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const enc = new TextEncoder();
    const encodedData = enc.encode(plainText);

    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      key,
      encodedData
    );

    const payload = {
      s: Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join(''),
      i: Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join(''),
      c: Array.from(new Uint8Array(ciphertext)).map(b => b.toString(16).padStart(2, '0')).join('')
    };

    return btoa(JSON.stringify(payload));
  } catch (error) {
    console.error('Encryption error:', error);
    return `ENC_${Date.now()}_${plainText.slice(0, 4)}***`;
  }
}

// AES-256-GCM Decryption
export async function decryptVoterData(
  cipherPayloadBase64: string,
  passphrase: string = 'KPU-RW14-PEDURUNGAN-TENGAH-SEMARANG-2026'
): Promise<string> {
  try {
    const jsonStr = atob(cipherPayloadBase64);
    const payload = JSON.parse(jsonStr);
    
    const hexToBytes = (hex: string) => {
      const bytes = new Uint8Array(hex.length / 2);
      for (let i = 0; i < hex.length; i += 2) {
        bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
      }
      return bytes;
    };

    const salt = hexToBytes(payload.s);
    const iv = hexToBytes(payload.i);
    const ciphertext = hexToBytes(payload.c);

    const key = await deriveKey(passphrase, salt);
    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv as unknown as ArrayBuffer },
      key,
      ciphertext as unknown as ArrayBuffer
    );

    const dec = new TextDecoder();
    return dec.decode(decryptedBuffer);
  } catch {
    return '[DATA_TERENKRIPSI_AMAN]';
  }
}

// Mask NIK for public / display safety (e.g. 3374112005820001 -> 337411******0001)
export function maskNik(nik: string): string {
  if (!nik || nik.length < 16) return nik;
  return `${nik.substring(0, 6)}******${nik.substring(12, 16)}`;
}

// Validate e-KTP NIK format: 16 digits, with Semarang / Central Java validation
export function validateSemarangNik(nik: string): { valid: boolean; message: string } {
  const cleaned = nik.trim().replace(/\D/g, '');
  if (cleaned.length !== 16) {
    return { valid: false, message: 'NIK wajib terdiri dari 16 digit angka.' };
  }
  // 33: Jawa Tengah, 74: Kota Semarang
  if (!cleaned.startsWith('3374')) {
    return {
      valid: false,
      message: 'NIK tidak sesuai wilayah Kota Semarang (Kode e-KTP Kota Semarang diawali 3374...).'
    };
  }
  return { valid: true, message: 'Format NIK e-KTP Kota Semarang valid.' };
}
