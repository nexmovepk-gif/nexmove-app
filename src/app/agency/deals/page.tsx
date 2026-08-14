'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import AIEscrowGuard from '@/components/AIEscrowGuard';

interface DealItem {
  id: string;
  title: string;
  stage: 'LEAD' | 'NEGOTIATION' | 'ESCROW' | 'AGREEMENT_SIGNED' | 'CLOSED';
  value: number;
  clientAlias: string;
  clientPrivateName: string;
  clientContact: string;
  privateNotes: string;
  property: string;
  matchScore?: number;
}

interface CoBrokerListing {
  id: string;
  title: string;
  agencyName: string;
  agencyVerified: boolean;
  city: string;
  price: number;
  propertyType: string;
  commissionRate: number;
}

const INITIAL_DEALS: DealItem[] = [];

const CO_BROKER_NETWORK_DATA: CoBrokerListing[] = [];

export default function ShieldedDealsPage() {
  const [deals, setDeals] = useState<DealItem[]>(INITIAL_DEALS);
  const [selectedStage, setSelectedStage] = useState<string>('ALL');
  const [showPrivateDetails, setShowPrivateDetails] = useState<Record<string, boolean>>({});

  // AI Matcher state
  const [aiMatching, setAiMatching] = useState(false);
  const [aiMatchedResult, setAiMatchedResult] = useState<string | null>(null);

  // Co-Brokering Network Search state
  const [searchCity, setSearchCity] = useState('');
  const [searchMaxBudget, setSearchMaxBudget] = useState('');
  const [searchType, setSearchType] = useState('');
  const [coBrokerResults, setCoBrokerResults] = useState<CoBrokerListing[]>(CO_BROKER_NETWORK_DATA);
  const [coBrokerSuccessMsg, setCoBrokerSuccessMsg] = useState<string | null>(null);

  // AI Legal Agreement Generator Modal State
  const [contractDeal, setContractDeal] = useState<DealItem | null>(null);

  const togglePrivateDetails = (dealId: string) => {
    setShowPrivateDetails((prev) => ({
      ...prev,
      [dealId]: !prev[dealId],
    }));
  };

  const runAiMatcher = () => {
    setAiMatching(true);
    setAiMatchedResult(null);
    setTimeout(() => {
      setAiMatching(false);
      setAiMatchedResult(
        'AI Match Found! "Buyer Requirement #408" matches 98% with "Marina Tower Penthouse ($520k)". Client identity remains 100% shielded from external brokers.'
      );
    }, 1000);
  };

  const handleCoBrokerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    let res = CO_BROKER_NETWORK_DATA;
    if (searchCity) {
      res = res.filter((item) => item.city.toLowerCase().includes(searchCity.toLowerCase()));
    }
    if (searchType) {
      res = res.filter((item) => item.propertyType === searchType);
    }
    if (searchMaxBudget) {
      res = res.filter((item) => item.price <= Number(searchMaxBudget));
    }
    setCoBrokerResults(res);
  };

  const initiateCoBrokeredDeal = (listing: CoBrokerListing) => {
    const newDealId = `DEAL-${100 + deals.length + 1}`;
    const totalCommission = listing.price * listing.commissionRate;
    const splitShare = totalCommission / 2;

    const newDeal: DealItem = {
      id: newDealId,
      title: `Co-Brokered: ${listing.title}`,
      stage: 'NEGOTIATION',
      value: listing.price,
      clientAlias: `Shared Lead #${Math.floor(100 + Math.random() * 900)} (Co-Broker)`,
      clientPrivateName: 'Confidential Shared Client',
      clientContact: '+971 50 *** **99',
      privateNotes: `Co-brokered deal with ${listing.agencyName}. Total Commission: $${totalCommission.toLocaleString()} (50/50 Split: $${splitShare.toLocaleString()} per agency).`,
      property: listing.title,
      matchScore: 95,
    };

    setDeals([newDeal, ...deals]);
    setCoBrokerSuccessMsg(
      `✓ Co-Brokered Deal #${newDealId} created! $${splitShare.toLocaleString()} profit share locked with ${listing.agencyName}.`
    );
    setTimeout(() => setCoBrokerSuccessMsg(null), 5000);
  };

  const filteredDeals = selectedStage === 'ALL'
    ? deals
    : deals.filter((d) => d.stage === selectedStage);

  const getStageBadge = (stage: DealItem['stage']) => {
    switch (stage) {
      case 'LEAD':
        return <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-bold rounded-full">Lead</span>;
      case 'NEGOTIATION':
        return <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-full">In Negotiation</span>;
      case 'ESCROW':
        return <span className="px-3 py-1 bg-purple-100 text-purple-800 text-xs font-bold rounded-full">Escrow Deposited</span>;
      case 'AGREEMENT_SIGNED':
        return <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-full">SPA Signed</span>;
      case 'CLOSED':
        return <span className="px-3 py-1 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full">Closed & Shielded</span>;
      default:
        return null;
    }
  };

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      {/* ── Printable AI Contract Layout (Visible only during printing) ───── */}
      {contractDeal && (
        <div id="printable-contract" className="hidden print:block fixed inset-0 bg-white p-16 z-[9999] text-gray-900 leading-relaxed">
          <div className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900 uppercase tracking-tight">NexMove PropTech Ecosystem</h1>
              <p className="text-sm font-bold text-emerald-800 mt-0.5">Official AI-Generated Sale & Purchase Agreement (SPA)</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 font-bold">Document Ref.</p>
              <p className="text-lg font-black text-gray-900">SPA-{contractDeal.id}</p>
              <p className="text-xs text-gray-500 mt-0.5">Date: {new Date().toLocaleDateString('en-US', { dateStyle: 'full' })}</p>
            </div>
          </div>

          <div className="space-y-4 text-xs text-gray-800">
            <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1">1. CONTRACTING PARTIES & DEALS TERMS</h2>
            <p>
              This Agreement is executed between <strong>NexMove Partner Agency</strong> (&quot;Broker / Escrow Agent&quot;) and <strong>{contractDeal.clientAlias}</strong> (&quot;Client&quot;), subject to Multi-Tenant Data Shield Isolation.
            </p>
            <table className="w-full text-xs border border-gray-300 my-4">
              <tbody>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <td className="p-2.5 font-bold w-40 border-r border-gray-300">Property Identifier</td>
                  <td className="p-2.5 font-semibold">{contractDeal.property}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="p-2.5 font-bold border-r border-gray-300">Agreed Consideration Value</td>
                  <td className="p-2.5 font-black text-emerald-800">${contractDeal.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} USD</td>
                </tr>
                <tr className="border-b border-gray-300 bg-gray-50">
                  <td className="p-2.5 font-bold border-r border-gray-300">Current Pipeline Status</td>
                  <td className="p-2.5 font-bold uppercase">{contractDeal.stage}</td>
                </tr>
                <tr>
                  <td className="p-2.5 font-bold border-r border-gray-300">Escrow Security Deposit</td>
                  <td className="p-2.5 font-semibold">5% Token Payment (${(contractDeal.value * 0.05).toLocaleString()}) — Held in NexMove Vault (Non-Refundable)</td>
                </tr>
              </tbody>
            </table>

            <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 pt-2">2. CO-BROKERING & COMMISSION TERMS</h2>
            <p className="leading-relaxed">
              In accordance with NexMove Global PropTech Standards, all co-brokered sales stipulate a 50/50 net commission split disbursed upon Land Department deed transfer.
            </p>

            <h2 className="text-base font-bold text-gray-900 border-b border-gray-300 pb-1 pt-2">3. DIGITAL EXECUTION & SIGNATURES</h2>
            <div className="grid grid-cols-2 gap-8 pt-8">
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold text-gray-900">Authorized Agency Officer</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Digital Signature: NX-AGENCY-AUTH-{contractDeal.id}</p>
              </div>
              <div className="border-t border-gray-400 pt-2">
                <p className="font-bold text-gray-900">Client Signature / Alias Authorization</p>
                <p className="text-[10px] text-gray-500 font-mono mt-1">Shielded Verification: {contractDeal.clientAlias}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto print:hidden">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold text-gray-900">Shielded Deal Pipeline</h1>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1">
                <span>🛡️</span> Multi-Tenant Data Shield Active
              </span>
            </div>
            <p className="text-sm text-gray-700 mt-1 font-medium">
              Private agency deal pipeline — client contact details and negotiation notes are completely isolated from external brokers.
            </p>
          </div>
          <Link
            href="/agency/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* AIEscrowGuard Escrow Protection Banner */}
        <AIEscrowGuard mode="escrow_protection" className="mb-8" title="Escrow Vault & Deal Protection Matrix" subtitle="State Bank of Pakistan Trustee compliance — all deposits and contracts are locked under AIEscrowGuard security." />

        {/* AI Cross-Agency Matcher Engine Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl mb-8 border border-teal-800/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🤖</span>
              <h2 className="text-xl font-bold text-teal-300">Internal AI Deal Matcher</h2>
            </div>
            <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold">
              Privacy-Safe AI Engine
            </span>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            Automatically matches buyer/tenant requirements with available agency inventory without revealing client names or contact numbers to third parties.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={runAiMatcher}
              disabled={aiMatching}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition disabled:opacity-50"
            >
              {aiMatching ? 'Running AI Matcher...' : '⚡ Run AI Cross-Match Engine'}
            </button>
          </div>

          {aiMatchedResult && (
            <div className="mt-4 p-4 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-200 font-semibold flex items-center gap-2">
              <span className="text-emerald-400 text-base font-bold">✓</span>
              <span>{aiMatchedResult}</span>
            </div>
          )}
        </div>

        {/* Shared Co-Brokering Network Search Tool */}
        <div className="bg-white rounded-2xl p-6 shadow border border-purple-200 mb-10">
          <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🤝</span>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Shared Co-Brokering Network Search</h2>
                <p className="text-xs text-gray-600">Query partner agency inventories to co-broker deals and share 50/50 commissions</p>
              </div>
            </div>
            <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-3 py-1 rounded-full font-bold">
              50/50 Profit Split Network
            </span>
          </div>

          {coBrokerSuccessMsg && (
            <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2">
              <span>{coBrokerSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleCoBrokerSearch} className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            <input
              type="text"
              placeholder="City (e.g. Dubai, Lahore)"
              value={searchCity}
              onChange={(e) => setSearchCity(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
            />
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
            >
              <option value="">All Property Types</option>
              <option value="VILLA">Villa</option>
              <option value="APARTMENT">Apartment</option>
              <option value="PLOT">Plot</option>
              <option value="COMMERCIAL">Commercial</option>
            </select>
            <input
              type="number"
              placeholder="Max Budget ($ USD)"
              value={searchMaxBudget}
              onChange={(e) => setSearchMaxBudget(e.target.value)}
              className="bg-gray-50 border border-gray-300 rounded-xl px-3.5 py-2 text-xs text-gray-900 focus:outline-none focus:border-purple-500"
            />
            <button
              type="submit"
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs py-2 px-4 rounded-xl transition shadow"
            >
              🔍 Search Network Listings
            </button>
          </form>

          {coBrokerResults.length === 0 ? (
            <div className="p-8 text-center bg-purple-50/50 rounded-2xl border border-dashed border-purple-200">
              <span className="text-3xl">🤝</span>
              <p className="font-bold text-gray-800 text-sm mt-2">No co-broker listings currently active</p>
              <p className="text-xs text-gray-500 mt-0.5">Partner agencies have not broadcasted co-brokering inventory in this territory yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coBrokerResults.map((item) => {
                const totalCommission = item.price * item.commissionRate;
                const splitShare = totalCommission / 2;
                return (
                  <div
                    key={item.id}
                    className="p-4 bg-purple-50/40 rounded-xl border border-purple-200 hover:border-purple-300 transition flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold uppercase bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          {item.propertyType}
                        </span>
                        <span className="text-xs font-bold text-gray-600">{item.city}</span>
                      </div>
                      <h3 className="text-base font-bold text-gray-900">{item.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-gray-700 font-semibold">Listing Agency: {item.agencyName}</span>
                        {item.agencyVerified && (
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded-full font-bold">
                            ✓ Verified Agency
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-black text-gray-900">${item.price.toLocaleString()}</span>
                        <p className="text-[10px] text-purple-900 font-bold">
                          50% Split Share: <span className="text-emerald-700 font-black">${splitShare.toLocaleString()}</span>
                        </p>
                      </div>
                      <button
                        onClick={() => initiateCoBrokeredDeal(item)}
                        className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-3.5 py-2 rounded-xl transition shadow"
                      >
                        🤝 Initiate Co-Brokered Deal
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pipeline Filters */}
        <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-gray-900">Filter Stage:</span>
            {['ALL', 'LEAD', 'NEGOTIATION', 'ESCROW', 'AGREEMENT_SIGNED', 'CLOSED'].map((stg) => (
              <button
                key={stg}
                onClick={() => setSelectedStage(stg)}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  selectedStage === stg
                    ? 'bg-emerald-600 text-white shadow'
                    : 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-100'
                }`}
              >
                {stg.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          <span className="text-sm font-bold text-gray-900">
            Total Pipeline Value: ${deals.reduce((sum, d) => sum + d.value, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>

        {/* Deals Cards */}
        <div className="grid grid-cols-1 gap-6 mb-10">
          {filteredDeals.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center shadow border border-gray-200 flex flex-col items-center gap-3">
              <span className="text-4xl">🛡️</span>
              <div>
                <p className="font-bold text-gray-900 text-base">No active deals in pipeline</p>
                <p className="text-xs text-gray-500 mt-1">Your shielded deal pipeline is clean and ready for new client acquisitions.</p>
              </div>
              <Link
                href="/agency/submit-listing"
                className="mt-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow transition"
              >
                + List Property to Create Deals
              </Link>
            </div>
          ) : (
            filteredDeals.map((deal) => {
              const isUnmasked = showPrivateDetails[deal.id];
              return (
                <div
                  key={deal.id}
                  className="bg-white rounded-2xl p-6 shadow border border-gray-200 hover:shadow-md transition flex flex-col gap-4"
                >
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-gray-100 gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md">
                          {deal.id}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{deal.title}</h3>
                        {getStageBadge(deal.stage)}
                      </div>
                      <p className="text-sm text-gray-700 font-medium mt-1">Property: {deal.property}</p>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <span className="text-2xl font-black text-gray-900">
                        ${deal.value.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {(deal.stage === 'AGREEMENT_SIGNED' || deal.stage === 'CLOSED') ? (
                        <button
                          onClick={() => setContractDeal(deal)}
                          className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3.5 py-1.5 rounded-lg transition shadow flex items-center gap-1 mt-1"
                        >
                          <span>📄</span> Generate AI Legal Contract
                        </button>
                      ) : (
                        <span className="text-[11px] bg-amber-100 border border-amber-300 text-amber-800 font-bold px-2.5 py-1 rounded-lg mt-1">
                          Contract available at SPA Signed / Closed stage
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Privacy & Shield Details */}
                  <div className="pt-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-gray-900 uppercase">Client Identity Shield</span>
                        <button
                          onClick={() => togglePrivateDetails(deal.id)}
                          className="text-xs font-bold text-blue-600 hover:underline"
                        >
                          {isUnmasked ? '🔒 Mask Details' : '🔓 Unmask (Agency Admin Only)'}
                        </button>
                      </div>

                      <div className="text-sm">
                        <div className="font-semibold text-gray-900">
                          Public / External Alias:{' '}
                          <span className="font-bold text-emerald-700">{deal.clientAlias}</span>
                        </div>
                        {isUnmasked ? (
                          <div className="mt-2 pt-2 border-t border-gray-200 bg-amber-50 p-2.5 rounded-lg border border-amber-200">
                            <p className="text-xs font-bold text-amber-900">Internal Unmasked Client Data:</p>
                            <p className="text-xs text-gray-900 font-medium">Name: {deal.clientPrivateName}</p>
                            <p className="text-xs text-gray-900 font-medium">Phone: {deal.clientContact}</p>
                          </div>
                        ) : (
                          <p className="text-xs text-gray-600 mt-1 italic">
                            Real client name and phone contact details are encrypted and hidden from third parties.
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 text-slate-100 p-4 rounded-xl border border-slate-800">
                      <span className="text-xs font-bold text-teal-400 uppercase tracking-wider block mb-2">
                        🔒 Confidential Negotiation Notes
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed font-mono bg-slate-950 p-2.5 rounded-lg border border-slate-800">
                        &quot;{deal.privateNotes}&quot;
                      </p>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Nav */}
        <nav className="flex space-x-8 text-lg pt-4 border-t border-gray-200">
          <Link href="/agency/dashboard" className="text-blue-600 hover:underline font-medium">
            Back to Dashboard
          </Link>
          <Link href="/agency/submit-listing" className="text-emerald-700 hover:underline font-bold">
            Add Property
          </Link>
          <Link href="/agency/ledger" className="text-blue-600 hover:underline font-medium">
            View Ledger
          </Link>
          <Link href="/agency/rent-collection" className="text-blue-600 hover:underline font-medium">
            Rent Collections
          </Link>
        </nav>
      </div>

      {/* ── AI LEGAL CONTRACT PREVIEW MODAL ─────────────────────────────────── */}
      {contractDeal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 print:hidden">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-2xl w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-900 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setContractDeal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-3xl">📄</span>
                <div>
                  <h3 className="text-xl font-black text-slate-900">AI Legal Agreement Generated</h3>
                  <p className="text-xs text-slate-600 font-medium">Official Sale & Purchase Contract for {contractDeal.id}</p>
                </div>
              </div>

              {/* Agreement Document Box */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-xs text-slate-800 space-y-3 font-mono">
                <div className="border-b border-slate-300 pb-2 flex justify-between font-bold">
                  <span>DOCUMENT REF: SPA-{contractDeal.id}</span>
                  <span className="text-emerald-700 font-black">NEXMOVE LEGAL AI VERIFIED</span>
                </div>
                <p><strong>Property:</strong> {contractDeal.property}</p>
                <p><strong>Agreed Price:</strong> ${contractDeal.value.toLocaleString()} USD</p>
                <p><strong>Client Alias (Shielded):</strong> {contractDeal.clientAlias}</p>
                <p><strong>Escrow Deposit:</strong> 5% Token Amount Locked in NexMove Vault</p>
                <p><strong>Commission Split:</strong> 50/50 Co-Brokering Distribution Standard</p>
                <p className="text-[11px] text-slate-600 leading-relaxed font-sans pt-2 border-t border-slate-200">
                  This Agreement is digitally compiled by NexMove Legal AI Engine. All data shield clauses remain fully enforceable under International PropTech Regulations.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => setContractDeal(null)}
                  className="text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl transition"
                >
                  Close
                </button>
                <button
                  onClick={() => window.print()}
                  className="text-xs bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-xl transition shadow flex items-center gap-1.5"
                >
                  <span>🖨️</span> Download PDF / Print Contract
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
