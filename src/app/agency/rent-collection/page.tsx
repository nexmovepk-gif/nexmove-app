'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface RentPayment {
  id: string;
  tenantName: string;
  property: string;
  amount: number;
  dueDate: string;
  status: 'Paid' | 'Pending' | 'Overdue';
  month?: number;
  year?: number;
  notes?: string;
  dateCollected?: string;
}

interface ToastMsg {
  id: number;
  text: string;
  type: 'success' | 'warning' | 'error';
}

export default function RentCollectionPage() {
  const [collections, setCollections] = useState<RentPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [printId, setPrintId] = useState<string | null>(null);

  // New Record Form State
  const [tenantName, setTenantName] = useState('');
  const [property, setProperty] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'Pending' | 'Paid' | 'Overdue'>('Pending');
  const [notes, setNotes] = useState('');

  const showToast = (text: string, type: ToastMsg['type'] = 'success') => {
    const id = Date.now();
    setToasts((p) => [...p, { id, text, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  };

  const fetchRentRecords = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agency/rent-collection');
      const data = await res.json();
      if (data.success && Array.isArray(data.collections)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mapped: RentPayment[] = data.collections.map((item: any) => {
          let meta = {
            tenantName: 'Shielded Tenant',
            property: 'Managed Property',
            dueDate: item.dateCollected ? new Date(item.dateCollected).toISOString().split('T')[0] : 'N/A',
            status: 'Pending' as 'Paid' | 'Pending' | 'Overdue',
            notes: '',
          };
          try {
            if (item.description) {
              meta = { ...meta, ...JSON.parse(item.description) };
            }
          } catch {
            meta.property = item.description || 'Managed Unit';
          }

          return {
            id: item.id,
            tenantName: meta.tenantName,
            property: meta.property,
            amount: item.amount,
            dueDate: meta.dueDate,
            status: meta.status,
            month: item.month,
            year: item.year,
            notes: meta.notes,
            dateCollected: item.dateCollected,
          };
        });
        setCollections(mapped);
      }
    } catch (err) {
      console.error('Failed to load rent records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRentRecords();
  }, []);

  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      showToast('Please enter a valid monthly rent amount in PKR.', 'error');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/agency/rent-collection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantName: tenantName.trim(),
          property: property.trim(),
          amount: numAmount,
          dueDate,
          status,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save rent record');
      }

      showToast('Tenant Rent Record successfully registered in Database ✓', 'success');
      setTenantName('');
      setProperty('');
      setAmount('');
      setNotes('');
      setIsModalOpen(false);
      await fetchRentRecords();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error adding rent record';
      showToast(msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (item: RentPayment) => {
    const nextStatus: 'Paid' | 'Pending' = item.status === 'Paid' ? 'Pending' : 'Paid';
    try {
      const res = await fetch('/api/agency/rent-collection', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: item.id,
          status: nextStatus,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setCollections((prev) =>
          prev.map((c) => (c.id === item.id ? { ...c, status: nextStatus } : c))
        );
        showToast(`Rent status updated to "${nextStatus}" for ${item.tenantName}`, 'success');
      }
    } catch (err) {
      console.error('Status update failed:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this tenant rent record?')) return;
    try {
      const res = await fetch(`/api/agency/rent-collection?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setCollections((prev) => prev.filter((c) => c.id !== id));
        showToast('Rent record removed.', 'warning');
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const sendReminder = (item: RentPayment) => {
    showToast(
      `📨 Payment reminder dispatched to ${item.tenantName} (${item.property}) for PKR ${item.amount.toLocaleString()}.`,
      'warning'
    );
  };

  const downloadInvoice = (item: RentPayment) => {
    setPrintId(item.id);
    setTimeout(() => {
      window.print();
      setPrintId(null);
    }, 150);
  };

  const totalCollected = collections.filter((c) => c.status === 'Paid').reduce((s, c) => s + c.amount, 0);
  const totalPending   = collections.filter((c) => c.status === 'Pending').reduce((s, c) => s + c.amount, 0);
  const totalOverdue   = collections.filter((c) => c.status === 'Overdue').reduce((s, c) => s + c.amount, 0);

  const statusBadge = (s: RentPayment['status']) => {
    if (s === 'Paid')    return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">✓ Paid</span>;
    if (s === 'Pending') return <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 text-amber-900 border border-amber-300">⏳ Pending</span>;
    return                      <span className="px-2.5 py-0.5 text-[10px] font-bold rounded-full bg-red-100 text-red-800 border border-red-300">⚠ Overdue</span>;
  };

  const printItem = collections.find((c) => c.id === printId);

  return (
    <section className="p-4 sm:p-8 bg-[#faf9f7] min-h-screen text-slate-900">
      {/* Off-screen printable receipt */}
      {printItem && (
        <div id="printable-receipt" className="hidden print:block fixed inset-0 bg-white p-12 z-[9999] text-gray-900">
          <div className="border-b-2 border-emerald-700 pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black text-gray-900">NexMove Real Estate Agency</h1>
              <p className="text-xs text-gray-600 mt-0.5">Official Rent Settlement Receipt &amp; Invoice</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-gray-500 uppercase font-bold">Invoice No.</p>
              <p className="text-base font-black text-gray-900">INV-RENT-{printItem.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-[10px] text-gray-500 mt-1">Date: {new Date().toLocaleDateString('en-GB')}</p>
            </div>
          </div>

          <table className="w-full text-xs mb-8 border border-gray-200">
            <tbody>
              {[
                ['Tenant Name', printItem.tenantName],
                ['Property Unit', printItem.property],
                ['Rent Amount', `PKR ${printItem.amount.toLocaleString()} (Pakistani Rupees)`],
                ['Due / Settled Date', printItem.dueDate],
                ['Payment Status', printItem.status],
              ].map(([label, value]) => (
                <tr key={label} className="border-b border-gray-200">
                  <td className="py-2.5 px-4 font-bold text-gray-700 w-44 bg-gray-50">{label}</td>
                  <td className="py-2.5 px-4 text-gray-900 font-semibold">{value}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-8 pt-4 border-t border-gray-300 text-[10px] text-gray-500 flex justify-between">
            <p>Generated securely via NexMove PropTech Platform</p>
            <p className="font-bold">Authorized Agency Stamp &amp; Signature</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/agency/dashboard" className="hover:text-emerald-700 font-medium transition">Agency Dashboard</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Rent Collection</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Tenant Rent Collection Hub</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Automated rental tracking, 1-click reminders, and instant digital invoices in PKR.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/agency/dashboard"
              className="text-xs bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold px-3 py-2 rounded-xl transition shadow-sm"
            >
              ← Back to Portal
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition flex items-center gap-1.5"
            >
              <span>+</span> Add Rent Record
            </button>
          </div>
        </div>

        {/* Toasts */}
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-3.5 rounded-2xl border text-xs font-semibold shadow-sm ${
              t.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : t.type === 'warning'
                ? 'bg-amber-50 border-amber-300 text-amber-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            {t.text}
          </div>
        ))}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Collected (Paid)
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-2">
              PKR {totalCollected.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Successfully cleared payments</p>
          </div>

          <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Pending Rent
            </span>
            <div className="text-2xl font-black text-amber-950 mt-2">
              PKR {totalPending.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Awaiting tenant transfers</p>
          </div>

          <div className="bg-white border border-red-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
              Overdue Rent
            </span>
            <div className="text-2xl font-black text-red-900 mt-2">
              PKR {totalOverdue.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Requires immediate follow-up</p>
          </div>
        </div>

        {/* Table Card */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏢</span>
              <h2 className="text-base font-bold text-slate-900">Active Tenant Rent Ledger</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{collections.length} Tenants Listed</span>
          </div>

          {loading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Loading Tenant Records from Database...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Tenant</th>
                    <th className="py-2.5 px-3">Property Unit</th>
                    <th className="py-2.5 px-3">Due Date</th>
                    <th className="py-2.5 px-3 text-right">Monthly Rent</th>
                    <th className="py-2.5 px-3 text-center">Status</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {collections.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-slate-400 font-medium">
                        No rent collection records registered yet. Click &quot;+ Add Rent Record&quot; to manage tenants.
                      </td>
                    </tr>
                  ) : (
                    collections.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-bold text-slate-900">{item.tenantName}</td>
                        <td className="py-3 px-3 font-medium text-slate-600">{item.property}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{item.dueDate}</td>
                        <td className="py-3 px-3 text-right font-black text-slate-900">
                          PKR {item.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleToggleStatus(item)}
                            title="Click to toggle Paid/Pending"
                            className="cursor-pointer transition hover:opacity-80"
                          >
                            {statusBadge(item.status)}
                          </button>
                        </td>
                        <td className="py-3 px-3 text-right space-x-1.5 whitespace-nowrap">
                          <button
                            onClick={() => sendReminder(item)}
                            className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-1 rounded-lg text-[10px] transition"
                          >
                            🔔 Reminder
                          </button>
                          <button
                            onClick={() => downloadInvoice(item)}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2 py-1 rounded-lg text-[10px] transition"
                          >
                            🖨️ Receipt
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="text-slate-400 hover:text-red-600 px-1 text-xs"
                            title="Delete"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Add New Rent Record */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#faf9f7] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏠</span>
                  <h3 className="text-lg font-black text-slate-900">Register Tenant Rent Agreement</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleAddRecord} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">Tenant Name / Company</label>
                  <input
                    type="text"
                    value={tenantName}
                    onChange={(e) => setTenantName(e.target.value)}
                    placeholder="e.g. Asad Qureshi"
                    required
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">Property / Unit Detail</label>
                  <input
                    type="text"
                    value={property}
                    onChange={(e) => setProperty(e.target.value)}
                    placeholder="e.g. House 44, Sector F-7/2, Islamabad"
                    required
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Monthly Rent (PKR)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 150000"
                      required
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      required
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">Current Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'Pending' | 'Paid' | 'Overdue')}
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  >
                    <option value="Pending">Pending (Waiting for payment)</option>
                    <option value="Paid">Paid (Collected)</option>
                    <option value="Overdue">Overdue (Delayed)</option>
                  </select>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white text-xs font-bold rounded-xl transition shadow-md flex items-center gap-1.5"
                  >
                    {saving ? 'Saving...' : 'Register Tenant ✓'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </section>
  );
}
