'use client';

import { useApiGetRoadmapCourseQuery } from '@/api/services/learning-service';
import { type ActivitySummary, type LessonActivities } from '@/api/types/learning';
import { LessonCategoryHeading } from '@/components/lessons-list/lesson-category-heading';
import { LessonsList } from '@/components/lessons-list/lessons-list';
import { type LessonListItem, type LessonStatus } from '@/components/lessons-list/lesson-roadmap-types';
import { useLocalLearningProgress } from '@/hooks/use-local-learning-progress';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

type LessonRoadmapProps = {
  category: string;
};

type RoadmapLesson = Pick<LessonActivities, 'order_index' | 'title' | 'activities'>;

const roadmapCourses = {
  'stocks-bonds': 'stocks-bonds-roadmap',
  investing: 'investing-roadmap',
  budgeting: 'budgeting-roadmap',
  economics: 'economics-roadmap',
} as const;

type CategoryKey = keyof typeof roadmapCourses;

const categoryTitles: Record<CategoryKey, 'categories.stocks-bonds' | 'categories.investing' | 'categories.budgeting' | 'categories.economics'> = {
  'stocks-bonds': 'categories.stocks-bonds',
  investing: 'categories.investing',
  budgeting: 'categories.budgeting',
  economics: 'categories.economics',
};

const categoryIcons: Record<CategoryKey, ReactNode> = {
  'stocks-bonds': <BankIcon className="text-3xl stroke-[1.5]" />,
  investing: <DollarIcon className="text-3xl stroke-[1.5]" />,
  budgeting: <WalletIcon className="text-3xl stroke-[1.5]" />,
  economics: <HandCoinsIcon className="text-3xl stroke-[1.5]" />,
};

const fallbackLessonTitles = [
  'lessons.lesson-1',
  'lessons.lesson-2',
  'lessons.lesson-3',
  'lessons.lesson-4',
  'lessons.lesson-5',
] as const;

const getLessonStatus = (
  activities: ActivitySummary[],
  localActivities: ReturnType<typeof useLocalLearningProgress>,
): LessonStatus => {
  const isCompleted = (activity: ActivitySummary) => (
    activity.is_completed || localActivities[String(activity.id)]?.status === 'completed'
  );

  if (activities.length > 0 && activities.every(isCompleted)) {
    return 'completed';
  }

  if (activities.some((activity) => (
    isCompleted(activity)
    || activity.progress_status === 'started'
    || localActivities[String(activity.id)]?.status === 'started'
  ))) {
    return 'in-progress';
  }

  return 'not-started';
};

export const LessonRoadmap = ({ category }: LessonRoadmapProps) => {
  const t = useTranslations('components.learning-category');
  const localActivities = useLocalLearningProgress();
  const categoryKey: CategoryKey = category in roadmapCourses ? category as CategoryKey : 'investing';
  const courseQuery = useApiGetRoadmapCourseQuery({ courseSlug: roadmapCourses[categoryKey] });
  const fallbackLessons: RoadmapLesson[] = fallbackLessonTitles.map((title, index) => ({
    order_index: index + 1,
    title: t(title),
    activities: [],
  }));
  const lessons = courseQuery.data?.course.lessons || fallbackLessons;
  const lessonItems: LessonListItem[] = lessons.map((lesson) => ({
    slug: `lesson-${lesson.order_index}`,
    title: lesson.title,
    status: getLessonStatus(lesson.activities, localActivities),
  }));
  const completed = lessonItems.filter((lesson) => lesson.status === 'completed').length;

  return (
    <>
      <LessonCategoryHeading
        title={t(categoryTitles[categoryKey])}
        icon={categoryIcons[categoryKey]}
        completed={completed}
        total={lessonItems.length}
      />

      <LessonsList category={categoryKey} lessons={lessonItems} />
    </>
  );
};
