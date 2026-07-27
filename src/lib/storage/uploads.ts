import 'server-only';
import { getServerEnv } from '@/lib/env';
import { getSupabaseAdmin } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';
import { uid } from '@/lib/utils';

export interface StoredUpload {
  key: string;
  /** Base64 payload handed to the AI provider; never written to disk locally. */
  data: string;
  mimeType: string;
  fileName: string;
}

/**
 * Uploaded images are transient by contract: they exist only for the duration
 * of one AI analysis and are deleted immediately afterwards. When Supabase
 * Storage is configured the object is created and then removed; otherwise the
 * bytes stay in request memory and are never persisted at all.
 */
export async function storeTemporaryUpload(file: File): Promise<StoredUpload> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const data = buffer.toString('base64');
  const key = `tmp/${uid('upload')}`;
  const env = getServerEnv();

  if (env.isSupabaseConfigured) {
    try {
      await getSupabaseAdmin()
        .storage.from(env.SUPABASE_UPLOAD_BUCKET)
        .upload(key, buffer, { contentType: file.type, upsert: true });
    } catch (error) {
      // Analysis can still proceed from the in-memory copy.
      logger.warn('uploads:store_failed', error);
    }
  }

  return { key, data, mimeType: file.type, fileName: file.name };
}

/** Removes the temporary object. Called in a finally block, always. */
export async function deleteTemporaryUpload(key: string): Promise<void> {
  const env = getServerEnv();
  if (!env.FILE_DELETE_AFTER_ANALYSIS) {
    logger.warn('uploads:retention_disabled', { key });
    return;
  }
  if (!env.isSupabaseConfigured) return;

  try {
    await getSupabaseAdmin().storage.from(env.SUPABASE_UPLOAD_BUCKET).remove([key]);
  } catch (error) {
    logger.error('uploads:delete_failed', error);
  }
}
