'use client'
// src/app/architects/login/page.tsx
// Dedicated Architect Portal Login Page with Suspense boundary

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ArchitectLoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/architects/dashboard'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Please enter both email address and password.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await signIn('credentials', {
        email: email.trim(),
        password,
        redirect: false,
      })

      if (res?.error) {
        setError('Invalid credentials or account not found. Please try again.')
      } else {
        router.push(callbackUrl)
        router.refresh()
      }
    } catch (err) {
      console.error('Architect login error:', err)
      setError('An unexpected error occurred during sign in.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl flex flex-col gap-6">
      {/* Header */}
      <div className="text-center flex flex-col items-center gap-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500/20 to-emerald-500/10 border border-teal-500/30 flex items-center justify-center text-3xl shadow-lg">
          📐
        </div>
        <span className="text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-400 px-3 py-1 rounded-full uppercase tracking-widest mt-1">
          Architect Portal Access
        </span>
        <h1 className="text-2xl font-black text-slate-50 mt-1">Architect Sign In</h1>
        <p className="text-xs text-slate-400">
          Sign in to manage your portfolio, upload designs, and update your profile.
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3.5 rounded-xl font-medium">
          ⚠️ {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-300">Registered Email Address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="architect@firm.com"
            required
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-medium"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300">Password</label>
          </div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-lg shadow-teal-950/50 disabled:opacity-50 mt-2"
        >
          {loading ? 'Authenticating...' : 'Sign In to Architect Dashboard →'}
        </button>
      </form>

      <div className="border-t border-slate-800 pt-4 flex flex-col items-center gap-3 text-center">
        <p className="text-xs text-slate-400">
          Not registered on NexMove yet?
        </p>
        <Link
          href="/architects/register"
          className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 text-teal-400 font-bold px-4 py-2.5 rounded-xl transition w-full text-center"
        >
          + Register as Verified Architect
        </Link>
        <Link href="/architects" className="text-xs text-slate-500 hover:text-slate-300 transition mt-1">
          ← Return to Public Architects Directory
        </Link>
      </div>
    </div>
  )
}

export default function ArchitectLoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center text-slate-400 text-xs">
          Loading Architect Sign In...
        </div>
      }>
        <ArchitectLoginForm />
      </Suspense>
    </main>
  )
}
