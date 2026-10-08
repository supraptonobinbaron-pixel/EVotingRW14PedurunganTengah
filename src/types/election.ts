export interface Candidate {
  id: string;
  number: number;
  name: string;
  title: string;
  photo: string;
  slogan: string;
  vision: string;
  missions: string[];
  programs: string[];
  rtAsal: string;
  age: number;
  education: string;
  occupation: string;
  voteCount: number;
}

export type ZoneType = 'Zona Barat' | 'Zona Tengah' | 'Zona Timur';
export type AgeGroupType = 'Gen Z (17-27)' | 'Milenial (28-43)' | 'Gen X (44-59)' | 'Lansia (60+)';

export interface CitizenRecord {
  id: string;
  nik: string; // 16 digits
  nikMasked: string;
  nama: string;
  gender: 'L' | 'P';
  tanggalLahir: string; // YYYY-MM-DD
  usia: number;
  ageGroup: AgeGroupType;
  rt: string; // RT 01 to RT 06
  rw: string; // RW 14
  zona: ZoneType;
  alamat: string;
  phone: string;
  hasVoted: boolean;
  votedAt?: string;
  votedHour?: number; // 7 to 14
  receiptHash?: string;
  encryptedData?: string;
}

export interface VotingToken {
  tokenCode: string; // e.g. RW14-8X92-KL41
  citizenId: string;
  citizenName: string;
  citizenRt: string;
  issuedAt: string;
  expiresAt: string;
  isUsed: boolean;
  usedAt?: string;
}

export interface CastBallot {
  id: string;
  blockHeight: number;
  candidateId: string;
  candidateName: string;
  candidateNumber: number;
  timestamp: string;
  hour: number; // 7 to 14
  previousHash: string;
  receiptHash: string; // SHA-256
  rtOrigin: string; // RT 01 - RT 06
  zoneOrigin: ZoneType;
  voterAgeGroup: AgeGroupType;
  voterGender: 'L' | 'P';
}

export interface AuditLogItem {
  id: string;
  type: 'VERIFICATION' | 'TOKEN_ISSUED' | 'BALLOT_CAST' | 'WHATSAPP_SENT' | 'SECURITY_CHECK' | 'RESET';
  timestamp: string;
  title: string;
  details: string;
  hash: string;
}

export interface WhatsAppNotificationPayload {
  recipientPhone: string;
  voterName: string;
  displayName: string; // Real name or Anonymized (e.g., "Budi S***")
  allowNameInNotification: boolean;
  candidateSelectedName: string;
  candidateNumber: number;
  rt: string;
  receiptHash: string;
  ballotNumber: number;
  timestamp: string;
  sentAt: string;
  status: 'QUEUED' | 'SENT' | 'DELIVERED' | 'READ';
  rawMessage: string;
  metaCloudApiPayload: MetaCloudApiMessage;
}

export interface MetaCloudApiMessage {
  messaging_product: 'whatsapp';
  recipient_type: 'individual';
  to: string;
  type: 'template';
  template: {
    name: 'rw14_vote_confirmation';
    language: { code: 'id' };
    components: Array<{
      type: 'header' | 'body' | 'button';
      sub_type?: string;
      index?: string;
      parameters: Array<{
        type: 'text' | 'payload';
        text?: string;
        payload?: string;
      }>;
    }>;
  };
}

export interface StrictVerificationResult {
  nikValidFormat: boolean;
  nikSemarangMatch: boolean;
  nikInDpt: boolean;
  nameMatchScore: number; // 0 to 100
  nameMatchPassed: boolean;
  dobMatchPassed: boolean;
  genderMatchPassed: boolean;
  overallPassed: boolean;
  citizen?: CitizenRecord;
  discrepancies: string[];
  detectedDobFromNik?: string;
  detectedGenderFromNik?: 'L' | 'P';
}

export interface HourlyVoteTrend {
  hourLabel: string;
  hour: number;
  candidate1Votes: number;
  candidate2Votes: number;
  candidate3Votes: number;
  cumulativeTotal: number;
}
