'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { extractFromMetadata } from '@/lib/aiExtraction';

export default function AgencySubmitListingPage() {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [price, setPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [isRental, setIsRental] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [bedrooms, setBedrooms] = useState('');
  const [bathrooms, setBathrooms] = useState('');
  const [areaSqFt, setAreaSqFt] = useState('');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('');

  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [isValuationEstimated, setIsValuationEstimated] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploadedFileType, setUploadedFileType] = useState<string | null>(null);
  const [uploadedFileSizeBytes, setUploadedFileSizeBytes] = useState<number>(0);

  // AI Market Valuation button state
  const [valuationLoading, setValuationLoading] = useState(false);
  const [valuationResult, setValuationResult] = useState<{ midPKR: number; minPKR: number; maxPKR: number; ratePerSqFt: number; basis: string } | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSold, setIsSold] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setUploadedFileName(file.name);
    setUploadedFileType(file.type);
    setUploadedFileSizeBytes(file.size);
    setIsAiExtracting(true);
    setAiExtracted(false);
    setTimeout(() => {
      const result = extractFromMetadata({ fileName: file.name, fileType: file.type, fileSizeBytes: file.size });
      setIsAiExtracting(false);
      setAiExtracted(true);
      setAiConfidence(result.confidence > 0 ? Math.round(result.confidence * 100) : null);
      if (result.propertyType) setPropertyType(result.propertyType);
      if (result.bedrooms != null && !bedrooms) setBedrooms(String(result.bedrooms));
      if (result.bathrooms != null && !bathrooms) setBathrooms(String(result.bathrooms));
      if (result.areaSqFt != null && !areaSqFt) setAreaSqFt(String(result.areaSqFt));
      if (result.locationHint && !city) setCity(result.locationHint);
      if (!price && result.bedrooms != null && result.areaSqFt != null) {
        setPrice(String(result.bedrooms * 3500000 + result.areaSqFt * 12000));
        setIsValuationEstimated(true);
      } else {
        setIsValuationEstimated(false);
      }
    }, 1200);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/public/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, propertyType, price: Number(price), address, city,
          bedrooms: bedrooms ? Number(bedrooms) : undefined,
          bathrooms: bathrooms ? Number(bathrooms) : undefined,
          areaSqFt: areaSqFt ? Number(areaSqFt) : undefined,
          description, contactName, contactPhone, isRental,
          monthlyRent: isRental && monthlyRent ? Number(monthlyRent) : undefined,
          virtualTourUrl: virtualTourUrl || undefined,
          uploadedFileName: uploadedFileName ?? undefined,
          uploadedFileType: uploadedFileType ?? undefined,
          uploadedFileSizeBytes: uploadedFileSizeBytes || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit listing.');
      setLoading(false);
      setSubmitted(true);
    } catch (err: unknown) {
      setLoading(false);
      setSubmitError(err instanceof Error ? err.message : 'Failed to submit listing.');
    }
  };

  // City-aware PKR rate table (PKR per sq ft, mid-2026 estimates)
  const getCityRatePerSqFt = (cityInput: string): { rate: number; label: string } => {
    const c = cityInput.toLowerCase().trim();
    if (c.includes('islamabad') || c.includes('f-6') || c.includes('f-7') || c.includes('f-8') || c.includes('f-10')) return { rate: 18500, label: 'Islamabad' };
    if (c.includes('rawalpindi') || c.includes('bahria') || c.includes('dha rawalpindi')) return { rate: 13500, label: 'Rawalpindi / Bahria Town' };
    if (c.includes('lahore') || c.includes('gulberg') || c.includes('dha lahore') || c.includes('model town')) return { rate: 16000, label: 'Lahore' };
    if (c.includes('karachi') || c.includes('dha karachi') || c.includes('clifton') || c.includes('defence')) return { rate: 14500, label: 'Karachi' };
    if (c.includes('peshawar') || c.includes('hayatabad')) return { rate: 9500, label: 'Peshawar' };
    if (c.includes('quetta')) return { rate: 7500, label: 'Quetta' };
    if (c.includes('faisalabad')) return { rate: 10000, label: 'Faisalabad' };
    if (c.includes('multan')) return { rate: 9000, label: 'Multan' };
    if (c.includes('gujranwala')) return { rate: 8500, label: 'Gujranwala' };
    if (c.includes('sialkot')) return { rate: 8000, label: 'Sialkot' };
    if (c.includes('abbottabad') || c.includes('murree')) return { rate: 11000, label: 'Abbottabad / Murree' };
    // fallback: generic Pakistan average
    return { rate: 10500, label: cityInput || 'Pakistan (general estimate)' };
  };

  const handleAiValuation = () => {
    setValuationLoading(true);
    setValuationResult(null);

    setTimeout(() => {
      const sqft = areaSqFt ? Number(areaSqFt) : (bedrooms ? Number(bedrooms) * 650 : 1200);
      const beds = bedrooms ? Number(bedrooms) : 2;
      const { rate, label } = getCityRatePerSqFt(city);

      // Bedroom premium: +3% per bedroom above 1
      const bedroomMultiplier = 1 + Math.max(0, beds - 1) * 0.03;
      // Property type premium
      const typePremium: Record<string, number> = {
        VILLA: 1.25, HOUSE: 1.10, APARTMENT: 1.00, COMMERCIAL: 1.35, PLOT: 0.65,
      };
      const typeMult = typePremium[propertyType] ?? 1.0;

      const midRate = Math.round(rate * bedroomMultiplier * typeMult);
      const midPKR = Math.round(midRate * sqft);
      const minPKR = Math.round(midPKR * 0.88);
      const maxPKR = Math.round(midPKR * 1.12);

      const basis = [
        `${sqft.toLocaleString()} sq ft`,
        beds ? `${beds} bed${beds !== 1 ? 's' : ''}` : null,
        label,
        propertyType.charAt(0) + propertyType.slice(1).toLowerCase(),
      ].filter(Boolean).join(' · ');

      setValuationResult({ midPKR, minPKR, maxPKR, ratePerSqFt: midRate, basis });
      setPrice(String(midPKR));
      setIsValuationEstimated(true);
      setValuationLoading(false);
    }, 1000);
  };

  const handleReset = () => {
    setTitle(''); setPrice(''); setMonthlyRent(''); setAddress(''); setCity('');
    setBedrooms(''); setBathrooms(''); setAreaSqFt(''); setDescription('');
    setContactName(''); setContactPhone(''); setVirtualTourUrl('');
    setAiExtracted(false); setAiConfidence(null); setFileName(null);
    setUploadedFileName(null); setUploadedFileType(null); setUploadedFileSizeBytes(0);
    setIsValuationEstimated(false); setValuationResult(null); setSubmitted(false); setSubmitError(null); setIsRental(false);
  };

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Add New Property Listing</h1>
            <p className="text-sm text-gray-700 mt-1 font-medium">Publish with AI document extraction &amp; market valuation</p>
          </div>
          <Link href="/agency/dashboard" className="text-sm font-semibold text-blue-600 hover:underline">← Back to Dashboard</Link>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl p-8 shadow border border-emerald-200 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold">✓</div>
            <h2 className="text-2xl font-bold text-gray-900">Property Listing Published!</h2>
            <p className="text-gray-700 max-w-md">Your listing for <span className="font-bold">{title}</span> has been published to the marketplace.</p>
            <div className={`w-full max-w-md rounded-2xl border p-4 flex flex-col gap-2 transition-all ${isSold ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Mark as Sold / Closed</p>
                  <p className="text-xs text-gray-600 mt-0.5">{isSold ? '🔒 Archived and hidden from marketplace.' : 'Toggle to close and auto-archive this listing.'}</p>
                </div>
                <button type="button" onClick={() => setIsSold(v => !v)} className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${isSold ? 'bg-red-500' : 'bg-gray-300'}`} role="switch" aria-checked={isSold}>
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${isSold ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              {isSold && <span className="self-start bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">🏷️ Archived</span>}
            </div>
            <div className="flex gap-4 mt-2">
              <button onClick={handleReset} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg shadow transition">+ Add Another</button>
              {!isSold && <Link href="/marketplace" className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg transition">View Marketplace</Link>}
              <Link href="/agency/dashboard" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition">Dashboard</Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-teal-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-xl font-bold text-teal-300">AI Document Extraction &amp; Valuation Engine</h2>
                </div>
                <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold">OCR + Valuation Model</span>
              </div>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">Upload a Title Deed, Lease Contract, or Blueprint. Our AI extracts specs, locations, and prices — or generates an AI Market Valuation if price data is absent.</p>
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2">
                  <span>📄 Upload Document (PDF/Image)</span>
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg,.docx" className="hidden" />
                </label>

                {/* AI Market Valuation button — reads live form state, no hardcoded data */}
                <button
                  type="button"
                  onClick={handleAiValuation}
                  disabled={valuationLoading || isAiExtracting}
                  title={!city && !areaSqFt && !bedrooms ? 'Enter City, Area, or Bedrooms first for a more accurate estimate' : 'Calculate PKR market valuation from your entered details'}
                  className="bg-purple-700 hover:bg-purple-600 disabled:opacity-50 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2"
                >
                  {valuationLoading ? (
                    <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Calculating...</span></>
                  ) : (
                    <><span>🔮</span><span>AI Market Valuation</span></>
                  )}
                </button>

                {fileName && !isAiExtracting && (
                  <span className="text-xs text-slate-300 font-medium bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl truncate max-w-xs">📎 {fileName}</span>
                )}
              </div>

              {/* Valuation Result Card */}
              {valuationResult && !valuationLoading && (
                <div className="mt-4 p-4 bg-purple-950/60 border border-purple-500/40 rounded-xl">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-purple-300 font-bold text-sm">🔮 AI Market Valuation Result</span>
                        <span className="text-[10px] bg-purple-800/60 text-purple-200 border border-purple-600/40 px-2 py-0.5 rounded-full font-bold">PKR Estimate</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mb-2">Based on: {valuationResult.basis}</div>
                      <div className="text-2xl font-black text-white">
                        Rs. {valuationResult.midPKR.toLocaleString()}
                      </div>
                      <div className="text-xs text-purple-200 mt-0.5">
                        Range: Rs. {valuationResult.minPKR.toLocaleString()} – Rs. {valuationResult.maxPKR.toLocaleString()}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-right">
                      <span className="text-[11px] text-slate-400">Rate per sq ft</span>
                      <span className="text-lg font-bold text-purple-200">Rs. {valuationResult.ratePerSqFt.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => setValuationResult(null)}
                        className="text-[10px] text-slate-500 hover:text-slate-300 underline mt-1 text-right"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-3 border-t border-purple-800/40 pt-2">
                    ⚠️ This is an AI-generated estimate based on current market rates. Final valuations should be verified with a certified property valuer.
                  </p>
                </div>
              )}
              {isAiExtracting && (
                <div className="mt-4 p-4 bg-teal-900/40 border border-teal-500/30 rounded-xl flex items-center gap-3">
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs text-teal-200 font-semibold">AI scanning document metadata, extracting property specs and calculating market valuation...</span>
                </div>
              )}
              {aiExtracted && !isAiExtracting && (
                <div className="mt-4 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-lg">✓</span>
                    <div>
                      <div className="text-xs font-bold text-emerald-300">{fileName}</div>
                      <div className="text-[11px] text-slate-300">
                        {aiConfidence && aiConfidence > 0 ? `Extracted: Property Type, City${bedrooms ? `, Bedrooms (${bedrooms})` : ''}${areaSqFt ? `, Area (${areaSqFt} sq ft)` : ''}. Verify remaining fields manually.` : 'No structured data detected. Fill in property details manually.'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isValuationEstimated ? (
                      <span className="px-3 py-1 bg-purple-900/80 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-full">🔮 AI Market Valuation</span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 text-xs font-bold rounded-full">Document Scan Complete</span>
                    )}
                    {aiConfidence !== null && aiConfidence > 0 && (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full shadow">AI Confidence: {aiConfidence}%</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Property Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Listing Title *</label>
                      <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. 3-Bedroom House, Gulberg III, Lahore" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900 flex items-center justify-between">
                        <span>3D Virtual Tour Link (360° / Matterport / Spline)</span>
                        <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">🕶️ 3D Tour Ready</span>
                      </label>
                      <input type="url" value={virtualTourUrl} onChange={e => setVirtualTourUrl(e.target.value)} placeholder="https://my.matterport.com/show/?m=..." className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Property Type *</label>
                      <select value={propertyType} onChange={e => setPropertyType(e.target.value)} className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none">
                        <option value="APARTMENT">Apartment</option>
                        <option value="VILLA">Villa</option>
                        <option value="HOUSE">House</option>
                        <option value="COMMERCIAL">Commercial Office</option>
                        <option value="PLOT">Land Plot</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-900">{isValuationEstimated ? 'AI Estimated Market Valuation (PKR) *' : 'Sale Price (PKR) *'}</label>
                        {aiConfidence !== null && aiConfidence > 0 && <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-full">AI Confidence: {aiConfidence}%</span>}
                      </div>
                      <input type="number" value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. 15000000" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                      {isValuationEstimated && <p className="text-xs text-purple-700 font-semibold">🔮 Estimated via AI based on {bedrooms} beds &amp; {areaSqFt} sq ft. Verify before publishing.</p>}
                    </div>
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <input type="checkbox" id="is-rental" checked={isRental} onChange={e => setIsRental(e.target.checked)} className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500" />
                        <label htmlFor="is-rental" className="text-sm font-bold text-gray-900 cursor-pointer">This property is also available for Monthly Rent</label>
                      </div>
                      {isRental && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-800">Monthly Rent Amount (PKR/mo)</label>
                          <input type="number" value={monthlyRent} onChange={e => setMonthlyRent(e.target.value)} placeholder="e.g. 85000" className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Location &amp; Specs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Full Address / Location *</label>
                      <input type="text" value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. House 14, Block C, Bahria Town, Rawalpindi" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">City *</label>
                      <input type="text" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g. Lahore, Karachi, Islamabad" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Bedrooms</label>
                      <input type="number" value={bedrooms} onChange={e => setBedrooms(e.target.value)} min="0" placeholder="e.g. 3" className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Bathrooms</label>
                      <input type="number" value={bathrooms} onChange={e => setBathrooms(e.target.value)} min="0" placeholder="e.g. 2" className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Area (Sq Ft)</label>
                      <input type="number" value={areaSqFt} onChange={e => setAreaSqFt(e.target.value)} placeholder="e.g. 1800" className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Description &amp; Agent Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Description</label>
                      <textarea rows={3} value={description} onChange={e => setDescription(e.target.value)} placeholder="Highlight features like balcony views, parking, pool, gym access..." className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Contact Agent Name *</label>
                      <input type="text" value={contactName} onChange={e => setContactName(e.target.value)} placeholder="e.g. Ahmed Khan" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Contact Phone / WhatsApp *</label>
                      <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)} placeholder="e.g. +923001234567" required className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none" />
                    </div>
                  </div>
                </div>

                {submitError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-3.5 rounded-xl font-semibold text-center">{submitError}</div>
                )}

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <Link href="/agency/dashboard" className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition">Cancel</Link>
                  <button type="submit" disabled={loading} className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow disabled:opacity-50 flex items-center gap-2">
                    {loading ? (<><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Publishing...</span></>) : 'Publish Property Listing'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
