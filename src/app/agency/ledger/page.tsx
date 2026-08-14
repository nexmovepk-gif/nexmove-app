'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface LedgerItem {
  id: string | number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  type: 'INCOME' | 'EXPENSE';
}

const INITIAL_INCOME: LedgerItem[] = [];

const INITIAL_EXPENSES: LedgerItem[] = [];

export default function LedgerPage() {
  const [incomeEntries, setIncomeEntries] = useState<LedgerItem[]>(INITIAL_INCOME);
  const [expenseEntries, setExpenseEntries] = useState<LedgerItem[]>(INITIAL_EXPENSES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('COMMISSION');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const newItem: LedgerItem = {
      id: `tx-${Date.now()}`,
      date: new Date().toISOString(),
      amount: numAmount,
      description: description || (type === 'INCOME' ? 'New Income Transaction' : 'New Expense Transaction'),
      category,
      type,
    };

    if (type === 'INCOME') {
      setIncomeEntries((prev) => [newItem, ...prev]);
    } else {
      setExpenseEntries((prev) => [newItem, ...prev]);
    }

    // Reset form
    setAmount('');
    setDescription('');
    setIsModalOpen(false);
  };

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Agency Ledger</h1>
            <p className="text-sm text-gray-700 mt-1 font-medium">Real-time financial tracking for income and operating expenses</p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 md:mt-0 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg shadow transition"
          >
            + Add Transaction
          </button>
        </div>

        {/* Income Table */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Income Entries</h2>
            <span className="text-sm font-semibold text-green-700 bg-green-100 px-3 py-1 rounded-full">
              Total: ${incomeEntries.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {incomeEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-700">No income entries recorded.</td>
                  </tr>
                ) : (
                  incomeEntries.map((entry) => (
                    <tr key={entry.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(entry.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{entry.category || 'COMMISSION'}</td>
                      <td className="px-6 py-4 text-sm text-green-700 font-bold whitespace-nowrap">
                        +${entry.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{entry.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expenses Table */}
        <div className="mb-10">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Expense Entries</h2>
            <span className="text-sm font-semibold text-red-700 bg-red-100 px-3 py-1 rounded-full">
              Total: ${expenseEntries.reduce((sum, item) => sum + item.amount, 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {expenseEntries.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-700">No expense entries recorded.</td>
                  </tr>
                ) : (
                  expenseEntries.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{new Date(exp.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{exp.category || 'EXPENSE'}</td>
                      <td className="px-6 py-4 text-sm text-red-700 font-bold whitespace-nowrap">
                        -${exp.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{exp.description}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal Dialog for Add Transaction */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl p-6 md:p-8 max-w-lg w-full shadow-2xl border border-gray-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Add New Transaction</h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-gray-500 hover:text-gray-900 font-bold text-xl"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-900">Transaction Type</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="INCOME">Income (+)</option>
                    <option value="EXPENSE">Expense (-)</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-900">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="COMMISSION">Commission</option>
                    <option value="RENT">Rent Collection</option>
                    <option value="SALARY">Staff Salary</option>
                    <option value="MARKETING">Marketing & Ads</option>
                    <option value="MAINTENANCE">Maintenance</option>
                    <option value="UTILITIES">Utilities</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-900">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2500"
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-bold text-gray-900">Description</label>
                  <input
                    type="text"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief detail about the transaction"
                    required
                    className="w-full bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-3 mt-4">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow"
                  >
                    Save Entry
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <nav className="flex space-x-8 text-lg pt-4 border-t border-gray-200">
          <Link href="/agency/dashboard" className="text-blue-600 hover:underline font-medium">Back to Dashboard</Link>
          <Link href="/agency/leaderboard" className="text-blue-600 hover:underline font-medium">Agent Leaderboard</Link>
          <Link href="/agency/rent-collection" className="text-blue-600 hover:underline font-medium">Rent Collections</Link>
        </nav>
      </div>
    </section>
  );
}
