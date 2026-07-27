'use client';

import * as React from 'react';
import { TriangleAlert, Upload } from 'lucide-react';
import type { ScreenshotAnalysis } from '@/types';
import { Sheet } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfidenceBadge } from '@/components/ai/confidence-badge';
import { Progress } from '@/components/ui/misc';
import { validateUploadedFile } from '@/lib/validation/schemas';
import { apiFetch } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';

type Status = 'idle' | 'uploading' | 'ready' | 'error';

/**
 * Uploads a store screenshot for analysis. The file is sent, analysed and
 * deleted server-side; nothing is kept in the client either.
 */
export function ScreenshotAssistant({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = React.useState<Status>('idle');
  const [progress, setProgress] = React.useState(0);
  const [error, setError] = React.useState('');
  const [analysis, setAnalysis] = React.useState<ScreenshotAnalysis | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const validation = validateUploadedFile(
      { name: file.name, type: file.type, size: file.size },
      'image',
    );
    if (!validation.ok) {
      setError(validation.error ?? "Fayl qabul qilinmadi.");
      setStatus('error');
      haptic('error');
      return;
    }

    setStatus('uploading');
    setProgress(15);
    setError('');
    track('image_uploaded', { source: 'screenshot_assistant' });

    const body = new FormData();
    body.append('file', file);

    const ticker = window.setInterval(() => {
      setProgress((value) => Math.min(90, value + 12));
    }, 300);

    try {
      const result = await apiFetch<ScreenshotAnalysis>('/api/ai/screenshot', {
        method: 'POST',
        body,
      });
      setAnalysis(result);
      setProgress(100);
      setStatus('ready');
      haptic('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Tahlil bajarilmadi.");
      setStatus('error');
      haptic('error');
    } finally {
      window.clearInterval(ticker);
    }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Screenshot yordamchisi">
      <div className="space-y-4">
        <p className="text-[13px] leading-snug text-content-secondary">
          Xorijiy internet-do&apos;kon sahifasining screenshotini yuklang. Tahlildan so&apos;ng fayl
          avtomatik o&apos;chiriladi.
        </p>

        {status === 'uploading' ? (
          <div className="space-y-2">
            <Progress value={progress} label="Yuklanmoqda" />
            <p className="text-[13px] text-content-secondary">Tahlil qilinmoqda...</p>
          </div>
        ) : null}

        {status === 'error' ? (
          <p role="alert" className="rounded-sm bg-danger-bg p-3 text-[13px] font-medium text-danger">
            {error}
          </p>
        ) : null}

        {status === 'ready' && analysis ? (
          <div className="space-y-3">
            <ConfidenceBadge confidence={analysis.confidence} />

            <Card className="p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-content-secondary">
                Platforma
              </p>
              <p className="text-[15px] font-bold text-content">{analysis.platform}</p>
              <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-content-secondary">
                Siz hozir qaysi bosqichdasiz
              </p>
              <p className="text-[15px] font-bold text-content">{analysis.stage}</p>
              <p className="mt-1 text-[13px] leading-snug text-content-secondary">
                {analysis.stageExplanation}
              </p>
            </Card>

            <Card className="p-4">
              <p className="text-sm font-bold text-content">Keyingi qadam</p>
              <p className="mt-1 text-[13px] leading-snug text-content-secondary">
                {analysis.nextStep}
              </p>
            </Card>

            {analysis.translatedElements.length > 0 ? (
              <Card className="p-4">
                <p className="text-sm font-bold text-content">Tarjima</p>
                <dl className="mt-2 space-y-1.5">
                  {analysis.translatedElements.map((element) => (
                    <div key={element.original} className="flex justify-between gap-3 text-[13px]">
                      <dt className="text-content-secondary">{element.original}</dt>
                      <dd className="text-right font-medium text-content">{element.translated}</dd>
                    </div>
                  ))}
                </dl>
              </Card>
            ) : null}

            {analysis.warnings.length > 0 ? (
              <Card className="p-4">
                <p className="text-sm font-bold text-warning">Diqqat</p>
                <ul className="mt-2 space-y-2">
                  {analysis.warnings.map((warning) => (
                    <li key={warning} className="flex gap-2 text-[13px] leading-snug text-content-secondary">
                      <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden="true" />
                      {warning}
                    </li>
                  ))}
                </ul>
              </Card>
            ) : null}

            <Button
              variant="outline"
              block
              onClick={() => {
                setAnalysis(null);
                setStatus('idle');
              }}
            >
              Boshqa screenshot yuklash
            </Button>
          </div>
        ) : null}

        {status === 'idle' || status === 'error' ? (
          <>
            <Button block size="lg" onClick={() => inputRef.current?.click()}>
              <Upload className="h-5 w-5" aria-hidden="true" />
              Screenshot tanlash
            </Button>
            <p className="text-center text-xs text-content-secondary">
              JPG, PNG yoki WEBP · 10 MB gacha
            </p>
          </>
        ) : null}

        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void upload(file);
            event.target.value = '';
          }}
        />
      </div>
    </Sheet>
  );
}
