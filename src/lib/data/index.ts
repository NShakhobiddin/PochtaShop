import { getServerEnv } from '@/lib/env';
import { MemoryDataSource } from './memory-source';
import { SupabaseDataSource } from './supabase-source';
import type { DataSource } from './types';

let instance: DataSource | null = null;

/**
 * Resolves the storage backend once per process. Supabase is used when it is
 * configured; otherwise the app runs on the bundled demo data set.
 */
export function getDataSource(): DataSource {
  if (instance) return instance;
  instance = getServerEnv().isSupabaseConfigured
    ? new SupabaseDataSource()
    : new MemoryDataSource();
  return instance;
}

/** Test helper. */
export function setDataSource(source: DataSource | null): void {
  instance = source;
}

export type { DataSource } from './types';
export { MemoryDataSource } from './memory-source';
