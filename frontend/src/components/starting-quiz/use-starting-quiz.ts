'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useViewer } from '@/components/auth';
import { STARTING_QUIZ_STEPS, STARTING_QUIZ_STORAGE_KEY_PREFIX } from './constants';
import type { StartingQuizAnswers } from './types';

export const useStartingQuiz = () => {
  const { user, status } = useViewer();
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [answers, setAnswers] = useState<StartingQuizAnswers>({});
  const [isDismissed, setIsDismissed] = useState(false);
  const [isClientReady, setIsClientReady] = useState(false);

  const storageKey = useMemo(() => {
    return user?.id
      ? `${STARTING_QUIZ_STORAGE_KEY_PREFIX}${user.id}`
      : `${STARTING_QUIZ_STORAGE_KEY_PREFIX}guest`;
  }, [user?.id]);

  useEffect(() => {
    setIsClientReady(true);
  }, []);

  const hasCompletedInStorage = useMemo(() => {
    if (!isClientReady || !storageKey) return false;
    try {
      return localStorage.getItem(storageKey) === 'true';
    } catch {
      return false;
    }
  }, [isClientReady, storageKey]);

  const shouldShow = useMemo(() => {
    if (!isClientReady) return false;
    // Ankieta pojawia się po zalogowaniu, chyba że wymuszono test
    if (status !== 'authenticated' && status !== 'loading') return false;
    if (isDismissed) return false;
    return !hasCompletedInStorage;
  }, [isClientReady, status, isDismissed, hasCompletedInStorage]);

  const totalSteps = STARTING_QUIZ_STEPS.length;
  const currentStep = STARTING_QUIZ_STEPS[currentStepIndex];
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === totalSteps - 1;

  const isOptionSelected = useCallback(
    (optionId: string) => {
      const ans = answers[currentStep.id];
      if (Array.isArray(ans)) {
        return ans.includes(optionId);
      }
      return ans === optionId;
    },
    [answers, currentStep.id],
  );

  const hasValidSelection = useMemo(() => {
    const ans = answers[currentStep.id];
    if (currentStep.isMultiSelect) {
      return Array.isArray(ans) && ans.length > 0;
    }
    return typeof ans === 'string' && ans.length > 0;
  }, [answers, currentStep]);

  const selectOption = useCallback(
    (optionId: string) => {
      setAnswers((prev) => {
        const currentAns = prev[currentStep.id];
        if (currentStep.isMultiSelect) {
          const list = Array.isArray(currentAns) ? currentAns : [];
          const exists = list.includes(optionId);
          const nextList = exists
            ? list.filter((id) => id !== optionId)
            : [...list, optionId];
          return {
            ...prev,
            [currentStep.id]: nextList,
          };
        }

        return {
          ...prev,
          [currentStep.id]: optionId,
        };
      });
    },
    [currentStep],
  );

  const markQuizDone = useCallback(() => {
    if (storageKey) {
      try {
        localStorage.setItem(storageKey, 'true');
      } catch {
        // Ignoruj błędy zapisu storage w trybie prywatnym
      }
    }
    setIsDismissed(true);
  }, [storageKey]);

  const nextStep = useCallback(() => {
    if (isLastStep) {
      markQuizDone();
    } else {
      setCurrentStepIndex((prev) => Math.min(prev + 1, totalSteps - 1));
    }
  }, [isLastStep, markQuizDone, totalSteps]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(prev - 1, 0));
  }, []);

  const skipQuiz = useCallback(() => {
    markQuizDone();
  }, [markQuizDone]);

  return {
    shouldShow,
    currentStepIndex,
    currentStep,
    totalSteps,
    isFirstStep,
    isLastStep,
    isOptionSelected,
    hasValidSelection,
    answers,
    selectOption,
    nextStep,
    prevStep,
    skipQuiz,
    markQuizDone,
  };
};
