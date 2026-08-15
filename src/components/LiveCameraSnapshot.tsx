'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'

interface LiveCameraSnapshotProps {
  onPhotoCaptured: (base64Photo: string) => void
  onPhotoCleared: () => void
  capturedPhoto?: string
  error?: string
}

export default function LiveCameraSnapshot({
  onPhotoCaptured,
  onPhotoCleared,
  capturedPhoto: externalCapturedPhoto,
  error,
}: LiveCameraSnapshotProps) {
  const [stream, setStream] = useState<MediaStream | null>(null)
  const [isCameraActive, setIsCameraActive] = useState(false)
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(externalCapturedPhoto || null)
  const [cameraError, setCameraError] = useState<string | null>(null)

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    if (externalCapturedPhoto) {
      setCapturedPhoto(externalCapturedPhoto)
    }
  }, [externalCapturedPhoto])

  useEffect(() => {
    return () => {
      // Clean up stream on unmount
      if (stream) {
        stream.getTracks().forEach((track) => track.stop())
      }
    }
  }, [stream])

  // Attach stream and trigger play as soon as the video element mounts or stream updates
  useEffect(() => {
    if (isCameraActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream
      const playPromise = videoRef.current.play()
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn('Video playback initiation error:', err)
        })
      }
    }
  }, [stream, isCameraActive])

  const startCamera = async () => {
    setCameraError(null)
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment. Please ensure you are using HTTPS or a supported mobile browser.')
      }

      let mediaStream: MediaStream
      try {
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        })
      } catch (constraintErr) {
        console.warn('Strict facingMode constraints failed, attempting fallback...', constraintErr)
        mediaStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
      }

      setStream(mediaStream)
      setIsCameraActive(true)

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        videoRef.current.play().catch(() => {})
      }
    } catch (err: unknown) {
      console.error('Camera access error:', err)
      const msg =
        err instanceof Error
          ? err.message
          : 'Unable to access camera. Please allow camera permissions in your browser.'
      setCameraError(msg)
    }
  }

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop())
      setStream(null)
    }
    setIsCameraActive(false)
  }

  const takeSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return

    const video = videoRef.current
    const canvas = canvasRef.current

    const width = video.videoWidth || 640
    const height = video.videoHeight || 480

    canvas.width = width
    canvas.height = height

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, width, height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      setCapturedPhoto(dataUrl)
      stopCamera()
      onPhotoCaptured(dataUrl)
    }
  }

  const retakePhoto = () => {
    setCapturedPhoto(null)
    onPhotoCleared()
    startCamera()
  }

  return (
    <div className="flex flex-col gap-3 bg-slate-50 border border-slate-200 p-4 rounded-2xl">
      <div className="flex items-center justify-between">
        <div>
          <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <span>📷</span> Live Identity Selfie Verification *
          </label>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Take a live profile photo using your webcam for identity compliance verification.
          </p>
        </div>
        {capturedPhoto && (
          <span className="text-[10px] bg-emerald-100 border border-emerald-300 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
            ✓ Live Selfie Captured
          </span>
        )}
      </div>

      {cameraError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl font-medium">
          {cameraError}
        </div>
      )}

      {error && !capturedPhoto && (
        <span className="text-[10px] text-red-600 font-semibold">{error}</span>
      )}

      {/* Hidden canvas element for frame grabbing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Snapshot Preview / Video Container */}
      <div className="relative w-full h-56 sm:h-64 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center border border-slate-300 shadow-inner">
        {capturedPhoto ? (
          <div className="relative w-full h-full">
            <Image
              src={capturedPhoto}
              alt="Live Selfie Snapshot"
              fill
              className="object-cover"
              unoptimized
            />
            <div className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow">
              ✓ Snapshot Verified
            </div>
          </div>
        ) : isCameraActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {
              if (videoRef.current) {
                videoRef.current.play().catch(() => {})
              }
            }}
            className="w-full h-full object-cover transform -scale-x-100"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 p-6 text-center text-slate-400">
            <div className="w-14 h-14 rounded-full bg-slate-800 flex items-center justify-center text-2xl border border-slate-700">
              📸
            </div>
            <span className="text-xs font-bold text-slate-300">Camera Feed Inactive</span>
            <span className="text-[10px] text-slate-400 max-w-xs">
              Click &quot;Start Camera&quot; below to launch your webcam and capture a live snapshot.
            </span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-2 pt-1">
        {!isCameraActive && !capturedPhoto && (
          <button
            type="button"
            onClick={startCamera}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-1.5"
          >
            <span>📹</span> Start Camera
          </button>
        )}

        {isCameraActive && !capturedPhoto && (
          <>
            <button
              type="button"
              onClick={takeSnapshot}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-1.5"
            >
              <span>📸</span> Capture Photo
            </button>
            <button
              type="button"
              onClick={stopCamera}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs py-2.5 px-3 rounded-xl transition"
            >
              Cancel
            </button>
          </>
        )}

        {capturedPhoto && (
          <button
            type="button"
            onClick={retakePhoto}
            className="flex-1 bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs py-2.5 px-4 rounded-xl transition shadow flex items-center justify-center gap-1.5"
          >
            <span>🔄</span> Retake Photo
          </button>
        )}
      </div>
    </div>
  )
}
