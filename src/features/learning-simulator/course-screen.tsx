'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Lightbulb, RotateCcw, X } from 'lucide-react';
import type { LearningCourse, LearningStep, SimulatorOption } from '@/types';
import { PageHeader } from '@/components/layout/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress, SectionHeader } from '@/components/ui/misc';
import { Badge } from '@/components/ui/badge';
import { SimulatorFrame } from './simulator-frame';
import { apiFetch } from '@/lib/api/client';
import { track } from '@/lib/analytics';
import { haptic } from '@/lib/telegram/webapp';
import { cn } from '@/lib/utils';

interface Attempt {
  optionId: string;
  correct: boolean;
}

export function CourseScreen({
  course,
  platformName,
}: {
  course: LearningCourse;
  platformName: string;
}) {
  const [index, setIndex] = React.useState(0);
  const [completed, setCompleted] = React.useState<string[]>([]);
  const [attempt, setAttempt] = React.useState<Attempt | null>(null);
  const [mistakes, setMistakes] = React.useState(0);
  const [finished, setFinished] = React.useState(false);

  const step = course.steps[index];
  const isLast = index === course.steps.length - 1;
  const percent = Math.round((completed.length / course.steps.length) * 100);

  React.useEffect(() => {
    track('lesson_started', { course: course.id });
  }, [course.id]);

  async function persist(stepId: string, done: boolean) {
    const score = Math.max(
      0,
      Math.round(((course.steps.length - mistakes) / course.steps.length) * 100),
    );
    try {
      await apiFetch('/api/learning/progress', {
        json: { courseId: course.id, stepId, completed: done, score },
      });
    } catch {
      // Progress is best-effort; the lesson continues offline.
    }
  }

  function selectOption(option: SimulatorOption) {
    if (attempt?.correct) return;
    setAttempt({ optionId: option.id, correct: option.correct });
    if (option.correct) {
      haptic('success');
    } else {
      haptic('error');
      setMistakes((value) => value + 1);
    }
  }

  async function goNext() {
    if (!step) return;
    const nextCompleted = completed.includes(step.id) ? completed : [...completed, step.id];
    setCompleted(nextCompleted);
    setAttempt(null);

    if (isLast) {
      await persist(step.id, true);
      setFinished(true);
      track('lesson_completed', { course: course.id, mistakes });
      haptic('success');
      return;
    }

    await persist(step.id, false);
    setIndex((value) => value + 1);
  }

  if (finished) {
    const score = Math.max(
      0,
      Math.round(((course.steps.length - mistakes) / course.steps.length) * 100),
    );
    return (
      <div className="flex flex-col gap-4">
        <PageHeader title={course.title} />
        <Card className="p-6 text-center">
          <span className="text-5xl" aria-hidden="true">
            🎓
          </span>
          <h2 className="mt-3 text-[19px] font-bold text-content">Kurs yakunlandi</h2>
          <p className="mt-1 text-[13px] text-content-secondary">
            {course.steps.length} ta bosqichdan {course.steps.length - mistakes} tasi birinchi
            urinishda to&apos;g&apos;ri bajarildi.
          </p>
          <div className="mt-4">
            <Progress value={100} label="Kurs progressi" />
          </div>
          <p className="mt-3 text-2xl font-extrabold text-primary">{score}%</p>
          <p className="text-[13px] text-content-secondary">Test natijasi</p>
        </Card>

        <Link href="/stores">
          <Button block>Haqiqiy do&apos;konga o&apos;tish</Button>
        </Link>
        <Button
          variant="outline"
          block
          onClick={() => {
            setFinished(false);
            setIndex(0);
            setCompleted([]);
            setMistakes(0);
          }}
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
          Kursni qaytadan boshlash
        </Button>
      </div>
    );
  }

  if (!step) return null;

  return (
    <div className="flex flex-col gap-4">
      <PageHeader title={course.title} />

      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-[13px] font-semibold text-primary">
            Dars {step.order} / {course.steps.length}
          </p>
          <Badge tone="neutral">{kindLabel(step.kind)}</Badge>
        </div>
        <Progress value={percent} label="Kurs progressi" />
      </Card>

      <Card className="p-4">
        <SectionHeader title={step.title} className="mb-2" />
        <p className="text-[15px] leading-relaxed text-content-secondary">{step.body}</p>
        {step.hint ? (
          <p className="mt-3 flex gap-2 rounded-sm bg-primary-light p-3 text-[13px] leading-snug text-primary">
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {step.hint}
          </p>
        ) : null}
      </Card>

      {step.kind !== 'reading' && step.options ? (
        <>
          <SimulatorFrame platformName={platformName} stepTitle={step.title} />

          <Card className="p-4">
            <p className="text-[15px] font-bold text-content">{step.question}</p>
            <div className="mt-3 space-y-2">
              {step.options.map((option) => (
                <OptionButton
                  key={option.id}
                  option={option}
                  attempt={attempt}
                  onSelect={() => selectOption(option)}
                />
              ))}
            </div>

            {attempt ? (
              <div
                className={cn(
                  'mt-3 rounded-sm p-3 text-[13px] leading-snug',
                  attempt.correct ? 'bg-success-bg text-success' : 'bg-danger-bg text-danger',
                )}
                role="status"
              >
                <p className="font-bold">
                  {attempt.correct ? "To'g'ri" : "Bu variant noto'g'ri"}
                </p>
                <p className="mt-1">
                  {step.options.find((option) => option.id === attempt.optionId)?.explanation}
                </p>
                {!attempt.correct ? (
                  <button
                    type="button"
                    onClick={() => setAttempt(null)}
                    className="mt-2 inline-flex items-center gap-1.5 font-semibold underline"
                  >
                    <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                    Qayta urinish
                  </button>
                ) : null}
              </div>
            ) : null}
          </Card>
        </>
      ) : null}

      <Button
        block
        size="lg"
        disabled={step.kind !== 'reading' && !attempt?.correct}
        onClick={() => void goNext()}
      >
        {isLast ? 'Kursni yakunlash' : 'Keyingi bosqich'}
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Button>

      {step.kind !== 'reading' && !attempt?.correct ? (
        <p className="text-center text-xs text-content-secondary">
          Davom etish uchun to&apos;g&apos;ri javobni tanlang.
        </p>
      ) : null}
    </div>
  );
}

function OptionButton({
  option,
  attempt,
  onSelect,
}: {
  option: SimulatorOption;
  attempt: Attempt | null;
  onSelect: () => void;
}) {
  const chosen = attempt?.optionId === option.id;
  const locked = attempt?.correct === true;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked && !chosen}
      className={cn(
        'flex w-full items-start gap-3 rounded-sm border p-3 text-left text-[15px] transition-colors',
        chosen && attempt?.correct && 'border-success bg-success-bg text-success',
        chosen && attempt && !attempt.correct && 'border-danger bg-danger-bg text-danger',
        !chosen && 'border-border bg-surface text-content',
      )}
    >
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold',
          chosen && attempt?.correct && 'bg-success text-white',
          chosen && attempt && !attempt.correct && 'bg-danger text-white',
          !chosen && 'bg-primary-light text-primary',
        )}
        aria-hidden="true"
      >
        {chosen && attempt?.correct ? (
          <Check className="h-3.5 w-3.5" />
        ) : chosen ? (
          <X className="h-3.5 w-3.5" />
        ) : (
          option.id.toUpperCase()
        )}
      </span>
      <span className="leading-snug">{option.label}</span>
    </button>
  );
}

function kindLabel(kind: LearningStep['kind']): string {
  if (kind === 'simulator') return 'Simulyator';
  if (kind === 'quiz') return 'Test';
  return 'Nazariya';
}
