'use client';

import { useCallback, useSyncExternalStore } from 'react';

const CHANGE_EVENT = 'pochtashop:flag-change';

function subscribe(callback: () => void): () => void {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener('storage', callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener('storage', callback);
  };
}

/**
 * Boolean flag backed by localStorage, read through useSyncExternalStore so
 * the value is available on the first client render without an effect.
 * Returns `null` until the store has been read (i.e. during SSR).
 */
export function usePersistentFlag(key: string): [boolean | null, (value: boolean) => void] {
  const getSnapshot = useCallback((): boolean => {
    try {
      return window.localStorage.getItem(key) === 'true';
    } catch {
      // Private mode / storage disabled: treat the flag as unset.
      return false;
    }
  }, [key]);

  const getServerSnapshot = useCallback((): boolean | null => null, []);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setValue = useCallback(
    (next: boolean) => {
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Ignore: the UI still updates for this session.
      }
      window.dispatchEvent(new Event(CHANGE_EVENT));
    },
    [key],
  );

  return [value, setValue];
}
