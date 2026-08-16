'use client'
// src/components/architects/LinkedInStylePostModal.tsx
// LinkedIn-Style Post & Portfolio Upload Modal — Enhanced with rich media UX

import { useState, useRef } from 'react'

interface LinkedInStylePostModalProps {
  architectId?: string
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CATEGORY_OPTIONS = [
  'Residential',
  'Commercial',
  'High-Rise',
  'Mixed-Use',
  'Luxury Villas',
  'Interior Design',
  'Landscape Architecture',
  'Hospitality',
  'Urban Planning',
]

const SOFTWARE_OPTIONS = [
  'Revit',
  'AutoCAD',
  '3ds Max',
  'Lumion',
  'SketchUp',
  'Enscape',
  'Navisworks',
  'Rhino',
  'V-Ray',
  'Photoshop',
]

interface MediaFile {
  url: string
  type: 'image' | 'video'
  name: string
  isPrimary?: boolean
}

export default function LinkedInStylePostModal({
  architectId,
  isOpen,
  onClose,
  onSuccess,
}: LinkedInStylePostModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('Residential')
  const [completedYear, setCompletedYear] = useState(new Date().getFullYear().toString())
  const [description, setDescription] = useState('')
  const [selectedSoftware, setSelectedSoftware] = useState<string[]>([])
  const [tags, setTags] = useState('')

  // Media state
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [processingFiles, setProcessingFiles] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!isOpen) return null

  const toggleSoftware = (sw: string) => {
    setSelectedSoftware((prev) =>
      prev.includes(sw) ? prev.filter((s) => s !== sw) : [...prev, sw]
    )
  }

  // Native File Picker Handler with loading state
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    setProcessingFiles(true)
    let processed = 0

    files.forEach((file) => {
      const isVideo = file.type.startsWith('video/')
      const reader = new FileReader()
      reader.onload = () => {
        setMediaFiles((prev) => {
          const newFile: MediaFile = {
            url: reader.result as string,
            type: isVideo ? 'video' : 'image',
            name: file.name,
            isPrimary: prev.length === 0 && !isVideo, // First image is primary
          }
          return [...prev, newFile]
        })
        processed++
        if (processed === files.length) setProcessingFiles(false)
      }
      reader.readAsDataURL(file)
    })
    // Reset the input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeMedia = (index: number) => {
    setMediaFiles((prev) => {
      const updated = prev.filter((_, i) => i !== index)
      // Re-assign primary to first image if removed
      const firstImageIdx = updated.findIndex((m) => m.type === 'image')
      return updated.map((m, i) => ({ ...m, isPrimary: i === firstImageIdx }))
    })
  }

  const setPrimary = (index: number) => {
    setMediaFiles((prev) =>
      prev.map((m, i) => ({ ...m, isPrimary: i === index && m.type === 'image' }))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setError('Project Title is required.')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Primary image = the one marked isPrimary, or first image
      const primaryImageFile = mediaFiles.find((m) => m.isPrimary && m.type === 'image')
        ?? mediaFiles.find((m) => m.type === 'image')
      const primaryVideoFile = mediaFiles.find((m) => m.type === 'video')
      const allImageUrls = mediaFiles.filter((m) => m.type === 'image').map((m) => m.url)

      const tagList = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean)

      const res = await fetch('/api/architects/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          architectId,
          title: title.trim(),
          category,
          completedYear,
          description: description.trim(),
          software: selectedSoftware,
          imageUrl: primaryImageFile?.url || null,
          imageUrls: allImageUrls,
          videoUrl: primaryVideoFile?.url || null,
          tags: tagList,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to publish post')

      // Reset form
      setTitle('')
      setDescription('')
      setMediaFiles([])
      setSelectedSoftware([])
      setTags('')
      setCategory('Residential')
      onSuccess()
      onClose()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An error occurred while publishing')
    } finally {
      setUploading(false)
    }
  }

  const imageCount = mediaFiles.filter((m) => m.type === 'image').length
  const videoCount = mediaFiles.filter((m) => m.type === 'video').length

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm" />

      <div
        className="relative w-full max-w-xl bg-white border border-slate-200 rounded-t-3xl sm:rounded-2xl flex flex-col shadow-2xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden text-slate-800"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Modal Header ── */}
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center text-white text-base shadow-sm">
              🏗️
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900 leading-tight">Create Portfolio Post</h2>
              <p className="text-[10px] text-slate-400">Share your design work with the NexMove network</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* ── Scrollable Body ── */}
        <div className="overflow-y-auto flex-1 px-5 py-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl mb-4 flex items-center gap-2">
              <span className="text-red-500">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="post-form" className="flex flex-col gap-4">
            {/* Title */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Project / Design Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 500 Sq Yd Luxury Modern Villa 3D Renders"
                required
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 font-medium transition"
              />
            </div>

            {/* Category & Year */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition"
                >
                  {CATEGORY_OPTIONS.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-slate-700">Completion Year</label>
                <input
                  type="number"
                  value={completedYear}
                  onChange={(e) => setCompletedYear(e.target.value)}
                  min="2000"
                  max="2030"
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-teal-500 transition"
                />
              </div>
            </div>

            {/* Software Pill Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Software Used
                {selectedSoftware.length > 0 && (
                  <span className="ml-2 text-teal-600 font-normal">({selectedSoftware.length} selected)</span>
                )}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SOFTWARE_OPTIONS.map((sw) => (
                  <button
                    key={sw}
                    type="button"
                    onClick={() => toggleSoftware(sw)}
                    className={`text-[11px] px-2.5 py-1 rounded-full border transition font-semibold ${
                      selectedSoftware.includes(sw)
                        ? 'bg-teal-600 border-teal-600 text-white shadow-sm'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-teal-400 hover:text-teal-700'
                    }`}
                  >
                    {selectedSoftware.includes(sw) && <span className="mr-1">✓</span>}
                    {sw}
                  </button>
                ))}
              </div>
            </div>

            {/* Native Media Upload Picker */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Media Attachments
                  {mediaFiles.length > 0 && (
                    <span className="ml-2 text-slate-500 font-normal">
                      {imageCount > 0 && `${imageCount} photo${imageCount > 1 ? 's' : ''}`}
                      {imageCount > 0 && videoCount > 0 && ', '}
                      {videoCount > 0 && `${videoCount} video`}
                    </span>
                  )}
                </label>
                {mediaFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setMediaFiles([])}
                    className="text-[10px] text-red-500 hover:text-red-700 font-bold transition"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Upload zone */}
              <label
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-1.5 cursor-pointer transition ${
                  processingFiles
                    ? 'border-teal-300 bg-teal-50/60'
                    : 'border-slate-200 hover:border-teal-400 bg-slate-50 hover:bg-teal-50/30'
                }`}
              >
                {processingFiles ? (
                  <>
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs font-medium text-teal-600">Processing files...</span>
                  </>
                ) : (
                  <>
                    <div className="flex gap-1 text-xl">📸 🎥</div>
                    <span className="text-xs font-bold text-slate-700">
                      Click to add Photos or Videos
                    </span>
                    <span className="text-[10px] text-slate-400">
                      JPG, PNG, WEBP, MP4, WEBM — multiple files supported
                    </span>
                  </>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  multiple
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>

              {/* Media Previews Grid */}
              {mediaFiles.length > 0 && (
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {mediaFiles.map((m, idx) => (
                    <div
                      key={idx}
                      className="relative aspect-square rounded-xl overflow-hidden border bg-slate-900 group cursor-pointer"
                      style={{
                        borderColor: m.isPrimary ? '#0d9488' : '#e2e8f0',
                        borderWidth: m.isPrimary ? '2px' : '1px',
                      }}
                      onClick={() => m.type === 'image' && setPrimary(idx)}
                    >
                      {m.type === 'video' ? (
                        <video src={m.url} className="w-full h-full object-cover" />
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={m.url} alt="Attachment" className="w-full h-full object-cover" />
                      )}

                      {/* Badges */}
                      {m.isPrimary && (
                        <span className="absolute top-1 left-1 bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                          COVER
                        </span>
                      )}
                      {m.type === 'video' && (
                        <span className="absolute top-1 left-1 bg-slate-900/80 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                          ▶ VIDEO
                        </span>
                      )}

                      {/* Remove button */}
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); removeMedia(idx) }}
                        className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full w-5 h-5 text-[10px] flex items-center justify-center transition opacity-0 group-hover:opacity-100"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {mediaFiles.length > 1 && imageCount > 1 && (
                <p className="text-[10px] text-slate-400 text-center">
                  Tap an image to set it as the cover photo
                </p>
              )}
            </div>

            {/* Search Keywords / Tags */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">
                Search Tags / Keywords
                <span className="ml-1.5 text-slate-400 font-normal">(comma separated)</span>
              </label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="3D Render, Residential, Villa, Interior, Lahore"
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 transition font-medium"
              />
              {/* Tag pill previews */}
              {tags && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {tags.split(',').filter(t => t.trim()).map((tag, i) => (
                    <span key={i} className="text-[10px] bg-teal-50 border border-teal-200 text-teal-700 px-2 py-0.5 rounded-full font-medium">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Description */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-bold text-slate-700">Project Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Share details about plot dimensions, architectural layout, lighting setup, materials used..."
                className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 resize-none transition font-medium"
              />
            </div>
          </form>
        </div>

        {/* ── Footer Actions ── */}
        <div className="flex gap-3 px-5 py-4 border-t border-slate-100 flex-shrink-0 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs py-3 rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="post-form"
            disabled={uploading || processingFiles}
            className="flex-1 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white font-bold text-xs py-3 rounded-xl transition shadow-md shadow-teal-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {uploading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Publishing...
              </>
            ) : (
              '🚀 Post to Portfolio'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
