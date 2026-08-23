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
              <span className="text-xs font-black bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full uppercase tracking-wider">
                PORTAL LISTING
              </span>
              <span className="text-xs font-bold text-gray-500">• Comprehensive Property Form</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mt-1">
              Add New Property Listing
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              Publish your property with dynamic pricing, categorized types, media uploads, and 1-month early match alerts.
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
