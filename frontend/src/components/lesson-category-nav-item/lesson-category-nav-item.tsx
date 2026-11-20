import { Link } from '@/i18n/navigation';
import { BankIcon } from '@/icons/bank';
import { getTranslations } from 'next-intl/server';
import React from 'react';

export const LessonCategoryNavItem = async () => {
  const t = await getTranslations('components.lesson-category-nav-item');

  return (
    <Link href="/" className="bg-white p-2 flex flex-col gap-4 rounded-xl border-blue-100 border">
      <div className="flex gap-2 items-end">
        <div className="size-12 rounded-lg bg-blue-50 text-blue-950 flex items-center justify-center shrink-0">
          <BankIcon className="text-3xl stroke-[1.5]" />
        </div>
        <h3 className="leading-tight font-semibold text-sm">Bonds and Stocks</h3>
      </div>
      <div className="flex flex-col gap-0.5">
        <div className="flex justify-between text-xs text-grey-600">
          <p>{t('progress')}</p>
          <p>{t('lesson-count', { count: 6, total: 12 })}</p>
        </div>
        <div className="h-1.5 rounded-full bg-grey-200 flex">
          <div className="h-full bg-blue-500 w-1/2 rounded-full" />
        </div>
      </div>
    </Link>
  );
};
