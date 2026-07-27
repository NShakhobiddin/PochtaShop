'use client';

import * as React from 'react';
import type { LearningProgress } from '@/types';
import { Progress } from '@/components/ui/misc';
import { apiFetch } from '@/lib/api/client';
import { useAsyncData } from '@/hooks/use-async-data';

const fetchProgress = () => apiFetch<LearningProgress[]>('/api/learning/progress');

export function CourseProgressBadge({
  courseId,
  totalSteps,
}: {
  courseId: string;
  totalSteps: number;
}) {
  const { data, status } = useAsyncData<LearningProgress[]>(fetchProgress);

  if (status === 'loading') return <div className="skeleton h-2 w-full" />;
  if (status !== 'ready') return null;

  const progress = data?.find((item) => item.courseId === courseId);
  if (!progress) {
    return <p className="text-xs text-content-secondary">Boshlanmagan</p>;
  }

  const percent = Math.round((progress.completedStepIds.length / totalSteps) * 100);
  return (
    <div>
      <Progress value={percent} label={`${courseId} progressi`} />
      {progress.completedAt ? (
        <p className="mt-1 text-xs font-medium text-success">Tugallangan</p>
      ) : null}
    </div>
  );
}
