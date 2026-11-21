'use client';

import { useApiGetRoadmapCourseQuery } from '@/api/services/learning-service';
import { ActivityType } from '@/api/types/learning';
import { useLocalLearningProgress } from '@/hooks/use-local-learning-progress';
import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { Button } from '@/ui';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';
import { type ReactNode } from 'react';

type LessonActivitiesProps = {
  category: string;
  lessonSlug: string;
};

const roadmapCourses: Record<string, string> = {
  'stocks-bonds': 'stocks-bonds-roadmap',
  investing: 'investing-roadmap',
  budgeting: 'budgeting-roadmap',
  economics: 'economics-roadmap',
};

const activityIcons: Record<ActivityType, string> = {
  article: '▤',
  quiz: '?',
  video: '▶',
};

export const LessonActivities = ({ category, lessonSlug }: LessonActivitiesProps) => {
  const t = useTranslations('components.learning-activity');
  const localActivities = useLocalLearningProgress();
  const lessonNumber = Number(/^lesson-(\d+)$/.exec(lessonSlug)?.[1]);
  const courseSlug = roadmapCourses[category];
  const courseQuery = useApiGetRoadmapCourseQuery(
    { courseSlug: courseSlug || '' },
    { enabled: Boolean(courseSlug && Number.isInteger(lessonNumber)) },
  );

  if (!courseSlug || !Number.isInteger(lessonNumber)) {
    return <LessonActivitiesMessage message={t('lesson-not-found')} />;
  }

  if (courseQuery.isPending) {
    return <LessonActivitiesMessage message={t('loading-lesson')} />;
  }

  if (courseQuery.isError || !courseQuery.data) {
    return (
      <LessonActivitiesMessage
        message={t('load-error')}
        action={
          <Button variant="ghost" size="sm" className="mt-3 self-center" onClick={() => void courseQuery.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const lesson = courseQuery.data.course.lessons.find((item) => item.order_index === lessonNumber);
  if (!lesson) {
    return <LessonActivitiesMessage message={t('lesson-not-found')} />;
  }

  return (
    <section className="mx-auto flex w-full max-w-lg flex-col gap-5 px-3 py-6">
      <Link href={routes.learningCategory(category)} className="flex w-fit items-center gap-1 text-sm font-semibold text-blue-500 hover:text-blue-950">
        <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
      </Link>

      <header>
        <p className="text-sm font-semibold text-blue-500">{t('lesson-kicker', { number: lesson.order_index })}</p>
        <h1 className="mt-1 text-2xl font-semibold text-blue-950">{lesson.title}</h1>
        <p className="mt-2 text-sm leading-6 text-grey-600">{t('lesson-activities-description')}</p>
      </header>

      {lesson.activities.length === 0 ? (
        <LessonActivitiesMessage message={t('no-activities')} />
      ) : (
        <ol className="flex flex-col gap-3">
          {lesson.activities.map((activity) => {
            const isCompleted = activity.is_completed || localActivities[String(activity.id)]?.status === 'completed';

            return (
              <li key={activity.id}>
                <Link
                  href={routes.learningActivity(activity.id)}
                  className={`flex items-center gap-3 rounded-2xl border bg-white p-4 transition-colors hover:border-blue-500 ${isCompleted ? 'border-green-500' : 'border-blue-100'}`}
                >
                  <span className={`flex size-10 shrink-0 items-center justify-center rounded-full font-semibold ${isCompleted ? 'bg-green-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                    {isCompleted ? '✓' : activityIcons[activity.activity_type]}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-semibold uppercase tracking-wide text-blue-500">{t(activity.activity_type)}</span>
                    <span className="mt-1 block font-semibold text-blue-950">{activity.title}</span>
                    <span className="mt-1 block text-xs text-grey-600">
                      {t('activity-meta', { minutes: activity.estimated_minutes, xp: activity.xp_reward, coins: activity.coin_reward })}
                    </span>
                  </span>
                  <span className="text-sm font-semibold text-blue-500">{activity.order_index}</span>
                </Link>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};

const LessonActivitiesMessage = ({ message, action }: { message: string; action?: ReactNode }) => (
  <section className="mx-auto flex w-full max-w-lg flex-col px-3 py-16 text-center text-sm text-grey-600">
    {message}
    {action}
  </section>
);
