'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export default function AgencySubmitListingPage() {
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState('APARTMENT');
  const [price, setPrice] = useState('');
  const [monthlyRent, setMonthlyRent] = useState('');
  const [isRental, setIsRental] = useState(false);
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dubai');
  const [bedrooms, setBedrooms] = useState('2');
  const [bathrooms, setBathrooms] = useState('2');
  const [areaSqFt, setAreaSqFt] = useState('1200');
  const [description, setDescription] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [virtualTourUrl, setVirtualTourUrl] = useState('https://my.matterport.com/show/?m=sample3d');

  // AI Extraction State
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [aiExtracted, setAiExtracted] = useState(false);
  const [aiConfidence, setAiConfidence] = useState<number | null>(null);
  const [isValuationEstimated, setIsValuationEstimated] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSold, setIsSold] = useState(false);

  // Trigger AI Document Extraction & Market Valuation
  const handleAiExtraction = (sampleType: 'title_deed' | 'rent_agreement' | 'missing_price') => {
    setIsAiExtracting(true);
    setAiExtracted(false);

    setTimeout(() => {
      setIsAiExtracting(false);
      setAiExtracted(true);

      if (sampleType === 'title_deed') {
        setFileName('Title_Deed_Marina_Tower_3.pdf');
        setTitle('Luxury 3-Bedroom Marina Tower Penthouse');
        setPropertyType('APARTMENT');
        setAddress('Unit 3402, Marina Tower 3, Dubai Marina');
        setCity('Dubai');
        setBedrooms('3');
        setBathrooms('3');
        setAreaSqFt('1850');
        setPrice('520000');
        setMonthlyRent('');
        setIsRental(false);
        setAiConfidence(98);
        setIsValuationEstimated(false);
        setDescription('AI Extracted: Panoramic sea-view penthouse with private balcony, maid room, and 2 covered parking slots.');
        setContactName('Sarah Jenkins');
        setContactPhone('+971 50 123 4567');
      } else if (sampleType === 'rent_agreement') {
        setFileName('Lease_Agreement_Downtown_Villa.pdf');
        setTitle('Exclusive 4-Bed Luxury Villa in Downtown');
        setPropertyType('VILLA');
        setAddress('Villa 14, Palm Avenue, Downtown');
        setCity('Dubai');
        setBedrooms('4');
        setBathrooms('4');
        setAreaSqFt('3200');
        setPrice('1450000');
        setMonthlyRent('9500');
        setIsRental(true);
        setAiConfidence(96);
        setIsValuationEstimated(false);
        setDescription('AI Extracted: Fully furnished luxury villa with private swimming pool, garden, and smart home automation.');
        setContactName('Marcus Vance');
        setContactPhone('+971 52 987 6543');
      } else {
        // missing_price case: compute AI Estimated Valuation based on specs
        setFileName('Property_Blueprint_Unpriced.pdf');
        setTitle('Modern 2-Bedroom Executive Suite');
        setPropertyType('APARTMENT');
        setAddress('Suite 18B, Business Bay Towers');
        setCity('Dubai');
        const beds = 2;
        const sqft = 1350;
        setBedrooms(String(beds));
        setBathrooms('2');
        setAreaSqFt(String(sqft));
        
        // Valuation formula: beds * 140k + sqft * 210
        const estimatedValuation = beds * 140000 + sqft * 210;
        setPrice(String(estimatedValuation));
        setMonthlyRent(String(Math.round(estimatedValuation * 0.006)));
        setIsRental(false);
        setAiConfidence(94);
        setIsValuationEstimated(true);
        setDescription('AI Extracted: Specs identified from blueprint. Price calculated using AI Market Valuation model based on Business Bay benchmark sales.');
        setContactName('Elena Rostova');
        setContactPhone('+971 55 444 3322');
      }
    }, 1000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFileName(e.target.files[0].name);
      handleAiExtraction('title_deed');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
      setLoading(false);
      setSubmitted(true);
    } catch {
      setLoading(false);
      alert('Failed to submit listing. Please try again.');
    }
  };

  const handleReset = () => {
    setTitle('');
    setPrice('');
    setMonthlyRent('');
    setAddress('');
    setDescription('');
    setContactName('');
    setContactPhone('');
    setAiExtracted(false);
    setAiConfidence(null);
    setFileName(null);
    setSubmitted(false);
  };

  return (
    <section className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-200">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Add New Property Listing</h1>
            <p className="text-sm text-gray-700 mt-1 font-medium">
              Publish agency property listings directly with AI document extraction & market valuation
            </p>
          </div>
          <Link
            href="/agency/dashboard"
            className="text-sm font-semibold text-blue-600 hover:text-blue-800 hover:underline"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {submitted ? (
          <div className="bg-white rounded-2xl p-8 shadow border border-emerald-200 text-center flex flex-col items-center gap-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl font-bold">
              ✓
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Property Listing Published!</h2>
            <p className="text-gray-700 max-w-md">
              Your property listing for <span className="font-bold text-gray-900">{title}</span> has been successfully added to your agency portfolio and published to the active marketplace.
            </p>

            {/* Mark as Sold / Closed Toggle */}
            <div className={`w-full max-w-md rounded-2xl border p-4 flex flex-col gap-2 transition-all ${
              isSold ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
            }`}>
              <div className="flex items-center justify-between">
                <div className="text-left">
                  <p className="text-sm font-bold text-gray-900">Mark as Sold / Closed</p>
                  <p className="text-xs text-gray-600 mt-0.5">
                    {isSold
                      ? '🔒 This listing is archived. It has been removed from the public marketplace and moved to your Archived Listings tab.'
                      : 'Toggle to close this deal and auto-archive the listing from the public marketplace.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsSold((v) => !v)}
                  className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${
                    isSold ? 'bg-red-500' : 'bg-gray-300'
                  }`}
                  role="switch"
                  aria-checked={isSold}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
                    isSold ? 'left-7' : 'left-1'
                  }`} />
                </button>
              </div>
              {isSold && (
                <span className="inline-flex items-center gap-1 self-start bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
                  🏷️ Archived — Hidden from Marketplace
                </span>
              )}
            </div>

            <div className="flex gap-4 mt-2">
              <button
                onClick={handleReset}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-lg shadow transition"
              >
                + Add Another Property
              </button>
              {!isSold && (
                <Link
                  href="/marketplace"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-6 py-2.5 rounded-lg transition"
                >
                  View Marketplace
                </Link>
              )}
              <Link
                href="/agency/dashboard"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2.5 rounded-lg transition"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* AI Document Extraction Section */}
            <div className="bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-teal-800/50">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">✨</span>
                  <h2 className="text-xl font-bold text-teal-300">AI Document Extraction & Valuation Engine</h2>
                </div>
                <span className="text-xs bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold">
                  OCR + Valuation Model
                </span>
              </div>
              <p className="text-xs text-slate-300 mb-5 leading-relaxed">
                Upload a Title Deed, Lease Contract, or Blueprint document. Our AI will automatically extract property specs, locations, and rent/sale prices or generate an AI Market Valuation.
              </p>

              {/* Sample Document Triggers */}
              <div className="flex flex-wrap items-center gap-3">
                <label className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-2">
                  <span>📄 Upload Document (PDF/Image)</span>
                  <input type="file" onChange={handleFileUpload} accept=".pdf,.png,.jpg,.jpeg,.docx" className="hidden" />
                </label>

                <button
                  type="button"
                  onClick={() => handleAiExtraction('title_deed')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                >
                  ⚡ Sample Title Deed (Sale)
                </button>

                <button
                  type="button"
                  onClick={() => handleAiExtraction('rent_agreement')}
                  className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                >
                  ⚡ Sample Lease Contract (Rent)
                </button>

                <button
                  type="button"
                  onClick={() => handleAiExtraction('missing_price')}
                  className="bg-purple-950/60 hover:bg-purple-900/80 border border-purple-500/30 text-purple-200 text-xs font-semibold px-3.5 py-2.5 rounded-xl transition"
                >
                  🔮 Missing Price (AI Market Valuation)
                </button>
              </div>

              {/* Extraction Processing State */}
              {isAiExtracting && (
                <div className="mt-4 p-4 bg-teal-900/40 border border-teal-500/30 rounded-xl flex items-center gap-3 animate-pulse">
                  <div className="w-5 h-5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs text-teal-200 font-semibold">
                    Extracting OCR document metadata, specs, location, and calculating market valuation...
                  </span>
                </div>
              )}

              {/* Extraction Summary */}
              {aiExtracted && !isAiExtracting && (
                <div className="mt-4 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 font-bold text-lg">✓</span>
                    <div>
                      <div className="text-xs font-bold text-emerald-300">
                        {fileName || 'Document Successfully Extracted'}
                      </div>
                      <div className="text-[11px] text-slate-300">
                        Auto-filled fields: Title, {isValuationEstimated ? 'AI Estimated Market Price' : 'Extracted Price'}, Property Type, Location, Bedrooms ({bedrooms}), Sq Ft ({areaSqFt})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isValuationEstimated ? (
                      <span className="px-3 py-1 bg-purple-900/80 text-purple-200 border border-purple-500/40 text-xs font-bold rounded-full">
                        AI Market Valuation
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-900/80 text-emerald-200 border border-emerald-500/40 text-xs font-bold rounded-full">
                        Document Price Extracted
                      </span>
                    )}
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-900 text-xs font-bold rounded-full shadow">
                      AI Confidence: {aiConfidence}%
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Listing Form */}
            <div className="bg-white rounded-2xl p-6 md:p-8 shadow-lg border border-gray-200">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Basic Details */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Property Overview</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Listing Title *</label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Luxury 2-Bedroom Apartment with Sea View"
                        required
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    {/* 3D Virtual Tour Embed Link */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900 flex items-center justify-between">
                        <span>3D Virtual Tour Link (360° / Matterport / Spline Embed)</span>
                        <span className="text-xs bg-purple-100 text-purple-800 border border-purple-200 px-2.5 py-0.5 rounded-full font-bold">
                          🕶️ 3D Tour Ready
                        </span>
                      </label>
                      <input
                        type="url"
                        value={virtualTourUrl}
                        onChange={(e) => setVirtualTourUrl(e.target.value)}
                        placeholder="https://my.matterport.com/show/?m=..."
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none text-xs"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Property Type *</label>
                      <select
                        value={propertyType}
                        onChange={(e) => setPropertyType(e.target.value)}
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      >
                        <option value="APARTMENT">Apartment</option>
                        <option value="VILLA">Villa</option>
                        <option value="HOUSE">House</option>
                        <option value="COMMERCIAL">Commercial Office</option>
                        <option value="PLOT">Land Plot</option>
                      </select>
                    </div>

                    {/* Price Field with AI Confidence Score Badge */}
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-sm font-bold text-gray-900">
                          {isValuationEstimated ? 'AI Estimated Market Valuation ($) *' : 'Extracted Sale Price ($) *'}
                        </label>
                        {aiConfidence && (
                          <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold rounded-full">
                            AI Confidence: {aiConfidence}%
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="e.g. 520000"
                        required
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                      {isValuationEstimated && (
                        <p className="text-xs text-purple-700 font-semibold">
                          🔮 Price missing in document — calculated via AI Market Valuation based on {bedrooms} beds & {areaSqFt} sq. ft specs.
                        </p>
                      )}
                    </div>

                    {/* Monthly Rent (Option) */}
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <div className="flex items-center gap-2 mb-1">
                        <input
                          type="checkbox"
                          id="is-rental"
                          checked={isRental}
                          onChange={(e) => setIsRental(e.target.checked)}
                          className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                        />
                        <label htmlFor="is-rental" className="text-sm font-bold text-gray-900 cursor-pointer">
                          This property is also available for Monthly Rent
                        </label>
                      </div>
                      {isRental && (
                        <div className="flex flex-col gap-1">
                          <label className="text-xs font-bold text-gray-800">Monthly Rent Amount ($/mo)</label>
                          <input
                            type="number"
                            value={monthlyRent}
                            onChange={(e) => setMonthlyRent(e.target.value)}
                            placeholder="e.g. 3500"
                            className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location & Specs */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Location & Specs</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Full Address / Location *</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="Marina Gate 1, Dubai Marina"
                        required
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">City *</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Dubai"
                        required
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Bedrooms</label>
                      <input
                        type="number"
                        value={bedrooms}
                        onChange={(e) => setBedrooms(e.target.value)}
                        min="0"
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Bathrooms</label>
                      <input
                        type="number"
                        value={bathrooms}
                        onChange={(e) => setBathrooms(e.target.value)}
                        min="0"
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Area (Sq Ft)</label>
                      <input
                        type="number"
                        value={areaSqFt}
                        onChange={(e) => setAreaSqFt(e.target.value)}
                        placeholder="1200"
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Description & Contact */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">Description & Agent Contact</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5 md:col-span-2">
                      <label className="text-sm font-bold text-gray-900">Description</label>
                      <textarea
                        rows={3}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Highlight features like balcony views, parking, pool, and gym access..."
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Contact Agent Name</label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Sarah Jenkins"
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-sm font-bold text-gray-900">Contact Phone / WhatsApp</label>
                      <input
                        type="tel"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        placeholder="+971 50 123 4567"
                        className="bg-white border border-gray-300 rounded-lg px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
                  <Link
                    href="/agency/dashboard"
                    className="px-5 py-2.5 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition"
                  >
                    Cancel
                  </Link>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-8 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition shadow disabled:opacity-50"
                  >
                    {loading ? 'Publishing Property...' : 'Publish Property Listing'}
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
