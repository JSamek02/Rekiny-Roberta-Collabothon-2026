import { Link } from '@/i18n/navigation';
import { BankIcon } from '@/icons/bank';
import { getTranslations } from 'next-intl/server';
import React from 'react';

type LessonCategoryNavItemProps = {
  title?: string;
  icon?: React.ReactNode;
  completed?: number;
  total?: number;
  href?: string;
};

export const LessonCategoryNavItem = async ({
  title = 'Bonds and Stocks',
  icon,
  completed = 6,
  total = 12,
  href = '/',
}: LessonCategoryNavItemProps) => {
  const t = await getTranslations('components.lesson-category-nav-item');
  const progressRatio = total > 0 ? Math.min(1, Math.max(0, completed / total)) : 0;

  return (
    <Link href={href} className="bg-white p-2.5 flex flex-col justify-between gap-3 rounded-xl border-blue-100 border shadow-xs hover:border-blue-400 hover:shadow-sm transition-all">
      <div className="flex gap-2 items-center">
        <div className="size-11 rounded-lg bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
          {icon || <BankIcon className="text-2xl stroke-[1.5]" />}
        </div>
        <h3 className="leading-tight font-semibold text-xs text-blue-950">{title}</h3>
      </div>
      <div className="flex flex-col gap-1">
        <div className="flex justify-between text-[11px] text-grey-600">
          <p>{t('progress')}</p>
          <p>{t('lesson-count', { count: completed, total })}</p>
        </div>
        <div className="h-1.5 rounded-full bg-grey-200 flex overflow-hidden">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.round(progressRatio * 100)}%` }}
          />
        </div>
      </div>
    </Link>
  );
};
