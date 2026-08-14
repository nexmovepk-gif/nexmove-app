'use client';

import React, { useState } from 'react';
import Link from 'next/link';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RentPayment {
  id: string;
  tenantName: string;
  property: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
}

interface ToastMsg {
  id: number;
  text: string;
  type: 'success' | 'warning';
}

// ─── Initial State (Clean Production Zero State) ───────────────────────────────

const INITIAL_COLLECTIONS: RentPayment[] = [];

// ─── Component ────────────────────────────────────────────────────────────────

export default function RentCollectionPage() {
  const [collections]        = useState<RentPayment[]>(INITIAL_COLLECTIONS);
  const [toasts, setToasts]  = useState<ToastMsg[]>([]);
  const [printId, setPrintId] = useState<string | null>(null);

  // ── Toast helper ────────────────────────────────────────────────────────────
  const showToast = (text: string, type: ToastMsg['type'] = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  // ── Send reminder ───────────────────────────────────────────────────────────
  const sendReminder = (item: RentPayment) => {
    showToast(
      `📨 Payment reminder sent to Tenant #${item.id} (${item.property}) for $${item.amount.toLocaleString()}.`,
      'warning'
    );
  };

  // ── Download invoice (print-to-PDF) ────────────────────────────────────────
  const downloadInvoice = (item: RentPayment) => {
    setPrintId(item.id);
    setTimeout(() => {
      window.print();
      setPrintId(null);
    }, 120);
  };

  // ── Stats ───────────────────────────────────────────────────────────────────
  const totalCollected = collections.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const totalPending   = collections.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.amount, 0);
  const totalOverdue   = collections.filter((c) => c.status === 'Overdue').reduce((s, c) => s + c.amount, 0);

  // ── Status badge ─────────────────────────────────────────────────────────────
  const statusBadge = (s: RentPayment['status']) => {
    if (s === 'Paid')    return <span className="px-3 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">✓ Paid</span>;
    if (s === 'Pending') return <span className="px-3 py-1 text-xs font-bold rounded-full bg-yellow-100 text-yellow-800">⏳ Pending</span>;
    return                      <span className="px-3 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">⚠ Overdue</span>;
  };

  // ── Print receipt (rendered off-screen when printId is set) ─────────────────
  const printItem = collections.find((c) => c.id === printId);

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      {/* ── Off-screen printable receipt ───────────────────────────────────── */}
      {printItem && (
        <div id="printable-receipt" className="hidden print:block fixed inset-0 bg-white p-16 z-[9999] text-gray-900">
          <div className="border-b-2 border-gray-900 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-black text-gray-900">NexMove Agency</h1>
              <p className="text-sm text-gray-600 mt-1">Official Rent Receipt / Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500">Invoice No.</p>
              <p className="text-lg font-bold text-gray-900">INV-RC-{printItem.id.padStart(4, '0')}</p>
              <p className="text-xs text-gray-500 mt-1">Issued: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          <table className="w-full text-sm mb-8">
            <tbody>
              {[
                ['Tenant',   `Tenant #${printItem.id} (Shielded)`],
                ['Property', printItem.property],
                ['Amount',   `$${printItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`],
                ['Due Date', printItem.dueDate],
                ['Status',   printItem.status],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-200">
                  <td className="py-3 pr-8 font-bold text-gray-700 w-40">{label}</td>
                  <td className="py-3 text-gray-900 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="bg-gray-100 rounded-xl p-6 flex justify-between items-center">
            <p className="text-gray-600 font-medium text-sm">Total Amount Due / Paid</p>
            <p className="text-2xl font-black text-gray-900">
              ${printItem.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>

          <p className="mt-10 text-xs text-gray-400 text-center">
            This receipt is generated by NexMove PropTech Platform. For disputes, contact your property manager.
          </p>
        </div>
      )}

      <div className="max-w-6xl mx-auto print:hidden">
        {/* ── Page Header ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Rent Collections</h1>
            <p className="text-sm text-gray-700 font-medium mt-1">
              Track, invoice, and send reminders for all tenant rent payments.
            </p>
          </div>
          <Link href="/agency/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        {/* ── KPI Summary Cards ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div className="bg-white rounded-2xl p-5 shadow border border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Total Collected</p>
            <p className="text-3xl font-black text-emerald-700">
              ${totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{collections.filter((c) => c.status === 'Paid').length} payments received</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow border border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Pending</p>
            <p className="text-3xl font-black text-yellow-600">
              ${totalPending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{collections.filter((c) => c.status === 'Pending').length} payments awaiting</p>
          </div>
          <div className="bg-white rounded-2xl p-5 shadow border border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-1">Overdue</p>
            <p className="text-3xl font-black text-red-600">
              ${totalOverdue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 mt-1">{collections.filter((c) => c.status === 'Overdue').length} payments overdue</p>
          </div>
        </div>

        {/* ── Rent Table ───────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Payment Records</h2>
            <span className="text-xs text-gray-500">{collections.length} tenants total</span>
          </div>
          <div className="overflow-x-auto">
            {collections.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center gap-3">
                <span className="text-4xl">💳</span>
                <div>
                  <p className="font-bold text-gray-800 text-base">No rent collections recorded yet</p>
                  <p className="text-xs text-gray-500 mt-1">Tenant invoices, rent ledgers, and automated payment receipts will appear here.</p>
                </div>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-100">
                <thead className="bg-gray-50">
                  <tr>
                    {['Tenant', 'Property', 'Amount', 'Due Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {collections.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm font-bold text-gray-900">{item.tenantName}</p>
                        <p className="text-xs text-gray-500">Tenant #{item.id}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-medium">{item.property}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                        ${item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{item.dueDate}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{statusBadge(item.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          {/* Download Invoice */}
                          <button
                            onClick={() => downloadInvoice(item)}
                            title="Download Invoice PDF"
                            className="text-xs bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg transition flex items-center gap-1"
                          >
                            <span>📄</span> Invoice
                          </button>

                          {/* Send Reminder – only for non-Paid */}
                          {item.status !== 'Paid' && (
                            <button
                              onClick={() => sendReminder(item)}
                              title="Send Payment Reminder"
                              className="text-xs bg-amber-500 hover:bg-amber-600 text-white font-bold px-3.5 py-1.5 rounded-lg transition flex items-center gap-1"
                            >
                              <span>📨</span> Remind
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ── Bottom Nav ─────────────────────────────────────────────────────── */}
        <nav className="flex flex-wrap gap-6 text-sm pt-4 border-t border-gray-200">
          <Link href="/agency/dashboard"      className="text-blue-600 hover:underline font-medium">Back to Dashboard</Link>
          <Link href="/agency/ledger"         className="text-blue-600 hover:underline font-medium">View Ledger</Link>
          <Link href="/agency/leaderboard"    className="text-blue-600 hover:underline font-medium">Agent Leaderboard</Link>
          <Link href="/agency/deals"          className="text-emerald-700 hover:underline font-bold">Deal Pipeline</Link>
        </nav>
      </div>

      {/* ── Toast Notifications ───────────────────────────────────────────── */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-2 z-50 print:hidden">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-5 py-3 rounded-xl shadow-xl text-sm font-semibold text-white flex items-center gap-2 animate-fade-in
              ${t.type === 'success' ? 'bg-emerald-600' : 'bg-amber-600'}`}
          >
            <span>{t.text}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
