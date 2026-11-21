'use client';

import { useState } from 'react';
import clsx from 'clsx';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui';
import { QuizOptionCard } from './quiz-option-card';
import { QuizProgressBar } from './quiz-progress-bar';
import { QuizThankYouView } from './quiz-thank-you-view';
import { useStartingQuiz } from './use-starting-quiz';
import type { StartingQuizViewProps } from './types';

export const StartingQuizView = ({
  onComplete,
  onSkip,
  className,
}: StartingQuizViewProps) => {
  const t = useTranslations('components.starting-quiz');
  const [isCompleted, setIsCompleted] = useState(false);
  const {
    currentStep,
    currentStepIndex,
    totalSteps,
    isFirstStep,
    isLastStep,
    isOptionSelected,
    hasValidSelection,
    selectOption,
    nextStep,
    prevStep,
    skipQuiz,
    markQuizDone,
  } = useStartingQuiz();

  const handleNext = () => {
    if (isLastStep) {
      markQuizDone();
      setIsCompleted(true);
    } else {
      nextStep();
    }
  };

  const handleSkip = () => {
    skipQuiz();
    onSkip();
  };

  if (isCompleted) {
    return (
      <div className={clsx('flex flex-col gap-4', className)}>
        <QuizThankYouView onGoToHome={onComplete} />
      </div>
    );
  }

  const stepTitle = t(`steps.${currentStep.id}.title` as any);
  const stepSubtitle = t(`steps.${currentStep.id}.subtitle` as any);

  return (
    <div className={clsx('flex flex-col gap-4', className)}>
      <QuizProgressBar
        currentStep={currentStepIndex}
        totalSteps={totalSteps}
        onSkip={handleSkip}
      />

      <div className="space-y-1">
        <h2 className="text-xl font-bold tracking-tight text-blue-950">
          {stepTitle}
        </h2>
        <p className="text-xs text-grey-600">{stepSubtitle}</p>
      </div>

      <div
        role={currentStep.isMultiSelect ? 'group' : 'radiogroup'}
        aria-label={stepTitle}
        className="flex flex-col gap-2.5 py-1"
      >
        {currentStep.options.map((option) => (
          <QuizOptionCard
            key={option.id}
            stepId={currentStep.id}
            option={option}
            isSelected={isOptionSelected(option.id)}
            onSelect={selectOption}
            isMultiSelect={currentStep.isMultiSelect}
          />
        ))}
      </div>

      <div className="flex items-center gap-2 pt-2">
        {!isFirstStep && (
          <Button
            type="button"
            variant="ghost"
            size="md"
            onClick={prevStep}
            className="gap-1.5 px-3 text-grey-600 hover:text-blue-950"
          >
            <ArrowLeft className="size-4" />
            {t('back')}
          </Button>
        )}

        <Button
          type="button"
          variant="solid"
          size="md"
          onClick={handleNext}
          disabled={!hasValidSelection}
          className="flex-1 gap-2"
        >
          {isLastStep ? t('finish') : t('next')}
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
};
