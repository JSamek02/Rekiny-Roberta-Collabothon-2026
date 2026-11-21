import { getTranslations } from 'next-intl/server';
import React from 'react';

type LessonCategoryHeadingProps = {
  title: string;
  icon: React.ReactNode;
  completed: number;
  total: number;
};

export const LessonCategoryHeading = async ({
  title,
  icon,
  completed,
  total,
}: LessonCategoryHeadingProps) => {
  const t = await getTranslations('components.learning-category');
  const progress = total > 0 ? Math.min(100, Math.round((completed / total) * 100)) : 0;

  return (
    <section className="mb-6 w-full rounded-xl border border-blue-100 bg-white p-4 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex size-14 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-950">
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-medium text-grey-600">{t('category')}</p>
          <h1 className="text-xl font-semibold leading-tight text-blue-950">{title}</h1>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-1.5">
        <div className="flex justify-between text-[11px] text-grey-600">
          <p>{t('progress')}</p>
          <p>{t('lesson-count', { count: completed, total })}</p>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-grey-100">
          <div
            className="h-full rounded-full bg-blue-500 transition-[width]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </section>
  );
};
