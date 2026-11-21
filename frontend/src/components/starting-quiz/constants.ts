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
    title: 'Jaki jest Twój główny cel finansowy?',
    subtitle: 'Wybierz jedną lub więcej opcji, a pomożemy Ci dobrać odpowiednie lekcje.',
    isMultiSelect: true,
    options: [
      {
        id: 'budget_basics',
        title: 'Podstawy i budżet domowy',
        description: 'Zbudowanie poduszki finansowej i kontrola wydatków',
        icon: ShieldCheck,
        iconColor: 'text-emerald-600',
      },
      {
        id: 'first_investments',
        title: 'Pierwsze inwestycje',
        description: 'Bezpieczny start: ETF-y, obligacje skarbowe i giełda',
        icon: TrendingUp,
        iconColor: 'text-blue-600',
      },
      {
        id: 'big_expense',
        title: 'Duży cel finansowy',
        description: 'Wkład własny, zakup mieszkania lub większy wydatek',
        icon: Home,
        iconColor: 'text-indigo-600',
      },
      {
        id: 'long_term_capital',
        title: 'Kapitał długoterminowy',
        description: 'Zabezpieczenie emerytury i siła procentu składanego',
        icon: Landmark,
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    id: 'level',
    title: 'Jak oceniasz swoją wiedzę o finansach?',
    subtitle: 'Dostosujemy trudność materiałów edukacyjnych.',
    options: [
      {
        id: 'level_beginner',
        title: 'Zaczynam od zera',
        description: 'Pojęcia takie jak obligacje czy ETF są mi zupełnie obce',
        icon: Sprout,
        iconColor: 'text-emerald-600',
      },
      {
        id: 'level_intermediate',
        title: 'Znam podstawy',
        description: 'Wiem, czym jest inflacja i lokata, ale brak mi pewności',
        icon: BookOpen,
        iconColor: 'text-blue-600',
      },
      {
        id: 'level_advanced',
        title: 'Mam pierwsze kroki za sobą',
        description: 'Inwestuję i chcę usystematyzować strategię',
        icon: Award,
        iconColor: 'text-amber-600',
      },
    ],
  },
  {
    id: 'format',
    title: 'W jakiej formie najwygodniej Ci się uczyć?',
    subtitle: 'Wybierz preferowany format przyswajania wiedzy.',
    options: [
      {
        id: 'format_quiz',
        title: 'Krótkie quizy i wyzwania',
        description: 'Interaktywne pytania, misje i zdobywanie punktów',
        icon: BrainCircuit,
        iconColor: 'text-purple-600',
      },
      {
        id: 'format_articles',
        title: 'Zwięzłe pigułki wiedzy',
        description: 'Krótkie artykuły i infografiki czytane we własnym tempie',
        icon: FileText,
        iconColor: 'text-blue-600',
      },
      {
        id: 'format_ai',
        title: 'Rozmowa z SharkBotem',
        description: 'Asystent AI odpowiadający na bieżąco na Twoje pytania',
        icon: Bot,
        iconColor: 'text-cyan-600',
      },
    ],
  },
  {
    id: 'commitment',
    title: 'Ile czasu dziennie chcesz poświęcić?',
    subtitle: 'Ustal swoje tempo, by łatwiej utrzymać regularność.',
    options: [
      {
        id: 'time_5m',
        title: '5 minut dziennie',
        description: 'Na luzie – 1 szybka pigułka wiedzy dziennie',
        icon: Coffee,
        iconColor: 'text-amber-600',
      },
      {
        id: 'time_10m',
        title: '10 minut dziennie',
        description: 'Regularnie – 1 lekcja + szybki quiz',
        icon: Flame,
        iconColor: 'text-orange-600',
      },
      {
        id: 'time_15m',
        title: '15+ minut dziennie',
        description: 'Ambitnie – pełne misje i maksymalne nagrody',
        icon: Rocket,
        iconColor: 'text-rose-600',
      },
    ],
  },
];
