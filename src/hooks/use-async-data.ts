'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/lib/api/client';

export type AsyncStatus = 'loading' | 'ready' | 'error' | 'offline';

export interface AsyncState<T> {
  data: T | null;
  status: AsyncStatus;
  error: string;
  reload: () => void;
  setData: (value: T | null) => void;
}

function statusFor(error: unknown): AsyncStatus {
  if (error instanceof ApiError && (error.code === 'offline' || error.code === 'network')) {
    return 'offline';
  }
  return 'error';
}

/**
 * Loads data on mount and exposes loading/error/offline states.
 *
 * State is only ever written from the promise callbacks, never synchronously
 * inside the effect body, which keeps renders from cascading.
 */
export function useAsyncData<T>(fetcher: () => Promise<T>, deps: unknown[] = []): AsyncState<T> {
  const [data, setData] = useState<T | null>(null);
  const [status, setStatus] = useState<AsyncStatus>('loading');
  const [error, setError] = useState('');
  const [nonce, setNonce] = useState(0);

  const fetcherRef = useRef(fetcher);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  useEffect(() => {
    let cancelled = false;

    fetcherRef
      .current()
      .then((result) => {
        if (cancelled) return;
        setData(result);
        setStatus('ready');
        setError('');
      })
      .catch((caught: unknown) => {
        if (cancelled) return;
        setStatus(statusFor(caught));
        setError(caught instanceof Error ? caught.message : "Ma'lumotni yuklab bo'lmadi.");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce, ...deps]);

  const reload = useCallback(() => setNonce((value) => value + 1), []);

  return { data, status, error, reload, setData };
}
