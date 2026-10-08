import { MetaCloudApiMessage, WhatsAppNotificationPayload } from '../types/election';

export interface WhatsAppBusinessApiConfig {
  phoneNumberId: string;
  accessToken: string;
  wabaId: string;
  isSandboxMode: boolean;
}

export const DEFAULT_WA_CONFIG: WhatsAppBusinessApiConfig = {
  phoneNumberId: '109823485729104',
  accessToken: 'EAAG9sample_meta_whatsapp_business_cloud_token_rw14',
  wabaId: '394827105928192',
  isSandboxMode: true
};

export function getStoredWhatsAppConfig(): WhatsAppBusinessApiConfig {
  try {
    const raw = localStorage.getItem('rw14_wa_business_config');
    if (raw) return JSON.parse(raw);
  } catch {
    // fallback
  }
  return DEFAULT_WA_CONFIG;
}

export function saveStoredWhatsAppConfig(config: WhatsAppBusinessApiConfig) {
  try {
    localStorage.setItem('rw14_wa_business_config', JSON.stringify(config));
  } catch {
    // fallback
  }
}

/**
 * Anonymize voter name if voter privacy opt-in was not granted
 */
export function getVoterDisplayName(fullName: string, allowName: boolean): string {
  if (allowName) return fullName;
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) return `${parts[0].slice(0, 3)}***`;
  return `${parts[0]} ${parts[1].slice(0, 1)}*** (Dirahasiakan)`;
}

/**
 * Generate Meta WhatsApp Business Cloud API JSON Payload
 * Strictly adheres to Meta WhatsApp Business Messaging Policy (Utility Category)
 */
export function buildMetaWhatsAppCloudPayload(
  phone: string,
  voterDisplayName: string,
  candidateName: string,
  candidateNumber: number,
  receiptHash: string,
  timestampStr: string,
  ballotNumber: number
): MetaCloudApiMessage {
  // Normalize phone to international format without + or 0
  const cleanPhone = phone.replace(/\D/g, '').replace(/^0/, '62');

  return {
    messaging_product: 'whatsapp',
    recipient_type: 'individual',
    to: cleanPhone,
    type: 'template',
    template: {
      name: 'rw14_vote_confirmation',
      language: { code: 'id' },
      components: [
        {
          type: 'header',
          parameters: [
            {
              type: 'text',
              text: 'KPU RW 14 PEDURUNGAN TENGAH'
            }
          ]
        },
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: voterDisplayName // {{1}} Nama Pemilih (atau disamarkan)
            },
            {
              type: 'text',
              text: `No. Urut 0${candidateNumber} - ${candidateName}` // {{2}} Kandidat yang dipilih
            },
            {
              type: 'text',
              text: `RW14/E-VOTE/${ballotNumber.toString().padStart(4, '0')}` // {{3}} Nomor Registrasi
            },
            {
              type: 'text',
              text: receiptHash.substring(0, 24) + '...' // {{4}} Potongan Hash Bukti
            },
            {
              type: 'text',
              text: 'Terima kasih atas partisipasi aktif Bapak/Ibu dalam menyukseskan demokrasi warga yang jujur, adil, dan transparan di Kelurahan Pedurungan Tengah Kota Semarang.' // {{5}} Ucapan Terima Kasih
            }
          ]
        },
        {
          type: 'button',
          sub_type: 'quick_reply',
          index: '0',
          parameters: [
            {
              type: 'payload',
              payload: `VERIFY_RECEIPT:${receiptHash}`
            }
          ]
        }
      ]
    }
  };
}

/**
 * Build human-readable formatted WhatsApp text message for deep links & preview
 */
export function buildWhatsAppFormattedText(
  voterDisplayName: string,
  candidateName: string,
  candidateNumber: number,
  rt: string,
  receiptHash: string,
  timestampStr: string,
  ballotNumber: number
): string {
  return `*PANITIA PEMILIHAN KETUA RW 14*
*KELURAHAN PEDURUNGAN TENGAH, KOTA SEMARANG*
_WhatsApp Business Official Notification_
─────────────────────────
*KONFIRMASI PENCOBLOSAN SUARA SAH*
No. Reg: *RW14/E-VOTE/${ballotNumber.toString().padStart(4, '0')}*

Kepada Yth:
*${voterDisplayName}*
Wilayah: *${rt} / RW 14 Pedurungan Tengah*
Waktu: *${timestampStr} WIB*

Surat suara Anda telah berhasil dicatat untuk:
🗳️ *Kandidat Pilihan:*
*Nomor Urut 0${candidateNumber} - ${candidateName}*

*Kode Tanda Terima Kriptografi (SHA-256):*
\`\`\`${receiptHash}\`\`\`

─────────────────────────
🙏 *Ucapan Terima Kasih:*
_Panitia Pemilihan Ketua RW 14 Kelurahan Pedurungan Tengah mengucapkan terima kasih yang sebesar-besarnya atas partisipasi aktif Bapak/Ibu dalam menyalurkan hak suara secara LUBER JURDIL demi kemajuan lingkungan kita._

_Pesan ini dikirim otomatis via WhatsApp Business API resmi RW 14 sesuai UU PDP & Kebijakan Meta._`;
}

/**
 * Dispatch message via WhatsApp Business API
 * If real credentials are present and sandbox is disabled, sends via fetch to Meta Graph API.
 * Otherwise simulates the dispatch and webhook status transitions.
 */
export async function dispatchWhatsAppBusinessMessage(
  payload: WhatsAppNotificationPayload,
  config: WhatsAppBusinessApiConfig = getStoredWhatsAppConfig()
): Promise<{ success: boolean; messageId: string; responseData: unknown }> {
  // If user provided a real token and disabled sandbox
  if (!config.isSandboxMode && config.accessToken && config.phoneNumberId) {
    try {
      const endpoint = `https://graph.facebook.com/v18.0/${config.phoneNumberId}/messages`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload.metaCloudApiPayload)
      });
      const data = await res.json();
      return {
        success: res.ok,
        messageId: data?.messages?.[0]?.id || `wamid.HBgM${Date.now()}`,
        responseData: data
      };
    } catch (err) {
      console.warn('Live Meta API failed, falling back to sandbox logger:', err);
    }
  }

  // Simulated Meta Cloud API response (Standard 200 OK from Graph API)
  await new Promise(r => setTimeout(r, 450));
  const simulatedMessageId = `wamid.HBgM${Date.now().toString(36).toUpperCase()}RW14PDG`;
  
  return {
    success: true,
    messageId: simulatedMessageId,
    responseData: {
      messaging_product: 'whatsapp',
      contacts: [{ input: payload.metaCloudApiPayload.to, wa_id: payload.metaCloudApiPayload.to }],
      messages: [{ id: simulatedMessageId, message_status: 'accepted' }]
    }
  };
}
