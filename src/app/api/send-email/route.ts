import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { to, subject, body } = await request.json();
    const recipient = to || 'nexmove.pk@gmail.com';
    const emailSubject = subject || 'NexMove System Notification';
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f8fafc; border-radius: 8px;">
        <h2 style="color: #0f172a; border-bottom: 2px solid #059669; padding-bottom: 10px;">NexMove Notification</h2>
        <p style="color: #334155; font-size: 16px;">${body}</p>
        <hr style="border: none; border-top: 1px solid #e2e8f0; margin-top: 20px;" />
        <p style="color: #64748b; font-size: 12px;">Automated alert sent to: ${recipient}</p>
      </div>
    `;

    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;

    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const data = await transporter.sendMail({
        from: `"NexMove PropTech" <${smtpUser}>`,
        to: recipient,
        subject: emailSubject,
        html: emailHtml,
      });

      return NextResponse.json({ success: true, data });
    } else if (process.env.RESEND_API_KEY) {
      const resend = new Resend(process.env.RESEND_API_KEY);
      const data = await resend.emails.send({
        from: 'NexMove PropTech <onboarding@resend.dev>',
        to: [recipient],
        subject: emailSubject,
        html: emailHtml,
      });
      return NextResponse.json({ success: true, data });
    }

    console.warn('Neither SMTP nor RESEND_API_KEY configured. Email notification skipped.');
    return NextResponse.json({ success: true, mocked: true });
  } catch (error) {
    console.error('send-email route error:', error);
    return NextResponse.json({ error }, { status: 500 });
  }
}