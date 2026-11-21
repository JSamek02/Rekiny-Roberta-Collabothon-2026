'use client';

import clsx from 'clsx';
import { useTranslations } from 'next-intl';

type QuizProgressBarProps = {
  currentStep: number;
  totalSteps: number;
  onSkip?: () => void;
};

export const QuizProgressBar = ({
  currentStep,
  totalSteps,
  onSkip,
}: QuizProgressBarProps) => {
  const t = useTranslations('components.starting-quiz');

  return (
    <div className="flex items-center justify-between gap-3 pb-1">
      <div
        className="flex items-center gap-1.5"
        role="progressbar"
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-label={t('step-progress', { current: currentStep + 1, total: totalSteps })}
      >
        {Array.from({ length: totalSteps }, (_, idx) => (
          <span
            key={idx}
            className={clsx(
              'h-1.5 rounded-full transition-all duration-300',
              idx === currentStep
                ? 'w-6 bg-blue-600'
                : idx < currentStep
                  ? 'w-2 bg-blue-300'
                  : 'w-2 bg-grey-200',
            )}
          />
        ))}
      </div>

      {onSkip && (
        <button
          type="button"
          onClick={onSkip}
          className="text-xs font-semibold text-grey-500 transition-colors hover:text-blue-900 focus-visible:outline-hidden focus-visible:underline"
        >
          {t('skip')}
        </button>
      )}
    </div>
  );
};
