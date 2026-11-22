'use client';

import { apiGetRoadmapCourse, LEARNING_QUERY_KEYS } from '@/api/services/learning-service';
import { LessonCategoryNavItem } from '@/components/lesson-category-nav-item';
import { getCompletedLessonsCount } from '@/components/lessons-list/lesson-progress';
import { useLocalLearningProgress } from '@/hooks/use-local-learning-progress';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { routes } from '@/utils/routes';
import { useQueries } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';
import { usePathname } from '@/i18n/navigation';
import { useShop } from '@/components/shop/shop-context';
import { CourseMarketplaceButton } from '@/components/course-marketplace-button';

type Category = {
  key: 'stocks-bonds' | 'investing' | 'budgeting' | 'economics';
  courseSlug: string;
  icon: ReactNode;
};

const categories: Category[] = [
  {
    key: 'stocks-bonds',
    courseSlug: 'stocks-bonds-roadmap',
    icon: <BankIcon className="text-2xl stroke-[1.5]" />,
  },
  {
    key: 'investing',
    courseSlug: 'investing-roadmap',
    icon: <DollarIcon className="text-2xl stroke-[1.5]" />,
  },
  {
    key: 'budgeting',
    courseSlug: 'budgeting-roadmap',
    icon: <WalletIcon className="text-2xl stroke-[1.5]" />,
  },
  {
    key: 'economics',
    courseSlug: 'economics-roadmap',
    icon: <HandCoinsIcon className="text-2xl stroke-[1.5]" />,
  },
];

export const LessonCategoryGrid = () => {
  const t = useTranslations('components.learning-category.categories');
  const localActivities = useLocalLearningProgress();
  const pathname = usePathname();
  const { starredCourses } = useShop();
  const isLearningPage = pathname === routes.learning;
  const courseQueries = useQueries({
    queries: categories.map(({ courseSlug }) => ({
      queryKey: LEARNING_QUERY_KEYS.roadmapCourse(courseSlug),
      queryFn: async () => {
        const result = await apiGetRoadmapCourse({ courseSlug });
        return result.data;
      },
    })),
  });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        {categories.map((category, index) => {
          if (isLearningPage && !starredCourses.includes(category.key)) return null;
          const lessons = courseQueries[index].data?.course.lessons ?? [];
          const completed = getCompletedLessonsCount(lessons, localActivities);

          return (
            <LessonCategoryNavItem
              key={category.key}
              title={t(category.key)}
              icon={category.icon}
              completed={completed}
              total={lessons.length}
              href={routes.learningCategory(category.key)}
            />
          );
        })}
      </div>
      {isLearningPage && starredCourses.includes('taxes') && (
        <article className="flex min-h-20 items-center gap-3 rounded-xl border border-blue-100 bg-white p-2.5">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-950">T</div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-blue-950">Taxes</h3>
            <span className="mt-1 w-fit rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              Tumbleweed co.
            </span>
          </div>
        </article>
      )}
      {isLearningPage && starredCourses.includes('retirement') && (
        <article className="flex min-h-20 items-center gap-3 rounded-xl border border-blue-100 bg-white p-2.5">
          <div className="flex size-11 items-center justify-center rounded-lg bg-blue-50 text-blue-950">R</div>
          <div className="flex flex-col">
            <h3 className="text-xs font-semibold text-blue-950">Retirement</h3>
            <span className="mt-1 w-fit rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-semibold text-white">
              Tumbleweed co.
            </span>
          </div>
        </article>
      )}
      <CourseMarketplaceButton />
    </div>
  );
};
