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
    <div className="grid grid-cols-2 gap-2">
      {categories.map((category, index) => {
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
  );
};
