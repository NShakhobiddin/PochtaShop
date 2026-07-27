'use client';

import * as React from 'react';
import { SlidersHorizontal, Scale } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { UniversalSearchBar } from './universal-search-bar';
import { Chip, SectionHeader } from '@/components/ui/misc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input, Field } from '@/components/ui/input';
import { EmptyState, ErrorState, ListSkeleton, OfflineState } from '@/components/ui/states';
import { ConfidenceBadge } from '@/components/ai/confidence-badge';
import { RecommendationCard } from '@/components/product/recommendation-card';
import { ComparisonSheet } from './comparison-sheet';
import { apiFetch, ApiError } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';
import { COUNTRIES, AI_DISCLAIMER, type CountryCode } from '@/constants';
import type { AIRecommendationOption, AIResult, ProductSearchCriteria } from '@/types';

type Status = 'idle' | 'loading' | 'ready' | 'error' | 'offline';

const PRIORITIES: Array<{ value: NonNullable<ProductSearchCriteria['priority']>; label: string }> = [
  { value: 'price', label: 'Narx muhim' },
  { value: 'speed', label: 'Tezlik muhim' },
  { value: 'quality', label: 'Sifat muhim' },
];

const COUNTRY_OPTIONS: CountryCode[] = ['CN', 'US', 'TR'];

export function SearchScreen({ initialQuery }: { initialQuery: string }) {
  // A static export pre-renders without searchParams, so the query is read from
  // the address bar when the server did not supply one.
  const [query] = React.useState(() => {
    if (initialQuery) return initialQuery;
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('q') ?? '';
  });
  const [criteria, setCriteria] = React.useState<ProductSearchCriteria>({ query });
  const [result, setResult] = React.useState<AIResult | null>(null);
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [filtersOpen, setFiltersOpen] = React.useState(false);
  const [selected, setSelected] = React.useState<AIRecommendationOption[]>([]);
  const [comparisonOpen, setComparisonOpen] = React.useState(false);

  const runSearch = React.useCallback(async (next: ProductSearchCriteria) => {
    if (!next.query.trim()) return;
    setStatus('loading');
    track('search_started', { has_budget: Boolean(next.maxBudgetUzs) });

    try {
      const response = await apiFetch<AIResult>('/api/search', { json: next });
      setResult(response);
      setStatus('ready');
      track('search_completed', { options: response.recommendedOptions.length });
      if (response.recommendedOptions.length > 0) {
        track('recommendation_viewed', { count: response.recommendedOptions.length });
      }
    } catch (error) {
      if (error instanceof ApiError && (error.code === 'offline' || error.code === 'network')) {
        setStatus('offline');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : "Qidiruv bajarilmadi.");
      setStatus('error');
    }
  }, []);

  React.useEffect(() => {
    if (!query) return;
    // Deferred to a microtask so the first search does not set state
    // synchronously inside the effect body.
    void Promise.resolve().then(() => runSearch({ query }));
  }, [query, runSearch]);

  function update(patch: Partial<ProductSearchCriteria>) {
    setCriteria((current) => ({ ...current, ...patch }));
  }

  function toggleCountry(country: CountryCode) {
    const current = criteria.countries ?? [];
    const next = current.includes(country)
      ? current.filter((item) => item !== country)
      : [...current, country];
    update({ countries: next.length > 0 ? next : undefined });
  }

  function toggleSelected(option: AIRecommendationOption) {
    haptic('selection');
    setSelected((current) => {
      const exists = current.some((item) => item.type === option.type);
      if (exists) return current.filter((item) => item.type !== option.type);
      if (current.length >= 3) return current;
      return [...current, option];
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader
        title="Qidiruv natijalari"
        action={
          <button
            type="button"
            aria-label="Filtrlar"
            aria-expanded={filtersOpen}
            onClick={() => setFiltersOpen((value) => !value)}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-surface text-content"
          >
            <SlidersHorizontal className="h-5 w-5" aria-hidden="true" />
          </button>
        }
      />

      <UniversalSearchBar defaultValue={query} />

      {filtersOpen ? (
        <Card className="space-y-4 p-4">
          <SectionHeader title="Mahsulotni aniqlashtiring" className="mb-0" />

          <div>
            <p className="mb-2 text-sm font-medium text-content">Nima siz uchun muhim?</p>
            <div className="scroll-x flex gap-2">
              {PRIORITIES.map((priority) => (
                <Chip
                  key={priority.value}
                  selected={criteria.priority === priority.value}
                  onClick={() =>
                    update({
                      priority: criteria.priority === priority.value ? undefined : priority.value,
                    })
                  }
                >
                  {priority.label}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-content">Qaysi davlatlardan qidirilsin?</p>
            <div className="scroll-x flex gap-2">
              {COUNTRY_OPTIONS.map((country) => (
                <Chip
                  key={country}
                  selected={criteria.countries?.includes(country) ?? false}
                  onClick={() => toggleCountry(country)}
                >
                  {COUNTRIES[country]}
                </Chip>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-sm font-medium text-content">Qo&apos;shimcha shartlar</p>
            <div className="scroll-x flex gap-2">
              <Chip
                selected={criteria.requireAuthentic === true}
                onClick={() =>
                  update({ requireAuthentic: criteria.requireAuthentic ? undefined : true })
                }
              >
                Faqat original
              </Chip>
              <Chip
                selected={criteria.condition === 'new'}
                onClick={() =>
                  update({ condition: criteria.condition === 'new' ? undefined : 'new' })
                }
              >
                Yangi
              </Chip>
              <Chip
                selected={criteria.maxDeliveryDays === 20}
                onClick={() =>
                  update({ maxDeliveryDays: criteria.maxDeliveryDays === 20 ? undefined : 20 })
                }
              >
                20 kungacha
              </Chip>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Maksimal budjet (so'm)" htmlFor="budget">
              <Input
                id="budget"
                type="number"
                inputMode="numeric"
                min={0}
                placeholder="1 000 000"
                value={criteria.maxBudgetUzs ?? ''}
                onChange={(event) =>
                  update({
                    maxBudgetUzs: event.target.value ? Number(event.target.value) : undefined,
                  })
                }
              />
            </Field>
            <Field label="Miqdor" htmlFor="quantity">
              <Input
                id="quantity"
                type="number"
                inputMode="numeric"
                min={1}
                placeholder="1"
                value={criteria.quantity ?? ''}
                onChange={(event) =>
                  update({ quantity: event.target.value ? Number(event.target.value) : undefined })
                }
              />
            </Field>
          </div>

          <Button block onClick={() => void runSearch(criteria)}>
            Natijalarni yangilash
          </Button>
        </Card>
      ) : null}

      {status === 'loading' ? <ListSkeleton count={3} /> : null}

      {status === 'offline' ? <OfflineState onRetry={() => void runSearch(criteria)} /> : null}

      {status === 'error' ? (
        <ErrorState
          title="Qidiruv bajarilmadi"
          description={errorMessage}
          onAction={() => void runSearch(criteria)}
        />
      ) : null}

      {status === 'idle' && !query ? (
        <EmptyState
          title="Mahsulotni qidiring"
          description="Mahsulot nomini yozing, rasm yuklang yoki do'kon havolasini yuboring."
        />
      ) : null}

      {status === 'ready' && result ? (
        <>
          <ConfidenceBadge confidence={result.confidence} reason={result.confidenceReason} />

          <Card className="p-4">
            <p className="text-[15px] leading-relaxed text-content">{result.summary}</p>
            <p className="mt-2 text-xs text-content-secondary">{AI_DISCLAIMER}</p>
          </Card>

          {result.missingInformation.length > 0 ? (
            <Card className="p-4">
              <p className="text-sm font-semibold text-content">
                Aniqroq natija uchun quyidagilarni ko&apos;rsating
              </p>
              <ul className="mt-2 space-y-1">
                {result.missingInformation.map((item) => (
                  <li key={item} className="text-[13px] text-content-secondary">
                    • {item}
                  </li>
                ))}
              </ul>
              <Button
                variant="secondary"
                size="sm"
                className="mt-3"
                onClick={() => setFiltersOpen(true)}
              >
                Shartlarni to&apos;ldirish
              </Button>
            </Card>
          ) : null}

          {result.recommendedOptions.length === 0 ? (
            <EmptyState
              title="Mos variant topilmadi"
              description="AI mahsulotni aniq taniy olmadi. Yaxshiroq rasm yuboring yoki nomini boshqacha yozing."
            />
          ) : (
            <section aria-label="Tavsiyalar" className="space-y-3">
              <SectionHeader
                title={`Siz uchun ${result.recommendedOptions.length} ta tavsiya`}
                className="mb-0"
              />
              {result.recommendedOptions.map((option) => (
                <RecommendationCard
                  key={option.type}
                  option={option}
                  selected={selected.some((item) => item.type === option.type)}
                  onToggleSelect={toggleSelected}
                />
              ))}
            </section>
          )}

          {result.nextActions.length > 0 ? (
            <Card className="p-4">
              <p className="text-sm font-semibold text-content">Keyingi qadamlar</p>
              <ol className="mt-2 space-y-1">
                {result.nextActions.map((action, index) => (
                  <li key={action} className="text-[13px] text-content-secondary">
                    {index + 1}. {action}
                  </li>
                ))}
              </ol>
            </Card>
          ) : null}
        </>
      ) : null}

      {selected.length >= 2 ? (
        <div className="fixed inset-x-0 bottom-[84px] z-30 mx-auto max-w-lg px-4">
          <Button block size="lg" onClick={() => setComparisonOpen(true)}>
            <Scale className="h-5 w-5" aria-hidden="true" />
            Taqqoslashni ochish ({selected.length})
          </Button>
        </div>
      ) : null}

      <ComparisonSheet
        open={comparisonOpen}
        options={selected}
        onClose={() => setComparisonOpen(false)}
      />
    </div>
  );
}
