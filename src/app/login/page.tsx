'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError('Invalid credentials. Check your email/password.');
    } else {
      if (email.includes('superadmin')) {
        router.push('/admin/dashboard');
      } else {
        router.push('/agency/dashboard');
      }
    }
  };

  const handleQuickLogin = async (mockEmail: string, mockPass: string, redirectPath: string) => {
    setError(null);
    setLoading(true);
    const result = await signIn('credentials', {
      email: mockEmail,
      password: mockPass,
      redirect: false,
    });
    setLoading(false);
    if (result?.error) {
      setError('Failed to login with quick account.');
    } else {
      router.push(redirectPath);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">

        {/* Header */}
        <div className="flex flex-col items-center text-center gap-1.5">
          <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            NexMove SaaS Portal
          </span>
          <h1 className="text-2xl font-black text-slate-900 mt-1">Agency Staff Login</h1>
          <p className="text-xs text-slate-600">Enter your credentials to access your private agency portal</p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl text-center font-semibold">
            {error}
          </div>
        )}

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-900" htmlFor="email-input">Email Address</label>
            <input
              id="email-input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="agent1@agency1.com"
              required
              className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-slate-900" htmlFor="password-input">Password</label>
            <input
              id="password-input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3 rounded-xl transition shadow-md disabled:opacity-50 mt-1"
          >
            {loading ? 'Authenticating...' : 'Sign In to Dashboard'}
          </button>
        </form>

        <div className="relative flex items-center justify-center my-1">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200"></div>
          </div>
          <span className="relative bg-white px-3 text-[11px] text-slate-500 uppercase font-bold">
            RBAC Quick Switch
          </span>
        </div>

        {/* Quick Logins */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              onClick={() => handleQuickLogin('superadmin@nexmove.com', 'admin123', '/admin/dashboard')}
              className="bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 rounded-xl p-2.5 text-left transition flex flex-col gap-0.5"
            >
              <span className="text-xs font-bold">Super Admin</span>
              <span className="text-[10px] text-purple-700">Ali Hamza (CEO)</span>
            </button>

            <button
              onClick={() => handleQuickLogin('user@public.com', 'user123', '/')}
              className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-900 rounded-xl p-2.5 text-left transition flex flex-col gap-0.5"
            >
              <span className="text-xs font-bold">Public Portal</span>
              <span className="text-[10px] text-slate-600">Public Self-Listing</span>
            </button>

            <button
              onClick={() => handleQuickLogin('manager1@agency1.com', 'manager123', '/agency/dashboard')}
              className="bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 rounded-xl p-2.5 text-left transition flex flex-col gap-0.5"
            >
              <span className="text-xs font-bold">Agency Manager</span>
              <span className="text-[10px] text-emerald-800">Apex Real Estate</span>
            </button>

            <button
              onClick={() => handleQuickLogin('agent1@agency1.com', 'agent123', '/agency/dashboard')}
              className="bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-900 rounded-xl p-2.5 text-left transition flex flex-col gap-0.5"
            >
              <span className="text-xs font-bold">Agency Agent</span>
              <span className="text-[10px] text-teal-800">Sales & Pipeline</span>
            </button>
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center pt-3 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            Need to register a new agency?{' '}
            <Link href="/register" className="text-emerald-700 hover:underline font-bold">
              Register New Agency →
            </Link>
          </p>
        </div>

      </div>
    </main>
  );
}
