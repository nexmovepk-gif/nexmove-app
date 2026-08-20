// src/app/api/documents/verify-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { uploadPropertyDocument } from '@/lib/supabaseStorage';
import {
  analyzeDocumentContent,
  extractBufferStrings,
} from '@/lib/documentValidation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// OCR budget: 2 s on Vercel hobby / edge environments
const OCR_TIMEOUT_MS = 2000;

const VALID_MIMES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/tiff',
  'image/bmp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

function isValidDocumentMime(fileType: string, fileName: string): boolean {
  if (VALID_MIMES.has(fileType.toLowerCase())) return true;
  return /\.(jpe?g|png|webp|pdf|docx?|tiff?|bmp)$/i.test(fileName);
}

// ─── POST /api/documents/verify-upload ───────────────────────────────────────

export async function POST(req: NextRequest) {
  let buffer: Buffer | null = null;
  let fileType = 'application/octet-stream';
  let fileName = 'document.jpg';

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, isValid: false, verifiedScore: 0, error: 'No document file provided.' },
        { status: 400 }
      );
    }

    fileName = file.name || 'document.jpg';
    fileType = file.type || 'application/octet-stream';

    // 1. MIME / extension guard
    if (!isValidDocumentMime(fileType, fileName)) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          error: 'Invalid file type. Please upload a PDF, JPEG, PNG, or WEBP document.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        { success: false, isValid: false, verifiedScore: 0, error: 'Uploaded file is empty.' },
        { status: 400 }
      );
    }

    // 2. Fast string extraction from raw buffer (milliseconds, language-agnostic)
    const fastBufferText = extractBufferStrings(buffer);

    // 3. Timed OCR for images only
    let ocrText = fastBufferText;
    const isImage =
      fileType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileName);

    if (isImage) {
      try {
        const ocrRace = (async (): Promise<string> => {
          let worker = null;
          try {
            worker = await createWorker('eng');
            const result = await worker.recognize(buffer as Buffer);
            return result.data.text || '';
          } finally {
            if (worker) {
              try { await worker.terminate(); } catch { /* ignore */ }
            }
          }
        })();

        const timeout = new Promise<string>((resolve) =>
          setTimeout(() => resolve(''), OCR_TIMEOUT_MS)
        );

        const recognized = await Promise.race([ocrRace, timeout]);
        if (recognized) ocrText = `${ocrText} ${recognized}`;
      } catch (ocrErr) {
        console.warn('[OCR] Fallback to buffer heuristic:', ocrErr);
      }
    }

    // 4. Analysis — pass fileMime & formatVerified so the library can apply 80% fallback
    const formatVerified = isValidDocumentMime(fileType, fileName);
    const analysis = analyzeDocumentContent(ocrText, fileName, fileType, formatVerified);

    // 5. Invalid document → 400
    if (!analysis.isValid) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          score: 0,
          error: 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
          errorMessage:
            analysis.errorMessage ||
            'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
          documentType: 'INVALID',
          documentTypeLabel: 'Invalid Document',
          extractedParams: analysis.extractedParams,
        },
        { status: 400 }
      );
    }

    // 6. Upload valid document to Supabase Storage
    const uploadResult = await uploadPropertyDocument(buffer, fileName, fileType);

    return NextResponse.json(
      {
        success: true,
        isValid: true,
        verifiedScore: analysis.verifiedScore,
        score: analysis.verifiedScore,
        confidence: analysis.confidence,
        fallback: analysis.fallback ?? false,
        documentType: analysis.documentType,
        documentTypeLabel: analysis.documentTypeLabel,
        extractedParams: analysis.extractedParams,
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath,
        bucket: uploadResult.bucket,
        message: `Document verified successfully as ${analysis.documentTypeLabel}.${
          analysis.fallback
            ? ' (Fallback score applied — document may be compressed or blurry.)'
            : ''
        }`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify Document API] Error:', error);
    return NextResponse.json(
      {
        success: false,
        isValid: false,
        verifiedScore: 0,
        score: 0,
        error:
          error instanceof Error
            ? error.message
            : 'Document verification failed. Please upload an Allotment Letter, CNIC, or Registry.',
      },
      { status: 400 }
    );
  }
}
