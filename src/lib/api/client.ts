import { getCurrentInitData } from '@/features/telegram-auth/telegram-provider';

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const OFFLINE_MESSAGE =
  "Internet aloqasi talab qilinadi. Ulanishni tekshirib, qayta urinib ko'ring.";

interface ApiResponseShape {
  ok?: boolean;
  error?: { message?: string; code?: string };
  data?: unknown;
}

/**
 * All Mini App requests go through here so the verified Telegram initData is
 * attached to every call — the server trusts nothing else.
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, headers, ...rest } = options;

  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    throw new ApiError(OFFLINE_MESSAGE, 0, 'offline');
  }

  let response: Response;
  try {
    response = await fetch(path, {
      ...rest,
      method: rest.method ?? (json ? 'POST' : 'GET'),
      headers: {
        ...(json ? { 'Content-Type': 'application/json' } : {}),
        'x-telegram-init-data': getCurrentInitData(),
        ...headers,
      },
      body: json ? JSON.stringify(json) : rest.body,
    });
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0, 'network');
  }

  let payload: ApiResponseShape = {};
  try {
    payload = (await response.json()) as ApiResponseShape;
  } catch {
    if (!response.ok) throw new ApiError("So'rov bajarilmadi.", response.status);
  }

  if (!response.ok || payload.ok === false) {
    throw new ApiError(
      payload.error?.message ?? "So'rov bajarilmadi.",
      response.status,
      payload.error?.code,
    );
  }

  return payload.data as T;
}
