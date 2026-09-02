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
