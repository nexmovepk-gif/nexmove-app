// src/app/api/documents/verify-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { uploadPropertyDocument } from '@/lib/supabaseStorage';
import { analyzeDocumentContent, extractBufferStrings } from '@/lib/documentValidation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Maximum execution timeout for OCR worker to avoid Vercel function timeout (1.5 seconds)
const OCR_TIMEOUT_MS = 1500;

function isValidDocumentMime(fileType: string, fileName: string): boolean {
  const validMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'image/tiff',
    'image/bmp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  if (validMimes.includes(fileType.toLowerCase())) return true;
  return /\.(jpe?g|png|webp|pdf|docx?|tiff?|bmp)$/i.test(fileName);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          error: 'No document file provided for verification.',
        },
        { status: 400 }
      );
    }

    const fileName = file.name || 'document.jpg';
    const fileType = file.type || 'application/octet-stream';

    // 1. Fast Header / MIME Type Validation
    if (!isValidDocumentMime(fileType, fileName)) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          error: 'Invalid document format. Please upload a PDF, JPEG, PNG, or WEBP document.',
        },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length === 0) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          error: 'Uploaded document file is empty.',
        },
        { status: 400 }
      );
    }

    // 2. Fast String Extraction from Buffer (Milliseconds)
    const fastBufferText = extractBufferStrings(buffer);

    // 3. Fast OCR with strict 1.5s timeout (Safe on Serverless / Vercel)
    let ocrText = fastBufferText;
    const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileName);

    if (isImage && buffer.length > 0) {
      try {
        const ocrPromise = (async () => {
          let worker = null;
          try {
            worker = await createWorker('eng');
            const ret = await worker.recognize(buffer);
            return ret.data.text || '';
          } finally {
            if (worker) {
              try {
                await worker.terminate();
              } catch {
                // ignore
              }
            }
          }
        })();

        const timeoutPromise = new Promise<string>((resolve) =>
          setTimeout(() => resolve(''), OCR_TIMEOUT_MS)
        );

        const recognizedText = await Promise.race([ocrPromise, timeoutPromise]);
        if (recognizedText) {
          ocrText = `${ocrText} ${recognizedText}`;
        }
      } catch (ocrErr) {
        console.warn('[OCR Engine] Fast fallback used:', ocrErr);
      }
    }

    // 4. Analyze Document Content & Structure
    const analysis = analyzeDocumentContent(ocrText, fileName);

    // If invalid structure (e.g. car, van, random photo, non-document): Return HTTP 400
    if (!analysis.isValid) {
      return NextResponse.json(
        {
          success: false,
          isValid: false,
          verifiedScore: 0,
          error: 'Invalid document structure uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
          errorMessage: 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
          documentType: 'INVALID',
          documentTypeLabel: 'Invalid Document',
          extractedParams: analysis.extractedParams,
        },
        { status: 400 }
      );
    }

    // 5. Valid Document: Fast Upload to Supabase Storage 'property-documents' bucket
    const uploadResult = await uploadPropertyDocument(buffer, fileName, fileType);

    return NextResponse.json(
      {
        success: true,
        isValid: true,
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
        isValid: false,
        verifiedScore: 0,
        error: error instanceof Error ? error.message : 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
      },
      { status: 400 }
    );
  }
}
