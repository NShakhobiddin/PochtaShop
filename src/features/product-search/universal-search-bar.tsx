'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Link2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';
import { track } from '@/lib/analytics';

export interface UniversalSearchBarProps {
  className?: string;
  defaultValue?: string;
  autoFocus?: boolean;
}

/**
 * Entry point of the whole product flow: free text, an image/screenshot, or a
 * store link — all three land on the same search screen.
 */
export function UniversalSearchBar({ className, defaultValue = '', autoFocus }: UniversalSearchBarProps) {
  const router = useRouter();
  const [value, setValue] = React.useState(defaultValue);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const query = value.trim();
    if (!query) return;
    const isLink = /^https?:\/\//i.test(query);
    track('search_started', { mode: isLink ? 'link' : 'text' });
    if (isLink) track('link_analyzed', { host: safeHost(query) });
    haptic('light');
    router.push(`/search?q=${encodeURIComponent(query)}`);
  }

  async function pasteFromClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setValue(text.trim());
        haptic('success');
      }
    } catch {
      // Clipboard permission denied — the user can still paste manually.
      haptic('warning');
    }
  }

  function onFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    track('image_uploaded', { source: 'search_bar' });
    // The file itself is handed to the AI screen, which uploads and then
    // discards it; nothing is stored here.
    const url = URL.createObjectURL(file);
    sessionStorage.setItem('pochtashop.pendingImageName', file.name);
    sessionStorage.setItem('pochtashop.pendingImageUrl', url);
    router.push('/ai?source=image');
  }

  return (
    <form onSubmit={submit} className={cn('relative', className)} role="search">
      <label htmlFor="universal-search" className="sr-only">
        Mahsulot nomini yozing yoki havola yuboring
      </label>
      <div className="flex items-center gap-1 rounded-md border border-border bg-surface p-1.5 shadow-card">
        <Search className="ml-2 h-5 w-5 shrink-0 text-content-secondary" aria-hidden="true" />
        <input
          id="universal-search"
          value={value}
          autoFocus={autoFocus}
          onChange={(event) => setValue(event.target.value)}
          placeholder="Mahsulot nomini yozing yoki havola yuboring"
          className="h-11 min-w-0 flex-1 bg-transparent text-[15px] text-content outline-none placeholder:text-content-secondary/80"
          enterKeyHint="search"
        />
        <span className="mx-1 h-6 w-px bg-border" aria-hidden="true" />
        <button
          type="button"
          aria-label="Rasm yuklash"
          onClick={() => fileInputRef.current?.click()}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-content-secondary hover:bg-surface-muted"
        >
          <Camera className="h-5 w-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          aria-label="Havolani clipboarddan olish"
          onClick={pasteFromClipboard}
          className="flex h-11 w-11 items-center justify-center rounded-sm text-content-secondary hover:bg-surface-muted"
        >
          <Link2 className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={onFileSelected}
      />
    </form>
  );
}

function safeHost(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return 'unknown';
  }
}
