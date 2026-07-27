'use client';

import * as React from 'react';
import Link from 'next/link';
import { Check, ChevronRight, Paperclip, Send, Sparkles } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Icon3D } from '@/components/ui/icon-3d';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ConfidenceBadge } from '@/components/ai/confidence-badge';
import { RiskBadge } from '@/components/customs/risk-badge';
import { ScreenshotAssistant } from '@/features/screenshot-assistant/screenshot-assistant';
import { AiFeedback } from '@/components/ai/ai-feedback';
import { ListSkeleton, ErrorState, OfflineState } from '@/components/ui/states';
import { apiFetch, ApiError } from '@/lib/api/client';
import { formatUzs, formatDeliveryDays } from '@/lib/currency';
import { AI_DISCLAIMER } from '@/constants';
import { haptic } from '@/lib/telegram/webapp';
import { track } from '@/lib/analytics';
import type { AIResult } from '@/types';

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'offline';

export function AiScreen({ initialSource }: { initialSource: 'text' | 'image' }) {
  const [question, setQuestion] = React.useState('');
  const [result, setResult] = React.useState<AIResult | null>(null);
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [screenshotOpen, setScreenshotOpen] = React.useState(initialSource === 'image');
  // The pending image name is handed over via sessionStorage by the search bar
  // and is read once, lazily, on the first client render.
  const [attachedName] = React.useState<string | null>(() => {
    if (initialSource !== 'image' || typeof window === 'undefined') return null;
    return window.sessionStorage.getItem('pochtashop.pendingImageName');
  });

  async function ask(event: React.FormEvent) {
    event.preventDefault();
    const query = question.trim();
    if (!query) return;

    setStatus('loading');
    haptic('light');
    try {
      const response = await apiFetch<AIResult>('/api/search', {
        json: { query, imageProvided: Boolean(attachedName) },
      });
      setResult(response);
      setStatus('ready');
      track('recommendation_viewed', { source: attachedName ? 'image' : 'text' });
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'offline' || error.code === 'network')) {
        setStatus('offline');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Tahlil bajarilmadi.');
      setStatus('error');
    }
  }

  const best = result?.recommendedOptions[0] ?? null;

  return (
    <div className="flex flex-col gap-4 pb-24">
      <PageHeader
        title="AI yordamchi"
        action={
          <Link
            href="/profile/history"
            aria-label="Tahlillar tarixi"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-content-secondary"
          >
            <Sparkles className="h-5 w-5" aria-hidden="true" />
          </Link>
        }
      />

      {attachedName ? (
        <Card className="flex items-center gap-3 p-4">
          <Icon3D name="ai" size="sm" />
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-bold text-content">Rasm yuklandi</p>
            <p className="truncate text-[13px] text-content-secondary">{attachedName}</p>
          </div>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success-bg text-success">
            <Check className="h-4 w-4" aria-hidden="true" />
          </span>
        </Card>
      ) : null}

      {status === 'idle' && !result ? (
        <Card className="p-4">
          <div className="flex items-start gap-3">
            <Icon3D name="ai" />
            <div>
              <p className="text-[15px] font-bold text-content">Nima yordam kerak?</p>
              <p className="mt-1 text-[13px] leading-snug text-content-secondary">
                Mahsulot nomini yozing yoki savolingizni bering. Men uchta variant tayyorlab beraman:
                eng arzon, eng tez va eng ishonchli.
              </p>
            </div>
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {['Simsiz quloqchin', 'Krossovka', 'Power bank', 'Robot changyutgich'].map((sample) => (
              <button
                key={sample}
                type="button"
                onClick={() => setQuestion(sample)}
                className="h-10 rounded-full border border-border px-3 text-sm text-content-secondary"
              >
                {sample}
              </button>
            ))}
          </div>
        </Card>
      ) : null}

      {status === 'loading' ? <ListSkeleton count={2} /> : null}
      {status === 'offline' ? <OfflineState /> : null}
      {status === 'error' ? (
        <ErrorState title="Tahlil bajarilmadi" description={errorMessage} onAction={() => setStatus('idle')} />
      ) : null}

      {status === 'ready' && result ? (
        <>
          <ConfidenceBadge confidence={result.confidence} reason={result.confidenceReason} />

          <Card className="p-4">
            <p className="flex items-center gap-1.5 text-sm font-bold text-primary">
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              AI tavsiyasi
            </p>
            <p className="mt-2 text-[15px] leading-relaxed text-content">{result.summary}</p>
            <p className="mt-2 text-xs text-content-secondary">{AI_DISCLAIMER}</p>
          </Card>

          {best ? (
            <div className="space-y-2">
              <SummaryRow
                icon="store"
                title="Tavsiya etilgan do'kon"
                subtitle={`${best.store.logoEmoji} ${best.store.name}`}
                value={formatUzs(best.estimatedCost.productUzs)}
                href={`/stores/${best.store.id}`}
              />
              <SummaryRow
                icon="courier"
                title="Tavsiya etilgan kuryer"
                subtitle={`${best.courier.name} · ${formatDeliveryDays(best.courier.deliveryDays)}`}
                value={formatUzs(best.estimatedCost.shippingUzs)}
                href={`/couriers/${best.courier.id}`}
              />
              <SummaryRow
                icon="calculator"
                title="Jami xarajat (taxminiy)"
                subtitle="Mahsulot + yetkazish + bojxona"
                value={formatUzs(best.estimatedCost.totalUzs)}
                href="/calculator"
              />
              <SummaryRow
                icon="customs"
                title="Bojxona xavfi"
                subtitle={best.customsRisk.note}
                value={<RiskBadge level={best.customsRisk.level} />}
                href="/customs/risk"
              />
            </div>
          ) : null}

          <Link href={`/search?q=${encodeURIComponent(question)}`}>
            <Button block variant="secondary">
              Uchta variantni to&apos;liq ko&apos;rish
            </Button>
          </Link>

          <AiFeedback context="recommendations" />
        </>
      ) : null}

      <Card className="p-4">
        <div className="flex items-start gap-3">
          <Icon3D name="consultation" />
          <div className="flex-1">
            <p className="text-[15px] font-bold text-content">Ekspert yordami</p>
            <p className="mt-1 text-[13px] leading-snug text-content-secondary">
              Aniqroq hisob-kitob va shaxsiy maslahat uchun pulli konsultatsiya oling.
            </p>
            <p className="mt-2 text-xs text-content-secondary">
              ⏱ Odatda 15 daqiqa ichida javob beramiz
            </p>
          </div>
        </div>
        <Link href="/consultation" className="mt-3 block">
          <Button block>Konsultatsiya olish</Button>
        </Link>
      </Card>

      <Card className="p-4">
        <p className="text-[15px] font-bold text-content">Screenshot yordamchisi</p>
        <p className="mt-1 text-[13px] text-content-secondary">
          Xorijiy do&apos;kon screenshotini yuklang — qaysi bosqichda ekaningizni va keyingi qadamni
          tushuntiraman.
        </p>
        <div className="mt-2">
          <Badge tone="primary">Premium</Badge>
        </div>
        <Button variant="outline" block className="mt-3" onClick={() => setScreenshotOpen(true)}>
          <Paperclip className="h-4 w-4" aria-hidden="true" />
          Screenshot yuklash
        </Button>
      </Card>

      <Card className="p-4">
        <p className="text-[15px] font-bold text-content">Sotuvchi bilan muloqot</p>
        <p className="mt-1 text-[13px] text-content-secondary">
          O&apos;zbekcha yozing — xitoy, ingliz yoki turk tilida tayyor xabar oling.
        </p>
        <Link href="/seller-assistant" className="mt-3 block">
          <Button variant="outline" block>
            Ochish
          </Button>
        </Link>
      </Card>

      <form
        onSubmit={ask}
        className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-lg px-4"
        role="search"
      >
        <div className="flex items-center gap-2 rounded-md border border-border bg-surface p-1.5 shadow-card">
          <button
            type="button"
            aria-label="Fayl biriktirish"
            onClick={() => setScreenshotOpen(true)}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-sm text-content-secondary"
          >
            <Paperclip className="h-5 w-5" aria-hidden="true" />
          </button>
          <label htmlFor="ai-question" className="sr-only">
            Savolingizni yozing
          </label>
          <input
            id="ai-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder="Yana bir savol bering..."
            className="h-11 min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-content-secondary/80"
          />
          <button
            type="submit"
            aria-label="Yuborish"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-primary text-white"
          >
            <Send className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </form>

      <ScreenshotAssistant open={screenshotOpen} onClose={() => setScreenshotOpen(false)} />
    </div>
  );
}

function SummaryRow({
  icon,
  title,
  subtitle,
  value,
  href,
}: {
  icon: 'store' | 'courier' | 'calculator' | 'customs';
  title: string;
  subtitle: string;
  value: React.ReactNode;
  href: string;
}) {
  return (
    <Link href={href}>
      <Card className="flex items-center gap-3 p-3.5">
        <Icon3D name={icon} size="sm" />
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold text-content">{title}</p>
          <p className="truncate text-[13px] text-content-secondary">{subtitle}</p>
        </div>
        <span className="shrink-0 text-sm font-bold text-primary">{value}</span>
        <ChevronRight className="h-4 w-4 shrink-0 text-content-secondary" aria-hidden="true" />
      </Card>
    </Link>
  );
}
