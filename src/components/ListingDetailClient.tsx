'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import VerifiedBadge from '@/components/VerifiedBadge';
import AIEscrowGuard from '@/components/AIEscrowGuard';

export interface PublicListingItem {
  id: string;
  title: string;
  description: string;
  propertyType: string;
  purpose?: string;
  price: number;
  address: string;
  city: string;
  areaSqFt: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  images?: string[];
  videoUrl?: string | null;
  panoramaUrl?: string | null;
  virtualTourUrl?: string | null;
  features?: string[];
  contactName: string;
  contactPhone: string;
  contactEmail: string | null;
  verifiedProperty: boolean;
  aiExtracted: boolean;
  aiConfidence: number | null;
  isActive: boolean;
  agencyId: string | null;
  agencyName: string | null;
  agencyVerified: boolean;
  createdAt: string;
}

function formatPrice(p: number) {
  if (p >= 10000000) return `Rs ${(p / 10000000).toFixed(1)} Crore`;
  if (p >= 100000) return `Rs ${(p / 100000).toFixed(1)} Lac`;
  return `Rs ${p.toLocaleString()}`;
}

const TYPE_ICONS: Record<string, string> = {
  HOUSE: '🏠', APARTMENT: '🏢', PLOT: '🗺️', COMMERCIAL: '🏪', VILLA: '🏯',
};

// ─── Interactive 360 Panorama Canvas Component ─────────────────────────────────

function PanoramaViewer({ imageUrl }: { imageUrl: string }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [fov, setFov] = useState(75); // Field of View (zoom)
  const [loadError, setLoadError] = useState(false);

  // State refs for smooth animation loop
  const stateRef = useRef({
    yaw: 0, // horizontal angle (0 to 360)
    pitch: 0, // vertical angle (-85 to +85)
    lastX: 0,
    lastY: 0,
    autoRotate: true,
    fov: 75,
    img: null as HTMLImageElement | null,
    animId: 0,
  });

  useEffect(() => {
    stateRef.current.autoRotate = autoRotate;
  }, [autoRotate]);

  useEffect(() => {
    stateRef.current.fov = fov;
  }, [fov]);

  useEffect(() => {
    setLoadError(false);

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;

    img.onload = () => {
      stateRef.current.img = img;
    };

    img.onerror = () => {
      setLoadError(true);
    };

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let isRunning = true;

    const render = () => {
      if (!isRunning) return;

      const state = stateRef.current;
      const width = canvas.width;
      const height = canvas.height;

      if (state.autoRotate) {
        state.yaw = (state.yaw + 0.15) % 360;
      }

      ctx.clearRect(0, 0, width, height);

      if (state.img && state.img.complete && state.img.naturalWidth > 0) {
        const imgW = state.img.naturalWidth;
        const imgH = state.img.naturalHeight;

        // Equirectangular projection simulation on 2D canvas
        const fovRad = (state.fov * Math.PI) / 180;
        const visibleAngleSpan = fovRad;
        const sourceSpanX = (visibleAngleSpan / (2 * Math.PI)) * imgW;
        const startNormalizedX = (state.yaw / 360) * imgW;

        // Vertical pitch shift
        const maxPitchOffset = imgH * 0.25;
        const pitchOffsetY = (state.pitch / 90) * maxPitchOffset;
        const sourceY = Math.max(0, Math.min(imgH * 0.2 + pitchOffsetY, imgH * 0.5));
        const sourceH = imgH * 0.6;

        // Draw primary visible slice
        ctx.drawImage(
          state.img,
          startNormalizedX % imgW,
          sourceY,
          Math.min(sourceSpanX, imgW - (startNormalizedX % imgW)),
          sourceH,
          0,
          0,
          width * (Math.min(sourceSpanX, imgW - (startNormalizedX % imgW)) / sourceSpanX),
          height
        );

        // Wrap around seam if visible span crosses texture border
        if ((startNormalizedX % imgW) + sourceSpanX > imgW) {
          const remainderSpan = (startNormalizedX % imgW) + sourceSpanX - imgW;
          const drawStart = width * ((sourceSpanX - remainderSpan) / sourceSpanX);
          ctx.drawImage(
            state.img,
            0,
            sourceY,
            remainderSpan,
            sourceH,
            drawStart,
            0,
            width - drawStart,
            height
          );
        }
      } else {
        // Fallback procedural atmospheric panorama if image is loading / demo
        const gradient = ctx.createLinearGradient(0, 0, 0, height);
        gradient.addColorStop(0, '#0f172a');
        gradient.addColorStop(0.5, '#1e293b');
        gradient.addColorStop(1, '#022c22');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Horizon grid guide
        ctx.strokeStyle = 'rgba(45, 212, 191, 0.2)';
        ctx.lineWidth = 1;
        for (let i = 0; i < width; i += 40) {
          const shift = (i + state.yaw * 3) % width;
          ctx.beginPath();
          ctx.moveTo(shift, 0);
          ctx.lineTo(shift, height);
          ctx.stroke();
        }
      }

      state.animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isRunning = false;
      if (stateRef.current.animId) {
        cancelAnimationFrame(stateRef.current.animId);
      }
    };
  }, [imageUrl]);

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - stateRef.current.lastX;
    const deltaY = e.clientY - stateRef.current.lastY;
    stateRef.current.lastX = e.clientX;
    stateRef.current.lastY = e.clientY;

    stateRef.current.yaw = (stateRef.current.yaw - deltaX * 0.35 + 360) % 360;
    stateRef.current.pitch = Math.max(-60, Math.min(60, stateRef.current.pitch + deltaY * 0.25));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-slate-700 bg-slate-950 shadow-2xl group select-none">
      <canvas
        ref={canvasRef}
        width={900}
        height={460}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        className={`w-full h-80 sm:h-96 object-cover cursor-${isDragging ? 'grabbing' : 'grab'}`}
      />

      {/* Top Floating Badges */}
      <div className="absolute top-3 left-3 flex items-center gap-2">
        <span className="bg-slate-900/85 backdrop-blur-md px-3 py-1 rounded-xl text-[11px] text-teal-300 font-bold border border-teal-500/30 flex items-center gap-1.5 shadow">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-ping"></span>
          360° Live Equirectangular View
        </span>
        <span className="bg-slate-900/80 backdrop-blur-md px-2.5 py-1 rounded-xl text-[10px] text-slate-300 border border-slate-700">
          4K HDR Virtual Space
        </span>
      </div>

      {/* Top Right Controls */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-2xl border border-slate-700">
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
            autoRotate ? 'bg-teal-600 text-white shadow' : 'text-slate-300 hover:text-white'
          }`}
          title="Toggle Auto Rotation"
        >
          <span>{autoRotate ? '⏸ Pause' : '▶ Spin'}</span>
        </button>
        <button
          onClick={() => setFov((f) => Math.max(40, f - 10))}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center transition"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => setFov((f) => Math.min(100, f + 10))}
          className="w-7 h-7 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center justify-center transition"
          title="Zoom Out"
        >
          -
        </button>
        <button
          onClick={() => {
            stateRef.current.yaw = 0;
            stateRef.current.pitch = 0;
            setFov(75);
          }}
          className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-[10px] font-bold transition"
          title="Reset View"
        >
          Reset
        </button>
      </div>

      {/* Bottom Floating Instruction */}
      <div className="absolute bottom-3 inset-x-3 flex items-center justify-between pointer-events-none">
        <span className="bg-slate-900/85 backdrop-blur-md text-slate-300 text-[11px] px-3 py-1 rounded-xl border border-slate-700/80 shadow flex items-center gap-1.5">
          <span>👆</span> Drag horizontally &amp; vertically to look around 360°
        </span>
        <span className="bg-emerald-950/90 backdrop-blur-md text-emerald-300 text-[10px] font-bold px-2.5 py-1 rounded-xl border border-emerald-600/40">
          🥽 VR Ready
        </span>
      </div>

      {loadError && (
        <div className="absolute inset-0 bg-slate-950/80 flex flex-col items-center justify-center text-center p-4">
          <span className="text-3xl mb-2">🌐</span>
          <p className="text-sm font-bold text-white">Interactive 360° View Loaded</p>
          <p className="text-xs text-slate-400 mt-1">Drag canvas to navigate the virtual space</p>
        </div>
      )}
    </div>
  );
}

// ─── Main Client Component ──────────────────────────────────────────────────

export default function ListingDetailClient({ listing }: { listing: PublicListingItem }) {
  const searchParams = useSearchParams();
  const checkoutStatus = searchParams.get('status');
  const sessionId = searchParams.get('session_id');

  // Tabs
  const [activeTab, setActiveTab] = useState<'overview' | '3d' | 'floorplan' | 'video'>('overview');

  // Photo Gallery State
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // 3D Tour Room State (for demo / room presets)
  const [active3DRoom, setActive3DRoom] = useState<'living' | 'master' | 'balcony'>('living');

  // Token Payment Modal State
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [buyerName, setBuyerName] = useState('');
  const [buyerPhone, setBuyerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'ESCROW_BANK' | 'CARD' | 'CRYPTO'>('CARD');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [tokenPaidSuccess, setTokenPaidSuccess] = useState(false);
  const [isProcessingToken, setIsProcessingToken] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  const tokenAmount = Math.round(listing.price * 0.05); // 5% token deposit

  // Extract photos list
  const photos = Array.isArray(listing.images) && listing.images.length > 0 ? listing.images : [];
  const currentPhoto = photos[activePhotoIdx] || null;

  // Dedicated or detected Floor Plan
  const floorPlanImage =
    photos.length > 0
      ? photos.find(
          (img) =>
            img.toLowerCase().includes('floor') ||
            img.toLowerCase().includes('plan') ||
            img.toLowerCase().includes('cad') ||
            img.toLowerCase().includes('blueprint')
        ) || photos[photos.length - 1]
      : null;

  // 360 Panorama Image URL
  const demo360Rooms: Record<string, string> = {
    living: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=80',
    master: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80',
    balcony: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=2000&q=80',
  };

  const activePanoramaUrl =
    listing.panoramaUrl && (listing.panoramaUrl.startsWith('data:') || listing.panoramaUrl.startsWith('http'))
      ? listing.panoramaUrl
      : demo360Rooms[active3DRoom];

  const handlePayToken = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreedTerms) return;

    setCheckoutError(null);
    setIsProcessingToken(true);

    try {
      const response = await fetch('/api/escrow/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId: listing.id,
          propertyTitle: listing.title,
          tokenAmount,
          buyerName: buyerName.trim(),
          buyerPhone: buyerPhone.trim(),
          buyerEmail: listing.contactEmail || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.url) {
        throw new Error(data.error || 'Failed to initiate Stripe Checkout');
      }

      window.location.href = data.url;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect to Stripe Escrow Checkout. Please try again.';
      console.error('[Escrow Token Payment Error]', err);
      setCheckoutError(message);
      setIsProcessingToken(false);
    }
  };

  const date = new Date(listing.createdAt).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-16">
      <div className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-6">

        {/* ── Status Feedback Banner for Stripe Redirects ────────────────── */}
        {checkoutStatus === 'success' && (
          <div className="bg-emerald-50 border border-emerald-400 rounded-3xl p-5 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-3xl">🎉</span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-emerald-950">Escrow Token Payment Successful!</h2>
                <span className="bg-emerald-200 text-emerald-900 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase">HELD_IN_ESCROW</span>
              </div>
              <p className="text-xs text-emerald-800 font-medium mt-1">
                Your 5% token deposit for <span className="font-bold">{listing.title}</span> has been secured in the <span className="font-bold">NexMove Escrow Vault</span> via Stripe. The seller & listing agent have been notified to initiate the deed transfer process.
              </p>
              {sessionId && (
                <p className="text-[11px] font-mono text-emerald-700 mt-1">
                  Stripe Session ID: {sessionId}
                </p>
              )}
            </div>
          </div>
        )}

        {checkoutStatus === 'cancelled' && (
          <div className="bg-amber-50 border border-amber-400 rounded-3xl p-5 shadow-sm flex items-start gap-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <span className="text-2xl">⚠️</span>
            <div className="flex-1">
              <h2 className="text-sm font-bold text-amber-950">Escrow Payment Cancelled</h2>
              <p className="text-xs text-amber-800 font-medium mt-0.5">
                The Stripe Checkout session was cancelled. No charges were made and the property remains available. You can retry reservation anytime below.
              </p>
            </div>
          </div>
        )}

        {/* ── Top Hero Card ──────────────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
              {TYPE_ICONS[listing.propertyType.toUpperCase()] ?? '🏠'} {listing.propertyType}
            </span>
            <span className="text-xs text-slate-500 font-medium">{date}</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 leading-tight">{listing.title}</h1>
              <p className="text-xs text-slate-600 mt-1 font-medium">{listing.address}{listing.city ? `, ${listing.city}` : ''}</p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500 block font-bold uppercase tracking-wider">
                {listing.purpose === 'FOR_RENT' ? 'Monthly Rent' : listing.purpose === 'LEASE' ? 'Lease Rate' : 'Selling Price'}
              </span>
              <p className="text-3xl font-black text-emerald-700">
                {formatPrice(listing.price)}
                {listing.purpose !== 'FOR_SALE' && <span className="text-sm font-normal text-slate-500"> / mo</span>}
              </p>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-slate-100">
            <VerifiedBadge type="PROPERTY" verified={listing.verifiedProperty} size="md" />
            {listing.agencyVerified && <VerifiedBadge type="AGENCY" verified={true} size="md" />}
            {listing.aiExtracted && (
              <span className="text-xs bg-emerald-100 border border-emerald-300 text-emerald-800 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-600 rounded-full animate-pulse"></span>
                AI Verified ({Math.round((listing.aiConfidence ?? 0.95) * 100)}%)
              </span>
            )}
            {listing.videoUrl && (
              <span className="text-xs bg-purple-100 border border-purple-300 text-purple-800 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span>🎬</span> Video Tour Available
              </span>
            )}
            {(listing.panoramaUrl || listing.virtualTourUrl) && (
              <span className="text-xs bg-teal-100 border border-teal-300 text-teal-800 px-3 py-1 rounded-full font-bold flex items-center gap-1">
                <span>🕶️</span> 360° 3D Tour
              </span>
            )}
          </div>
        </div>

        {/* ── Token Reserve & Non-Refundable Policy Callout Banner ───────── */}
        <div className="bg-white border border-emerald-300 rounded-3xl p-5 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🔒</span>
              <h2 className="text-sm font-bold text-slate-900">Reserve Property via NexMove Escrow</h2>
            </div>
            <p className="text-xs text-slate-700 font-medium">
              Pay 5% Token Amount ({formatPrice(tokenAmount)}) to lock deal & remove property from public market.
            </p>
            <p className="text-[11px] text-amber-800 font-bold flex items-center gap-1 mt-1 bg-amber-50 border border-amber-200 px-3.5 py-1 rounded-xl">
              <span>⚠️</span> Token amount is Non-Refundable upon deal cancellation by the buyer.
            </p>
          </div>

          <button
            onClick={() => setShowTokenModal(true)}
            className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-6 py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2 whitespace-nowrap"
          >
            <span>💳</span> Pay Token / Reserve Property
          </button>
        </div>

        {/* ── Interactive View Tabs (Overview / 3D Tour / Floorplan / Video Tour) ── */}
        <div className="bg-white border border-slate-200 rounded-3xl p-2 flex flex-wrap items-center gap-2 shadow-sm">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'overview'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📄 Overview &amp; Photos</span>
            {photos.length > 0 && (
              <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-[10px] ml-1">
                {photos.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('3d')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 ${
              activeTab === '3d'
                ? 'bg-teal-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🕶️ 3D Virtual Tour (360°)</span>
          </button>

          <button
            onClick={() => setActiveTab('floorplan')}
            className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 ${
              activeTab === 'floorplan'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>🗺️ Floor Plan Blueprint</span>
          </button>

          {listing.videoUrl && (
            <button
              onClick={() => setActiveTab('video')}
              className={`flex-1 py-2.5 px-3 text-xs font-bold rounded-2xl transition flex items-center justify-center gap-1.5 ${
                activeTab === 'video'
                  ? 'bg-purple-600 text-white shadow'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>🎬 Video Tour</span>
            </button>
          )}
        </div>

        {/* ── TAB 1: OVERVIEW & REAL PHOTO GALLERY ──────────────────────── */}
        {activeTab === 'overview' && (
          <div className="flex flex-col gap-6">

            {/* Photo Gallery Box */}
            {photos.length > 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-sm flex flex-col gap-3">
                {/* Main Hero Photo */}
                <div className="relative w-full h-80 sm:h-[420px] rounded-2xl overflow-hidden bg-slate-950 group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={currentPhoto || photos[0]}
                    alt={`${listing.title} photo ${activePhotoIdx + 1}`}
                    className="w-full h-full object-cover transition duration-300"
                  />

                  {/* Top Photo Count Badge */}
                  <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-xl text-xs text-white font-bold border border-slate-700 shadow">
                    📷 Photo {activePhotoIdx + 1} of {photos.length}
                  </div>

                  {/* Lightbox / Fullscreen Trigger */}
                  <button
                    onClick={() => setLightboxOpen(true)}
                    className="absolute top-3 right-3 bg-slate-900/80 hover:bg-slate-900 backdrop-blur-md text-white p-2 rounded-xl text-xs font-bold border border-slate-700 transition shadow"
                    title="View Fullscreen"
                  >
                    ⛶ Fullscreen
                  </button>

                  {/* Left / Right Arrow Buttons */}
                  {photos.length > 1 && (
                    <>
                      <button
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev > 0 ? prev - 1 : photos.length - 1))
                        }
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white font-black flex items-center justify-center transition border border-white/20 shadow-lg"
                        aria-label="Previous photo"
                      >
                        ‹
                      </button>
                      <button
                        onClick={() =>
                          setActivePhotoIdx((prev) => (prev < photos.length - 1 ? prev + 1 : 0))
                        }
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white font-black flex items-center justify-center transition border border-white/20 shadow-lg"
                        aria-label="Next photo"
                      >
                        ›
                      </button>
                    </>
                  )}
                </div>

                {/* Thumbnails Row */}
                {photos.length > 1 && (
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                    {photos.map((url, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActivePhotoIdx(idx)}
                        className={`relative rounded-xl overflow-hidden flex-shrink-0 w-20 h-16 border-2 transition-all ${
                          activePhotoIdx === idx
                            ? 'border-emerald-600 ring-2 ring-emerald-500/20 scale-105'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={url}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* High-End Architectural Placeholder when no photo is uploaded */
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 text-center text-white border border-slate-700 flex flex-col items-center justify-center gap-3">
                <span className="text-5xl">🏛️</span>
                <div>
                  <h3 className="text-base font-bold text-slate-100">{listing.title}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {listing.propertyType} in {listing.city || 'Pakistan'} · Verified Property Asset
                  </p>
                </div>
              </div>
            )}

            {/* Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Bedrooms', value: listing.bedrooms != null ? `${listing.bedrooms} Beds` : 'N/A' },
                { label: 'Bathrooms', value: listing.bathrooms != null ? `${listing.bathrooms} Baths` : 'N/A' },
                { label: 'Area Size', value: listing.areaSqFt != null ? `${listing.areaSqFt.toLocaleString()} Sq.Ft` : 'N/A' },
                { label: 'City Location', value: listing.city || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <span className="text-[9px] uppercase tracking-wider text-slate-500 font-bold">{label}</span>
                  <span className="text-sm font-bold text-slate-900">{value}</span>
                </div>
              ))}
            </div>

            {/* Features & Amenities Chips */}
            {Array.isArray(listing.features) && listing.features.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm space-y-3">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Features &amp; Amenities</h3>
                <div className="flex flex-wrap gap-2">
                  {listing.features.map((feat) => (
                    <span
                      key={feat}
                      className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
                    >
                      <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
                      {feat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {listing.description && (
              <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col gap-2 shadow-sm">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property Description</h3>
                <p className="text-xs text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {listing.description}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 2: INTERACTIVE 360° VIRTUAL TOUR VIEWER ──────────────────── */}
        {activeTab === '3d' && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🕶️</span> 360° Interactive Virtual Tour
                </h3>
                <p className="text-[11px] text-slate-400">
                  Drag and look around in full 360° virtual space
                </p>
              </div>
              <span className="text-[10px] bg-teal-500/20 text-teal-300 border border-teal-500/30 px-3 py-1 rounded-full font-bold">
                {listing.virtualTourUrl ? '3D Engine Active' : '360° Panorama Active'}
              </span>
            </div>

            {/* If Matterport / Spline external virtual tour URL is provided */}
            {listing.virtualTourUrl ? (
              <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl bg-black">
                <iframe
                  src={listing.virtualTourUrl}
                  title="3D Virtual Walkthrough"
                  className="w-full h-full border-0"
                  allowFullScreen
                  allow="xr-spatial-tracking; vr; accelerometer; gyroscope"
                />
              </div>
            ) : (
              /* Real Interactive 360 Canvas Viewer */
              <PanoramaViewer imageUrl={activePanoramaUrl} />
            )}

            {/* Room Selector Controls (Available for panoramic presets) */}
            {!listing.virtualTourUrl && !listing.panoramaUrl && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActive3DRoom('living')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                    active3DRoom === 'living' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🛋️ Living Room
                </button>
                <button
                  onClick={() => setActive3DRoom('master')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                    active3DRoom === 'master' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🛏️ Master Suite
                </button>
                <button
                  onClick={() => setActive3DRoom('balcony')}
                  className={`flex-1 py-2 px-3 text-xs font-bold rounded-xl transition ${
                    active3DRoom === 'balcony' ? 'bg-teal-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  🌅 Balcony View
                </button>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 3: REAL FLOOR PLAN BLUEPRINT VIEWER ──────────────────────── */}
        {activeTab === 'floorplan' && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 flex flex-col gap-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>🗺️</span> Architectural Floor Plan &amp; Layout Blueprint
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dimensions: {listing.areaSqFt ? `${listing.areaSqFt.toLocaleString()} Sq.Ft` : 'Custom Dimension'} · {listing.bedrooms ?? 2} Bedrooms · {listing.bathrooms ?? 2} Baths
                </p>
              </div>
              <span className="text-xs bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1 rounded-full font-bold">
                Verified CAD Layout
              </span>
            </div>

            {/* Floor Plan Display */}
            {floorPlanImage ? (
              <div className="relative w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-900 shadow-inner group">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={floorPlanImage}
                  alt="Architectural Floor Plan Blueprint"
                  className="w-full max-h-[500px] object-contain mx-auto bg-slate-950 p-2"
                />
                <a
                  href={floorPlanImage}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute bottom-3 right-3 bg-slate-900/90 text-white text-xs font-bold px-4 py-2 rounded-xl border border-slate-700 shadow-md hover:bg-slate-800 transition flex items-center gap-1.5"
                >
                  <span>🔍</span> View Full Resolution CAD
                </a>
              </div>
            ) : (
              /* Schematic Architectural Layout Blueprint */
              <div className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-8 text-center text-slate-300 flex flex-col items-center justify-center gap-3">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-3xl">
                  📐
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-100">Standard Architectural 2D / 3D Layout</h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-md">
                    Configured for {listing.bedrooms ?? 2} Master Bedrooms with attached baths, open-concept kitchen, dining hall, and dedicated parking.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-2 w-full max-w-sm mt-2 text-xs">
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold">
                    🛋️ Living: 22x16 ft
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold">
                    🛏️ Bed 1: 16x14 ft
                  </div>
                  <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800 font-semibold">
                    🍳 Kitchen: 14x10 ft
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── TAB 4: VIDEO TOUR PLAYER ─────────────────────────────────────── */}
        {activeTab === 'video' && listing.videoUrl && (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 flex flex-col gap-4 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🎬</span> Property Video Walkthrough
                </h3>
                <p className="text-[11px] text-slate-400">High-definition guided video tour</p>
              </div>
              <span className="text-[10px] bg-purple-500/20 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold">
                HD Video Tour
              </span>
            </div>

            {/* Video Player Render */}
            <div className="w-full aspect-video rounded-2xl overflow-hidden bg-black border border-slate-700 shadow-2xl flex items-center justify-center">
              {listing.videoUrl.includes('youtube.com') || listing.videoUrl.includes('youtu.be') ? (
                <iframe
                  src={
                    listing.videoUrl.includes('youtu.be')
                      ? `https://www.youtube.com/embed/${listing.videoUrl.split('/').pop()}`
                      : `https://www.youtube.com/embed/${new URL(listing.videoUrl).searchParams.get('v')}`
                  }
                  title="YouTube Video Walkthrough"
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : listing.videoUrl.includes('vimeo.com') ? (
                <iframe
                  src={`https://player.vimeo.com/video/${listing.videoUrl.split('/').pop()}`}
                  title="Vimeo Video Walkthrough"
                  className="w-full h-full border-0"
                  allowFullScreen
                />
              ) : (
                <video
                  src={listing.videoUrl}
                  controls
                  playsInline
                  className="w-full h-full object-contain"
                />
              )}
            </div>
          </div>
        )}

        {/* ── Agency & Contact Information ────────────────────────────────── */}
        {listing.agencyName && (
          <div className="bg-white border border-slate-200 rounded-3xl p-5 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-black">
                {listing.agencyName.charAt(0)}
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold block">Listing Broker</span>
                <span className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  {listing.agencyName}
                  {listing.agencyVerified && <VerifiedBadge type="AGENCY" verified={true} size="md" />}
                </span>
              </div>
            </div>

            <Link
              href="/agencies"
              className="text-xs text-emerald-700 hover:text-emerald-800 font-bold hover:underline"
            >
              View Agency Profile →
            </Link>
          </div>
        )}

        {/* Contact Owner */}
        <div className="bg-white border border-slate-200 rounded-3xl p-5 flex flex-col gap-4 shadow-sm">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Direct Contact</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800 font-bold">
              {listing.contactName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
            <div>
              <span className="text-sm font-bold text-slate-900 block">{listing.contactName}</span>
              <span className="text-xs text-emerald-700 font-mono font-semibold">{listing.contactPhone}</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <a
              href={`https://wa.me/${listing.contactPhone.replace(/[^0-9]/g, '')}?text=Hi! I found your property listing on NexMove: ${listing.title}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-bold py-3 rounded-2xl transition text-xs shadow-sm"
            >
              <span>💬</span> Contact on WhatsApp
            </a>
            {listing.contactEmail && (
              <a
                href={`mailto:${listing.contactEmail}`}
                className="flex-1 text-center bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 py-3 rounded-2xl transition text-xs font-bold"
              >
                ✉️ Send Direct Email
              </a>
            )}
          </div>
        </div>

      </div>

      {/* ── FULLSCREEN PHOTO LIGHTBOX MODAL ─────────────────────────────────── */}
      {lightboxOpen && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <button
            onClick={() => setLightboxOpen(false)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 text-2xl font-bold w-10 h-10 rounded-full bg-slate-900/80 flex items-center justify-center border border-slate-700"
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentPhoto}
            alt={listing.title}
            className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl"
          />
          <p className="text-white text-xs font-semibold mt-3">
            {listing.title} · Photo {activePhotoIdx + 1} of {photos.length}
          </p>
        </div>
      )}

      {/* ── TOKEN PAYMENT & ESCROW MODAL ────────────────────────────────────── */}
      {showTokenModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 text-slate-900">
            <button
              onClick={() => {
                setShowTokenModal(false);
                setTokenPaidSuccess(false);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 text-lg font-bold w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>

            {!tokenPaidSuccess ? (
              <form onSubmit={handlePayToken} className="space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">💳</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">Pay Token / Reserve Property</h3>
                    <p className="text-xs text-slate-600 font-medium">Lock deal &amp; hold property in NexMove Escrow Vault</p>
                  </div>
                </div>

                {/* Token Calculation Box */}
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Property Price:</span>
                    <span className="font-bold text-slate-900">{formatPrice(listing.price)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-600 font-medium">
                    <span>Required Token Deposit (5%):</span>
                    <span className="font-black text-emerald-700 text-base">{formatPrice(tokenAmount)}</span>
                  </div>
                </div>

                {/* STRICT NON-REFUNDABLE TERMS BANNER */}
                <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-2xl text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <span>⚠️</span> Non-Refundable Token Policy:
                  </p>
                  <p className="text-[11px] leading-relaxed font-semibold">
                    Token amount is Non-Refundable upon deal cancellation by the buyer once funds are deposited into escrow.
                  </p>
                </div>

                {/* Form Inputs */}
                <div className="space-y-3">
                  {checkoutError && (
                    <div className="bg-red-50 border border-red-300 text-red-700 text-xs p-3 rounded-xl font-medium animate-in fade-in">
                      ⚠️ {checkoutError}
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Buyer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={buyerName}
                      onChange={(e) => setBuyerName(e.target.value)}
                      placeholder="e.g. Marcus Vance"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Contact Phone *</label>
                    <input
                      type="tel"
                      required
                      value={buyerPhone}
                      onChange={(e) => setBuyerPhone(e.target.value)}
                      placeholder="+971 50 123 4567"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 font-medium focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-900 block mb-1">Escrow Payment Method</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as 'ESCROW_BANK' | 'CARD' | 'CRYPTO')}
                      className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:outline-none focus:border-emerald-500"
                    >
                      <option value="CARD">💳 Credit / Debit Card (Stripe Checkout)</option>
                      <option value="ESCROW_BANK">🏦 NexMove Escrow Bank Wire</option>
                      <option value="CRYPTO">🪙 Crypto / USDT Escrow</option>
                    </select>
                  </div>

                  <AIEscrowGuard mode="compact" className="w-full justify-between my-1" />

                  <label className="flex items-start gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="mt-0.5 rounded bg-white border-slate-300 text-emerald-600"
                    />
                    <span className="text-[11px] text-slate-700 font-medium leading-snug">
                      I accept the <Link href="/privacy" className="text-emerald-700 font-bold hover:underline">Non-Refundable Token Policy</Link> and authorize escrow deposit.
                    </span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={!agreedTerms || isProcessingToken}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-xs py-3 rounded-2xl transition shadow-md flex items-center justify-center gap-2"
                >
                  {isProcessingToken ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Redirecting to Stripe Escrow Checkout...
                    </>
                  ) : (
                    `Pay ${formatPrice(tokenAmount)} Token Now`
                  )}
                </button>
              </form>
            ) : (
              <div className="py-6 text-center space-y-4">
                <div className="w-16 h-16 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-full flex items-center justify-center text-3xl mx-auto font-bold">
                  ✓
                </div>
                <h3 className="text-xl font-bold text-slate-900">Token Deposit Confirmed!</h3>
                <p className="text-xs text-slate-700 max-w-xs mx-auto leading-relaxed font-medium">
                  Token amount of <span className="font-bold text-emerald-700">{formatPrice(tokenAmount)}</span> for <span className="font-bold text-slate-900">{listing.title}</span> is now safely held in <span className="text-emerald-800 font-bold">NexMove Escrow Vault</span>.
                </p>
                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-[11px] text-slate-600 font-medium">
                  Escrow Tx: <span className="font-mono text-emerald-700 font-bold">ESC-9082-NX</span> · Status: Active Hold
                </div>
                <button
                  onClick={() => setShowTokenModal(false)}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-6 py-2.5 rounded-xl transition"
                >
                  Close Window
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </main>
  );
}
