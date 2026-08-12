import React from 'react';
import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy & Data Shield Terms — NexMove PropTech',
  description: 'International Data Protection Policies, Multi-Tenant Shield Isolation, and Non-Refundable Token Terms.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-slate-200 pb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Legal & Compliance Framework
            </span>
            <h1 className="text-3xl font-black text-slate-900 mt-2">Privacy Policy & Data Protection Terms</h1>
            <p className="text-xs text-slate-600 mt-1 font-medium">
              Effective Date: August 10, 2026 · Global PropTech Standard v4.2
            </p>
          </div>
          <Link
            href="/"
            className="text-xs bg-white hover:bg-slate-100 text-slate-800 font-bold px-4 py-2 rounded-xl border border-slate-300 shadow-sm transition"
          >
            ← Back to Home
          </Link>
        </div>

        {/* Highlight Shield Banner */}
        <div className="bg-white border border-emerald-200 rounded-3xl p-6 shadow-sm flex items-start gap-4">
          <div className="text-3xl">🛡️</div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Multi-Tenant Data Shielding Architecture</h2>
            <p className="text-xs text-slate-700 mt-1 leading-relaxed font-medium">
              NexMove operates on isolated database schemas. Client names, phone numbers, and negotiation notes belonging to Agency A are cryptographically shielded and NEVER shared with Agency B or public marketplace listings without explicit authorization.
            </p>
          </div>
        </div>

        {/* Policy Sections */}
        <div className="space-y-6 text-sm text-slate-700">
          {/* Section 1 */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">1.</span> Data Protection & International Privacy Standards
            </h2>
            <p className="leading-relaxed text-xs sm:text-sm">
              NexMove complies with international data privacy standards including the General Data Protection Regulation (GDPR) and UAE Data Protection Law (Federal Decree-Law No. 45 of 2021). All user data, client records, and transaction histories are stored with end-to-end encryption.
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-slate-600 pl-2 font-medium">
              <li>Strict tenant isolation prevents cross-agency client poaching or deal leakage.</li>
              <li>Public marketplace listings obscure phone contact numbers (`+971 50 *** **88`).</li>
              <li>Users retain full right to request data export or account erasure upon contract termination.</li>
            </ul>
          </section>

          {/* Section 2 */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">2.</span> Non-Refundable Token Deposit Policy
            </h2>
            <p className="leading-relaxed text-xs sm:text-sm">
              When a buyer reserves a property using the NexMove Escrow Vault:
            </p>
            <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 text-amber-900 text-xs leading-relaxed font-bold">
              ⚠️ STRICT TERMS: The Token Payment / Booking Deposit is strictly NON-REFUNDABLE in the event of unilateral deal cancellation or buyer default after 24 hours of token confirmation.
            </div>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              Token amounts are held safely in escrow until conditions precedent (NOC, Title Deed Transfer) are fulfilled, after which funds are disbursed to the listing agency or returned only if seller title defect occurs.
            </p>
          </section>

          {/* Section 3 */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">3.</span> Co-Brokering Network & Commission Sharing
            </h2>
            <p className="leading-relaxed text-xs sm:text-sm">
              Agencies participating in the Shared Co-Brokering Network agree to standard 50/50 commission splitting for co-brokered sales. Client aliases exchanged across the network remain shielded until a formal digital MOU is signed.
            </p>
          </section>

          {/* Section 4 */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 space-y-3 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">4.</span> Verified Agency Standards
            </h2>
            <p className="leading-relaxed text-xs sm:text-sm">
              The &apos;Verified Agency&apos; badge is awarded solely to agencies submitting authentic commercial trade licenses, RERA/DLD broker certificates, and audited tax IDs. NexMove reserves the right to revoke verified badges for policy violations.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 pt-6 text-center text-xs text-slate-500 font-medium">
          <p>© 2026 NexMove PropTech Systems. All rights reserved. For compliance inquiries, contact compliance@nexmove.com</p>
        </div>
      </div>
    </main>
  );
}
