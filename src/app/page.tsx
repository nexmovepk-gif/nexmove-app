// src/app/page.tsx
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'NexMove PropTech — Next-Gen Global Real Estate Ecosystem',
  description: 'Multi-tenant global real estate platform with RBAC, AI extraction, blind listings, WhatsApp integration, and verified agency marketplace.',
};

export default function Home() {
  const phase1Features = [
    { title: 'Multi-Tenant Shielding', desc: 'Agency-scoped CRM data with strict data shield protection' },
    { title: 'RBAC Access Control', desc: 'Super Admin, Agency Manager, Agent, and Public User roles' },
    { title: 'NextAuth Session Security', desc: 'Secure session management with custom agency claims' },
  ];

  const phase2Features = [
    { title: 'Public Verified Marketplace', desc: 'Browse active listings filtered by city, type, and price', href: '/marketplace' },
    { title: 'AI Document Extraction', desc: 'Upload Title Deeds/Blueprints → AI auto-parses specs & market valuations', href: '/submit-listing' },
    { title: 'Verified Agency Badge System', desc: 'Trade license & RERA/DLD broker certificate verification' },
    { title: 'Agency Leaderboard & Directory', desc: 'Performance analytics, financial ledgers, and verified agency profiles', href: '/agencies' },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      {/* Top Banner Hero */}
      <div className="bg-slate-900 text-white px-4 py-16 border-b border-slate-800 shadow-md">
        <div className="max-w-3xl mx-auto text-center flex flex-col items-center gap-4">
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-3.5 py-1.5 rounded-full font-bold uppercase tracking-widest">
            Next-Gen Global PropTech SaaS
          </span>
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-white leading-tight">
            NexMove Real Estate Ecosystem
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-xl leading-relaxed">
            Enterprise multi-tenant platform with client data shielding, AI property document extraction, 3D virtual tours, and automated rent collection.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-md mt-4">
            <Link
              href="/marketplace"
              className="w-full sm:w-auto flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-6 rounded-xl transition shadow-lg text-sm text-center"
            >
              🏠 Browse Marketplace
            </Link>
            <Link
              href="/agency/dashboard"
              className="w-full sm:w-auto flex-1 bg-slate-800 hover:bg-slate-700 text-teal-300 border border-teal-500/30 font-bold py-3.5 px-6 rounded-xl transition text-sm text-center"
            >
              🛡️ Agency Dashboard
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10 flex flex-col gap-8">
        {/* Quick Nav Links */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: '/marketplace',           label: 'Marketplace',     icon: '🏠' },
            { href: '/agency/submit-listing', label: 'Add Property',    icon: '📤' },
            { href: '/agency/rent-collection',label: 'Rent Collections',icon: '💳' },
            { href: '/privacy',               label: 'Privacy Policy',  icon: '⚖️' },
          ].map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className="bg-white hover:bg-emerald-50/40 border border-slate-200 shadow-sm hover:shadow rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-1.5 transition group"
            >
              <span className="text-2xl">{icon}</span>
              <span className="text-xs font-bold text-slate-900 group-hover:text-emerald-700 transition">{label}</span>
            </Link>
          ))}
        </div>

        {/* Tech Stack */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-wrap justify-center gap-2">
          {['Next.js 14', 'Prisma ORM v7', 'PostgreSQL', 'NextAuth.js', 'Tailwind CSS', 'AI Document OCR'].map((tech) => (
            <span key={tech} className="bg-slate-100 border border-slate-200 text-xs text-slate-700 font-bold px-3 py-1 rounded-lg">
              {tech}
            </span>
          ))}
        </div>

        {/* Phase 2 Features Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Public Marketplace & AI Engine</h2>
            <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-bold">✓ Active</span>
          </div>
          <ul className="flex flex-col gap-3.5">
            {phase2Features.map((f) => (
              <li key={f.title} className="flex gap-3 items-start text-xs">
                <span className="text-emerald-600 font-bold text-sm mt-0.5">✓</span>
                <div>
                  {f.href ? (
                    <Link href={f.href} className="font-bold text-slate-900 hover:text-emerald-700 transition text-sm">
                      {f.title} →
                    </Link>
                  ) : (
                    <span className="font-bold text-slate-900 text-sm">{f.title}</span>
                  )}
                  <p className="text-slate-600 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Phase 1 Core Architecture Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Multi-Tenant CRM Architecture</h2>
            <span className="text-xs bg-slate-100 text-slate-700 border border-slate-300 px-3 py-1 rounded-full font-bold">✓ Verified</span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {phase1Features.map((f) => (
              <li key={f.title} className="flex gap-3 items-start text-xs">
                <span className="text-slate-500 font-bold mt-0.5">✓</span>
                <div>
                  <span className="font-bold text-slate-800 text-xs">{f.title}</span>
                  <p className="text-slate-600 text-xs">{f.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* Auth Quick Links */}
        <div className="text-center flex items-center justify-center gap-4 text-xs font-semibold">
          <Link href="/login" className="text-emerald-700 hover:underline">Agency Staff / Admin Login →</Link>
          <span className="text-slate-300">•</span>
          <Link href="/register" className="text-blue-600 hover:underline">Register New Agency Account →</Link>
        </div>
      </div>
    </main>
  );
}
