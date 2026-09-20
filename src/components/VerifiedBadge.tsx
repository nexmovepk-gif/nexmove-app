// src/components/VerifiedBadge.tsx

export type VerificationTier = 'SILVER' | 'GOLD' | 'PLATINUM';

interface VerifiedBadgeProps {
 type: 'AGENCY' | 'PROPERTY' | 'ARCHITECT' | 'USER';
 verified: boolean;
 tier?: VerificationTier;
 size?: 'sm' | 'md';
}

export default function VerifiedBadge({ type, verified, tier = 'GOLD', size = 'sm' }: VerifiedBadgeProps) {
 if (!verified) {
 if (type === 'ARCHITECT') {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2.5 py-0.5'}
 bg-amber-50 border-amber-300 text-amber-800 shadow-xs`}
 >
 <svg className="w-3 h-3 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 KYC Pending Verification
 </span>
 );
 }
 if (type === 'USER' || type === 'AGENCY') {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2.5 py-0.5'}
 bg-amber-50 border-amber-300 text-amber-800 shadow-xs`}
 >
 <svg className="w-3 h-3 flex-shrink-0 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
 </svg>
 KYC Pending
 </span>
 );
 }
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'}
 bg-slate-100 border-slate-300 text-slate-500`}
 >
 <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
 </svg>
 Unverified Docs
 </span>
 );
 }

 // User verified badge
 if (type === 'USER') {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2.5 py-0.5'}
 bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs`}
 >
 <svg className="w-3 h-3 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
 </svg>
 KYC Verified
 </span>
 );
 }

 // Architect verified badge — clean emerald green
 if (type === 'ARCHITECT') {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2.5 py-0.5'}
 bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs`}
 >
 <svg className="w-3 h-3 flex-shrink-0 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
 </svg>
 Verified Architect
 </span>
 );
 }

 if (type === 'PROPERTY') {
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'}
 bg-emerald-100 border-emerald-300 text-emerald-800`}
 >
 <svg className="w-3 h-3 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
 <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
 </svg>
 Verified Property
 </span>
 );
 }

 // Tiered Agency Badge
 switch (tier) {
 case 'SILVER':
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'}
 bg-slate-100 border-slate-300 text-slate-800`}
 >
 <svg className="w-2.5 h-2.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
 Silver Verified
 </span>
 );
 case 'PLATINUM':
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold shadow-sm
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'}
 bg-purple-100 border-purple-300 text-purple-900`}
 >
 <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l5.91-.01L12 2z"/></svg>
 Platinum Enterprise
 </span>
 );
 case 'GOLD':
 default:
 return (
 <span
 className={`inline-flex items-center gap-1 rounded-full border font-bold
 ${size === 'md' ? 'text-xs px-3 py-1' : 'text-[10px] px-2 py-0.5'}
 bg-amber-100 border-amber-300 text-amber-900`}
 >
 <svg className="w-2.5 h-2.5 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l2.09 6.26L20 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l5.91-.01L12 2z"/></svg>
 Gold Elite Agency
 </span>
 );
 }
}
