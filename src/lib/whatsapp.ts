/**
 * NexMove WhatsApp Business Cloud API Integration Helper
 */

interface SendWhatsAppTemplateParams {
  to: string;
  templateName: string;
  languageCode?: string;
  components?: Record<string, unknown>[];
}

interface SendWhatsAppTextParams {
  to: string;
  text: string;
}

/**
 * Format phone number to international E.164 format (e.g. 03225673641 -> 923225673641)
 */
export function formatPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('0')) {
    cleaned = '92' + cleaned.substring(1);
  }
  return cleaned;
}

/**
 * Send a Template Message via Meta WhatsApp Cloud API
 */
export async function sendWhatsAppTemplate({
  to,
  templateName,
  languageCode = 'en_US',
  components = [],
}: SendWhatsAppTemplateParams) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('⚠️ WhatsApp credentials missing in environment variables.');
    return { success: false, error: 'WhatsApp credentials not configured.' };
  }

  const formattedTo = formatPhoneNumber(to);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: formattedTo,
        type: 'template',
        template: {
          name: templateName,
          language: { code: languageCode },
          components,
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp API Error:', data);
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp message' };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Network error';
    console.error('❌ WhatsApp Network Error:', error);
    return { success: false, error: errMessage };
  }
}

/**
 * Send a Free-form Text Message via Meta WhatsApp Cloud API
 * Note: Free-form text messages can only be sent within an active 24-hour session window.
 */
export async function sendWhatsAppTextMessage({ to, text }: SendWhatsAppTextParams) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    console.warn('⚠️ WhatsApp credentials missing in environment variables.');
    return { success: false, error: 'WhatsApp credentials not configured.' };
  }

  const formattedTo = formatPhoneNumber(to);
  const url = `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedTo,
        type: 'text',
        text: { preview_url: true, body: text },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ WhatsApp API Error:', data);
      return { success: false, error: data.error?.message || 'Failed to send WhatsApp message' };
    }

    return { success: true, data };
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Network error';
    console.error('❌ WhatsApp Network Error:', error);
    return { success: false, error: errMessage };
  }
}

/**
 * Helper to trigger default Test Hello World Message
 */
export async function sendTestHelloWorldWhatsApp(to: string) {
  return sendWhatsAppTemplate({
    to,
    templateName: 'hello_world',
    languageCode: 'en_US',
  });
}

/**
 * Send a deal pipeline stage change notification to buyer or agency via WhatsApp
 */
export async function sendDealStageNotification({
  to,
  stage,
  dealId,
  propertyTitle,
  bayanaAmountPKR,
  agencyName = 'NexMove Partner Agency',
}: {
  to: string;
  stage: 'ESCROW' | 'AGREEMENT_SIGNED' | 'CLOSED';
  dealId: string;
  propertyTitle: string;
  bayanaAmountPKR?: number;
  agencyName?: string;
}) {
  const shortId = dealId.slice(-8).toUpperCase();
  let text = '';

  if (stage === 'ESCROW') {
    text = `🔒 *NexMove Escrow Vault — Bayana Locked*\n\nDear Client,\n\nYour Bayana (Security Deposit) of *PKR ${(bayanaAmountPKR || 0).toLocaleString()}* has been officially locked in NexMove Escrow Vault for property:\n\n📍 *${propertyTitle}*\n🔖 Deal Ref: NX-${shortId}\n🏢 Agency: ${agencyName}\n\n✅ Funds are fully protected under AIEscrowGuard protocol until property documents are transferred and ratified.\n\nFor queries: support@nexmove.pk`;
  } else if (stage === 'AGREEMENT_SIGNED') {
    text = `📄 *NexMove — Sale & Purchase Agreement Signed*\n\nDear Client,\n\nYour official Sale & Purchase Agreement (SPA) has been digitally generated and signed for:\n\n📍 *${propertyTitle}*\n🔖 Contract Ref: SPA-${shortId}\n🏢 Agency: ${agencyName}\n\n⚖️ This agreement is legally binding under NexMove PropTech Standards. Registry/transfer process will now begin.\n\nFor queries: support@nexmove.pk`;
  } else if (stage === 'CLOSED') {
    text = `🎉 *NexMove — Deal Closed & Payout Ready!*\n\nDear Client,\n\nCongratulations! Your property deal has been successfully closed:\n\n📍 *${propertyTitle}*\n🔖 Deal Ref: NX-${shortId}\n🏢 Agency: ${agencyName}\n\n✅ Registry transfer complete. Escrow funds have been released. All documents are archived in your NexMove vault.\n\nThank you for trusting NexMove PropTech Ecosystem! 🏠`;
  }

  if (!text) return { success: false, error: 'Unknown stage' };
  return sendWhatsAppTextMessage({ to, text });
}
