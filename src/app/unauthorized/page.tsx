// src/app/unauthorized/page.tsx
import Link from 'next/link'

export default function UnauthorizedPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/60 border border-red-500/30 rounded-3xl p-8 backdrop-blur-xl shadow-2xl text-center flex flex-col items-center gap-6">
        {/* Shield/Lock Glowing Icon */}
        <div className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.2)]">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-10 h-10 text-red-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>

        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-red-400 to-orange-500">
            Access Shield Active
          </h1>
          <p className="text-sm text-slate-400">
            Next-Gen Multi-Tenant Data Shielding has blocked your request. You do not have permissions to access this agency&apos;s workspace or private listings.
          </p>
        </div>

        <div className="w-full border-t border-slate-800 my-2"></div>

        <div className="flex flex-col gap-3 w-full">
          <Link
            href="/login"
            className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 text-white font-medium py-3 rounded-2xl transition duration-300 shadow-lg shadow-red-950/50 flex items-center justify-center gap-2"
          >
            Switch Accounts
          </Link>
          <Link
            href="/"
            className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium py-3 rounded-2xl transition duration-300 flex items-center justify-center"
          >
            Back to Public Portal
          </Link>
        </div>
      </div>
    </main>
  )
}
