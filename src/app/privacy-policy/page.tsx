// src/app/privacy-policy/page.tsx
// NexMove Privacy Policy

import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Privacy Policy — NexMove',
  description: 'NexMove Privacy Policy: How we collect, use, and protect your personal information.',
  robots: { index: false, follow: false },
}

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#F8F9FA] text-slate-800">
      {/* Header Bar */}
      <div className="border-b border-slate-200/80 bg-white/80 backdrop-blur-md sticky top-0 z-10 shadow-xs">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-600/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-sm">N</span>
            </div>
            <span className="font-black text-slate-900 text-lg tracking-tight">NexMove</span>
          </Link>
          <Link href="/" className="text-xs font-bold text-slate-600 hover:text-emerald-600 transition flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100">
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-6 py-14">
        {/* Title */}
        <div className="mb-12 text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold px-4 py-1.5 rounded-full mb-5 shadow-xs">
            🔒 Legal Document
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight tracking-tight mb-4">
            Privacy Policy
          </h1>
          <p className="text-slate-500 text-sm font-medium">
            Last Updated: <strong className="text-slate-700">September 2026</strong> &nbsp;·&nbsp; Effective Date: <strong className="text-slate-700">September 1, 2026</strong>
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-8">

          <div className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
            <p className="text-slate-700 text-sm leading-relaxed">
              Welcome to <strong className="text-slate-900">NexMove</strong> — Pakistan&apos;s advanced real estate intelligence platform. We are committed to protecting your privacy and personal data. This Privacy Policy explains what information we collect, how we use it, with whom we share it, and what rights you have over it. By using NexMove, you agree to the terms described in this policy.
            </p>
          </div>

          <PolicySection number="1" title="Information We Collect">
            <p className="mb-3 text-slate-700 text-sm">We collect information in the following ways:</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› <strong className="text-slate-900">Account Registration:</strong> Name, email address, phone number (WhatsApp), CNIC number (for agency/seller KYC), and password (hashed).</li>
              <li>› <strong className="text-slate-900">Property Listings:</strong> Property address, location, photographs, documents (title deeds, allotment letters), pricing, and descriptions.</li>
              <li>› <strong className="text-slate-900">Usage Data:</strong> IP address, browser type, device information, pages visited, and session logs.</li>
              <li>› <strong className="text-slate-900">Transaction Records:</strong> Bank transfer slips, pay order numbers, deal reference IDs, and commission-sharing records.</li>
              <li>› <strong className="text-slate-900">Communication Data:</strong> WhatsApp OTP codes (not stored permanently), deal room messages, and AI assistant queries.</li>
              <li>› <strong className="text-slate-900">KYC Documents:</strong> Trade license copies, CNIC scans, and business registration certificates for agency verification.</li>
            </ul>
          </PolicySection>

          <PolicySection number="2" title="How We Use Your Information">
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› To create and manage your account across all user roles (Seller, Buyer, Agency, Investor, Admin).</li>
              <li>› To verify your identity via WhatsApp OTP and conduct agency KYC before listing properties.</li>
              <li>› To display property listings and match buyer demand with seller supply using our AI matching engine.</li>
              <li>› To facilitate co-brokerage agreements (50/50 commission splits) and generate digital deal room records.</li>
              <li>› To process and record token payment slip submissions and deal milestone confirmations.</li>
              <li>› To send transactional notifications, OTP codes, and deal update alerts via WhatsApp Business API.</li>
              <li>› To generate FBR-compliant tax estimates and capital gains calculations.</li>
              <li>› To improve platform features through aggregated and anonymized usage analytics.</li>
            </ul>
          </PolicySection>

          <PolicySection number="3" title="Data Sharing & Third Parties">
            <p className="mb-3 text-slate-700 text-sm">We do <strong className="text-slate-900">not</strong> sell your personal data. We may share it only with:</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› <strong className="text-slate-900">Meta (WhatsApp Cloud API):</strong> Phone number shared to deliver OTP codes. Meta&apos;s privacy policy applies.</li>
              <li>› <strong className="text-slate-900">Google (Maps API):</strong> Location data for property mapping and neighbourhood analysis.</li>
              <li>› <strong className="text-slate-900">Database Providers:</strong> Data stored on secured cloud databases (Neon PostgreSQL) with encryption at rest.</li>
              <li>› <strong className="text-slate-900">Regulatory Authorities:</strong> If legally required, data may be disclosed to SECP, FBR, or law enforcement per Pakistani law.</li>
              <li>› <strong className="text-slate-900">Co-Brokerage Parties:</strong> Limited property details shared only between verified registered agencies — never directly with end buyers without consent.</li>
            </ul>
          </PolicySection>

          <PolicySection number="4" title="Document Watermarking & Security">
            <p className="text-slate-600 text-sm leading-relaxed">
              All legal documents uploaded to the NexMove Deal Room are automatically watermarked with a unique deal identifier and timestamp. This prevents document misuse, duplication, or fraudulent re-use. Watermarked documents are stored securely and accessible only to verified parties in that specific deal room.
            </p>
          </PolicySection>

          <PolicySection number="5" title="Data Retention">
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› <strong className="text-slate-900">Account data:</strong> Retained while active. Deleted within 30 days of a verified deletion request.</li>
              <li>› <strong className="text-slate-900">Deal room records:</strong> Retained for 7 years per Pakistani financial and real estate requirements.</li>
              <li>› <strong className="text-slate-900">OTP codes:</strong> Expire after 10 minutes and are permanently purged after use or expiry.</li>
              <li>› <strong className="text-slate-900">KYC documents:</strong> Retained while agency is active and for 3 years post-deregistration.</li>
            </ul>
          </PolicySection>

          <PolicySection number="6" title="Your Rights">
            <p className="mb-3 text-slate-700 text-sm">You have the right to:</p>
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› <strong className="text-slate-900">Access:</strong> Request a copy of all personal data we hold about you.</li>
              <li>› <strong className="text-slate-900">Correction:</strong> Request correction of inaccurate or incomplete information.</li>
              <li>› <strong className="text-slate-900">Deletion:</strong> Request deletion of your account and personal data (subject to legal retention obligations).</li>
              <li>› <strong className="text-slate-900">Restriction:</strong> Request limitation on how we process your data in certain circumstances.</li>
              <li>› <strong className="text-slate-900">Complaint:</strong> Lodge a complaint with relevant authorities if you believe your data rights are violated.</li>
            </ul>
            <p className="mt-4 text-slate-700 text-sm">To exercise any of these rights, contact: <a href="mailto:nexmove.pk@gmail.com" className="font-semibold text-emerald-700 hover:underline">nexmove.pk@gmail.com</a></p>
          </PolicySection>

          <PolicySection number="7" title="Cookies & Tracking">
            <p className="text-slate-600 text-sm leading-relaxed">
              NexMove uses session cookies for authentication purposes only (NextAuth.js session management). We do not use third-party advertising cookies or cross-site tracking technologies. You can disable cookies in your browser settings, though this may affect login functionality.
            </p>
          </PolicySection>

          <PolicySection number="8" title="Security Measures">
            <ul className="space-y-2 text-slate-600 text-sm">
              <li>› All passwords are hashed using bcrypt before storage.</li>
              <li>› All data in transit is encrypted using HTTPS/TLS.</li>
              <li>› Database connections use SSL and role-based access control.</li>
              <li>› OTP codes are stored in server memory only — never in the database — and auto-expire.</li>
              <li>› Sensitive documents are watermarked and access-controlled per deal room.</li>
              <li>› API keys and secrets are stored as environment variables and never exposed to the client.</li>
            </ul>
          </PolicySection>

          <PolicySection number="9" title="Children's Privacy">
            <p className="text-slate-600 text-sm leading-relaxed">
              NexMove is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from minors. If we become aware that a minor has registered, we will promptly delete their account and all associated data.
            </p>
          </PolicySection>

          <PolicySection number="10" title="Changes to This Policy">
            <p className="text-slate-600 text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. When we do, we will update the &quot;Last Updated&quot; date at the top of this page. Continued use of NexMove after changes constitutes your acceptance of the revised policy.
            </p>
          </PolicySection>

          <PolicySection number="11" title="Contact Us">
            <p className="text-slate-600 text-sm mb-5">For questions, concerns, legal inquiries, or data requests, please contact us directly:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0 text-lg">
                  ✉️
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mail</div>
                  <a href="mailto:nexmove.pk@gmail.com" className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition break-all">
                    nexmove.pk@gmail.com
                  </a>
                </div>
              </div>

              <div className="bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0 text-lg">
                  🌐
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Website</div>
                  <a href="https://nexmove.com" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition">
                    nexmove.com
                  </a>
                </div>
              </div>

              <div className="bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0 text-lg">
                  📞
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Call</div>
                  <a href="tel:+923204326715" className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition">
                    +92320 4326715
                  </a>
                </div>
              </div>

              <div className="bg-[#F8F9FA] border border-slate-200/90 rounded-xl p-4 flex items-start gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center flex-shrink-0 text-lg">
                  💬
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">WhatsApp</div>
                  <a href="https://wa.me/923225673541" target="_blank" rel="noopener noreferrer" className="text-sm font-bold text-slate-900 hover:text-emerald-600 transition">
                    +92 322 5673541
                  </a>
                </div>
              </div>
            </div>
          </PolicySection>

        </div>

        {/* Footer */}
        <div className="mt-16 pt-8 border-t border-slate-200 text-center">
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} NexMove. All rights reserved.{' '}
            <Link href="/" className="hover:text-emerald-600 font-semibold transition ml-1">Back to Platform</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function PolicySection({ number, title, children }: { number: string; title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-slate-200/90 rounded-2xl p-7 shadow-xs">
      <div className="flex items-start gap-4 mb-5">
        <span className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-black flex items-center justify-center flex-shrink-0 mt-0.5 border border-emerald-200">
          {number}
        </span>
        <h2 className="text-lg font-black text-slate-900">{title}</h2>
      </div>
      <div className="pl-11">
        {children}
      </div>
    </section>
  )
}
