'use client';
import { useScheduler } from '@/lib/hooks/useScheduler';

export function SchedulerInit() {
  useScheduler();
  return null;
}
