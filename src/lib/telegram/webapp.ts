/** Minimal typing of the parts of the Telegram WebApp API the app uses. */
export interface TelegramWebApp {
  initData: string;
  initDataUnsafe: {
    user?: {
      id: number;
      first_name: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
      is_premium?: boolean;
    };
    start_param?: string;
  };
  colorScheme: 'light' | 'dark';
  themeParams: Record<string, string>;
  viewportStableHeight: number;
  isExpanded: boolean;
  ready(): void;
  expand(): void;
  close(): void;
  setHeaderColor(color: string): void;
  setBackgroundColor(color: string): void;
  openLink(url: string, options?: { try_instant_view?: boolean }): void;
  openTelegramLink(url: string): void;
  BackButton: {
    isVisible: boolean;
    show(): void;
    hide(): void;
    onClick(handler: () => void): void;
    offClick(handler: () => void): void;
  };
  MainButton: {
    text: string;
    isVisible: boolean;
    show(): void;
    hide(): void;
    setText(text: string): void;
    onClick(handler: () => void): void;
    offClick(handler: () => void): void;
  };
  HapticFeedback: {
    impactOccurred(style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft'): void;
    notificationOccurred(type: 'error' | 'success' | 'warning'): void;
    selectionChanged(): void;
  };
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebApp };
  }
}

export function getWebApp(): TelegramWebApp | null {
  if (typeof window === 'undefined') return null;
  return window.Telegram?.WebApp ?? null;
}

export function haptic(
  kind: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection',
): void {
  const webApp = getWebApp();
  if (!webApp) return;
  try {
    if (kind === 'selection') {
      webApp.HapticFeedback.selectionChanged();
    } else if (kind === 'success' || kind === 'warning' || kind === 'error') {
      webApp.HapticFeedback.notificationOccurred(kind);
    } else {
      webApp.HapticFeedback.impactOccurred(kind);
    }
  } catch {
    // Haptics are a progressive enhancement; older clients simply lack them.
  }
}

/** Opens an external store/courier link through Telegram when available. */
export function openExternal(url: string): void {
  const webApp = getWebApp();
  if (webApp) {
    if (url.includes('t.me/')) webApp.openTelegramLink(url);
    else webApp.openLink(url);
    return;
  }
  if (typeof window !== 'undefined') window.open(url, '_blank', 'noopener,noreferrer');
}
