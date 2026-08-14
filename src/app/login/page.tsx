'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  const portalParam = searchParams?.get('portal')
  const callbackUrl = searchParams?.get('callbackUrl')
  const isInvestorPortal = portalParam === 'investor' || callbackUrl?.includes('investor')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (result?.error) {
      setError('Invalid credentials. Please check your email and password.')
    } else {
      if (callbackUrl) {
        router.push(callbackUrl)
      } else if (email.includes('superadmin')) {
        router.push('/admin/dashboard')
      } else if (email.includes('investor')) {
        router.push('/investors')
      } else {
        router.push('/agency/dashboard')
      }
    }
  }

  return (
    <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1.5">
        <span className={`text-xs ${isInvestorPortal ? 'bg-amber-100 text-amber-900 border-amber-300' : 'bg-emerald-100 text-emerald-800 border-emerald-300'} border font-bold px-3 py-1 rounded-full uppercase tracking-wider`}>
          {isInvestorPortal ? '🌐 Investor Sign-In Gateway' : 'NexMove Member Gateway'}
        </span>
        <h1 className="text-2xl font-black text-slate-900 mt-1">
          {isInvestorPortal ? 'Investor Portal Sign In' : 'Account Sign In'}
        </h1>
        <p className="text-xs text-slate-600 max-w-xs">
          {isInvestorPortal
            ? 'Sign in to access your overseas asset vault, escrow portfolio & legal contracts.'
            : 'Enter your credentials to access your private agency or member dashboard.'}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl text-center font-semibold leading-relaxed">
          {error}
        </div>
      )}

      {/* Credentials Form */}
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-900" htmlFor="email-input">
            Email Address
          </label>
          <input
            id="email-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={isInvestorPortal ? 'investor@nexmove.com' : 'user@example.com'}
            required
            className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-bold text-slate-900" htmlFor="password-input">
            Password
          </label>
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
          className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md disabled:opacity-50 mt-1 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Authenticating...</span>
            </>
          ) : (
            <span>{isInvestorPortal ? 'Sign In to Investor Dashboard →' : 'Sign In to Dashboard →'}</span>
          )}
        </button>
      </form>

      {/* Link to Register */}
      <div className="text-center pt-3 border-t border-slate-100">
        <p className="text-xs text-slate-600">
          Need to create a new account?{' '}
          <Link href="/register" className="text-emerald-700 hover:underline font-bold">
            Register Now →
          </Link>
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <Suspense fallback={
        <div className="w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 text-center text-xs text-slate-500 font-semibold">
          Loading Sign In Gateway...
        </div>
      }>
        <LoginForm />
      </Suspense>
    </main>
  )
}
