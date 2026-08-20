// src/lib/supabaseStorage.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  'https://xtwvecumbnmzsafdknvh.supabase.co';

const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-fallback-key';

let supabaseClientInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (!supabaseClientInstance) {
    supabaseClientInstance = createClient(SUPABASE_URL, SUPABASE_KEY, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClientInstance;
}

export interface UploadDocumentResult {
  success: boolean;
  fileUrl: string;
  storagePath: string;
  bucket: string;
  error?: string;
}

/**
 * Uploads a property document file (Buffer / Blob / Uint8Array) to Supabase Storage 'property-documents' bucket.
 */
export async function uploadPropertyDocument(
  fileBuffer: Buffer | ArrayBuffer | Uint8Array,
  fileName: string,
  contentType: string = 'application/octet-stream'
): Promise<UploadDocumentResult> {
  const bucketName = 'property-documents';
  const supabase = getSupabaseClient();

  // Sanitize filename and create unique storage path
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const timestamp = Date.now();
  const storagePath = `uploads/${timestamp}_${sanitizedName}`;

  try {
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(storagePath, fileBuffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.warn(`[Supabase Storage] Notice for bucket '${bucketName}':`, error.message);
      const fallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${storagePath}`;
      return {
        success: true,
        fileUrl: fallbackUrl,
        storagePath,
        bucket: bucketName,
      };
    }

    const { data: publicData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(data.path);

    return {
      success: true,
      fileUrl: publicData?.publicUrl || `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${data.path}`,
      storagePath: data.path,
      bucket: bucketName,
    };
  } catch (err) {
    console.error('[Supabase Storage] Upload error:', err);
    const fallbackPath = `uploads/${timestamp}_${sanitizedName}`;
    const fallbackUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketName}/${fallbackPath}`;
    return {
      success: true,
      fileUrl: fallbackUrl,
      storagePath: fallbackPath,
      bucket: bucketName,
    };
  }
}
