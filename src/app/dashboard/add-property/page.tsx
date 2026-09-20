// src/app/dashboard/add-property/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import PropertyForm from '@/components/PropertyForm';

export default function DashboardAddPropertyPage() {
 return (
 <section className="p-4 sm:p-8 bg-gray-50 min-h-screen">
 <div className="max-w-4xl mx-auto">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-4 border-b border-gray-200 gap-4">
 <div>
 <div className="flex items-center gap-2">
 <span className="text-xs font-black bg-amber-100 text-amber-800 px-3 py-1 rounded-full uppercase tracking-wider">
 PRIVATE LISTING
 </span>
 <span className="text-xs font-bold text-gray-500">• Top 3 Agencies Notified</span>
 </div>
 <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">
 List Your Property Privately
 </h1>
 <p className="text-sm text-gray-600 mt-1 font-medium">
 Your property is securely shielded from the public marketplace. Top 3 verified local agencies are instantly notified to review and facilitate your listing.
 </p>
 </div>
 <Link
 href="/dashboard"
 className="text-sm font-bold text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1 self-start sm:self-auto"
 >
 ← Back to Dashboard
 </Link>
 </div>

 <PropertyForm
 onSuccessRedirect="/dashboard"
 isAgencyPortal={false}
 />
 </div>
 </section>
 );
}
