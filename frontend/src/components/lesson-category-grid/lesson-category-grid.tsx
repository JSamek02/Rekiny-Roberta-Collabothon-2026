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
import { Sparkles, Star } from 'lucide-react';
import { LessonCategoryGridSkeleton } from '@/components/lesson-category-grid/lesson-category-grid-skeleton';

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
  const navItemT = useTranslations('components.lesson-category-nav-item');
  const marketplaceT = useTranslations('components.course-marketplace');
  const localActivities = useLocalLearningProgress();
  const pathname = usePathname();
  const { starredCourses, starredCoursesHydrated } = useShop();
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
        {isLearningPage && !starredCoursesHydrated &&
          <LessonCategoryGridSkeleton />}
        {categories.map((category, index) => {
          if (isLearningPage && (!starredCoursesHydrated || !starredCourses.includes(category.key))) return null;
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
        {isLearningPage && starredCourses.includes('taxes') && (
          <article className="flex h-[100px] flex-col justify-between rounded-xl border border-blue-100 bg-white p-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-950">
                <Sparkles className="text-2xl" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-semibold leading-tight text-blue-950">{marketplaceT('courses.taxes.title')}</h3>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-grey-600">
                <p>{navItemT('progress')}</p>
                <p>{navItemT('lesson-count', { count: 0, total: 6 })}</p>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-grey-200">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '0%' }} />
              </div>
            </div>
          </article>
        )}
        {isLearningPage && starredCourses.includes('retirement') && (
          <article className="flex h-[100px] flex-col justify-between rounded-xl border border-blue-100 bg-white p-2.5">
            <div className="flex items-center gap-2">
              <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-950">
                <Star className="text-2xl" strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-semibold leading-tight text-blue-950">{marketplaceT('courses.retirement.title')}</h3>
            </div>
            <div className="flex flex-col gap-1">
              <div className="flex justify-between text-[11px] text-grey-600">
                <p>{navItemT('progress')}</p>
                <p>{navItemT('lesson-count', { count: 0, total: 6 })}</p>
              </div>
              <div className="flex h-1.5 overflow-hidden rounded-full bg-grey-200">
                <div className="h-full rounded-full bg-blue-500" style={{ width: '0%' }} />
              </div>
            </div>
          </article>
        )}
      </div>
      <CourseMarketplaceButton />
    </div>
  );
};
