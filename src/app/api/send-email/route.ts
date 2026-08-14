import { NextResponse } from 'next/server';
import { Resend } from 'resend';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      console.warn('RESEND_API_KEY not configured. Email notification skipped.');
      return NextResponse.json({ success: true, mocked: true });
    }

    const resend = new Resend(apiKey);
    const { to, subject, body } = await request.json();

    const data = await resend.emails.send({
      from: 'NexMove PropTech <onboarding@resend.dev>',
      to: [to || 'nexmove.pk@gmail.com'],
      subject: subject || 'NexMove System Notification',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
          <h2 style="color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 10px;">NexMove Notification</h2>
          <p style="color: #334155; font-size: 16px;">${body}</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px;" />
          <p style="color: #64748b; font-size: 12px;">Automated alert sent to Master Owner: nexmove.pk@gmail.com</p>
        </div>
      `,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ error }, { status: 500 });
  }
}