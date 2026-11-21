'use client';

import clsx from 'clsx';
import { Check } from 'lucide-react';
import type { QuizOption } from './types';

type QuizOptionCardProps = {
  option: QuizOption;
  isSelected: boolean;
  onSelect: (id: string) => void;
  isMultiSelect?: boolean;
};

export const QuizOptionCard = ({
  option,
  isSelected,
  onSelect,
  isMultiSelect = false,
}: QuizOptionCardProps) => {
  const Icon = option.icon;

  return (
    <button
      type="button"
      role={isMultiSelect ? 'checkbox' : 'radio'}
      aria-checked={isSelected}
      onClick={() => onSelect(option.id)}
      className={clsx(
        'group flex w-full items-center gap-3.5 rounded-xl border p-3.5 text-left transition-all duration-150 outline-none',
        'focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2',
        isSelected
          ? 'border-blue-600 bg-blue-50/60 shadow-xs'
          : 'border-grey-200 bg-white hover:border-blue-200 hover:bg-slate-50/70',
      )}
    >
      <div className="flex shrink-0 items-center justify-center transition-transform duration-150 group-hover:scale-110">
        <Icon className={clsx('size-6', option.iconColor)} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className={clsx(
            'text-sm font-semibold leading-tight',
            isSelected ? 'text-blue-950' : 'text-grey-900',
          )}
        >
          {option.title}
        </p>
        <p className="mt-1 text-xs text-grey-500 leading-snug">
          {option.description}
        </p>
      </div>

      <div
        className={clsx(
          'flex size-5 shrink-0 items-center justify-center border transition-colors',
          isMultiSelect ? 'rounded-md' : 'rounded-full',
          isSelected
            ? 'border-blue-600 bg-blue-600 text-white'
            : 'border-grey-300 bg-transparent text-transparent',
        )}
      >
        <Check className="size-3 stroke-[3]" />
      </div>
    </button>
  );
};
