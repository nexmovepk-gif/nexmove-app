import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// Placeholder leaderboard component. Adjust data fetching as needed.
interface AgentLeader {
  id: string | number
  name: string
  score: number
}

export default async function LeaderboardPage() {
  let agents: AgentLeader[] = []
  try {
    agents = await (prisma as unknown as Record<string, { findMany: (args: unknown) => Promise<AgentLeader[]> }>).agent.findMany({ orderBy: { score: 'desc' } })
  } catch (error) {
    console.error('Leaderboard DB error, using mock data:', error)
    agents = [
      { id: 1, name: 'Mock Agent 1', score: 150 },
      { id: 2, name: 'Mock Agent 2', score: 120 },
    ]
  }

  return (
    <section className="p-8 bg-gray-50 min-w-screen">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Agent Leaderboard</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Name</th>
              <th className="px-4 py-2 text-left font-semibold text-gray-900">Score</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {agents.map((agent) => (
              <tr key={agent.id} className="border-t">
                <td className="px-4 py-2 text-gray-900">{agent.name}</td>
                <td className="px-4 py-2 text-gray-900 font-medium">{agent.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <nav className="flex space-x-8 text-lg mt-8">
        <Link href="/agency/dashboard" className="text-blue-600 hover:underline font-medium">Back to Dashboard</Link>
        <Link href="/agency/ledger" className="text-blue-600 hover:underline font-medium">View Ledger</Link>
      </nav>
    </section>
  );
}
