import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface AgentLeader {
  id: string
  name: string
  role: string
  listingsCount: number
}

export default async function LeaderboardPage() {
  let agents: AgentLeader[] = []
  try {
    const users = await prisma.user.findMany({
      where: {
        role: {
          in: ['AGENCY_AGENT', 'AGENCY_MANAGER'],
        },
      },
      include: {
        listings: true,
      },
      orderBy: {
        name: 'asc',
      },
    })

    agents = users.map((u) => ({
      id: u.id,
      name: u.name || 'Unnamed Agent',
      role: u.role,
      listingsCount: u.listings.length,
    }))
  } catch (error) {
    console.error('Leaderboard query error:', error)
    agents = []
  }

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Agent Leaderboard</h1>
        <div className="bg-white rounded-2xl shadow border border-gray-200 overflow-hidden">
          {agents.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center gap-3">
              <span className="text-4xl">🏆</span>
              <div>
                <p className="font-bold text-gray-800 text-base">No active agents registered yet</p>
                <p className="text-xs text-gray-500 mt-1">Agency staff and agents will be ranked automatically by verified transactions and active inventory.</p>
              </div>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Agent Name</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 uppercase">Active Inventory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {agents.map((agent) => (
                  <tr key={agent.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm font-semibold text-gray-900">{agent.name}</td>
                    <td className="px-6 py-4 text-xs font-bold text-teal-700">{agent.role}</td>
                    <td className="px-6 py-4 text-sm text-gray-800 font-medium">{agent.listingsCount} Listings</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <nav className="flex space-x-8 text-sm font-semibold mt-8">
          <Link href="/agency/dashboard" className="text-blue-600 hover:underline">← Back to Dashboard</Link>
          <Link href="/agency/ledger" className="text-blue-600 hover:underline">View Ledger</Link>
        </nav>
      </div>
    </section>
  );
}
