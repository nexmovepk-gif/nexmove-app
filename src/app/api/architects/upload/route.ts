// src/app/api/architects/upload/route.ts
// Handles media upload (images/videos) for Architect posts & profiles

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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

      // Convert file buffer to DataURL / Base64 for instant client rendering
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const base64 = buffer.toString('base64')
      mediaUrl = `data:${file.type};base64,${base64}`
    } else {
      const body = await req.json()
      const { dataUrl, fileType, url } = body

      if (url) {
        mediaUrl = url
        mediaType = url.match(/\.(mp4|webm|ogg)$/i) ? 'video' : 'image'
      } else if (dataUrl) {
        mediaUrl = dataUrl
        mediaType = fileType?.startsWith('video/') ? 'video' : 'image'
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
