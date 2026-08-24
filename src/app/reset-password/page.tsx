'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams?.get('token')

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Password strength check
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const passwordsMatch = newPassword === confirmPassword && confirmPassword.length > 0
  const isFormValid = hasMinLength && passwordsMatch && token

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.')
    }
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!hasMinLength) {
      setError('Password must be at least 8 characters long.')
      return
    }

    if (!passwordsMatch) {
      setError('Passwords do not match. Please re-enter.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to reset password. Please try again.')
        return
      }

      setSuccess(true)

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login?message=password_reset')
      }, 3000)
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

          {success ? (
            /* ── Success State ── */
            <div className="flex flex-col items-center text-center gap-4 py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center animate-bounce">
                <span className="text-3xl">✅</span>
              </div>
              <div>
                <h2 className="text-lg font-black text-slate-900 mb-1">Password Reset Successful!</h2>
                <p className="text-xs text-slate-600 leading-relaxed max-w-xs mx-auto">
                  Your password has been updated successfully. You will be redirected to the sign in page in a moment.
                </p>
              </div>
              <Link
                href="/login"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md flex items-center justify-center gap-2"
              >
                Sign In Now →
              </Link>
            </div>
          ) : (
            /* ── Form State ── */
            <>
              {/* Header */}
              <div className="flex flex-col items-center text-center gap-1.5">
                <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  🔐 Set New Password
                </span>
                <h2 className="text-2xl font-black text-slate-900 mt-1">Reset Your Password</h2>
                <p className="text-xs text-slate-600 max-w-xs">
                  Create a strong new password for your NexMove account.
                </p>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-2xl font-semibold leading-relaxed">
                  <span className="block text-center">{error}</span>
                  {(error.includes('expired') || error.includes('invalid') || error.includes('Invalid')) && (
                    <div className="text-center mt-2">
                      <Link href="/forgot-password" className="text-red-700 hover:underline font-bold">
                        Request a new reset link →
                      </Link>
                    </div>
                  )}
                </div>
              )}

              {/* Form */}
              {token && (
                <form onSubmit={handleSubmit} className="flex flex-col gap-4">

                  {/* New Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-900" htmlFor="new-password">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        id="new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Minimum 8 characters"
                        required
                        autoComplete="new-password"
                        className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 pr-10 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500 transition shadow-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-sm"
                        tabIndex={-1}
                      >
                        {showPassword ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {/* Password Strength Indicators */}
                    {newPassword.length > 0 && (
                      <div className="flex flex-col gap-1 mt-0.5">
                        <div className={`text-[10px] font-semibold flex items-center gap-1 ${hasMinLength ? 'text-emerald-600' : 'text-red-500'}`}>
                          {hasMinLength ? '✓' : '✗'} At least 8 characters
                        </div>
                        <div className={`text-[10px] font-semibold flex items-center gap-1 ${hasUppercase ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {hasUppercase ? '✓' : '○'} Contains uppercase letter (recommended)
                        </div>
                        <div className={`text-[10px] font-semibold flex items-center gap-1 ${hasNumber ? 'text-emerald-600' : 'text-slate-400'}`}>
                          {hasNumber ? '✓' : '○'} Contains a number (recommended)
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-900" htmlFor="confirm-password">
                      Confirm New Password
                    </label>
                    <input
                      id="confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter your new password"
                      required
                      autoComplete="new-password"
                      className={`bg-white border rounded-xl px-4 py-2.5 text-xs text-slate-900 font-medium focus:outline-none transition shadow-sm ${
                        confirmPassword.length > 0
                          ? passwordsMatch
                            ? 'border-emerald-500 focus:border-emerald-600'
                            : 'border-red-400 focus:border-red-500'
                          : 'border-slate-300 focus:border-emerald-500'
                      }`}
                    />
                    {confirmPassword.length > 0 && (
                      <span className={`text-[10px] font-semibold ${passwordsMatch ? 'text-emerald-600' : 'text-red-500'}`}>
                        {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
                      </span>
                    )}
                  </div>

                  <button
                    id="reset-password-btn"
                    type="submit"
                    disabled={loading || !isFormValid}
                    className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold text-xs py-3.5 rounded-xl transition shadow-md disabled:opacity-60 flex items-center justify-center gap-2 mt-1"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Updating Password...</span>
                      </>
                    ) : (
                      <span>Set New Password ✓</span>
                    )}
                  </button>
                </form>
              )}

              {/* Back link */}
              <div className="text-center pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600">
                  <Link href="/forgot-password" className="text-emerald-700 hover:underline font-bold">
                    ← Request a new reset link
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>

        {/* Security Footer */}
        <p className="text-center text-[10px] text-slate-400 mt-5 font-medium">
          🔒 Your new password is encrypted with bcrypt before storage.
        </p>
      </div>
    </main>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <div className="text-xs text-slate-500 font-semibold">Loading Reset Portal...</div>
      </main>
    }>
      <ResetPasswordForm />
    </Suspense>
  )
}
