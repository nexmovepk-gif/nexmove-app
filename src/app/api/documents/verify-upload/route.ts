// src/app/api/documents/verify-upload/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createWorker } from 'tesseract.js';
import { uploadPropertyDocument } from '@/lib/supabaseStorage';
import { analyzeDocumentContent } from '@/lib/documentValidation';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No document file provided for verification.',
          isValid: false,
          verifiedScore: 0,
        },
        { status: 400 }
      );
    }

    const fileName = file.name || 'document.jpg';
    const fileType = file.type || 'application/octet-stream';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 1. Upload to Supabase Storage 'property-documents' bucket
    const uploadResult = await uploadPropertyDocument(buffer, fileName, fileType);

    // 2. Perform OCR Text Extraction
    let ocrText = '';
    const isImage = fileType.startsWith('image/') || /\.(png|jpe?g|webp|bmp|tiff)$/i.test(fileName);

    if (isImage && buffer.length > 0) {
      let worker = null;
      try {
        worker = await createWorker('eng');
        const ret = await worker.recognize(buffer);
        ocrText = ret.data.text || '';
      } catch (ocrErr) {
        console.warn('[OCR Engine] Tesseract recognition fallback:', ocrErr);
      } finally {
        if (worker) {
          try {
            await worker.terminate();
          } catch {
            // ignore termination errors
          }
        }
      }
    }

    // 3. Analyze Extracted Content & Validate Structure
    const analysis = analyzeDocumentContent(ocrText, fileName);

    if (!analysis.isValid) {
      return NextResponse.json({
        success: true,
        isValid: false,
        verifiedScore: 0,
        errorMessage: 'Invalid document uploaded. Please upload an Allotment Letter, CNIC, or Registry.',
        fileUrl: uploadResult.fileUrl,
        storagePath: uploadResult.storagePath,
        bucket: uploadResult.bucket,
        documentType: 'INVALID',
        documentTypeLabel: 'Invalid Document',
        extractedParams: analysis.extractedParams,
        ocrSnippet: ocrText.slice(0, 150),
      });
    }

    return NextResponse.json({
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
      ocrSnippet: ocrText.slice(0, 150),
      message: `Document verified successfully as ${analysis.documentTypeLabel}.`,
    });
  } catch (error) {
    console.error('[Verify Document API] Unexpected error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal error processing document verification',
        isValid: false,
        verifiedScore: 0,
      },
      { status: 500 }
    );
  }
}
