import {
  Award,
  BookOpen,
  Bot,
  BrainCircuit,
  Coffee,
  FileText,
  Flame,
  Home,
  Landmark,
  Rocket,
  ShieldCheck,
  Sprout,
  TrendingUp,
} from 'lucide-react';
import type { QuizStep } from './types';

export const STARTING_QUIZ_STORAGE_KEY_PREFIX = 'rekiny_quiz_completed_';

export const STARTING_QUIZ_STEPS: QuizStep[] = [
  {
    id: 'goal',
    isMultiSelect: true,
    options: [
      {
        id: 'budget_basics',
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
      },
      {
        id: 'first_investments',
        icon: TrendingUp,
        iconColor: 'text-blue-600',
      },
      {
        id: 'big_expense',
        icon: Home,
        iconColor: 'text-indigo-600',
      },
      {
        id: 'long_term_capital',
        icon: Landmark,
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    id: 'level',
    options: [
      {
        id: 'level_beginner',
        icon: Sprout,
        iconColor: 'text-emerald-600',
      },
      {
        id: 'level_intermediate',
        icon: BookOpen,
        iconColor: 'text-blue-600',
      },
      {
        id: 'level_advanced',
        icon: Award,
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    id: 'format',
    options: [
      {
        id: 'format_quiz',
        icon: BrainCircuit,
        iconColor: 'text-purple-600',
      },
      {
        id: 'format_articles',
        icon: FileText,
        iconColor: 'text-blue-600',
      },
      {
        id: 'format_ai',
        icon: Bot,
        iconColor: 'text-cyan-600',
      },
    ],
  },
  {
    id: 'commitment',
    options: [
      {
        id: 'time_5m',
        icon: Coffee,
        iconColor: 'text-amber-600',
      },
      {
        id: 'time_10m',
        icon: Flame,
        iconColor: 'text-orange-600',
      },
      {
        id: 'time_15m',
        icon: Rocket,
        iconColor: 'text-rose-600',
      },
    ],
  },
];
