'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Something went wrong. Please try again.')
        return
      }

      setSubmitted(true)
    } catch {
      setError('A network error occurred. Please check your connection and try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#faf9f7] text-slate-900 flex flex-col justify-center items-center px-4 py-12">
      <div className="w-full max-w-md">

        {/* Logo / Brand */}
        <div className="flex flex-col items-center mb-8 gap-2">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center shadow-lg">
            <span className="text-2xl">🏢</span>
          </div>
          <h1 className="text-xl font-black text-slate-900">NexMove PropTech</h1>
          <p className="text-xs text-slate-500">Pakistan&apos;s Verified Real Estate Platform</p>
        </div>

        <div className="bg-[#faf9f7] border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xl flex flex-col gap-5">

          {submitted ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center">
                <span className="text-3xl">📬</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 mb-1">Check Your Inbox</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  If <strong className="text-slate-800">{email}</strong> is registered with NexMove,
                  a password reset link has been sent. The link expires in <strong>1 hour</strong>.
                </p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-[11px] text-amber-800 leading-relaxed w-full text-left">
                <strong>📌 Didn&apos;t receive the email?</strong><br />
                • Check your Spam / Junk folder<br />
                • Make sure you entered the correct email<br />
                • Wait a minute and check again
              </div>
              <Link
                href="/login"
                className="text-xs text-emerald-700 hover:underline font-bold flex items-center gap-1 mt-1"
              >
                ← Back to Sign In
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-1.5">
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Account Recovery
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Forgot Password?</h2>
                <p className="text-xs text-slate-600 max-w-xs">
                  Enter the email address linked to your NexMove account and we&apos;ll send you a secure reset link.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl text-center font-semibold leading-relaxed">
                  {error}
                </div>
              )}

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-900" htmlFor="forgot-email">
                    Registered Email Address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    required
                    autoComplete="email"
                    className="bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition shadow-sm"
                  />
                </div>

                <button
                  id="send-reset-link-btn"
                  type="submit"
                  disabled={loading || !email}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sending Reset Link...</span>
                    </>
                  ) : (
                    <span>Send Password Reset Link →</span>
                  )}
                </button>
              </form>

              {/* Back to Login */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  Remembered your password?{' '}
                  <Link href="/login" className="text-emerald-700 hover:underline font-bold">
                    Sign In →
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Security Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-5 font-medium">
          🔒 Reset links are encrypted, one-time use, and expire in 1 hour.
        </p>
      </div>
    </main>
  )
}
