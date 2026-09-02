import { NextRequest, NextResponse } from 'next/server';
import { sendTestHelloWorldWhatsApp, sendWhatsAppTextMessage } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { to, messageType = 'template', customText } = body;

    if (!to) {
      return NextResponse.json(
        { success: false, error: 'Phone number "to" is required' },
        { status: 400 }
      );
    }

    let result;
    if (messageType === 'text' && customText) {
      result = await sendWhatsAppTextMessage({ to, text: customText });
    } else {
      result = await sendTestHelloWorldWhatsApp(to);
    }

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp notification sent successfully!',
      result: result.data,
    });
  } catch (error: unknown) {
    const errMessage = error instanceof Error ? error.message : 'Internal server error';
    return NextResponse.json(
      { success: false, error: errMessage },
      { status: 500 }
    );
  }
}
