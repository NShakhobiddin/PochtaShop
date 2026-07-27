'use client';

import * as React from 'react';
import { Paperclip } from 'lucide-react';
import type { Consultation, ConsultationType } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Field, Input, Select, Textarea } from '@/components/ui/input';
import { SectionHeader } from '@/components/ui/misc';
import { Icon3D } from '@/components/ui/icon-3d';
import { ListSkeleton } from '@/components/ui/states';
import { CONSULTATION_STATUS_LABEL, CONSULTATION_STATUS_TONE, CONSULTATION_TYPES } from './types';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import { validateUploadedFile } from '@/lib/validation/schemas';
import { formatUzs } from '@/lib/currency';
import { formatDate } from '@/lib/utils';
import { haptic } from '@/lib/telegram/webapp';

const fetchConsultations = () => apiFetch<Consultation[]>('/api/consultations');

export function ConsultationScreen({ initialType }: { initialType: ConsultationType }) {
  const { data, status, reload } = useAsyncData<Consultation[]>(fetchConsultations);

  const [type, setType] = React.useState<ConsultationType>(initialType);
  const [description, setDescription] = React.useState('');
  const [productUrl, setProductUrl] = React.useState('');
  const [contactMethod, setContactMethod] = React.useState<'telegram' | 'phone'>('telegram');
  const [contactValue, setContactValue] = React.useState('');
  const [preferredTime, setPreferredTime] = React.useState('');
  const [consent, setConsent] = React.useState(false);
  const [attachmentName, setAttachmentName] = React.useState<string | undefined>();
  const [fileError, setFileError] = React.useState('');
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState('');
  const [sent, setSent] = React.useState(false);

  const inputRef = React.useRef<HTMLInputElement>(null);
  const selected = CONSULTATION_TYPES.find((item) => item.value === type);

  function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const kind = file.type === 'application/pdf' ? 'document' : 'image';
    const validation = validateUploadedFile(
      { name: file.name, type: file.type, size: file.size },
      kind,
    );
    if (!validation.ok) {
      setFileError(validation.error ?? "Fayl qabul qilinmadi.");
      setAttachmentName(undefined);
      return;
    }
    setFileError('');
    setAttachmentName(file.name);
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError('');
    try {
      await apiFetch('/api/consultations', {
        json: {
          type,
          description,
          productUrl: productUrl || undefined,
          attachmentName,
          contactMethod,
          contactValue,
          preferredTime,
          priceUzs: selected?.priceUzs ?? 0,
          consent: true,
        },
      });
      haptic('success');
      setSent(true);
      setDescription('');
      setProductUrl('');
      reload();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "So'rov yuborilmadi.");
      haptic('error');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title="Pulli konsultatsiya" />

      <Card className="flex items-center gap-3 p-4">
        <Icon3D name="consultation" />
        <div>
          <p className="text-[15px] font-bold text-content">Mutaxassis yordami</p>
          <p className="mt-0.5 text-[13px] leading-snug text-content-secondary">
            Narxlar so&apos;mda ko&apos;rsatilgan. To&apos;lov so&apos;rov qabul qilingandan keyin
            kelishiladi.
          </p>
        </div>
      </Card>

      {sent ? (
        <Card className="p-4">
          <p className="text-sm font-bold text-success">So&apos;rovingiz yuborildi</p>
          <p className="mt-1 text-[13px] text-content-secondary">
            Mutaxassis siz bilan tez orada bog&apos;lanadi. Holatni quyida kuzatishingiz mumkin.
          </p>
          <Button variant="outline" block className="mt-3" onClick={() => setSent(false)}>
            Yangi so&apos;rov yuborish
          </Button>
        </Card>
      ) : (
        <form onSubmit={submit}>
          <Card className="space-y-4 p-4">
            <Field label="Xizmat turi" htmlFor="cons-type">
              <Select
                id="cons-type"
                value={type}
                onChange={(event) => setType(event.target.value as ConsultationType)}
              >
                {CONSULTATION_TYPES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label} — {formatUzs(item.priceUzs)}
                  </option>
                ))}
              </Select>
            </Field>

            {selected ? (
              <div className="rounded-sm bg-primary-light p-3">
                <p className="text-[13px] leading-snug text-primary">{selected.description}</p>
                <p className="mt-1 text-sm font-bold text-primary">{formatUzs(selected.priceUzs)}</p>
              </div>
            ) : null}

            <Field label="Qisqa tavsif" htmlFor="cons-description" hint="Kamida 10 ta belgi.">
              <Textarea
                id="cons-description"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
                placeholder="Muammoingizni yoki savolingizni yozing"
                required
                minLength={10}
                maxLength={2000}
              />
            </Field>

            <Field label="Mahsulot havolasi (ixtiyoriy)" htmlFor="cons-url">
              <Input
                id="cons-url"
                type="url"
                inputMode="url"
                value={productUrl}
                onChange={(event) => setProductUrl(event.target.value)}
                placeholder="https://..."
                maxLength={2048}
              />
            </Field>

            <div>
              <Button type="button" variant="outline" block onClick={() => inputRef.current?.click()}>
                <Paperclip className="h-4 w-4" aria-hidden="true" />
                {attachmentName ?? 'Fayl biriktirish (ixtiyoriy)'}
              </Button>
              <input
                ref={inputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                className="hidden"
                onChange={onFile}
              />
              {fileError ? (
                <p role="alert" className="mt-1 text-xs font-medium text-danger">
                  {fileError}
                </p>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Aloqa usuli" htmlFor="cons-method">
                <Select
                  id="cons-method"
                  value={contactMethod}
                  onChange={(event) =>
                    setContactMethod(event.target.value === 'phone' ? 'phone' : 'telegram')
                  }
                >
                  <option value="telegram">Telegram</option>
                  <option value="phone">Telefon</option>
                </Select>
              </Field>
              <Field
                label={contactMethod === 'phone' ? 'Telefon raqami' : 'Telegram username'}
                htmlFor="cons-contact"
              >
                <Input
                  id="cons-contact"
                  value={contactValue}
                  onChange={(event) => setContactValue(event.target.value)}
                  placeholder={contactMethod === 'phone' ? '+998 90 000 00 00' : '@username'}
                  required
                  minLength={4}
                  maxLength={80}
                />
              </Field>
            </div>

            <Field label="Qulay vaqt" htmlFor="cons-time">
              <Input
                id="cons-time"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                placeholder="Masalan: ish kunlari 18:00 dan keyin"
                maxLength={120}
              />
            </Field>

            <label className="flex items-start gap-3 text-[13px] leading-snug text-content-secondary">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                required
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-border accent-[rgb(79,70,229)]"
              />
              <span>
                Ma&apos;lumotlarim konsultatsiya doirasida ishlatilishiga roziman. Pasport, karta va
                uy manzili ma&apos;lumotlari so&apos;ralmaydi.
              </span>
            </label>

            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            ) : null}

            <Button type="submit" block size="lg" loading={pending} disabled={!consent}>
              So&apos;rov yuborish
            </Button>
          </Card>
        </form>
      )}

      <section aria-label="So'rovlarim">
        <SectionHeader title="So'rovlarim" />
        {status === 'loading' ? <ListSkeleton count={2} /> : null}
        {status === 'ready' && (data?.length ?? 0) === 0 ? (
          <Card className="p-4">
            <p className="text-[13px] text-content-secondary">Hozircha so&apos;rovlar yo&apos;q.</p>
          </Card>
        ) : null}
        <div className="space-y-2">
          {(data ?? []).map((consultation) => {
            const definition = CONSULTATION_TYPES.find((item) => item.value === consultation.type);
            return (
              <Card key={consultation.id} className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-[15px] font-semibold text-content">
                      {definition?.label ?? consultation.type}
                    </p>
                    <p className="mt-0.5 line-clamp-2 text-[13px] text-content-secondary">
                      {consultation.description}
                    </p>
                  </div>
                  <Badge tone={CONSULTATION_STATUS_TONE[consultation.status]}>
                    {CONSULTATION_STATUS_LABEL[consultation.status]}
                  </Badge>
                </div>
                <p className="mt-2 text-xs text-content-secondary">
                  {formatDate(consultation.createdAt)} · {formatUzs(consultation.priceUzs)}
                </p>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}
