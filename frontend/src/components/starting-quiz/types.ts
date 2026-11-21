import type { ComponentType } from 'react';

export type QuizOption = {
  id: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
  iconColor: string;
};

export type QuizStep = {
  id: string;
  title: string;
  subtitle: string;
  options: QuizOption[];
  isMultiSelect?: boolean;
};

export type StartingQuizAnswers = Record<string, string | string[]>;

export type StartingQuizViewProps = {
  onComplete: () => void;
  onSkip: () => void;
  className?: string;
};

export type StartingQuizModalProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onFinished?: () => void;
  forceShow?: boolean;
};
