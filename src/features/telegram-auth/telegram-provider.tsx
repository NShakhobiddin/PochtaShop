'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { getWebApp, type TelegramWebApp } from '@/lib/telegram/webapp';
import type { TelegramUser } from '@/types';

interface TelegramContextValue {
  ready: boolean;
  insideTelegram: boolean;
  initData: string;
  user: TelegramUser | null;
  colorScheme: 'light' | 'dark';
}

const TelegramContext = React.createContext<TelegramContextValue>({
  ready: false,
  insideTelegram: false,
  initData: '',
  user: null,
  colorScheme: 'light',
});

function mapUser(webApp: TelegramWebApp): TelegramUser | null {
  const raw = webApp.initDataUnsafe.user;
  if (!raw) return null;
  return {
    id: raw.id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    username: raw.username,
    languageCode: raw.language_code,
    photoUrl: raw.photo_url,
    isPremium: raw.is_premium,
  };
}

/** Keeps the initData available to the fetch layer without prop drilling. */
let currentInitData = '';
export function getCurrentInitData(): string {
  return currentInitData;
}

const BROWSER_VALUE: TelegramContextValue = {
  ready: true,
  insideTelegram: false,
  initData: '',
  user: null,
  colorScheme: 'light',
};

const SERVER_VALUE: TelegramContextValue = {
  ready: false,
  insideTelegram: false,
  initData: '',
  user: null,
  colorScheme: 'light',
};

let snapshot: TelegramContextValue | null = null;

/**
 * The Telegram WebApp object is injected once by the client and never changes,
 * so the snapshot is computed lazily and cached — `useSyncExternalStore` then
 * gives components the value on their first client render.
 */
function getClientSnapshot(): TelegramContextValue {
  if (snapshot) return snapshot;
  const webApp = getWebApp();
  snapshot = webApp
    ? {
        ready: true,
        insideTelegram: true,
        initData: webApp.initData,
        user: mapUser(webApp),
        colorScheme: webApp.colorScheme,
      }
    : BROWSER_VALUE;
  currentInitData = snapshot.initData;
  return snapshot;
}

function getServerSnapshot(): TelegramContextValue {
  return SERVER_VALUE;
}

function subscribeToWebApp(): () => void {
  // Nothing to subscribe to: the object is stable for the session.
  return () => {};
}

export function TelegramProvider({ children }: { children: React.ReactNode }) {
  const value = React.useSyncExternalStore(subscribeToWebApp, getClientSnapshot, getServerSnapshot);

  React.useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;

    webApp.ready();
    webApp.expand();
    // The app ships a light theme; keep the Telegram chrome consistent with it.
    try {
      webApp.setHeaderColor('#F8FAFC');
      webApp.setBackgroundColor('#F8FAFC');
    } catch {
      // Older clients do not support colour overrides.
    }
  }, []);

  return <TelegramContext.Provider value={value}>{children}</TelegramContext.Provider>;
}

export function useTelegram(): TelegramContextValue {
  return React.useContext(TelegramContext);
}

/**
 * Wires the native Telegram back button to Next.js history. Root routes hide
 * the button so users can close the app the usual way.
 */
export function TelegramBackButton({ rootPaths }: { rootPaths: string[] }) {
  const router = useRouter();
  const pathname = usePathname();

  React.useEffect(() => {
    const webApp = getWebApp();
    if (!webApp) return;

    const isRoot = rootPaths.includes(pathname);
    const handler = () => router.back();

    if (isRoot) {
      webApp.BackButton.hide();
      return;
    }

    webApp.BackButton.onClick(handler);
    webApp.BackButton.show();
    return () => {
      webApp.BackButton.offClick(handler);
      webApp.BackButton.hide();
    };
  }, [pathname, rootPaths, router]);

  return null;
}
