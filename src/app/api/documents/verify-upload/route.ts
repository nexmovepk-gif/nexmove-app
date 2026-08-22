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

// Local OCR timeout budget (10.0s)
const OCR_TIMEOUT_MS = 10000;

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
    const clientExtractedText = (formData.get('clientExtractedText') as string | null) || '';

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          isValid: false,
          score: 0,
          verifiedScore: 0,
          error: 'No document file provided for verification.',
        },
        { status: 400 }
      );
    }

    fileName = file.name || 'document.jpg';
    fileType = file.type || 'application/octet-stream';

    // 1. File Type / MIME validation
    if (!isValidDocumentMime(fileType, fileName)) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          isValid: false,
          score: 0,
          verifiedScore: 0,
          error: 'Invalid Document Structure Uploaded',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          isValid: false,
          score: 0,
          verifiedScore: 0,
          error: 'Invalid Document Structure Uploaded',
        },
        { status: 400 }
      );
    }

    // 2. Buffer String Extraction
    const fastBufferText = extractBufferStrings(buffer);

    // 3. Combine with Client-side OCR if available
    let ocrText = `${fastBufferText} ${clientExtractedText}`.trim();
    const isImage =
      fileType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileName);

    // If client didn't extract text or was empty, attempt server OCR
    if (isImage && clientExtractedText.trim().length < 15) {
      try {
        const ocrRace = (async (): Promise<string> => {
          let worker = null;
          try {
            worker = await createWorker('eng');
            const result = await worker.recognize(buffer as Buffer);
            return result.data.text || '';
          } finally {
            if (worker) {
              try {
                await worker.terminate();
              } catch {
                // worker cleanup
              }
            }
          }
        })();

        const timeout = new Promise<string>((resolve) =>
          setTimeout(() => resolve(''), OCR_TIMEOUT_MS)
        );

        const recognized = await Promise.race([ocrRace, timeout]);
        if (recognized) {
          ocrText = `${ocrText} ${recognized}`.trim();
        }
      } catch (ocrErr) {
        console.warn('[Local OCR] Server OCR fallback utilized:', ocrErr);
      }
    }

    // 4. Strict Signature Verification Analysis
    const analysis = analyzeDocumentContent(ocrText, fileName);

    // 5. IF ZERO signatures match: Return HTTP 400 with { valid: false, score: 0 }
    if (!analysis.isValid || analysis.score === 0) {
      return NextResponse.json(
        {
          success: false,
          valid: false,
          isValid: false,
          score: 0,
          verifiedScore: 0,
          error: 'Invalid Document Structure Uploaded',
          errorMessage: 'Invalid Document Structure Uploaded',
          documentType: 'INVALID',
          documentTypeLabel: 'Invalid Document',
          extractedParams: analysis.extractedParams,
        },
        { status: 400 }
      );
    }

    // 6. IF MATCHED: Upload to Supabase Storage and Return 200 with dynamic score
    const uploadResult = await uploadPropertyDocument(buffer, fileName, fileType);

    return NextResponse.json(
      {
        success: true,
        valid: true,
        isValid: true,
        score: analysis.score,
        verifiedScore: analysis.verifiedScore,
        confidence: analysis.confidence,
        documentType: analysis.documentType,
        documentTypeLabel: analysis.documentTypeLabel,
        extractedParams: analysis.extractedParams,
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath,
        bucket: uploadResult.bucket,
        message: `Document verified successfully as ${analysis.documentTypeLabel}.`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('[Verify Document API] Processing error:', error);
    return NextResponse.json(
      {
        success: false,
        valid: false,
        isValid: false,
        score: 0,
        verifiedScore: 0,
        error:
          error instanceof Error
            ? error.message
            : 'Invalid Document Structure Uploaded',
      },
      { status: 400 }
    );
  }
}
