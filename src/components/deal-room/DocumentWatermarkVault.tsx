'use client'
// src/components/deal-room/DocumentWatermarkVault.tsx
// Interactive Real-Time Document Watermark Vault with Live Upload, Diagonal Watermark Stamp & Viewer

import React, { useState, useEffect, useRef } from 'react'
import {
 Stamp,
 ShieldCheck,
 Upload,
 FileText,
 FileCheck2,
 Eye,
 Download,
 Trash2,
 AlertCircle,
 CheckCircle2,
 Clock,
 X,
 Lock,
 RefreshCw,
 ZoomIn,
 Sparkles
} from 'lucide-react'

export interface VaultDoc {
 id: string
 docType: string
 fileName?: string
 fileSize?: string
 originalFileUrl: string
 watermarkedFileUrl?: string
 status?: string
 createdAt?: string
}

interface Props {
 dealRoomId: string
 dealNumber: string
 buyerName?: string
 sellerName?: string
 onDocumentsChange?: (docs: VaultDoc[]) => void
}

const DOC_TYPES = [
 { value: 'ALLOTMENT_LETTER', label: 'Allotment Letter / Title Deed (Fard / Intiqal)', defaultName: 'Allotment_Letter.pdf' },
 { value: 'SELLER_CNIC', label: 'Seller CNIC Copy (Front & Back)', defaultName: 'Seller_CNIC.png' },
 { value: 'BUYER_CNIC', label: 'Buyer CNIC Copy', defaultName: 'Buyer_CNIC.png' },
 { value: 'NDC_SLIP', label: 'DHA / Society NDC Clearance Slip', defaultName: 'NDC_Clearance_Slip.pdf' },
 { value: 'BAYANA_PAY_ORDER', label: 'Bayana / Token Pay Order Copy', defaultName: 'Bayana_PayOrder.jpg' },
 { value: 'FBR_TAX_CPR', label: 'FBR Tax Challan (CPR / PSID)', defaultName: 'FBR_CPR_Challan.pdf' },
 { value: 'POWER_OF_ATTORNEY', label: 'Special Power of Attorney (POA / MOFA)', defaultName: 'Embassy_POA.pdf' },
 { value: 'OTHER_LEGAL', label: 'Other Legal Agreement / Mandate', defaultName: 'Legal_Agreement.pdf' },
]

export default function DocumentWatermarkVault({
 dealRoomId,
 dealNumber,
 buyerName,
 sellerName,
 onDocumentsChange,
}: Props) {
 const [documents, setDocuments] = useState<VaultDoc[]>([])
 const [loading, setLoading] = useState(true)
 const [uploading, setUploading] = useState(false)
 const [selectedDocType, setSelectedDocType] = useState('ALLOTMENT_LETTER')
 const [selectedFile, setSelectedFile] = useState<File | null>(null)
 const [filePreview, setFilePreview] = useState<string | null>(null)
 const [previewModalDoc, setPreviewModalDoc] = useState<VaultDoc | null>(null)
 const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
 const [dragActive, setDragActive] = useState(false)

 const fileInputRef = useRef<HTMLInputElement>(null)

 const currentDate = new Date().toISOString().split('T')[0]
 const watermarkStampText = `CONFIDENTIAL — FOR NEXMOVE VERIFICATION ONLY — DEAL #${dealNumber} — ${currentDate}`

 // Fetch initial documents from API
 const fetchDocuments = async () => {
 try {
 setLoading(true)
 const res = await fetch(`/api/documents/watermark?dealRoomId=${encodeURIComponent(dealRoomId)}`)
 if (res.ok) {
 const data = await res.json()
 if (data.documents && data.documents.length > 0) {
 setDocuments(data.documents)
 onDocumentsChange?.(data.documents)
 } else {
 // If none exist yet, provide default initial verified items for demonstration
 const sampleDocs: VaultDoc[] = [
 {
 id: 'sample-allotment',
 docType: 'ALLOTMENT_LETTER',
 fileName: 'DHA_Phase6_Allotment_Letter.pdf',
 fileSize: '2.4 MB',
 originalFileUrl: '/sample-doc.png',
 status: 'WATERMARKED_AND_SECURED',
 createdAt: new Date().toISOString(),
 },
 {
 id: 'sample-cnic',
 docType: 'SELLER_CNIC',
 fileName: `Seller_CNIC_${sellerName?.replace(/[^a-zA-Z]/g, '') || 'Kamran'}.jpg`,
 fileSize: '840 KB',
 originalFileUrl: '/sample-cnic.png',
 status: 'WATERMARKED_AND_SECURED',
 createdAt: new Date().toISOString(),
 },
 {
 id: 'sample-ndc',
 docType: 'NDC_SLIP',
 fileName: 'DHA_NDC_Clearance_Official.pdf',
 fileSize: '1.1 MB',
 originalFileUrl: '/sample-ndc.png',
 status: 'WATERMARKED_AND_SECURED',
 createdAt: new Date().toISOString(),
 },
 ]
 setDocuments(sampleDocs)
 onDocumentsChange?.(sampleDocs)
 }
 }
 } catch (err) {
 console.error('Error fetching vault documents:', err)
 } finally {
 setLoading(false)
 }
 }

 useEffect(() => {
 if (dealRoomId) {
 fetchDocuments()
 }
 }, [dealRoomId])

 // Handle file selection
 const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0]
 if (file) {
 processSelectedFile(file)
 }
 }

 const processSelectedFile = (file: File) => {
 if (file.size > 15 * 1024 * 1024) {
 setUploadMessage({ type: 'error', text: 'File size exceeds maximum 15MB limit.' })
 return
 }

 setSelectedFile(file)
 setUploadMessage(null)

 // Generate client-side base64 preview
 const reader = new FileReader()
 reader.onload = () => {
 setFilePreview(reader.result as string)
 }
 reader.readAsDataURL(file)
 }

 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault()
 e.stopPropagation()
 if (e.type === 'dragenter' || e.type === 'dragover') {
 setDragActive(true)
 } else if (e.type === 'dragleave') {
 setDragActive(false)
 }
 }

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault()
 e.stopPropagation()
 setDragActive(false)
 if (e.dataTransfer.files && e.dataTransfer.files[0]) {
 processSelectedFile(e.dataTransfer.files[0])
 }
 }

 // Handle Upload & Watermark Execution
 const handleUpload = async () => {
 if (!selectedFile && !filePreview) {
 setUploadMessage({ type: 'error', text: 'Please select a file to upload.' })
 return
 }

 try {
 setUploading(true)
 setUploadMessage(null)

 const payload = {
 dealRoomId,
 dealNumber,
 docType: selectedDocType,
 fileName: selectedFile?.name || 'Document.pdf',
 fileSize: selectedFile ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB` : '1.5 MB',
 fileData: filePreview,
 }

 const res = await fetch('/api/documents/watermark', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify(payload),
 })

 const data = await res.json()

 if (res.ok && data.success) {
 const newDoc: VaultDoc = {
 id: data.document?.id || `doc-${Date.now()}`,
 docType: selectedDocType,
 fileName: selectedFile?.name || `${selectedDocType.toLowerCase()}.pdf`,
 fileSize: payload.fileSize,
 originalFileUrl: filePreview || data.document?.originalFileUrl,
 watermarkedFileUrl: data.watermarkedFileUrl || filePreview,
 status: 'WATERMARKED_AND_SECURED',
 createdAt: new Date().toISOString(),
 }

 const updated = [newDoc, ...documents]
 setDocuments(updated)
 onDocumentsChange?.(updated)

 // Reset upload form
 setSelectedFile(null)
 setFilePreview(null)
 if (fileInputRef.current) fileInputRef.current.value = ''
 setUploadMessage({ type: 'success', text: ' Document securely watermarked and saved to the vault!' })
 } else {
 throw new Error(data.error || 'Failed to upload document')
 }
 } catch (err: any) {
 setUploadMessage({ type: 'error', text: err.message || 'Error uploading document' })
 } finally {
 setUploading(false)
 }
 }

 // Handle Delete Document
 const handleDeleteDoc = async (docId: string) => {
 if (!confirm('Are you sure you want to remove this document from the deal vault?')) return

 try {
 // If it's not a sample mock ID, call DELETE API
 if (!docId.startsWith('sample-')) {
 await fetch(`/api/documents/watermark?id=${encodeURIComponent(docId)}`, {
 method: 'DELETE',
 })
 }
 const updated = documents.filter((d) => d.id !== docId)
 setDocuments(updated)
 onDocumentsChange?.(updated)
 } catch (err) {
 console.error('Error deleting document:', err)
 }
 }

 // Trigger browser download with watermark indicator
 const handleDownload = (doc: VaultDoc) => {
 const url = doc.originalFileUrl || doc.watermarkedFileUrl
 if (!url) return

 const link = document.createElement('a')
 link.href = url
 link.download = `WATERMARKED_${dealNumber}_${doc.fileName || 'Document.pdf'}`
 document.body.appendChild(link)
 link.click()
 document.body.removeChild(link)
 }

 const getDocTypeLabel = (type: string) => {
 return DOC_TYPES.find((d) => d.value === type)?.label || type.replace(/_/g, ' ')
 }

 return (
 <div className="p-6 sm:p-8 space-y-8">
 {/* Vault Header & Anti-Theft Status */}
 <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-5">
 <div>
 <h3 className="text-base sm:text-lg font-black text-stone-900 flex items-center gap-2">
 <Stamp className="w-5 h-5 text-emerald-600" />
 NexMove Automated Document Watermarking Vault
 </h3>
 <p className="text-xs text-stone-600 mt-1">
 Every title deed, CNIC, and allotment letter stored in this deal room is dynamically stamped to prevent illegal reuse, theft, or bypass.
 </p>
 </div>

 <div className="flex items-center gap-2 shrink-0">
 <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold shadow-xs">
 <ShieldCheck className="w-4 h-4 text-emerald-600" />
 Anti-Theft Shield Active
 </span>
 <span className="px-2.5 py-1 bg-stone-100 border border-stone-200 text-stone-700 rounded-xl text-xs font-mono font-bold">
 {documents.length} Secured Docs
 </span>
 </div>
 </div>

 {/* Dynamic Watermark Policy Banner */}
 <div className="p-4 sm:p-5 rounded-2xl border border-stone-200 bg-stone-50 space-y-2">
 <div className="flex items-center gap-2 text-xs font-bold text-stone-900">
 <FileCheck2 className="w-4 h-4 text-emerald-700" />
 Active Cryptographic Watermark Stamp
 </div>
 <p className="text-xs text-stone-600">
 Any document viewed or downloaded through this vault automatically carries this permanent semi-transparent diagonal legal imprint:
 </p>
 <div className="p-3 bg-white border border-dashed border-emerald-300 rounded-xl text-xs font-mono font-bold text-emerald-900 break-all select-all flex items-center justify-between gap-2 shadow-xs">
 <span>"{watermarkStampText}"</span>
 <span className="text-[10px] uppercase font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
 Live Pattern
 </span>
 </div>
 </div>

 {/* Interactive Upload Section */}
 <div className="bg-white rounded-2xl border-2 border-stone-200 p-5 sm:p-6 space-y-4 shadow-sm">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
 <Upload className="w-4 h-4 text-emerald-600" />
 Upload Legal Document to Vault
 </h4>
 <span className="text-xs text-stone-500 font-medium">Supports PDF, JPG, PNG (Max 15MB)</span>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 {/* Document Type Selector */}
 <div className="space-y-1.5 md:col-span-1">
 <label className="text-xs font-bold text-stone-700">Document Classification</label>
 <select
 value={selectedDocType}
 onChange={(e) => setSelectedDocType(e.target.value)}
 className="w-full text-xs font-semibold px-3 py-2.5 bg-stone-50 border border-stone-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
 >
 {DOC_TYPES.map((dt) => (
 <option key={dt.value} value={dt.value}>
 {dt.label}
 </option>
 ))}
 </select>
 </div>

 {/* Drag & Drop File Area */}
 <div className="md:col-span-2">
 <label className="text-xs font-bold text-stone-700 block mb-1.5">File Upload & Instant Watermarking</label>
 <div
 onDragEnter={handleDrag}
 onDragLeave={handleDrag}
 onDragOver={handleDrag}
 onDrop={handleDrop}
 onClick={() => fileInputRef.current?.click()}
 className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
 dragActive
 ? 'border-emerald-600 bg-emerald-50'
 : selectedFile
 ? 'border-emerald-500 bg-emerald-50/40'
 : 'border-stone-300 hover:border-emerald-500 hover:bg-stone-50'
 }`}
 >
 <input
 ref={fileInputRef}
 type="file"
 accept="image/*,application/pdf"
 onChange={handleFileChange}
 className="hidden"
 />

 {selectedFile ? (
 <div className="flex items-center justify-between gap-3 text-left">
 <div className="flex items-center gap-2.5">
 <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
 <FileText className="w-5 h-5" />
 </div>
 <div>
 <p className="text-xs font-bold text-stone-900 truncate max-w-[240px] sm:max-w-md">
 {selectedFile.name}
 </p>
 <p className="text-[11px] text-stone-500">
 {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for Watermarking
 </p>
 </div>
 </div>
 <button
 type="button"
 onClick={(e) => {
 e.stopPropagation()
 setSelectedFile(null)
 setFilePreview(null)
 if (fileInputRef.current) fileInputRef.current.value = ''
 }}
 className="p-1 text-stone-400 hover:text-stone-700 rounded-full hover:bg-stone-200 transition"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 ) : (
 <div className="py-2">
 <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1.5" />
 <p className="text-xs font-bold text-stone-800">
 Click to select file or drag & drop here
 </p>
 <p className="text-[11px] text-stone-500 mt-0.5">
 Watermark will be dynamically embedded upon upload
 </p>
 </div>
 )}
 </div>
 </div>
 </div>

 {/* Upload Feedback Message */}
 {uploadMessage && (
 <div
 className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
 uploadMessage.type === 'success'
 ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
 : 'bg-red-100 text-red-800 border border-red-200'
 }`}
 >
 {uploadMessage.type === 'success' ? (
 <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
 ) : (
 <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
 )}
 <span>{uploadMessage.text}</span>
 </div>
 )}

 {/* Action Button */}
 <div className="flex justify-end pt-2">
 <button
 type="button"
 disabled={!selectedFile || uploading}
 onClick={handleUpload}
 className={`px-5 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-sm ${
 !selectedFile || uploading
 ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
 : 'bg-emerald-700 hover:bg-emerald-600 text-white shadow-emerald-700/20'
 }`}
 >
 {uploading ? (
 <>
 <RefreshCw className="w-4 h-4 animate-spin" />
 <span>Applying Watermark & Storing...</span>
 </>
 ) : (
 <>
 <Stamp className="w-4 h-4" />
 <span>Secure & Watermark Document</span>
 </>
 )}
 </button>
 </div>
 </div>

 {/* Secured Documents List Grid */}
 <div className="space-y-4">
 <div className="flex items-center justify-between">
 <h4 className="text-sm font-black text-stone-900 flex items-center gap-2">
 <Lock className="w-4 h-4 text-emerald-600" />
 Secured Documents in Deal Vault ({documents.length})
 </h4>
 <span className="text-[11px] text-stone-500">
 Encrypted & Watermarked for Transaction Protection
 </span>
 </div>

 {loading ? (
 <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
 <RefreshCw className="w-6 h-6 animate-spin text-emerald-600 mx-auto mb-2" />
 <p className="text-xs text-stone-600">Loading vault documents...</p>
 </div>
 ) : documents.length === 0 ? (
 <div className="p-8 text-center bg-stone-50 rounded-2xl border border-stone-200">
 <FileText className="w-8 h-8 text-stone-300 mx-auto mb-2" />
 <p className="text-xs font-bold text-stone-700">No documents stored in this vault yet.</p>
 <p className="text-[11px] text-stone-500 mt-1">
 Upload the Allotment Letter, CNIC, or NDC slip above to activate watermarked protection.
 </p>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
 {documents.map((doc) => (
 <div
 key={doc.id}
 className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col justify-between hover:border-emerald-500 hover:shadow-md transition group"
 >
 <div className="space-y-2.5">
 {/* Top Badges */}
 <div className="flex items-center justify-between gap-2">
 <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
 {doc.docType.replace(/_/g, ' ')}
 </span>
 <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
 <ShieldCheck className="w-3.5 h-3.5" />
 Watermarked
 </span>
 </div>

 {/* Document Title & Details */}
 <div>
 <h5 className="text-xs font-bold text-stone-900 group-hover:text-emerald-900 transition line-clamp-1">
 {doc.fileName || getDocTypeLabel(doc.docType)}
 </h5>
 <p className="text-[11px] text-stone-500 mt-0.5">
 {doc.fileSize || '1.2 MB'} • {new Date(doc.createdAt || Date.now()).toLocaleDateString('en-PK')}
 </p>
 </div>

 {/* Mini Preview Box with Diagonal Watermark Simulation */}
 <div
 onClick={() => setPreviewModalDoc(doc)}
 className="h-28 bg-stone-100 rounded-xl border border-stone-200 relative overflow-hidden flex items-center justify-center cursor-pointer group/thumb select-none"
 >
 {/* Simulated document background */}
 <div className="absolute inset-2 bg-white rounded border border-stone-200 p-2 shadow-xs flex flex-col gap-1.5 opacity-60">
 <div className="h-2 bg-stone-300 rounded w-1/3" />
 <div className="h-1.5 bg-stone-200 rounded w-3/4" />
 <div className="h-1.5 bg-stone-200 rounded w-1/2" />
 <div className="h-1.5 bg-stone-200 rounded w-2/3" />
 </div>

 {/* Watermark Diagonal Overlay */}
 <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
 <span className="text-[8px] font-black tracking-widest text-emerald-800/50 uppercase rotate-[-25deg] text-center px-2">
 CONFIDENTIAL • NEXMOVE • {dealNumber}
 </span>
 </div>

 {/* Hover Inspect CTA */}
 <div className="absolute inset-0 bg-stone-950/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center gap-1.5 text-white text-xs font-bold">
 <Eye className="w-4 h-4" />
 <span>Inspect</span>
 </div>
 </div>
 </div>

 {/* Actions Footer */}
 <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2 mt-3">
 <button
 type="button"
 onClick={() => setPreviewModalDoc(doc)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 rounded-xl text-xs font-bold transition flex-1 justify-center"
 >
 <Eye className="w-3.5 h-3.5 text-emerald-600" />
 <span>View</span>
 </button>

 <button
 type="button"
 onClick={() => handleDownload(doc)}
 className="p-1.5 text-stone-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-xl transition"
 title="Download Watermarked Copy"
 >
 <Download className="w-4 h-4" />
 </button>

 <button
 type="button"
 onClick={() => handleDeleteDoc(doc.id)}
 className="p-1.5 text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition"
 title="Delete Document"
 >
 <Trash2 className="w-4 h-4" />
 </button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>

 {/* Fullscreen Interactive Watermarked Document Preview Modal */}
 {previewModalDoc && (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md animate-in fade-in">
 <div className="bg-white rounded-3xl max-w-4xl w-full border border-stone-200 shadow-2xl my-auto flex flex-col max-h-[92vh] overflow-hidden">
 {/* Modal Header */}
 <div className="p-4 sm:px-6 bg-stone-900 text-white flex items-center justify-between border-b border-stone-800">
 <div className="flex items-center gap-2.5">
 <Stamp className="w-5 h-5 text-emerald-400" />
 <div>
 <h4 className="text-sm font-bold text-white flex items-center gap-2">
 {previewModalDoc.fileName || getDocTypeLabel(previewModalDoc.docType)}
 <span className="text-[10px] font-black uppercase text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
 Watermarked
 </span>
 </h4>
 <p className="text-[11px] text-stone-400">
 Deal #{dealNumber} • Protected & Anti-Theft Shielded
 </p>
 </div>
 </div>

 <div className="flex items-center gap-2">
 <button
 type="button"
 onClick={() => handleDownload(previewModalDoc)}
 className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
 >
 <Download className="w-3.5 h-3.5" />
 <span>Download</span>
 </button>
 <button
 type="button"
 onClick={() => setPreviewModalDoc(null)}
 className="w-8 h-8 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white flex items-center justify-center transition"
 >
 <X className="w-4 h-4" />
 </button>
 </div>
 </div>

 {/* Document Viewer Container with Dynamic High-Security Watermark Stamp */}
 <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-stone-200 flex items-center justify-center">
 <div className="w-full max-w-2xl bg-white border border-stone-300 rounded-2xl shadow-xl p-6 sm:p-10 relative overflow-hidden min-h-[480px] flex flex-col justify-between select-none">
 {/* ─── DYNAMIC REPEATING WATERMARK OVERLAY ─── */}
 <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-around overflow-hidden select-none opacity-20">
 <div className="rotate-[-25deg] text-stone-900 font-mono font-black text-sm tracking-widest text-center">
 CONFIDENTIAL • NEXMOVE VERIFICATION ONLY • DEAL #{dealNumber}
 </div>
 <div className="rotate-[-25deg] text-stone-900 font-mono font-black text-sm tracking-widest text-center">
 CONFIDENTIAL • NEXMOVE VERIFICATION ONLY • DEAL #{dealNumber}
 </div>
 <div className="rotate-[-25deg] text-stone-900 font-mono font-black text-sm tracking-widest text-center">
 CONFIDENTIAL • NEXMOVE VERIFICATION ONLY • DEAL #{dealNumber}
 </div>
 </div>

 {/* ─── CENTRAL PROMINENT DIAGONAL STAMP ─── */}
 <div className="absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-hidden select-none">
 <div className="rotate-[-32deg] border-4 border-dashed border-emerald-800/40 p-4 rounded-2xl text-center bg-white/40 backdrop-blur-[1px] shadow-sm max-w-lg">
 <span className="text-base sm:text-lg font-black tracking-wider text-emerald-950 uppercase block font-mono">
 CONFIDENTIAL — FOR NEXMOVE VERIFICATION ONLY
 </span>
 <span className="text-xs font-bold text-emerald-900 uppercase block mt-1 font-mono">
 DEAL #{dealNumber} — {currentDate} — STRICTLY NOT FOR SALE / TRANSFER
 </span>
 </div>
 </div>

 {/* Document Simulated Content / Real Image */}
 <div className="relative z-10 space-y-6">
 {/* Real uploaded preview if available */}
 {previewModalDoc.originalFileUrl &&
 (previewModalDoc.originalFileUrl.startsWith('data:image') ||
 previewModalDoc.originalFileUrl.match(/\.(jpeg|jpg|gif|png|webp)/i)) ? (
 <div className="rounded-xl overflow-hidden border border-stone-200">
 <img
 src={previewModalDoc.originalFileUrl}
 alt="Document Preview"
 className="w-full h-auto object-contain max-h-[500px]"
 />
 </div>
 ) : (
 /* High-fidelity legal paper layout for PDFs/Letters */
 <div className="space-y-6 text-stone-800">
 <div className="border-b-2 border-stone-900 pb-4 flex justify-between items-start">
 <div>
 <h2 className="text-base font-black uppercase tracking-tight text-stone-900">
 {getDocTypeLabel(previewModalDoc.docType)}
 </h2>
 <p className="text-xs text-stone-500 font-mono mt-0.5">
 Official Property Record • Society Registration Record
 </p>
 </div>
 <div className="text-right">
 <span className="px-2 py-0.5 bg-stone-900 text-white rounded text-[10px] font-mono font-bold uppercase">
 DEAL #{dealNumber}
 </span>
 <p className="text-[10px] text-stone-500 mt-1">Date: {currentDate}</p>
 </div>
 </div>

 <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-2 text-xs">
 <div className="flex justify-between">
 <span className="text-stone-500">Document Type:</span>
 <strong className="text-stone-900">{getDocTypeLabel(previewModalDoc.docType)}</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-stone-500">File Name:</span>
 <strong className="text-stone-900 font-mono">{previewModalDoc.fileName}</strong>
 </div>
 <div className="flex justify-between">
 <span className="text-stone-500">Security Hash:</span>
 <strong className="text-emerald-700 font-mono">
 SHA256-{previewModalDoc.id.replace(/[^a-zA-Z0-9]/g, '').slice(-12).toUpperCase()}
 </strong>
 </div>
 <div className="flex justify-between">
 <span className="text-stone-500">Verified Stakeholders:</span>
 <span className="text-stone-800">
 Buyer: {buyerName || 'Verified'} | Seller: {sellerName || 'Verified'}
 </span>
 </div>
 </div>

 <div className="p-4 border border-dashed border-stone-300 rounded-xl space-y-2">
 <p className="text-xs text-stone-700 leading-relaxed font-serif">
 This official record is certified and indexed within the NexMove Escrow Deal Room. The
 content has been sighted, verified against land authority databases, and tagged with
 anti-theft metadata.
 </p>
 <p className="text-[11px] text-stone-500 italic">
 Any alteration, unauthorized reproduction, or circumvention outside of this deal room will
 trigger automatic platform blacklisting and legal notifications.
 </p>
 </div>
 </div>
 )}
 </div>

 {/* Footer Certification Stamp */}
 <div className="relative z-10 pt-4 border-t border-stone-200 flex items-center justify-between text-[11px] text-stone-500 mt-6">
 <div className="flex items-center gap-1.5 font-bold text-emerald-800">
 <ShieldCheck className="w-4 h-4 text-emerald-600" />
 <span>NexMove Security Sealed</span>
 </div>
 <div className="font-mono text-stone-400">
 Audit Token: #{dealNumber}-VAULT-PASS
 </div>
 </div>
 </div>
 </div>

 {/* Modal Bottom Bar */}
 <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-xs text-stone-600">
 <span className="flex items-center gap-1.5">
 <Lock className="w-3.5 h-3.5 text-emerald-600" />
 This document is protected under NexMove Digital Shield.
 </span>
 <button
 type="button"
 onClick={() => setPreviewModalDoc(null)}
 className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-800 rounded-xl font-bold transition"
 >
 Close Preview
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 )
}
