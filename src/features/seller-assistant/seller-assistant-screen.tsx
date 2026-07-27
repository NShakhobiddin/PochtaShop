'use client';

import * as React from 'react';
import { Copy, Check, Languages, TriangleAlert } from 'lucide-react';
import type { SellerLanguage, SellerMessageDraft, SellerReplyAnalysis } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Chip, SectionHeader } from '@/components/ui/misc';
import { Field, Textarea } from '@/components/ui/input';
import { SELLER_TOPICS } from './phrasebook';
import { apiFetch } from '@/lib/api/client';
import { haptic } from '@/lib/telegram/webapp';

const LANGUAGES: Array<{ value: SellerLanguage; label: string }> = [
  { value: 'zh', label: 'Xitoycha' },
  { value: 'en', label: 'Inglizcha' },
  { value: 'tr', label: 'Turkcha' },
];

export function SellerAssistantScreen() {
  const [language, setLanguage] = React.useState<SellerLanguage>('zh');
  const [topicId, setTopicId] = React.useState(SELLER_TOPICS[0]?.id ?? '');
  const [userText, setUserText] = React.useState('');
  const [draft, setDraft] = React.useState<SellerMessageDraft | null>(null);
  const [draftPending, setDraftPending] = React.useState(false);

  const [sellerText, setSellerText] = React.useState('');
  const [reply, setReply] = React.useState<SellerReplyAnalysis | null>(null);
  const [replyPending, setReplyPending] = React.useState(false);

  const [error, setError] = React.useState('');
  const [copied, setCopied] = React.useState(false);

  const topic = SELLER_TOPICS.find((item) => item.id === topicId);

  async function generate() {
    setDraftPending(true);
    setError('');
    try {
      setDraft(
        await apiFetch<SellerMessageDraft>('/api/ai/seller-message', {
          json: { topicId, userText, language },
        }),
      );
      haptic('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Xabar tayyorlanmadi.');
    } finally {
      setDraftPending(false);
    }
  }

  async function translateReply() {
    if (!sellerText.trim()) return;
    setReplyPending(true);
    setError('');
    try {
      setReply(
        await apiFetch<SellerReplyAnalysis>('/api/ai/seller-message', {
          method: 'PUT',
          json: { sellerText, language },
        }),
      );
      haptic('success');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Tarjima bajarilmadi.');
    } finally {
      setReplyPending(false);
    }
  }

  async function copyDraft() {
    if (!draft) return;
    try {
      await navigator.clipboard.writeText(draft.translated);
      setCopied(true);
      haptic('success');
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Nusxa olinmadi. Matnni qo'lda belgilab oling.");
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Sotuvchi bilan muloqot" />

      <Card className="p-4">
        <p className="mb-2 text-sm font-medium text-content">Sotuvchining tili</p>
        <div className="flex gap-2">
          {LANGUAGES.map((item) => (
            <Chip
              key={item.value}
              selected={language === item.value}
              onClick={() => setLanguage(item.value)}
            >
              {item.label}
            </Chip>
          ))}
        </div>
      </Card>

      <section aria-label="Tayyor mavzular">
        <SectionHeader title="Tayyor savollar" />
        <div className="grid grid-cols-1 gap-2">
          {SELLER_TOPICS.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setTopicId(item.id);
                setDraft(null);
              }}
              aria-pressed={topicId === item.id}
              className={
                topicId === item.id
                  ? 'min-h-[48px] rounded-sm border border-primary bg-primary-light px-4 text-left text-sm font-semibold text-primary'
                  : 'min-h-[48px] rounded-sm border border-border bg-surface px-4 text-left text-sm text-content'
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      </section>

      <Card className="space-y-3 p-4">
        <Field
          label="Qo'shimcha matn (ixtiyoriy)"
          htmlFor="seller-user-text"
          hint="O'zbekcha yozing — tarjima qilinadi."
        >
          <Textarea
            id="seller-user-text"
            value={userText}
            onChange={(event) => setUserText(event.target.value)}
            placeholder="Masalan: 42-o'lcham bormi?"
            maxLength={1500}
          />
        </Field>
        <Button block loading={draftPending} onClick={() => void generate()}>
          <Languages className="h-4 w-4" aria-hidden="true" />
          Xabarni tayyorlash
        </Button>
      </Card>

      {draft ? (
        <Card className="p-4">
          <p className="text-sm font-bold text-content">Sotuvchiga yuboriladigan xabar</p>
          <p className="mt-2 whitespace-pre-wrap rounded-sm bg-surface-muted p-3 text-[15px] leading-relaxed text-content">
            {draft.translated}
          </p>
          <p className="mt-2 text-[13px] text-content-secondary">
            <span className="font-medium text-content">O&apos;zbekcha ma&apos;nosi:</span>{' '}
            {draft.backTranslation}
          </p>
          <p className="mt-2 rounded-sm bg-primary-light p-3 text-[13px] leading-snug text-primary">
            💡 {draft.tip}
          </p>
          <Button variant="outline" block className="mt-3" onClick={() => void copyDraft()}>
            {copied ? (
              <Check className="h-4 w-4" aria-hidden="true" />
            ) : (
              <Copy className="h-4 w-4" aria-hidden="true" />
            )}
            {copied ? 'Nusxa olindi' : 'Nusxa olish'}
          </Button>
        </Card>
      ) : topic ? (
        <Card className="p-4">
          <p className="text-[13px] leading-snug text-content-secondary">💡 {topic.tip}</p>
        </Card>
      ) : null}

      <section aria-label="Sotuvchi javobi">
        <SectionHeader title="Sotuvchi javobini tarjima qilish" />
        <Card className="space-y-3 p-4">
          <Field label="Sotuvchidan kelgan xabar" htmlFor="seller-reply">
            <Textarea
              id="seller-reply"
              value={sellerText}
              onChange={(event) => setSellerText(event.target.value)}
              placeholder="Sotuvchining javobini shu yerga qo'ying"
              maxLength={3000}
            />
          </Field>
          <Button
            variant="secondary"
            block
            loading={replyPending}
            onClick={() => void translateReply()}
          >
            O&apos;zbekchaga tarjima qilish
          </Button>
        </Card>
      </section>

      {reply ? (
        <Card className="p-4">
          <p className="text-sm font-bold text-content">Tarjima</p>
          <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-content">
            {reply.translated}
          </p>
          <p className="mt-2 text-[13px] leading-snug text-content-secondary">{reply.explanation}</p>
          {reply.warnings.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {reply.warnings.map((warning) => (
                <li key={warning} className="flex gap-2 text-[13px] leading-snug text-warning">
                  <TriangleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  {warning}
                </li>
              ))}
            </ul>
          ) : null}
        </Card>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-sm bg-danger-bg p-3 text-[13px] font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
