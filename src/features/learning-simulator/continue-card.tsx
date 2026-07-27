'use client';

import * as React from 'react';
import Link from 'next/link';
import { Play } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress, SectionHeader } from '@/components/ui/misc';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';
import type { LearningCourse, LearningProgress } from '@/types';

interface ContinuePayload {
  course: LearningCourse;
  progress: LearningProgress;
  nextStepTitle: string;
  percent: number;
}

const fetchContinue = () => apiFetch<ContinuePayload | null>('/api/learning/continue');

export function ContinueLearningCard() {
  const { data: payload, status } = useAsyncData<ContinuePayload | null>(fetchContinue);

  if (status === 'loading') {
    return (
      <section aria-label="Davom ettirish">
        <SectionHeader title="Davom ettirish" />
        <div className="skeleton h-[92px] w-full rounded-md" />
      </section>
    );
  }

  if (status !== 'ready' || !payload) return null;

  return (
    <section aria-label="Davom ettirish">
      <SectionHeader title="Davom ettirish" />
      <Card className="flex items-center gap-3 p-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary-light text-2xl">
          {payload.course.title.slice(0, 1)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-content">{payload.course.title}</p>
          <p className="truncate text-[13px] text-content-secondary">{payload.nextStepTitle}</p>
          <div className="mt-2">
            <Progress value={payload.percent} label="Dars progressi" />
          </div>
        </div>
        <Link
          href={`/learn/${payload.course.id}`}
          aria-label="Darsni davom ettirish"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-primary"
        >
          <Play className="h-5 w-5" aria-hidden="true" />
        </Link>
      </Card>
    </section>
  );
}
