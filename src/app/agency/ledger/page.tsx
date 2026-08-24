'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface LedgerItem {
  id: string;
  date: string;
  amount: number;
  description: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE';
  createdBy?: {
    name: string | null;
    email: string;
  };
}

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COMMISSION');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchLedger = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agency/ledger');
      const data = await res.json();
      if (data.success && Array.isArray(data.entries)) {
        setEntries(data.entries);
      }
    } catch (err) {
      console.error('Failed to load agency ledger:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setMessage({ text: 'Please enter a valid amount in PKR.', type: 'error' });
      return;
    }

    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch('/api/agency/ledger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          amount: numAmount,
          description: description.trim(),
          category,
          date,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to save transaction');
      }

      setMessage({ text: 'Transaction recorded successfully in Database ✓', type: 'success' });
      setAmount('');
      setDescription('');
      setIsModalOpen(false);
      await fetchLedger();
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Error saving transaction';
      setMessage({ text: errMsg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this ledger entry?')) return;

    try {
      const res = await fetch(`/api/agency/ledger?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setEntries((prev) => prev.filter((item) => item.id !== id));
        setMessage({ text: 'Transaction deleted successfully.', type: 'success' });
      }
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const incomeEntries = entries.filter((e) => e.type === 'INCOME');
  const expenseEntries = entries.filter((e) => e.type === 'EXPENSE');

  const totalIncome = incomeEntries.reduce((sum, item) => sum + item.amount, 0);
  const totalExpense = expenseEntries.reduce((sum, item) => sum + item.amount, 0);
  const netProfit = totalIncome - totalExpense;

  return (
    <section className="p-4 sm:p-8 bg-[#faf9f7] min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header & Breadcrumbs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/agency/dashboard" className="hover:text-emerald-700 font-medium transition">Agency Dashboard</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Financial Ledger</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Agency Financial Ledger</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Secure double-entry bookkeeping for deals commission, operating costs, and net agency revenue in PKR.
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
              <span>+</span> Add Transaction
            </button>
          </div>
        </div>

        {/* Notification Toast */}
        {message && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
              message.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <span>{message.text}</span>
            <button onClick={() => setMessage(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Financial KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Total Inflow (Income)
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-2">
              PKR {totalIncome.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{incomeEntries.length} verified income transactions</p>
          </div>

          <div className="bg-white border border-red-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-red-800 bg-red-100 px-2.5 py-0.5 rounded-full">
              Total Outflow (Expenses)
            </span>
            <div className="text-2xl font-black text-red-900 mt-2">
              PKR {totalExpense.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{expenseEntries.length} operating expense entries</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Net Agency Cashflow
            </span>
            <div className={`text-2xl font-black mt-2 ${netProfit >= 0 ? 'text-slate-900' : 'text-red-700'}`}>
              PKR {netProfit.toLocaleString()}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {netProfit >= 0 ? '✓ Profitable Agency Margin' : '⚠ Deficit Period'}
            </p>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col items-center justify-center gap-2">
            <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-500 font-semibold">Synchronizing Live Ledger with Database...</p>
          </div>
        )}

        {/* 1. Income Ledger Table */}
        {!loading && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📈</span>
                <h2 className="text-base font-bold text-slate-900">Income Entries (Credits)</h2>
              </div>
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                Subtotal: PKR {totalIncome.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {incomeEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                        No income entries recorded yet. Click &quot;+ Add Transaction&quot; to log deal commissions.
                      </td>
                    </tr>
                  ) : (
                    incomeEntries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {new Date(entry.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {entry.category || 'COMMISSION'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{entry.description}</td>
                        <td className="py-3 px-3 text-right font-black text-emerald-700">
                          +PKR {entry.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDelete(entry.id)}
                            className="text-slate-400 hover:text-red-600 text-xs transition"
                            title="Delete Entry"
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
          </div>
        )}

        {/* 2. Expense Ledger Table */}
        {!loading && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📉</span>
                <h2 className="text-base font-bold text-slate-900">Operating Expenses (Debits)</h2>
              </div>
              <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-3 py-1 rounded-full">
                Subtotal: PKR {totalExpense.toLocaleString()}
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3 text-right">Amount (PKR)</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {expenseEntries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-6 text-slate-400 font-medium">
                        No expense records recorded yet. Log staff salaries, fuel, marketing, or maintenance costs.
                      </td>
                    </tr>
                  ) : (
                    expenseEntries.map((exp) => (
                      <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {new Date(exp.date).toLocaleDateString('en-GB')}
                        </td>
                        <td className="py-3 px-3">
                          <span className="bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full text-[10px]">
                            {exp.category || 'EXPENSE'}
                          </span>
                        </td>
                        <td className="py-3 px-3 font-medium text-slate-900">{exp.description}</td>
                        <td className="py-3 px-3 text-right font-black text-red-700">
                          -PKR {exp.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => handleDelete(exp.id)}
                            className="text-slate-400 hover:text-red-600 text-xs transition"
                            title="Delete Entry"
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
          </div>
        )}

        {/* Modal: Add New Transaction */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#faf9f7] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">💳</span>
                  <h3 className="text-lg font-black text-slate-900">Record Financial Transaction</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Transaction Type</label>
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="INCOME">Income / Credit (+)</option>
                      <option value="EXPENSE">Expense / Debit (-)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Category</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      {type === 'INCOME' ? (
                        <>
                          <option value="COMMISSION">Deal Commission</option>
                          <option value="RENT">Rent Management Fee</option>
                          <option value="CONSULTANCY">Consultancy / Token</option>
                          <option value="OTHER">Other Inflow</option>
                        </>
                      ) : (
                        <>
                          <option value="SALARY">Staff Salary</option>
                          <option value="MARKETING">Marketing &amp; Ads (Zameen/FB)</option>
                          <option value="MAINTENANCE">Property Maintenance</option>
                          <option value="UTILITIES">Office Rent &amp; Utilities</option>
                          <option value="OTHER">Other Expense</option>
                        </>
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Amount (PKR)</label>
                    <input
                      type="number"
                      step="1"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="e.g. 50000"
                      required
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Date</label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      required
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">Description / Details</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="e.g. 2% Commission for 1 Kanal DHA Phase 6 Villa"
                    required
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
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
                    {saving ? 'Saving...' : 'Save to Ledger ✓'}
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
