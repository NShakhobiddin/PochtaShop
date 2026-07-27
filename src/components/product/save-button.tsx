'use client';

import * as React from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import type { SavedItemKind } from '@/types';
import { apiFetch } from '@/lib/api/client';
import { haptic } from '@/lib/telegram/webapp';
import { cn } from '@/lib/utils';

export function SaveButton({
  kind,
  refId,
  title,
  subtitle,
  className,
}: {
  kind: SavedItemKind;
  refId: string;
  title: string;
  subtitle?: string;
  className?: string;
}) {
  const [saved, setSaved] = React.useState(false);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');

  async function save() {
    if (saved || pending) return;
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/saved', { json: { kind, refId, title, subtitle } });
      setSaved(true);
      haptic('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Saqlanmadi.');
      haptic('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col items-center', className)}>
      <button
        type="button"
        onClick={save}
        disabled={pending}
        aria-pressed={saved}
        aria-label={saved ? 'Saqlangan' : 'Saqlash'}
        className={cn(
          'flex h-12 w-12 items-center justify-center rounded-sm border transition-colors',
          saved ? 'border-primary bg-primary-light text-primary' : 'border-border bg-surface text-content-secondary',
        )}
      >
        {saved ? (
          <BookmarkCheck className="h-5 w-5" aria-hidden="true" />
        ) : (
          <Bookmark className="h-5 w-5" aria-hidden="true" />
        )}
      </button>
      {error ? <span className="mt-1 text-[11px] text-danger">{error}</span> : null}
    </div>
  );
}
