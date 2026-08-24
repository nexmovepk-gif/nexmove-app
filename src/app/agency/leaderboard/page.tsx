'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface AgentLeader {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  isKycVerified: boolean;
  listingsCount: number;
  dealsCount: number;
  joinedAt: string;
}

export default function LeaderboardPage() {
  const [agents, setAgents] = useState<AgentLeader[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'AGENCY_AGENT' | 'AGENCY_MANAGER'>('AGENCY_AGENT');
  const [password, setPassword] = useState('');

  const fetchAgents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/agency/agents');
      const data = await res.json();
      if (data.success && Array.isArray(data.agents)) {
        // Sort agents by listingsCount desc, then dealsCount desc
        const sorted = [...data.agents].sort(
          (a, b) => (b.listingsCount + b.dealsCount * 2) - (a.listingsCount + a.dealsCount * 2)
        );
        setAgents(sorted);
      }
    } catch (err) {
      console.error('Failed to load agents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const handleInviteAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      setToast({ text: 'Please fill in all required fields.', type: 'error' });
      return;
    }

    setSaving(true);
    setToast(null);

    try {
      const res = await fetch('/api/agency/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          role,
          password: password.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to invite agent');
      }

      setToast({
        text: `Agent "${name}" registered! Login credentials dispatched to ${email} ✓`,
        type: 'success',
      });
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setIsModalOpen(false);
      await fetchAgents();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Error registering agent';
      setToast({ text: msg, type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveAgent = async (id: string, agentName: string) => {
    if (!confirm(`Are you sure you want to remove "${agentName}" from your agency?`)) return;

    try {
      const res = await fetch(`/api/agency/agents?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setAgents((prev) => prev.filter((a) => a.id !== id));
        setToast({ text: `Agent "${agentName}" unlinked from agency.`, type: 'success' });
      }
    } catch (err) {
      console.error('Failed to remove agent:', err);
    }
  };

  const totalListings = agents.reduce((sum, a) => sum + a.listingsCount, 0);
  const totalDeals = agents.reduce((sum, a) => sum + a.dealsCount, 0);
  const topAgent = agents.length > 0 ? agents[0] : null;

  const getRankBadge = (index: number) => {
    if (index === 0) return <span className="text-xl" title="Rank 1: Gold Producer">🥇</span>;
    if (index === 1) return <span className="text-xl" title="Rank 2: Silver Producer">🥈</span>;
    if (index === 2) return <span className="text-xl" title="Rank 3: Bronze Producer">🥉</span>;
    return <span className="font-mono font-bold text-xs text-slate-500">#{index + 1}</span>;
  };

  return (
    <section className="p-4 sm:p-8 bg-[#faf9f7] min-h-screen text-slate-900">
      <div className="max-w-6xl mx-auto space-y-6">

        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
              <Link href="/agency/dashboard" className="hover:text-emerald-700 font-medium transition">Agency Dashboard</Link>
              <span>/</span>
              <span className="text-slate-900 font-bold">Agent Leaderboard</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900">Agency Agent Leaderboard</h1>
            <p className="text-xs text-slate-600 mt-0.5">
              Track team performance, active inventory, verified transactions, and onboard new staff.
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
              <span>+</span> Invite / Add Agent
            </button>
          </div>
        </div>

        {/* Toast Notification */}
        {toast && (
          <div
            className={`p-3.5 rounded-2xl border text-xs font-semibold flex items-center justify-between shadow-sm ${
              toast.type === 'success'
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-red-50 border-red-300 text-red-900'
            }`}
          >
            <span>{toast.text}</span>
            <button onClick={() => setToast(null)} className="opacity-70 hover:opacity-100">✕</button>
          </div>
        )}

        {/* Team KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-emerald-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full">
              Team Strength
            </span>
            <div className="text-2xl font-black text-emerald-900 mt-2">
              {agents.length} Registered Agents
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Verified agency staff &amp; managers</p>
          </div>

          <div className="bg-white border border-indigo-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 bg-indigo-100 px-2.5 py-0.5 rounded-full">
              Team Inventory
            </span>
            <div className="text-2xl font-black text-indigo-900 mt-2">
              {totalListings} Active Properties
            </div>
            <p className="text-[11px] text-slate-500 mt-1">{totalDeals} completed deals recorded</p>
          </div>

          <div className="bg-white border border-amber-200 rounded-3xl p-5 shadow-sm">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Top Producer
            </span>
            <div className="text-2xl font-black text-amber-950 mt-2 truncate">
              {topAgent ? topAgent.name : 'No agents yet'}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              {topAgent ? `${topAgent.listingsCount} Listings · ${topAgent.dealsCount} Deals` : 'Invite agents to begin'}
            </p>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-lg">🏆</span>
              <h2 className="text-base font-bold text-slate-900">Ranked Agent Roster</h2>
            </div>
            <span className="text-xs font-semibold text-slate-500">{agents.length} Active Agents</span>
          </div>

          {loading ? (
            <div className="p-8 text-center flex flex-col items-center justify-center gap-2">
              <div className="w-6 h-6 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs text-slate-500 font-semibold">Loading Agent Roster from Database...</p>
            </div>
          ) : agents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">👥</span>
              <div>
                <p className="font-bold text-slate-800 text-sm">No team agents registered yet</p>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Click &quot;+ Invite / Add Agent&quot; above to onboard your staff. They will receive sign-in credentials automatically.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3 text-center w-12">Rank</th>
                    <th className="py-2.5 px-3">Agent Name &amp; Contact</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3 text-center">Active Inventory</th>
                    <th className="py-2.5 px-3 text-center">Deals Closed</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {agents.map((agent, index) => (
                    <tr key={agent.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-3 text-center">{getRankBadge(index)}</td>
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{agent.name}</span>
                          {agent.isKycVerified && (
                            <span className="text-[10px] text-emerald-600 font-bold" title="Verified Staff">✓</span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500">{agent.email} · {agent.phone}</div>
                      </td>
                      <td className="py-3 px-3">
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${
                          agent.role === 'AGENCY_MANAGER'
                            ? 'bg-purple-100 text-purple-900 border-purple-300'
                            : 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {agent.role === 'AGENCY_MANAGER' ? 'Manager' : 'Agent'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-slate-800">
                        {agent.listingsCount} Listings
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-emerald-700">
                        {agent.dealsCount} Deals
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleRemoveAgent(agent.id, agent.name)}
                          className="text-slate-400 hover:text-red-600 text-xs px-2 py-1 rounded transition"
                          title="Remove from Agency"
                        >
                          🗑️ Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Modal: Invite / Add Agent */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-[#faf9f7] rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🤝</span>
                  <h3 className="text-lg font-black text-slate-900">Onboard Agency Agent</h3>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-900 font-bold text-lg"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleInviteAgent} className="space-y-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-800">Full Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Usman Tariq"
                    required
                    className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Email Address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="agent@example.com"
                      required
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Phone Number</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="03001234567"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Team Role</label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'AGENCY_AGENT' | 'AGENCY_MANAGER')}
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-medium text-slate-900 focus:border-emerald-500 focus:outline-none"
                    >
                      <option value="AGENCY_AGENT">Property Agent</option>
                      <option value="AGENCY_MANAGER">Agency Manager</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-800">Temporary Password</label>
                    <input
                      type="text"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Leave blank for auto-generate"
                      className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono text-slate-900 focus:border-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-[11px] text-emerald-900 leading-relaxed">
                  📧 <strong>Automated Onboarding:</strong> When you submit, an official invitation with sign-in instructions and temporary password will be dispatched to the agent&apos;s email.
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
                    {saving ? 'Inviting Agent...' : 'Invite Agent ✓'}
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
