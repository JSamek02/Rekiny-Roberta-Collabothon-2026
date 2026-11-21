'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogTitle } from '@/ui';
import { StartingQuizView } from './starting-quiz-view';
import { useStartingQuiz } from './use-starting-quiz';
import type { StartingQuizModalProps } from './types';

export const StartingQuizModal = ({
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  onFinished,
  forceShow = false,
}: StartingQuizModalProps) => {
  const t = useTranslations('components.starting-quiz');
  const { shouldShow, skipQuiz } = useStartingQuiz();
  const [internalOpen, setInternalOpen] = useState(true);

  const isOpen =
    controlledOpen !== undefined
      ? controlledOpen
      : (forceShow || shouldShow) && internalOpen;

  const handleClose = () => {
    skipQuiz();
    setInternalOpen(false);
    controlledOnOpenChange?.(false);
    onFinished?.();
  };

  const handleComplete = () => {
    setInternalOpen(false);
    controlledOnOpenChange?.(false);
    onFinished?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent showCloseButton={false} className="max-w-md p-5 sm:p-6">
        <DialogTitle className="sr-only">{t('modal-title')}</DialogTitle>
        <StartingQuizView onComplete={handleComplete} onSkip={handleClose} />
      </DialogContent>
    </Dialog>
  );
};
