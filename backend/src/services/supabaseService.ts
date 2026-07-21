import { createClient, SupabaseClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

export const DOCS_BUCKET = process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents';
export const PROFILES_BUCKET = process.env.SUPABASE_PROFILES_BUCKET || 'profile-images';

let supabaseClient: SupabaseClient | null = null;

const isPlaceholder = (val: string) => {
  if (!val) return true;
  return val.includes('your-supabase-project') || val.includes('your-supabase-anon') || val === 'placeholder';
};

if (SUPABASE_URL && SUPABASE_KEY && !isPlaceholder(SUPABASE_URL) && !isPlaceholder(SUPABASE_KEY)) {
  try {
    supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);
    console.log('[SupabaseService] Initialized Supabase client successfully.');
  } catch (error) {
    console.error('[SupabaseService] Failed to initialize Supabase client:', error);
  }
} else {
  console.warn('[SupabaseService] SUPABASE_URL or SUPABASE_KEY not set or using placeholders. Supabase Storage uploads will fall back to local URLs.');
}

export const isSupabaseConfigured = (): boolean => {
  return supabaseClient !== null;
};

export interface UploadOptions {
  buffer?: Buffer;
  filePath?: string;
  fileName: string;
  mimeType: string;
  bucket: string;
}

/**
 * Upload a file (buffer or file path) to Supabase Storage bucket.
 * Returns the public URL of the uploaded object.
 * If Supabase is not configured or fails, falls back gracefully to local server URL format.
 */
export const uploadFileToSupabase = async (options: UploadOptions): Promise<string> => {
  const { buffer, filePath, fileName, mimeType, bucket } = options;

  let fileContent: Buffer;
  if (buffer) {
    fileContent = buffer;
  } else if (filePath && fs.existsSync(filePath)) {
    fileContent = fs.readFileSync(filePath);
  } else {
    throw new Error('No valid buffer or filePath provided for Supabase upload');
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
  const uniqueKey = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${sanitizedFileName}`;

  if (supabaseClient) {
    try {
      console.log(`[SupabaseStorage] Uploading ${uniqueKey} to bucket "${bucket}"...`);
      const { data, error } = await supabaseClient.storage
        .from(bucket)
        .upload(uniqueKey, fileContent, {
          contentType: mimeType,
          upsert: true
        });

      if (error) {
        console.error(`[SupabaseStorage] Error uploading to bucket "${bucket}":`, error.message);
        throw error;
      }

      const { data: publicUrlData } = supabaseClient.storage
        .from(bucket)
        .getPublicUrl(uniqueKey);

      if (publicUrlData && publicUrlData.publicUrl) {
        console.log(`[SupabaseStorage] Successfully uploaded. Public URL: ${publicUrlData.publicUrl}`);
        return publicUrlData.publicUrl;
      }
    } catch (err: any) {
      console.error(`[SupabaseStorage] Upload failed: ${err?.message || err}. Falling back to local storage URL.`);
    }
  }

  // Fallback if Supabase is not configured or failed
  const fallbackUrl = `/uploads/${path.basename(filePath || fileName)}`;
  console.log(`[SupabaseStorage] Using fallback URL: ${fallbackUrl}`);
  return fallbackUrl;
};
