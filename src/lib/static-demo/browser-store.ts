'use client';

import { ensureMemoryState } from '@/lib/data/memory-source';

const STORAGE_KEY = 'pochtashop.static-demo.v1';

interface PersistedShape {
  saved: unknown[];
  history: unknown[];
  consultations: unknown[];
  assistedOrders: unknown[];
  reviews: unknown[];
  changeRequests: unknown[];
  auditLog: unknown[];
  aiLog: unknown[];
  progress: Array<[number, unknown[]]>;
  users: Array<[number, unknown]>;
}

type MemoryState = Record<string, unknown> & {
  progress: Map<number, unknown[]>;
  users: Map<number, unknown>;
};

const globalState = globalThis as typeof globalThis & { __pochtashopState?: MemoryState };

/**
 * On GitHub Pages there is no server, so the in-memory data source lives in the
 * browser and is mirrored to localStorage. Each visitor gets their own copy —
 * this is a demo, not shared storage.
 */
export function loadPersistedState(): void {
  if (typeof window === 'undefined') return;

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return;
  }
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw) as Partial<PersistedShape>;
    // The state is created lazily, so it must be materialised before merging.
    ensureMemoryState();
    const state = globalState.__pochtashopState;
    if (!state) return;

    for (const key of [
      'saved',
      'history',
      'consultations',
      'assistedOrders',
      'reviews',
      'changeRequests',
      'auditLog',
      'aiLog',
    ] as const) {
      const value = parsed[key];
      if (Array.isArray(value)) state[key] = value;
    }

    if (Array.isArray(parsed.progress)) {
      state.progress = new Map(parsed.progress as Array<[number, unknown[]]>);
    }
    if (Array.isArray(parsed.users)) {
      state.users = new Map(parsed.users as Array<[number, unknown]>);
    }
  } catch {
    // Corrupted payload: fall back to the pristine demo state.
  }
}

export function persistState(): void {
  if (typeof window === 'undefined') return;
  const state = globalState.__pochtashopState;
  if (!state) return;

  const snapshot: PersistedShape = {
    saved: (state.saved as unknown[]) ?? [],
    history: (state.history as unknown[]) ?? [],
    consultations: (state.consultations as unknown[]) ?? [],
    assistedOrders: (state.assistedOrders as unknown[]) ?? [],
    reviews: (state.reviews as unknown[]) ?? [],
    changeRequests: (state.changeRequests as unknown[]) ?? [],
    auditLog: (state.auditLog as unknown[]) ?? [],
    aiLog: (state.aiLog as unknown[]) ?? [],
    progress: Array.from(state.progress?.entries() ?? []),
    users: Array.from(state.users?.entries() ?? []),
  };

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    // Quota or private mode: the session still works, it just will not persist.
  }
}

export function resetPersistedState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
  delete globalState.__pochtashopState;
}
