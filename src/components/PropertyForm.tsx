'use client';

import React, { useState, useRef, useId } from 'react';
import Link from 'next/link';

export type PropertyPurposeType = 'FOR_SALE' | 'FOR_RENT' | 'LEASE';

export interface PropertyFormProps {
 initialAgencyId?: string;
 onSuccessRedirect?: string;
 isAgencyPortal?: boolean;
}

// ─── Vector SVG Icons (Lucide Clean Stroke Architecture) ──────────────────────

function IconCompass({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="12" cy="12" r="10" />
 <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
 </svg>
 );
}

function IconRoad({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M4 19 8 5" />
 <path d="M20 19 16 5" />
 <line x1="12" x2="12" y1="5" y2="7" />
 <line x1="12" x2="12" y1="11" y2="13" />
 <line x1="12" x2="12" y1="17" y2="19" />
 </svg>
 );
}

function IconSofa({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3" />
 <path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0Z" />
 <path d="M4 18v2" />
 <path d="M20 18v2" />
 <path d="M12 4v9" />
 </svg>
 );
}

function IconZap({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
 </svg>
 );
}

function IconFlame({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
 </svg>
 );
}

function IconDroplets({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M7 16.3c2.2 0 4-1.83 4-4.05 0-1.16-.57-2.26-1.71-3.19S7.29 6.75 7 5.3c-.29 1.45-1.14 2.84-2.29 3.76S3 11.1 3 12.25c0 2.22 1.8 4.05 4 4.05z" />
 <path d="M12.56 6.6A10.97 10.97 0 0 0 14 3.02c.5 2.5 2 4.9 4 6.5s3 3.5 3 5.5a6.98 6.98 0 0 1-11.91 4.97" />
 </svg>
 );
}

function IconShieldCheck({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
 <path d="m9 12 2 2 4-4" />
 </svg>
 );
}

function IconCar({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
 <circle cx="7" cy="17" r="2" />
 <path d="M9 17h6" />
 <circle cx="17" cy="17" r="2" />
 </svg>
 );
}

function IconDumbbell({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="m6.5 6.5 11 11" />
 <path d="m21 21-1-1" />
 <path d="m3 3 1 1" />
 <path d="m18 22 4-4" />
 <path d="m2 6 4-4" />
 <path d="m3 10 7-7" />
 <path d="m14 21 7-7" />
 </svg>
 );
}

function IconTrees({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M10 10v.2A3 3 0 0 1 8.9 16H5a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z" />
 <path d="M7 16v6" />
 <path d="M13 19v3" />
 <path d="M12 19h8.3a1 1 0 0 0 .7-1.7L18 14h.3a1 1 0 0 0 .7-1.7L16 9h.2a1 1 0 0 0 .8-1.7L13 3l-1.4 1.5" />
 </svg>
 );
}

function IconTag({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M12 2H2v10l9.29 9.29c.94.94 2.48.94 3.42 0l6.58-6.58c.94-.94.94-2.48 0-3.42L12 2Z" />
 <path d="M7 7h.01" />
 </svg>
 );
}

function IconKey({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <circle cx="7.5" cy="15.5" r="5.5" />
 <path d="m21 2-9.6 9.6" />
 <path d="m15.5 7.5 3 3L22 7l-3-3" />
 </svg>
 );
}

function IconFileText({ className = 'w-5 h-5' }: { className?: string }) {
 return (
 <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
 <polyline points="14 2 14 8 20 8" />
 <line x1="16" x2="8" y1="13" y2="13" />
 <line x1="16" x2="8" y1="17" y2="17" />
 <line x1="10" x2="8" y1="9" y2="9" />
 </svg>
 );
}

// ─── Amenity Definitions ──────────────────────────────────────────────────────

const AMENITY_OPTIONS = [
 { id: 'Corner Property', label: 'Corner Property', icon: IconCompass },
 { id: 'Main Boulevard', label: 'Main Boulevard', icon: IconRoad },
 { id: 'Furnished', label: 'Furnished', icon: IconSofa },
 { id: 'Electricity', label: 'Electricity', icon: IconZap },
 { id: 'Sui Gas', label: 'Sui Gas', icon: IconFlame },
 { id: 'Water Supply', label: 'Water Supply', icon: IconDroplets },
 { id: 'Security / CCTV', label: 'Security / CCTV', icon: IconShieldCheck },
 { id: 'Parking Space', label: 'Parking Space', icon: IconCar },
 { id: 'Gym / Pool', label: 'Gym / Pool', icon: IconDumbbell },
 { id: 'Park Facing', label: 'Park Facing', icon: IconTrees },
];

const PROPERTY_CATEGORIES = [
 {
 category: 'HOMES',
 label: ' Homes & Living',
 options: [
 'House',
 'Flat / Apartment',
 'Upper Portion',
 'Lower Portion',
 'Farm House',
 'Room',
 'Penthouse',
 ],
 },
 {
 category: 'PLOTS',
 label: '️ Plots & Land',
 options: [
 'Residential Plot',
 'Commercial Plot',
 'Agricultural Land',
 'Industrial Land',
 'Plot File',
 'Plot Form',
 ],
 },
 {
 category: 'COMMERCIAL',
 label: ' Commercial & Industrial',
 options: [
 'Office',
 'Shop',
 'Warehouse',
 'Factory',
 'Building',
 ],
 },
 {
 category: 'OTHER',
 label: ' Other Properties',
 options: [
 'Other',
 ],
 },
];

export default function PropertyForm({
 initialAgencyId,
 onSuccessRedirect = '/agency/dashboard',
 isAgencyPortal = true,
}: PropertyFormProps) {
 // ── 1. Categorized Property Specs State
 const [propertyType, setPropertyType] = useState('House');
 const [title, setTitle] = useState('');
 const [description, setDescription] = useState('');
 const [address, setAddress] = useState('');
 const [city, setCity] = useState('');
 const [bedrooms, setBedrooms] = useState('');
 const [bathrooms, setBathrooms] = useState('');
 const [areaSqFt, setAreaSqFt] = useState('');

 // ── 2. Purpose & Dynamic Payment State
 const [purpose, setPurpose] = useState<PropertyPurposeType>('FOR_SALE');
 const [price, setPrice] = useState('');

 // ── 3. Availability & 1-Month Advance Alert
 const [isAvailable, setIsAvailable] = useState<boolean>(true);
 const [availableDate, setAvailableDate] = useState<string>('');
 const [isOffMarket, setIsOffMarket] = useState<boolean>(false);

 // ── 4. Media Upload Expansion State
 const [galleryImages, setGalleryImages] = useState<Array<{ name: string; url: string; size: number }>>([]);
 const [videoMode, setVideoMode] = useState<'url' | 'file'>('url');
 const [videoUrl, setVideoUrl] = useState('');
 const [videoFileName, setVideoFileName] = useState<string | null>(null);
 const [panoramaFileName, setPanoramaFileName] = useState<string | null>(null);
 const [panoramaPreviewUrl, setPanoramaPreviewUrl] = useState<string | null>(null);
 const [floorPlanFileName, setFloorPlanFileName] = useState<string | null>(null);
 const [floorPlanPreviewUrl, setFloorPlanPreviewUrl] = useState<string | null>(null);
 const [virtualTourUrl, setVirtualTourUrl] = useState('');

 // ── 5. Features & Amenities
 const [selectedFeatures, setSelectedFeatures] = useState<string[]>([
 'Electricity',
 'Water Supply',
 ]);

 // ── 6. Agent & Contact Details
 const [contactName, setContactName] = useState('');
 const [contactPhone, setContactPhone] = useState('');
 const [contactEmail, setContactEmail] = useState('');
 const [emailError, setEmailError] = useState<string | null>(null);

 // ── WhatsApp OTP Verification State (for Private Sellers)
 const [isPhoneVerified, setIsPhoneVerified] = useState(false);
 const [otpCode, setOtpCode] = useState('');
 const [otpSent, setOtpSent] = useState(false);
 const [otpLoading, setOtpLoading] = useState(false);
 const [otpVerifying, setOtpVerifying] = useState(false);
 const [otpError, setOtpError] = useState<string | null>(null);
 const [otpSuccess, setOtpSuccess] = useState<string | null>(null);
 const [devOtpNotice, setDevOtpNotice] = useState<string | null>(null);

 // ── AI Extraction & Title Deed State
 const [isAiExtracting, setIsAiExtracting] = useState(false);
 const [aiExtracted, setAiExtracted] = useState(false);
 const [aiConfidence, setAiConfidence] = useState<number | null>(null);
 const [isValuationEstimated, setIsValuationEstimated] = useState(false);
 const [fileName, setFileName] = useState<string | null>(null);
 const [ownershipScore, setOwnershipScore] = useState<number | null>(null);
 const [uploadedDocUrl, setUploadedDocUrl] = useState<string | null>(null);
 const [docValidationError, setDocValidationError] = useState<string | null>(null);
 const [docTypeLabel, setDocTypeLabel] = useState<string | null>(null);

 // ── Toast Notifications State
 const [toasts, setToasts] = useState<Array<{ id: string; message: string; type: 'success' | 'error' | 'info' | 'warning' }>>([]);

 const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
 const id = Math.random().toString(36).substring(2, 9);
 setToasts((prev) => [...prev, { id, message, type }]);
 setTimeout(() => {
 setToasts((prev) => prev.filter((t) => t.id !== id));
 }, 5000);
 };

 // ── AI Valuation
 const [valuationLoading, setValuationLoading] = useState(false);
 const [valuationWarning, setValuationWarning] = useState<string | null>(null);
 const [valuationResult, setValuationResult] = useState<{
 midPKR: number;
 minPKR: number;
 maxPKR: number;
 ratePerSqFt: number;
 basis: string;
 } | null>(null);

 // ── Submission State
 const [loading, setLoading] = useState(false);
 const [submitted, setSubmitted] = useState(false);
 const [submitError, setSubmitError] = useState<string | null>(null);
 const [isSold, setIsSold] = useState(false);

 // File input refs
 const titleDeedInputRef = useRef<HTMLInputElement>(null);
 const galleryInputRef = useRef<HTMLInputElement>(null);
 const videoFileInputRef = useRef<HTMLInputElement>(null);
 const panoramaInputRef = useRef<HTMLInputElement>(null);
 const floorPlanInputRef = useRef<HTMLInputElement>(null);

 // Unique IDs for accessibility
 const titleId = useId();
 const priceId = useId();
 const addressId = useId();
 const cityId = useId();
 const typeId = useId();
 const contactNameId = useId();
 const contactPhoneId = useId();
 const contactEmailId = useId();
 const datePickerId = useId();

 // ── Email Validation
 const validateEmail = (val: string) => {
 setContactEmail(val);
 if (!val.trim()) {
 setEmailError(null);
 return;
 }
 const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
 if (!emailRegex.test(val.trim())) {
 setEmailError('Please enter a valid email address (e.g. agent@example.com)');
 } else {
 setEmailError(null);
 }
 };

 // ── Send WhatsApp OTP Handler
 const handleSendOtp = async () => {
 if (!contactPhone.trim()) {
 setOtpError('Please enter a phone number first.');
 return;
 }
 setOtpLoading(true);
 setOtpError(null);
 setOtpSuccess(null);
 setDevOtpNotice(null);

 try {
 const res = await fetch('/api/leads/private/otp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'send', phone: contactPhone.trim() }),
 });
 const data = await res.json();
 if (res.ok && data.success) {
 setOtpSent(true);
 setOtpSuccess('OTP sent successfully to your WhatsApp!');
 if (data.devOtp) {
 setDevOtpNotice(data.devOtp);
 }
 showToast('OTP sent! Please check your WhatsApp.', 'success');
 } else {
 setOtpError(data.error || 'Failed to send WhatsApp OTP.');
 }
 } catch {
 setOtpError('Network error while sending OTP.');
 } finally {
 setOtpLoading(false);
 }
 };

 // ── Verify WhatsApp OTP Handler
 const handleVerifyOtp = async () => {
 if (!otpCode.trim() || otpCode.length !== 6) {
 setOtpError('Please enter the 6-digit OTP code.');
 return;
 }
 setOtpVerifying(true);
 setOtpError(null);

 try {
 const res = await fetch('/api/leads/private/otp', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'verify', phone: contactPhone.trim(), otp: otpCode.trim() }),
 });
 const data = await res.json();
 if (res.ok && data.success && data.verified) {
 setIsPhoneVerified(true);
 setOtpSuccess(' WhatsApp number verified successfully!');
 showToast('Mobile number verified!', 'success');
 } else {
 setOtpError(data.error || 'Invalid OTP code. Please try again.');
 }
 } catch {
 setOtpError('Network error while verifying OTP.');
 } finally {
 setOtpVerifying(false);
 }
 };

 // ── 1-Month Early Alert Calculation
 const isWithinOneMonth = (dateStr: string): boolean => {
 if (!dateStr) return false;
 const target = new Date(dateStr);
 const now = new Date();
 const diffMs = target.getTime() - now.getTime();
 const diffDays = diffMs / (1000 * 60 * 60 * 24);
 return diffDays >= 0 && diffDays <= 31;
 };

 // ── Toggle Amenity
 const toggleFeature = (feature: string) => {
 setSelectedFeatures((prev) =>
 prev.includes(feature)
 ? prev.filter((f) => f !== feature)
 : [...prev, feature]
 );
 };

 // ── Helper: File to Optimized Base64 Data URL for persistent cross-client rendering
 const fileToDataUrl = (file: File, maxWidth = 1920, quality = 0.85): Promise<string> => {
 return new Promise((resolve) => {
 if (!file.type.startsWith('image/')) {
 const reader = new FileReader();
 reader.onload = () => resolve(reader.result as string);
 reader.onerror = () => resolve('');
 reader.readAsDataURL(file);
 return;
 }
 const reader = new FileReader();
 reader.onload = (event) => {
 const img = new Image();
 img.onload = () => {
 const canvas = document.createElement('canvas');
 let width = img.width;
 let height = img.height;
 if (width > maxWidth) {
 height = Math.round((height * maxWidth) / width);
 width = maxWidth;
 }
 canvas.width = width;
 canvas.height = height;
 const ctx = canvas.getContext('2d');
 if (ctx) {
 ctx.drawImage(img, 0, 0, width, height);
 resolve(canvas.toDataURL('image/jpeg', quality));
 } else {
 resolve(event.target?.result as string);
 }
 };
 img.onerror = () => resolve(event.target?.result as string);
 img.src = event.target?.result as string;
 };
 reader.onerror = () => resolve('');
 reader.readAsDataURL(file);
 });
 };

 // ── Gallery Multi-Image Upload (Persistent Data URLs)
 const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const files = e.target.files;
 if (!files || files.length === 0) return;

 showToast(`Processing ${files.length} property ${files.length === 1 ? 'image' : 'images'}...`, 'info');
 const fileList = Array.from(files);
 const newImages = await Promise.all(
 fileList.map(async (file) => {
 const dataUrl = await fileToDataUrl(file, 1920, 0.85);
 return {
 name: file.name,
 url: dataUrl,
 size: file.size,
 };
 })
 );

 setGalleryImages((prev) => [...prev, ...newImages]);
 showToast(`${newImages.length} images added to gallery`, 'success');
 };

 const removeGalleryImage = (index: number) => {
 setGalleryImages((prev) => prev.filter((_, i) => i !== index));
 };

 // ── Video File Upload (Persistent Data URL or URL input)
 const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setVideoFileName(file.name);
 showToast(`Loading video: ${file.name}...`, 'info');
 const reader = new FileReader();
 reader.onload = () => {
 setVideoUrl(reader.result as string);
 showToast('Video ready for playback', 'success');
 };
 reader.readAsDataURL(file);
 };

 // ── 360 Panorama Upload (Persistent Data URL)
 const handlePanoramaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setPanoramaFileName(file.name);
 showToast('Processing 360° panorama image...', 'info');
 const dataUrl = await fileToDataUrl(file, 2560, 0.9);
 setPanoramaPreviewUrl(dataUrl);
 showToast('360° panorama loaded successfully', 'success');
 };

 // ── Floor Plan Blueprint Upload (Persistent Data URL)
 const handleFloorPlanUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;
 setFloorPlanFileName(file.name);
 showToast('Processing floor plan blueprint...', 'info');
 const dataUrl = await fileToDataUrl(file, 2048, 0.9);
 setFloorPlanPreviewUrl(dataUrl);
 showToast('Floor plan blueprint loaded', 'success');
 };

 // ── High-Contrast Grayscale Preprocessor & Low-Res Upscaler for OCR Accuracy ─
 const preprocessImageForOcr = (file: File): Promise<Blob> =>
 new Promise((resolve) => {
 // Pass PDFs and non-image documents directly to API
 if (!file.type.startsWith('image/')) {
 resolve(file);
 return;
 }

 const img = new Image();
 const objectUrl = URL.createObjectURL(file);

 img.onload = () => {
 try {
 const canvas = document.createElement('canvas');
 const maxDim = Math.max(img.width, img.height);
 const TARGET_DIM = 1600;

 // Auto-upscale low-resolution scans (e.g. 400-900px) or downscale massive files for optimal OCR
 let scale = 1;
 if (maxDim < TARGET_DIM) {
 scale = Math.min(3.0, TARGET_DIM / maxDim);
 } else if (maxDim > 2200) {
 scale = 2200 / maxDim;
 }

 canvas.width = Math.round(img.width * scale);
 canvas.height = Math.round(img.height * scale);

 const ctx = canvas.getContext('2d');
 if (!ctx) {
 resolve(file);
 return;
 }

 // Enable high-quality smoothing for upscaled low-resolution text
 ctx.imageSmoothingEnabled = true;
 ctx.imageSmoothingQuality = 'high';

 // High-contrast grayscale filter for crisp character edges on CNICs, stamps & title deeds
 ctx.filter = 'grayscale(100%) contrast(180%) brightness(105%)';
 ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

 canvas.toBlob(
 (blob) => resolve(blob ?? file),
 'image/jpeg',
 0.95
 );
 } catch {
 resolve(file);
 } finally {
 URL.revokeObjectURL(objectUrl);
 }
 };

 img.onerror = () => {
 URL.revokeObjectURL(objectUrl);
 resolve(file);
 };
 img.src = objectUrl;
 });

 // ── Browser-based Optical Character Extractor (Tesseract.js) ─────────────
 const runClientOcr = async (fileOrBlob: Blob): Promise<string> => {
 try {
 const { createWorker } = await import('tesseract.js');
 const worker = await createWorker('eng');
 const res = await worker.recognize(fileOrBlob);
 await worker.terminate();
 return res.data?.text || '';
 } catch (err) {
 console.warn('[Client OCR] Browser OCR note:', err);
 return '';
 }
 };

 // ── Strict Document OCR & Content Verification ───────────────────────────
 const handleTitleDeedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (!file) return;

 // Reset input to allow re-selecting the same file if needed
 e.target.value = '';

 setFileName(file.name);
 setIsAiExtracting(true);
 setAiExtracted(false);
 setDocValidationError(null);
 setDocTypeLabel(null);

 const controller = new AbortController();
 const timeoutId = setTimeout(() => controller.abort(), 25000);

 try {
 showToast('Analyzing legal document & extracting property specs...', 'info');

 // 1. High-contrast canvas pre-processing
 const processedBlob = await preprocessImageForOcr(file);
 const uploadFile = new File([processedBlob], file.name, {
 type: processedBlob.type || file.type,
 });

 // 2. Client-side OCR extraction
 const clientOcrText = await runClientOcr(processedBlob);

 const formData = new FormData();
 formData.append('file', uploadFile);
 if (clientOcrText) {
 formData.append('clientExtractedText', clientOcrText);
 }

 // 3. Verification API call
 const res = await fetch('/api/documents/verify-upload', {
 method: 'POST',
 body: formData,
 signal: controller.signal,
 });

 const data = await res.json().catch(() => ({}));

 // 3. Strict validation check (Zero fallback allowed)
 const isValid = res.ok && (data.valid === true || data.isValid === true) && (data.score > 0 || data.verifiedScore > 0);

 if (!isValid) {
 const errorMsg = data.error || data.errorMessage || 'Invalid Document Structure Uploaded';
 setOwnershipScore(0);
 setAiConfidence(0);
 setAiExtracted(false);
 setDocValidationError(errorMsg);
 showToast(errorMsg, 'error');
 return;
 }

 // 4. Strict Success Flow (Dynamic Score 85% – 98%)
 const score = data.score ?? data.verifiedScore ?? 85;

 setOwnershipScore(score);
 setAiConfidence(data.confidence ? Math.round(data.confidence * 100) : Math.round(score));
 setAiExtracted(true);
 setDocTypeLabel(data.documentTypeLabel || 'Verified Document');
 if (data.fileUrl) {
 setUploadedDocUrl(data.fileUrl);
 }

 showToast(` Document verified successfully as ${data.documentTypeLabel || 'Legal Document'}! Score: ${score}%`, 'success');

 // 5. Auto-fill property specs from verified document
 const params = data.extractedParams;
 if (params) {
 if (params.suggestedTitle && !title) {
 setTitle(params.suggestedTitle);
 }
 if (params.propertyType) {
 const pType = params.propertyType.toLowerCase();
 const found = PROPERTY_CATEGORIES.flatMap((c) => c.options).find((o) =>
 o.toLowerCase().includes(pType)
 );
 if (found) setPropertyType(found);
 }
 if (params.bedrooms != null && !bedrooms) {
 setBedrooms(String(params.bedrooms));
 }
 if (params.bathrooms != null && !bathrooms) {
 setBathrooms(String(params.bathrooms));
 }
 if (params.areaSqFt != null && !areaSqFt) {
 setAreaSqFt(String(params.areaSqFt));
 }
 if (params.city && !city) {
 setCity(params.city);
 }
 if (params.societyOrLocation && !address) {
 const addr = params.plotOrUnitNo
 ? `${params.plotOrUnitNo}, ${params.societyOrLocation}`
 : params.societyOrLocation;
 setAddress(addr);
 }
 if (!price && params.areaSqFt != null) {
 const beds = params.bedrooms ?? 2;
 setPrice(String(beds * 3_500_000 + params.areaSqFt * 12_000));
 setIsValuationEstimated(true);
 }
 }
 } catch (err: unknown) {
 console.error('[DocVerify] Verification error:', err);
 const errorMsg = 'Invalid Document Structure Uploaded';
 setOwnershipScore(0);
 setAiConfidence(0);
 setAiExtracted(false);
 setDocValidationError(errorMsg);
 showToast(errorMsg, 'error');
 } finally {
 clearTimeout(timeoutId);
 // Strictly reset loading state regardless of outcome
 setIsAiExtracting(false);
 }
 };

 // ── City Rate Estimator for AI Valuation
 const getCityRatePerSqFt = (cityInput: string): { rate: number; label: string } => {
 const c = cityInput.toLowerCase().trim();
 if (c.includes('islamabad') || c.includes('f-6') || c.includes('f-7') || c.includes('f-8') || c.includes('f-10'))
 return { rate: 18500, label: 'Islamabad' };
 if (c.includes('rawalpindi') || c.includes('bahria') || c.includes('dha rawalpindi'))
 return { rate: 13500, label: 'Rawalpindi / Bahria Town' };
 if (c.includes('lahore') || c.includes('gulberg') || c.includes('dha lahore') || c.includes('model town'))
 return { rate: 16000, label: 'Lahore' };
 if (c.includes('karachi') || c.includes('dha karachi') || c.includes('clifton') || c.includes('defence'))
 return { rate: 14500, label: 'Karachi' };
 if (c.includes('peshawar') || c.includes('hayatabad')) return { rate: 9500, label: 'Peshawar' };
 if (c.includes('quetta')) return { rate: 7500, label: 'Quetta' };
 if (c.includes('faisalabad')) return { rate: 10000, label: 'Faisalabad' };
 if (c.includes('multan')) return { rate: 9000, label: 'Multan' };
 return { rate: 10500, label: cityInput || 'Pakistan (general estimate)' };
 };

 const handleAiValuation = () => {
 const trimmedCity = city.trim();
 const parsedArea = areaSqFt ? Number(areaSqFt) : 0;

 if (!trimmedCity || !propertyType || !areaSqFt.trim() || isNaN(parsedArea) || parsedArea <= 0) {
 setValuationWarning('Please enter City, Property Type, and Area (Sq Ft) in Section 1 above before calculating market valuation.');
 setValuationResult(null);
 return;
 }

 setValuationWarning(null);
 setValuationLoading(true);
 setValuationResult(null);

 setTimeout(() => {
 const sqft = parsedArea;
 const beds = bedrooms ? Number(bedrooms) : 2;
 const { rate, label } = getCityRatePerSqFt(trimmedCity);

 const bedroomMultiplier = 1 + Math.max(0, beds - 1) * 0.03;
 const typeMult = propertyType.toLowerCase().includes('plot') ? 0.7 : 1.1;

 let midRate = Math.round(rate * bedroomMultiplier * typeMult);
 if (purpose === 'FOR_RENT' || purpose === 'LEASE') {
 midRate = Math.round(midRate * 0.0045);
 }

 const midPKR = Math.round(midRate * sqft);
 const minPKR = Math.round(midPKR * 0.88);
 const maxPKR = Math.round(midPKR * 1.12);

 const basis = [
 `${sqft.toLocaleString()} sq ft`,
 bedrooms ? `${bedrooms} beds` : null,
 label,
 propertyType,
 purpose === 'FOR_SALE' ? 'Sale Price' : 'Monthly Rent',
 ]
 .filter(Boolean)
 .join(' · ');

 setValuationResult({ midPKR, minPKR, maxPKR, ratePerSqFt: midRate, basis });
 setPrice(String(midPKR));
 setIsValuationEstimated(true);
 setValuationLoading(false);
 }, 1000);
 };

 // ── Submit Handler
 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (emailError) {
 setSubmitError('Please fix the email address error before submitting.');
 return;
 }

 if (!isAgencyPortal && !isPhoneVerified) {
 setSubmitError('Please verify your Contact Phone / WhatsApp number with OTP before listing your property privately.');
 showToast('WhatsApp OTP verification is required.', 'warning');
 return;
 }

 setLoading(true);
 setSubmitError(null);

 const matchedCategory =
 PROPERTY_CATEGORIES.find((c) => c.options.includes(propertyType))?.category || 'OTHER';

 // Collect all real uploaded image URLs (gallery images, floor plan, and title deed)
 const allImages: string[] = [
 ...galleryImages.map((img) => img.url),
 ...(floorPlanPreviewUrl ? [floorPlanPreviewUrl] : []),
 ...(uploadedDocUrl ? [uploadedDocUrl] : []),
 ];

 const payload = {
 title,
 description,
 purpose,
 propertyType,
 category: matchedCategory,
 price: Number(price),
 address,
 city,
 areaSqFt: areaSqFt ? Number(areaSqFt) : undefined,
 bedrooms: bedrooms ? Number(bedrooms) : undefined,
 bathrooms: bathrooms ? Number(bathrooms) : undefined,
 isAvailable,
 availableDate: !isAvailable && availableDate ? availableDate : undefined,
 images: allImages,
 videoUrl: videoUrl || undefined,
 panoramaUrl: panoramaPreviewUrl || undefined,
 virtualTourUrl: virtualTourUrl || undefined,
 features: isOffMarket
 ? Array.from(new Set([...selectedFeatures, 'OFF_MARKET', 'INVESTOR_DEAL']))
 : selectedFeatures,
 isOffMarket,
 contactName,
 contactPhone,
 contactEmail: contactEmail.trim() || undefined,
 agencyId: initialAgencyId,
 };

 try {
 const res = await fetch('/api/properties', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 });
 const data = await res.json();
 if (!res.ok) throw new Error(data.error || 'Failed to submit property listing.');

 if (isAgencyPortal && !isOffMarket) {
 await fetch('/api/public/listings', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 }).catch(() => {});
 }

 setSubmitted(true);
 } catch (err) {
 setSubmitError(err instanceof Error ? err.message : 'Failed to submit property listing.');
 } finally {
 setLoading(false);
 }
 };

 const handleReset = () => {
 setTitle('');
 setPurpose('FOR_SALE');
 setPropertyType('House');
 setPrice('');
 setAddress('');
 setCity('');
 setBedrooms('');
 setBathrooms('');
 setAreaSqFt('');
 setDescription('');
 setIsAvailable(true);
 setAvailableDate('');
 setGalleryImages([]);
 setVideoUrl('');
 setVideoFileName(null);
 setPanoramaFileName(null);
 setPanoramaPreviewUrl(null);
 setFloorPlanFileName(null);
 setFloorPlanPreviewUrl(null);
 setVirtualTourUrl('');
 setSelectedFeatures(['Electricity', 'Water Supply']);
 setContactName('');
 setContactPhone('');
 setContactEmail('');
 setEmailError(null);
 setAiExtracted(false);
 setAiConfidence(null);
 setFileName(null);
 setOwnershipScore(null);
 setUploadedDocUrl(null);
 setDocValidationError(null);
 setDocTypeLabel(null);
 setIsValuationEstimated(false);
 setValuationResult(null);
 setValuationWarning(null);
 setSubmitted(false);
 setSubmitError(null);
 setIsSold(false);
 };

 const priceLabel =
 purpose === 'FOR_SALE' ? 'Sale Price (PKR)' : 'Monthly Rent / Price (PKR)';
 const pricePlaceholder =
 purpose === 'FOR_SALE' ? 'e.g. 18500000' : 'e.g. 120000';

 return (
 <div className="w-full">
 {submitted ? (
 <div className="bg-white rounded-3xl p-8 shadow-xl border border-emerald-200 text-center flex flex-col items-center gap-5">
 <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl font-bold shadow-inner">
 
 </div>
 <div>
 <h2 className="text-3xl font-black text-gray-900">
 {isAgencyPortal ? 'Property Listing Published!' : 'Property Listed Privately! '}
 </h2>
 <p className="text-gray-600 mt-1 max-w-md">
 {isAgencyPortal ? (
 <>
 Your property <span className="font-bold text-gray-900">&quot;{title}&quot;</span> is now live with purpose{' '}
 <span className="font-bold text-emerald-600 uppercase">[{purpose.replace('_', ' ')}]</span>.
 </>
 ) : (
 <>
 Your property <span className="font-bold text-gray-900">&quot;{title}&quot;</span> is listed privately (SHIELDED). The Top 3 Verified Agencies in your city have been notified to review and facilitate your deal.
 </>
 )}
 </p>
 </div>

 <div
 className={`w-full max-w-md rounded-2xl border p-4 flex flex-col gap-2 transition-all ${
 isSold ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
 }`}
 >
 <div className="flex items-center justify-between">
 <div className="text-left">
 <p className="text-sm font-bold text-gray-900">Mark as Sold / Closed</p>
 <p className="text-xs text-gray-500">
 {isSold ? ' Hidden from public discovery.' : 'Toggle when the deal closes.'}
 </p>
 </div>
 <button
 type="button"
 onClick={() => setIsSold((v) => !v)}
 className={`relative w-12 h-6 rounded-full transition-colors ${
 isSold ? 'bg-red-500' : 'bg-gray-300'
 }`}
 role="switch"
 aria-checked={isSold}
 >
 <span
 className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
 isSold ? 'left-7' : 'left-1'
 }`}
 />
 </button>
 </div>
 {isSold && (
 <span className="self-start bg-red-100 text-red-800 text-xs font-bold px-3 py-1 rounded-full border border-red-200">
 ️ Archived &amp; Deal Closed
 </span>
 )}
 </div>

 <div className="flex flex-wrap gap-4 mt-4">
 <button
 onClick={handleReset}
 className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-3 rounded-xl shadow-lg transition"
 >
 + Add Another Property
 </button>
 <Link
 href="/marketplace"
 className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold px-6 py-3 rounded-xl transition"
 >
 Explore Marketplace
 </Link>
 {isAgencyPortal && (
 <Link
 href={onSuccessRedirect}
 className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl shadow transition"
 >
 Dashboard
 </Link>
 )}
 </div>
 </div>
 ) : (
 <form onSubmit={handleSubmit} className="flex flex-col gap-8">
 {/* ── AI Title Deed Verification Banner ── */}
 <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex items-start gap-4">
 <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 flex-shrink-0">
 <IconFileText className="w-6 h-6" />
 </div>
 <div>
 <div className="flex items-center gap-2 mb-1">
 <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
 AI OCR SPEC EXTRACTOR
 </span>
 </div>
 <h2 className="text-base font-bold text-white">
 AI Property Document &amp; Title Verification
 </h2>
 <p className="text-xs text-slate-300 mt-0.5">
 Upload allotment letter, deed, or blueprint to auto-fill specs, verify ownership, and calculate instant market rates.
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2 flex-shrink-0">
 {isAiExtracting ? (
 <span className="text-xs font-bold text-teal-300 bg-teal-950/80 border border-teal-800 px-3 py-2 rounded-xl flex items-center gap-1.5">
 <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" />
 Extracting &amp; Uploading...
 </span>
 ) : ownershipScore === 0 ? (
 <span className="text-xs font-bold text-red-400 bg-red-950/90 border border-red-800 px-3 py-2 rounded-xl flex items-center gap-1">
 <span></span> Invalid Document (0%)
 </span>
 ) : ownershipScore !== null && ownershipScore > 0 ? (
 <span className="text-xs font-bold text-emerald-400 bg-emerald-950 border border-emerald-800 px-3 py-2 rounded-xl flex items-center gap-1">
 <span></span> Verified Score: {ownershipScore}%
 </span>
 ) : (
 <span className="text-xs font-bold text-slate-400 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl">
 Ready for Scan
 </span>
 )}

 <input
 type="file"
 ref={titleDeedInputRef}
 onChange={handleTitleDeedUpload}
 accept=".pdf,.png,.jpg,.jpeg,.webp"
 className="hidden"
 />
 <button
 type="button"
 onClick={() => titleDeedInputRef.current?.click()}
 disabled={isAiExtracting}
 className="text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2.5 rounded-xl transition shadow flex items-center gap-1.5 disabled:opacity-50"
 >
 <IconFileText className="w-4 h-4" />
 <span>Upload Doc</span>
 </button>
 </div>
 </div>

 {/* Error banner when invalid document is uploaded */}
 {docValidationError && (
 <div className="mt-4 p-3.5 bg-red-950/50 border border-red-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-300">
 <span className="flex items-center gap-2">
 <span className="text-red-400 font-bold">️ Error:</span> {docValidationError}
 </span>
 <span className="text-red-400 font-bold bg-red-900/40 px-2.5 py-1 rounded-lg border border-red-800 self-start sm:self-auto">
 Score: 0%
 </span>
 </div>
 )}

 {/* Success banner when valid document is verified */}
 {aiExtracted && fileName && (
 <div className="mt-4 p-3.5 bg-emerald-950/40 border border-emerald-500/30 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-emerald-300">
 <div className="flex flex-wrap items-center gap-2">
 <span> Auto-extracted details from <strong>{fileName}</strong></span>
 {docTypeLabel && (
 <span className="bg-emerald-800/50 text-emerald-200 border border-emerald-700/60 px-2 py-0.5 rounded-md text-[10px] font-bold">
 {docTypeLabel}
 </span>
 )}
 </div>
 <div className="flex items-center gap-3">
 {uploadedDocUrl && (
 <a
 href={uploadedDocUrl}
 target="_blank"
 rel="noreferrer"
 className="text-teal-300 hover:text-teal-200 underline font-semibold text-[11px]"
 >
 Supabase Storage Doc 
 </a>
 )}
 {aiConfidence && <span>AI Confidence: {aiConfidence}%</span>}
 </div>
 </div>
 )}
 </div>

 {/* ── SECTION 1: CATEGORIZED PROPERTY SPECS (FIRST IN UX FLOW) ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 1
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">Categorized Property Specs</h3>
 <p className="text-xs text-gray-500">Grouped classification, physical specifications, and society location</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* Listing Title */}
 <div className="flex flex-col gap-1.5 md:col-span-2">
 <label htmlFor={titleId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Listing Title *
 </label>
 <input
 id={titleId}
 type="text"
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="e.g. Luxurious 1 Kanal Designer Villa, DHA Phase 6"
 required
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Categorized Property Type Dropdown */}
 <div className="flex flex-col gap-1.5">
 <label htmlFor={typeId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Property Type *
 </label>
 <select
 id={typeId}
 value={propertyType}
 onChange={(e) => {
 setPropertyType(e.target.value);
 setValuationWarning(null);
 }}
 required
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 >
 {PROPERTY_CATEGORIES.map((catGroup) => (
 <optgroup key={catGroup.category} label={catGroup.label} className="font-bold text-gray-800">
 {catGroup.options.map((opt) => (
 <option key={opt} value={opt} className="font-medium text-gray-900">
 {opt}
 </option>
 ))}
 </optgroup>
 ))}
 </select>
 </div>

 {/* Location / Address */}
 <div className="flex flex-col gap-1.5 md:col-span-2">
 <label htmlFor={addressId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Full Street Address / Society Sector *
 </label>
 <input
 id={addressId}
 type="text"
 value={address}
 onChange={(e) => setAddress(e.target.value)}
 placeholder="e.g. Street 14, Sector J, DHA Phase 6, Lahore"
 required
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* City */}
 <div className="flex flex-col gap-1.5">
 <label htmlFor={cityId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 City *
 </label>
 <input
 id={cityId}
 type="text"
 value={city}
 onChange={(e) => {
 setCity(e.target.value);
 setValuationWarning(null);
 }}
 placeholder="e.g. Lahore, Islamabad, Karachi"
 required
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Area */}
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Area (Sq Ft) *
 </label>
 <input
 type="number"
 value={areaSqFt}
 onChange={(e) => {
 setAreaSqFt(e.target.value);
 setValuationWarning(null);
 }}
 min={1}
 placeholder="e.g. 2250 (10 Marla)"
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Bedrooms */}
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Bedrooms
 </label>
 <input
 type="number"
 value={bedrooms}
 onChange={(e) => setBedrooms(e.target.value)}
 min={0}
 placeholder="e.g. 4"
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Bathrooms */}
 <div className="flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Bathrooms
 </label>
 <input
 type="number"
 value={bathrooms}
 onChange={(e) => setBathrooms(e.target.value)}
 min={0}
 placeholder="e.g. 5"
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Description */}
 <div className="flex flex-col gap-1.5 md:col-span-3">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Property Description
 </label>
 <textarea
 rows={3}
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Describe architectural style, premium fittings, terrace views, nearby schools & hospitals..."
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>
 </div>
 </div>

 {/* ── SECTION 2: PURPOSE & PRICING (IMMEDIATELY FOLLOWS SPECS) ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 2
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">Purpose &amp; Pricing</h3>
 <p className="text-xs text-gray-500">
 Select listing purpose, set price, or compute instant AI market valuation from the specs above
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Purpose Selector */}
 <div className="flex flex-col gap-2 md:col-span-2">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Listing Purpose *
 </label>
 <div className="grid grid-cols-3 gap-3">
 {[
 { id: 'FOR_SALE' as const, label: 'For Sale', icon: IconTag, desc: 'Outright Property Sale' },
 { id: 'FOR_RENT' as const, label: 'For Rent', icon: IconKey, desc: 'Monthly Rental Tenancy' },
 { id: 'LEASE' as const, label: 'Lease', icon: IconFileText, desc: 'Commercial / Long Lease' },
 ].map((opt) => {
 const active = purpose === opt.id;
 const IconComp = opt.icon;
 return (
 <button
 key={opt.id}
 type="button"
 onClick={() => {
 setPurpose(opt.id);
 setValuationResult(null);
 }}
 className={`p-4 rounded-2xl border text-left transition-all flex flex-col justify-between ${
 active
 ? 'bg-emerald-50 border-emerald-600 ring-2 ring-emerald-500/20 text-emerald-950 shadow-sm'
 : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
 }`}
 >
 <div className="flex items-center justify-between mb-2">
 <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${active ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
 <IconComp className="w-4 h-4" />
 </div>
 <span
 className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
 active ? 'border-emerald-600 bg-emerald-600' : 'border-gray-300'
 }`}
 >
 {active && <span className="w-1.5 h-1.5 bg-white rounded-full" />}
 </span>
 </div>
 <div>
 <div className="font-extrabold text-sm text-gray-900">{opt.label}</div>
 <div className="text-[11px] text-gray-500 mt-0.5">{opt.desc}</div>
 </div>
 </button>
 );
 })}
 </div>
 </div>

 {/* Dynamic Price Field */}
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor={priceId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 {priceLabel} *
 </label>
 {price && !isNaN(Number(price)) && (
 <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
 PKR {Number(price).toLocaleString()}
 {purpose !== 'FOR_SALE' && ' / month'}
 </span>
 )}
 </div>
 <div className="relative">
 <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-sm">
 Rs.
 </span>
 <input
 id={priceId}
 type="number"
 value={price}
 onChange={(e) => setPrice(e.target.value)}
 placeholder={pricePlaceholder}
 required
 min={1}
 className="w-full bg-white border border-gray-300 rounded-xl pl-12 pr-4 py-3 text-gray-900 font-bold text-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none transition shadow-sm"
 />
 </div>
 {isValuationEstimated && (
 <p className="text-xs text-purple-700 font-semibold mt-1">
 Price estimated via AI Valuation Engine based on specs above.
 </p>
 )}
 </div>

 {/* AI Valuation Calculation Button */}
 <div className="flex flex-col justify-end">
 <button
 type="button"
 onClick={handleAiValuation}
 disabled={valuationLoading || isAiExtracting}
 className="bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-600 hover:to-indigo-600 text-white font-bold px-4 py-3 rounded-xl shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
 >
 {valuationLoading ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>Computing Market Valuation...</span>
 </>
 ) : (
 <>
 <IconZap className="w-4 h-4 text-amber-300" />
 <span>Calculate AI Market Rate (PKR)</span>
 </>
 )}
 </button>
 </div>

 {/* Valuation Result Display */}
 {valuationResult && !valuationLoading && (
 <div className="md:col-span-2 p-4 bg-purple-50 border border-purple-200 rounded-2xl">
 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
 <div>
 <span className="text-xs font-black bg-purple-200 text-purple-900 px-2.5 py-0.5 rounded-full uppercase">
 AI Valuation Match
 </span>
 <div className="text-2xl font-black text-purple-950 mt-1">
 Rs. {valuationResult.midPKR.toLocaleString()}
 {purpose !== 'FOR_SALE' && ' / month'}
 </div>
 <div className="text-xs text-purple-700 mt-0.5">
 Range: Rs. {valuationResult.minPKR.toLocaleString()} – Rs.{' '}
 {valuationResult.maxPKR.toLocaleString()} ({valuationResult.basis})
 </div>
 </div>
 <button
 type="button"
 onClick={() => setValuationResult(null)}
 className="text-xs text-purple-600 hover:underline font-bold"
 >
 Dismiss
 </button>
 </div>
 </div>
 )}

 {valuationWarning && (
 <div className="md:col-span-2 p-3 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-xs font-medium">
 ️ {valuationWarning}
 </div>
 )}
 </div>
 </div>

 {/* ── SECTION 3: AVAILABILITY & 1-MONTH ADVANCE ALERT SYSTEM ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 3
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">
 Availability &amp; 1-Month Early Match Alerts
 </h3>
 <p className="text-xs text-gray-500">
 Enable client matching alerts before the tenant vacates or construction completes
 </p>
 </div>
 </div>

 <div className="flex flex-col gap-5">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-2xl gap-4">
 <div>
 <div className="font-extrabold text-sm text-gray-900">
 Is Property Currently Available?
 </div>
 <div className="text-xs text-gray-500 mt-0.5">
 {isAvailable
 ? ' Available immediately for possession / move-in.'
 : ' Currently occupied or under preparation. Scheduled for future date.'}
 </div>
 </div>

 <div className="flex items-center gap-3">
 <span className={`text-xs font-bold ${isAvailable ? 'text-emerald-700' : 'text-gray-500'}`}>
 {isAvailable ? 'Available Now' : 'Future Date'}
 </span>
 <button
 type="button"
 onClick={() => setIsAvailable((prev) => !prev)}
 className={`relative w-14 h-7 rounded-full transition-colors ${
 isAvailable ? 'bg-emerald-600' : 'bg-gray-300'
 }`}
 role="switch"
 aria-checked={isAvailable}
 >
 <span
 className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
 isAvailable ? 'left-8' : 'left-1'
 }`}
 />
 </button>
 </div>
 </div>

 {!isAvailable && (
 <div className="p-5 bg-blue-50/70 border border-blue-200 rounded-2xl flex flex-col gap-3 transition-all animate-fadeIn">
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
 <div className="flex flex-col gap-1.5 flex-1">
 <label htmlFor={datePickerId} className="text-xs font-extrabold text-blue-950 uppercase tracking-wider">
 Expected Available Date *
 </label>
 <input
 id={datePickerId}
 type="date"
 value={availableDate}
 onChange={(e) => setAvailableDate(e.target.value)}
 min={new Date().toISOString().split('T')[0]}
 required={!isAvailable}
 className="bg-white border border-blue-300 rounded-xl px-4 py-2.5 text-gray-900 font-bold focus:ring-2 focus:ring-blue-500 focus:outline-none"
 />
 </div>

 {availableDate && (
 <div className="flex-1">
 {isWithinOneMonth(availableDate) ? (
 <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2">
 
 <span>
 <strong>1-Month Early Match Activated!</strong> Matching tenants/buyers will receive early notification alerts.
 </span>
 </div>
 ) : (
 <div className="p-3 bg-blue-100/80 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold">
 Scheduled availability: {new Date(availableDate).toLocaleDateString(undefined, { dateStyle: 'long' })}
 </div>
 )}
 </div>
 )}
 </div>

 {/* Helper UI Note */}
 <div className="text-xs text-blue-800 bg-blue-100/50 p-3 rounded-xl flex items-start gap-2 border border-blue-200/60 font-medium">
 
 <span>
 <strong>List early!</strong> Properties available within 1 month get early client matching alerts across our investor and buyer network.
 </span>
 </div>
 </div>
 )}

 {/* ── Off-Market / Investor Deal (B2B) Toggle for Agency OR Private Notice for Seller ── */}
 {isAgencyPortal ? (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-purple-50/80 border border-purple-200 rounded-2xl gap-4">
 <div>
 <div className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
 
 <span>Mark as Private B2B / Off-Market Investor Deal</span>
 </div>
 <p className="text-xs text-purple-700 mt-0.5">
 Highlights this listing with a <strong> Off-Market</strong> badge in the Marketplace and routes it into Verified Investor Deal Rooms with Smart Escrow protection.
 </p>
 </div>

 <div className="flex items-center gap-3 flex-shrink-0">
 <span className={`text-xs font-bold ${isOffMarket ? 'text-purple-900 font-extrabold' : 'text-gray-500'}`}>
 {isOffMarket ? ' Off-Market Deal' : 'Public Listing'}
 </span>
 <button
 type="button"
 onClick={() => setIsOffMarket((prev) => !prev)}
 className={`relative w-14 h-7 rounded-full transition-colors ${
 isOffMarket ? 'bg-purple-600' : 'bg-gray-300'
 }`}
 role="switch"
 aria-checked={isOffMarket}
 >
 <span
 className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
 isOffMarket ? 'left-8' : 'left-1'
 }`}
 />
 </button>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-3 p-4 bg-amber-50/90 border border-amber-200 rounded-2xl">
 
 <div>
 <div className="font-extrabold text-sm text-amber-950 flex items-center gap-2">
 <span>Private Off-Market Listing</span>
 <span className="text-[10px] font-black uppercase bg-amber-600 text-white px-2 py-0.5 rounded-full">
 Shielded
 </span>
 </div>
 <p className="text-xs text-amber-700 mt-0.5">
 Your property is securely shielded from the public marketplace. The <strong>Top 3 Verified Agencies</strong> in your city will be notified immediately to review your deal.
 </p>
 </div>
 </div>
 )}
 </div>
 </div>

 {/* ── SECTION 4: MEDIA UPLOAD EXPANSION ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 4
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">Media Upload Expansion</h3>
 <p className="text-xs text-gray-500">
 Photos, video tours, 360° panoramas, and Matterport/Spline 3D virtual walkthroughs
 </p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {/* Multi-image Gallery Upload */}
 <div className="md:col-span-2 flex flex-col gap-3">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Property Photo Gallery (Multi-Image)
 </label>
 <span className="text-xs font-bold text-gray-500">
 {galleryImages.length} {galleryImages.length === 1 ? 'photo' : 'photos'} added
 </span>
 </div>

 <div
 onClick={() => galleryInputRef.current?.click()}
 className="border-2 border-dashed border-gray-300 hover:border-emerald-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-gray-50 hover:bg-emerald-50/30 transition text-center"
 >
 <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center text-2xl">
 
 </div>
 <div className="text-sm font-bold text-gray-800">
 Click to select multiple photos (JPG, PNG, WEBP)
 </div>
 <div className="text-xs text-gray-500">
 Upload high-res exterior, interior, bedrooms, kitchen, and bathroom shots
 </div>
 <input
 ref={galleryInputRef}
 type="file"
 multiple
 accept="image/*"
 onChange={handleGalleryUpload}
 className="hidden"
 />
 </div>

 {/* Thumbnails Grid */}
 {galleryImages.length > 0 && (
 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-2">
 {galleryImages.map((img, idx) => (
 <div
 key={idx}
 className="relative group rounded-xl overflow-hidden border border-gray-200 bg-gray-100 aspect-square shadow-sm"
 >
 {/* eslint-disable-next-line @next/next/no-img-element */}
 <img
 src={img.url}
 alt={img.name}
 className="w-full h-full object-cover"
 />
 <button
 type="button"
 onClick={() => removeGalleryImage(idx)}
 aria-label={`Remove photo ${img.name}`}
 className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-red-600 text-white font-bold text-xs flex items-center justify-center opacity-90 group-hover:opacity-100 transition shadow"
 >
 
 </button>
 <span className="absolute bottom-0 inset-x-0 bg-black/60 text-white text-[9px] px-1 py-0.5 truncate text-center">
 {img.name}
 </span>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Video Tour (File or URL) */}
 <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
 <span> Video Tour</span>
 </label>
 <div className="flex items-center gap-1 bg-gray-200 p-0.5 rounded-lg text-xs font-semibold">
 <button
 type="button"
 onClick={() => setVideoMode('url')}
 className={`px-2.5 py-1 rounded-md transition ${
 videoMode === 'url' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
 }`}
 >
 Video URL
 </button>
 <button
 type="button"
 onClick={() => setVideoMode('file')}
 className={`px-2.5 py-1 rounded-md transition ${
 videoMode === 'file' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
 }`}
 >
 Upload .MP4
 </button>
 </div>
 </div>

 {videoMode === 'url' ? (
 <input
 type="url"
 value={videoUrl}
 onChange={(e) => setVideoUrl(e.target.value)}
 placeholder="https://www.youtube.com/watch?v=... or Vimeo / MP4"
 className="bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 ) : (
 <div>
 <input
 ref={videoFileInputRef}
 type="file"
 accept="video/mp4,video/quicktime,video/webm"
 onChange={handleVideoUpload}
 className="hidden"
 />
 <button
 type="button"
 onClick={() => videoFileInputRef.current?.click()}
 className="w-full bg-white border border-dashed border-gray-300 hover:border-emerald-500 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
 >
 <span> {videoFileName ? `Selected: ${videoFileName}` : 'Select .MP4 Video File'}</span>
 </button>
 </div>
 )}
 </div>

 {/* Direct 360° Panorama Upload */}
 <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
 <span> 360° Panorama (.jpg)</span>
 </label>
 <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2 py-0.5 rounded-full">
 Equirectangular View
 </span>
 </div>
 <input
 ref={panoramaInputRef}
 type="file"
 accept=".jpg,.jpeg,image/jpeg,image/png"
 onChange={handlePanoramaUpload}
 className="hidden"
 />
 <button
 type="button"
 onClick={() => panoramaInputRef.current?.click()}
 className="bg-white border border-dashed border-gray-300 hover:border-purple-500 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
 >
 <span> {panoramaFileName ? `Panorama: ${panoramaFileName}` : 'Upload 360° .JPG Photo'}</span>
 </button>
 {panoramaPreviewUrl && (
 <div className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5 bg-purple-50 p-2 rounded-xl border border-purple-200">
 <span> 360° equirectangular image loaded for 3D Viewer</span>
 </div>
 )}
 </div>

 {/* Floor Plan Blueprint Upload */}
 <div className="flex flex-col gap-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
 <div className="flex items-center justify-between">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
 <span>️ Floor Plan Blueprint (.jpg / .png)</span>
 </label>
 <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
 2D / 3D Layout
 </span>
 </div>
 <input
 ref={floorPlanInputRef}
 type="file"
 accept="image/*"
 onChange={handleFloorPlanUpload}
 className="hidden"
 />
 <button
 type="button"
 onClick={() => floorPlanInputRef.current?.click()}
 className="bg-white border border-dashed border-gray-300 hover:border-emerald-500 text-gray-800 text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
 >
 <span> {floorPlanFileName ? `Floor Plan: ${floorPlanFileName}` : 'Upload Floor Plan Image / CAD Blueprint'}</span>
 </button>
 {floorPlanPreviewUrl && (
 <div className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
 <span> Architectural blueprint loaded for Floor Plan tab</span>
 </div>
 )}
 </div>

 {/* 3D Virtual Tour Link */}
 <div className="md:col-span-2 flex flex-col gap-1.5">
 <label className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center justify-between">
 <span>3D Virtual Tour Link (Matterport / Spline / 3D Walkthrough)</span>
 <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full border border-purple-200">
 ️ 3D Immersion
 </span>
 </label>
 <input
 type="url"
 value={virtualTourUrl}
 onChange={(e) => setVirtualTourUrl(e.target.value)}
 placeholder="https://my.matterport.com/show/?m=... or https://app.spline.design/..."
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-xs text-gray-900 font-medium focus:ring-2 focus:ring-purple-500 focus:outline-none"
 />
 </div>
 </div>
 </div>

 {/* ── SECTION 5: ADDITIONAL FEATURES & AMENITIES TOGGLES (VECTOR SVG ICONS) ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 5
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">Features &amp; Amenities</h3>
 <p className="text-xs text-gray-500">
 Select all applicable property advantages and utility connections
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
 {AMENITY_OPTIONS.map((amenity) => {
 const isSelected = selectedFeatures.includes(amenity.id);
 const IconComponent = amenity.icon;
 return (
 <button
 key={amenity.id}
 type="button"
 onClick={() => toggleFeature(amenity.id)}
 className={`p-3.5 rounded-2xl border text-left transition-all flex flex-col justify-between gap-3 ${
 isSelected
 ? 'bg-emerald-600 border-emerald-600 text-white shadow-md shadow-emerald-600/20'
 : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
 }`}
 >
 <div className="flex items-center justify-between">
 <div
 className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
 isSelected ? 'bg-emerald-500/40 text-white' : 'bg-gray-200/80 text-gray-600'
 }`}
 >
 <IconComponent className="w-4 h-4" />
 </div>
 <span
 className={`w-4 h-4 rounded-md border flex items-center justify-center text-[10px] ${
 isSelected
 ? 'bg-white text-emerald-700 border-white font-black'
 : 'border-gray-400 bg-white'
 }`}
 >
 {isSelected && ''}
 </span>
 </div>
 <span className="text-xs font-bold leading-tight">{amenity.label}</span>
 </button>
 );
 })}
 </div>
 </div>

 {/* ── SECTION 6: AGENT & CONTACT DETAILS ── */}
 <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-md border border-gray-200">
 <div className="flex items-center gap-3 mb-6 pb-3 border-b border-gray-100">
 <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
 6
 </span>
 <div>
 <h3 className="text-lg font-black text-gray-900">Agent &amp; Contact Details</h3>
 <p className="text-xs text-gray-500">Contact information for inquiries and buyer scheduling</p>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
 {/* Agent Name */}
 <div className="flex flex-col gap-1.5">
 <label htmlFor={contactNameId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Contact Agent Name *
 </label>
 <input
 id={contactNameId}
 type="text"
 value={contactName}
 onChange={(e) => setContactName(e.target.value)}
 placeholder="e.g. Muhammad Zeeshan"
 required
 className="bg-white border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
 />
 </div>

 {/* Phone / WhatsApp with OTP Verification */}
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor={contactPhoneId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Contact Phone / WhatsApp *
 </label>
 {isPhoneVerified ? (
 <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
 <span></span> Verified Number
 </span>
 ) : !isAgencyPortal ? (
 <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
 OTP Required
 </span>
 ) : null}
 </div>
 <div className="flex gap-2">
 <input
 id={contactPhoneId}
 type="tel"
 value={contactPhone}
 disabled={isPhoneVerified}
 onChange={(e) => {
 setContactPhone(e.target.value);
 setIsPhoneVerified(false);
 setOtpSent(false);
 setOtpCode('');
 setOtpError(null);
 setOtpSuccess(null);
 }}
 placeholder="e.g. 03001234567 or +923001234567"
 required
 className={`bg-white border rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none flex-1 ${
 isPhoneVerified ? 'border-emerald-500 bg-emerald-50/30' : 'border-gray-300'
 }`}
 />
 {!isAgencyPortal && !isPhoneVerified && (
 <button
 type="button"
 disabled={otpLoading || !contactPhone.trim()}
 onClick={handleSendOtp}
 className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition disabled:opacity-50 whitespace-nowrap"
 >
 {otpLoading ? 'Sending...' : otpSent ? 'Resend OTP' : 'Send OTP'}
 </button>
 )}
 </div>

 {/* OTP Input Box if OTP is sent and not yet verified */}
 {!isAgencyPortal && otpSent && !isPhoneVerified && (
 <div className="mt-2 p-3.5 bg-emerald-50/70 border border-emerald-300 rounded-xl space-y-2 animate-in fade-in">
 <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
 <span>Enter 6-Digit WhatsApp Code</span>
 {devOtpNotice ? (
 <button
 type="button"
 onClick={() => setOtpCode(devOtpNotice)}
 className="text-[11px] font-mono text-emerald-800 bg-white hover:bg-emerald-100/80 px-2.5 py-0.5 rounded-lg border border-emerald-300 shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
 title="Click to auto-fill"
 >
 Code: <strong>{devOtpNotice}</strong> <span className="text-[10px] text-emerald-600 font-semibold underline">Auto-fill </span>
 </button>
 ) : (
 <button
 type="button"
 onClick={() => setOtpCode('849201')}
 className="text-[10px] text-emerald-800 bg-white hover:bg-emerald-100/80 px-2 py-0.5 rounded border border-emerald-300 transition font-semibold"
 title="Click to auto-fill test pass code"
 >
 Test Pass: <strong>849201</strong>
 </button>
 )}
 </div>
 <div className="flex gap-2">
 <input
 type="text"
 maxLength={6}
 value={otpCode}
 onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
 placeholder="e.g. 849201"
 className="w-36 text-center font-mono text-sm tracking-widest px-3 py-2 bg-white border border-emerald-400 rounded-lg text-emerald-950 font-black focus:outline-none focus:ring-2 focus:ring-emerald-600"
 />
 <button
 type="button"
 disabled={otpVerifying || otpCode.length !== 6}
 onClick={handleVerifyOtp}
 className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition disabled:opacity-50"
 >
 {otpVerifying ? 'Verifying...' : 'Verify OTP'}
 </button>
 </div>
 {otpError && <p className="text-[11px] text-red-600 font-bold">{otpError}</p>}
 {otpSuccess && <p className="text-[11px] text-emerald-700 font-bold">{otpSuccess}</p>}
 <p className="text-[11px] text-emerald-900/80">
 Didn&apos;t receive WhatsApp message? You can use test code{' '}
 <button
 type="button"
 onClick={() => setOtpCode('849201')}
 className="font-bold text-emerald-700 underline hover:text-emerald-900"
 >
 849201
 </button>{' '}
 to verify instantly.
 </p>
 </div>
 )}
 </div>

 {/* Email Address with Validation */}
 <div className="flex flex-col gap-1.5">
 <div className="flex items-center justify-between">
 <label htmlFor={contactEmailId} className="text-xs font-bold text-gray-700 uppercase tracking-wider">
 Contact Email Address
 </label>
 {contactEmail && !emailError && (
 <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
 Valid
 </span>
 )}
 </div>
 <input
 id={contactEmailId}
 type="email"
 value={contactEmail}
 onChange={(e) => validateEmail(e.target.value)}
 placeholder="e.g. agent@nexmove.pk"
 className={`bg-white border rounded-xl px-4 py-2.5 text-gray-900 font-medium focus:outline-none transition ${
 emailError
 ? 'border-red-500 ring-2 ring-red-400/20'
 : 'border-gray-300 focus:ring-2 focus:ring-emerald-500'
 }`}
 />
 {emailError && (
 <p className="text-xs text-red-600 font-semibold">{emailError}</p>
 )}
 </div>
 </div>
 </div>

 {/* ── Bottom Bar: Agency gets B2B toggle; Seller gets Private confirmation ── */}
 {isAgencyPortal ? (
 <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-purple-50/90 border-2 border-purple-300 rounded-2xl gap-4">
 <div>
 <div className="font-extrabold text-sm text-purple-950 flex items-center gap-2">
 <svg className="w-4 h-4 text-purple-700" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
 <span>Private B2B / Off-Market Investor Deal</span>
 {isOffMarket && (
 <span className="text-[10px] font-black uppercase bg-purple-600 text-white px-2.5 py-0.5 rounded-full shadow-sm">
 Active
 </span>
 )}
 </div>
 <p className="text-xs text-purple-700 mt-0.5">
 Toggle on to publish directly as an Off-Market deal with smart escrow protection for qualified investors.
 </p>
 </div>

 <div className="flex items-center gap-3 flex-shrink-0">
 <span className={`text-xs font-bold ${isOffMarket ? 'text-purple-900 font-black' : 'text-gray-500'}`}>
 {isOffMarket ? 'Off-Market Deal' : 'Public Listing'}
 </span>
 <button
 type="button"
 onClick={() => setIsOffMarket((prev) => !prev)}
 className={`relative w-14 h-7 rounded-full transition-colors ${
 isOffMarket ? 'bg-purple-600' : 'bg-gray-300'
 }`}
 role="switch"
 aria-checked={isOffMarket}
 >
 <span
 className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${
 isOffMarket ? 'left-8' : 'left-1'
 }`}
 />
 </button>
 </div>
 </div>
 ) : (
 <div className="flex items-center gap-3 p-4 bg-amber-50/90 border-2 border-amber-300 rounded-2xl">
 <svg className="w-6 h-6 text-amber-700 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>
 <div>
 <div className="font-extrabold text-sm text-amber-950">Your Listing is 100% Private (Shielded)</div>
 <p className="text-xs text-amber-700 mt-0.5">
 This property will <strong>NOT</strong> appear on the public marketplace. Top 3 Verified Agencies in your city will be notified immediately to review and facilitate your deal.
 </p>
 </div>
 </div>
 )}

 {/* Submit Error Banner */}
 {submitError && (
 <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-4 rounded-2xl font-bold text-center">
 <svg className="w-4 h-4 inline mr-1 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg> {submitError}
 </div>
 )}

 {/* Form Actions */}
 <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-200">
 {isAgencyPortal && (
 <Link
 href="/agency/dashboard"
 className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition"
 >
 Cancel
 </Link>
 )}
 <button
 type="submit"
 disabled={loading || Boolean(emailError)}
 className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl transition shadow-lg disabled:opacity-50 flex items-center gap-2"
 >
 {loading ? (
 <>
 <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
 <span>{isAgencyPortal ? 'Publishing Property...' : 'Listing Privately...'}</span>
 </>
 ) : (
 <>
 <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
 {isAgencyPortal
 ? <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
 : <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
 }
 </svg>
 <span>{isAgencyPortal ? 'Publish Property Listing' : 'List Property Privately'}</span>
 </>
 )}
 </button>
 </div>
 </form>
 )}

 {/* ── Floating Toast Notifications Container ── */}
 <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2.5 pointer-events-none max-w-sm sm:max-w-md w-full px-4 sm:px-0">
 {toasts.map((t) => (
 <div
 key={t.id}
 className={`pointer-events-auto flex items-start justify-between gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border text-xs font-bold transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 ${
 t.type === 'error'
 ? 'bg-red-950/95 text-red-100 border-red-700 shadow-red-950/60'
 : t.type === 'success'
 ? 'bg-emerald-950/95 text-emerald-100 border-emerald-700 shadow-emerald-950/60'
 : t.type === 'warning'
 ? 'bg-amber-950/95 text-amber-100 border-amber-700 shadow-amber-950/60'
 : 'bg-slate-900/95 text-slate-100 border-slate-700 shadow-slate-950/60'
 }`}
 >
 <div className="flex items-start gap-2.5">
 <span className="text-sm mt-0.5 flex items-center">
 {t.type === 'error'
 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
 : t.type === 'success'
 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
 : t.type === 'warning'
 ? <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></svg>
 : <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" /></svg>
 }
 </span>
 <p className="leading-snug">{t.message}</p>
 </div>
 <button
 type="button"
 onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
 className="text-white/60 hover:text-white text-xs px-1"
 >
 
 </button>
 </div>
 ))}
 </div>
 </div>
 );
}
