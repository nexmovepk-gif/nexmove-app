// src/app/api/architects/upload/route.ts
// Handles media upload (images/videos) for Architect posts & profiles to Supabase Storage CDN

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadPropertyDocument } from '@/lib/supabaseStorage'

export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = req.headers.get('content-type') || ''

    let mediaUrl = ''
    let mediaType: 'image' | 'video' = 'image'

    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      const file = formData.get('file') as File | null

      if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })
      }

      mediaType = file.type.startsWith('video/') ? 'video' : 'image'

      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)

      // Upload to Supabase Storage CDN
      const uploadResult = await uploadPropertyDocument(
        buffer,
        `arch_${Date.now()}_${file.name}`,
        file.type || 'image/jpeg'
      )

      if (uploadResult && uploadResult.fileUrl) {
        mediaUrl = uploadResult.fileUrl
      } else {
        throw new Error(uploadResult?.error || 'Failed to upload to cloud storage')
      }
    } else {
      const body = await req.json()
      const { dataUrl, url } = body

      if (url) {
        mediaUrl = url
        mediaType = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'
      } else if (dataUrl && dataUrl.startsWith('data:')) {
        // Convert Base64 dataUrl to buffer and upload to Supabase Storage
        const commaIdx = dataUrl.indexOf(',')
        const mimeMatch = dataUrl.match(/^data:([^;]+);base64,/)
        const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg'
        const base64Data = commaIdx > -1 ? dataUrl.slice(commaIdx + 1) : dataUrl
        const buffer = Buffer.from(base64Data, 'base64')
        mediaType = mime.startsWith('video/') ? 'video' : 'image'

        const uploadResult = await uploadPropertyDocument(
          buffer,
          `arch_${Date.now()}.${mime.split('/')[1] || 'jpg'}`,
          mime
        )
        mediaUrl = uploadResult.fileUrl
      } else {
        return NextResponse.json({ error: 'Missing file payload' }, { status: 400 })
      }
    }

    return NextResponse.json({
      success: true,
      url: mediaUrl,
      type: mediaType,
    })
  } catch (error) {
    console.error('[Architect Upload POST] Error:', error)
    return NextResponse.json({ error: 'Failed to upload media file' }, { status: 500 })
  }
}
