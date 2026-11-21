'use client';

import { CompleteActivityResponse, SubmitQuizResponse } from '@/api/types/learning';
import { useEffect, useState } from 'react';

const STORAGE_KEY = 'shark-finance.learning-progress.v1';
const UPDATE_EVENT = 'shark-finance.learning-progress.updated';

export type LocalActivityProgress = {
  status: 'started' | 'completed';
  passed: boolean;
  quizScore: number | null;
  attemptsCount: number;
  xpEarned: number;
  coinsEarned: number;
  completedAt: string | null;
};

type StoredLearningProgress = {
  activities: Record<string, LocalActivityProgress>;
};

const emptyProgress = (): StoredLearningProgress => ({ activities: {} });

const readProgress = (): StoredLearningProgress => {
  if (typeof window === 'undefined') {
    return emptyProgress();
  }

  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    if (!value) {
      return emptyProgress();
    }
    const progress = JSON.parse(value) as StoredLearningProgress;
    return progress && typeof progress.activities === 'object' ? progress : emptyProgress();
  } catch {
    return emptyProgress();
  }
};

const writeProgress = (progress: StoredLearningProgress) => {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
    window.dispatchEvent(new Event(UPDATE_EVENT));
  } catch {
    // Local progress is optional when browser storage is unavailable.
  }
};

export const saveGuestActivityCompletion = (activityId: number, result: CompleteActivityResponse) => {
  const progress = readProgress();
  const previous = progress.activities[String(activityId)];
  progress.activities[String(activityId)] = {
    status: 'completed',
    passed: true,
    quizScore: previous?.quizScore ?? null,
    attemptsCount: Math.max(previous?.attemptsCount ?? 0, 1),
    xpEarned: result.xp_earned,
    coinsEarned: result.coins_earned,
    completedAt: new Date().toISOString(),
  };
  writeProgress(progress);
};

export const saveGuestQuizProgress = (activityId: number, result: SubmitQuizResponse) => {
  const progress = readProgress();
  const previous = progress.activities[String(activityId)];
  const passed = result.passed || previous?.status === 'completed';
  progress.activities[String(activityId)] = {
    status: passed ? 'completed' : 'started',
    passed,
    quizScore: Math.max(previous?.quizScore ?? 0, result.score),
    attemptsCount: (previous?.attemptsCount ?? 0) + 1,
    xpEarned: result.passed ? result.xp_earned : previous?.xpEarned ?? 0,
    coinsEarned: result.passed ? result.coins_earned : previous?.coinsEarned ?? 0,
    completedAt: result.passed ? new Date().toISOString() : previous?.completedAt ?? null,
  };
  writeProgress(progress);
};

export const useLocalLearningProgress = () => {
  const [activities, setActivities] = useState<Record<string, LocalActivityProgress>>({});

  useEffect(() => {
    const refresh = () => setActivities(readProgress().activities);
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        refresh();
      }
    };

    refresh();
    window.addEventListener(UPDATE_EVENT, refresh);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener(UPDATE_EVENT, refresh);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return activities;
};
