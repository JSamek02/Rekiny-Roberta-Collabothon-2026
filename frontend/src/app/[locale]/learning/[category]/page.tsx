import { LessonCategoryHeading, LessonsList } from '@/components/lessons-list';
import { buttonVariants } from '@/ui';
import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { BankIcon } from '@/icons/bank';
import { BooksIcon } from '@/icons/books';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { routes } from '@/utils/routes';
import { getTranslations } from 'next-intl/server';
import React from 'react';
import clsx from 'clsx';

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

const categoryIcons: Record<string, React.ReactNode> = {
  'stocks-bonds': <BankIcon className="text-3xl stroke-[1.5]" />,
  investing: <DollarIcon className="text-3xl stroke-[1.5]" />,
  budgeting: <WalletIcon className="text-3xl stroke-[1.5]" />,
  economics: <HandCoinsIcon className="text-3xl stroke-[1.5]" />,
};

export default async function LearningCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const t = await getTranslations('components.learning-category');
  const categoryKey = categoryIcons[category] ? category : 'investing';
  const categoryName =
    categoryKey === 'stocks-bonds'
      ? t('categories.stocks-bonds')
      : categoryKey === 'budgeting'
        ? t('categories.budgeting')
        : categoryKey === 'economics'
          ? t('categories.economics')
          : t('categories.investing');
  const lessons = [
    { slug: 'lesson-1', title: t('lessons.lesson-1') },
    { slug: 'lesson-2', title: t('lessons.lesson-2') },
    { slug: 'lesson-3', title: t('lessons.lesson-3') },
    { slug: 'lesson-4', title: t('lessons.lesson-4') },
    { slug: 'lesson-5', title: t('lessons.lesson-5') },
  ];

  const completed = 2;

  return (
    <main className="flex-1 px-3 pt-4 pb-8">
      <Link
        href={routes.learning}
        className={clsx(
          buttonVariants({ variant: 'ghost', size: 'sm', color: 'blue' }),
          'mb-4 w-fit border-0 px-0 text-sm uppercase',
        )}
      >
        <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
        <span>{t('back')}</span>
      </Link>

      <LessonCategoryHeading
        title={categoryName}
        icon={categoryIcons[categoryKey] || <BooksIcon className="text-3xl stroke-[1.5]" />}
        completed={completed}
        total={lessons.length}
      />

      <LessonsList
        category={categoryKey}
        lessons={lessons.map((lesson, index) => ({
          ...lesson,
          status: index < completed ? 'read' : 'unread',
        }))}
      />
    </main>
  );
}
