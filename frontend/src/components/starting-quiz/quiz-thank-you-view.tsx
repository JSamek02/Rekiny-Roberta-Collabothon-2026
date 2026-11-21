'use client';

import { ArrowRight, CheckCircle2, Sparkles, Target } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/ui';

type QuizThankYouViewProps = {
  onGoToHome: () => void;
};

export const QuizThankYouView = ({ onGoToHome }: QuizThankYouViewProps) => {
  const t = useTranslations('components.starting-quiz');

  return (
    <div className="flex flex-col items-center text-center py-2 gap-5 animate-fadeIn">
      {/* Animowana/estetyczna ikona sukcesu */}
      <div className="relative flex size-16 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 shadow-xs">
        <CheckCircle2 className="size-9 stroke-[2.2]" />
        <Sparkles className="absolute -top-1.5 -right-1.5 size-5 text-amber-500 animate-bounce" />
      </div>

      {/* Nagłówek i opis */}
      <div className="space-y-1.5 max-w-sm">
        <h2 className="text-xl font-bold tracking-tight text-blue-950 sm:text-2xl">
          {t('thank-you.title')}
        </h2>
        <p className="text-xs sm:text-sm text-grey-600 leading-relaxed">
          {t('thank-you.description')}
        </p>
      </div>

      {/* Pigułki / benefity */}
      <div className="w-full flex flex-col gap-2 rounded-xl bg-blue-50/60 p-3.5 text-left border border-blue-100/70">
        <div className="flex items-center gap-2.5 text-xs text-blue-950 font-medium">
          <Target className="size-4 text-blue-600 shrink-0" />
          <span>{t('thank-you.benefit-plan')}</span>
        </div>
        <div className="flex items-center gap-2.5 text-xs text-blue-950 font-medium">
          <CheckCircle2 className="size-4 text-emerald-600 shrink-0" />
          <span>{t('thank-you.benefit-difficulty')}</span>
        </div>
      </div>

      {/* Przycisk przejścia do ekranu głównego */}
      <Button
        type="button"
        variant="solid"
        size="md"
        onClick={onGoToHome}
        className="w-full gap-2 mt-1 shadow-sm"
      >
        <span>{t('thank-you.cta')}</span>
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
};
