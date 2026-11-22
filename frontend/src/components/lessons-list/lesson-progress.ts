import { type ActivitySummary, type LessonActivities } from '@/api/types/learning';
import { type LocalActivityProgress } from '@/hooks/use-local-learning-progress';
import { type LessonStatus } from './lesson-roadmap-types';

type LocalActivities = Record<string, LocalActivityProgress>;

export const isActivityCompleted = (
  activity: ActivitySummary,
  localActivities: LocalActivities,
) => (
  activity.is_completed || localActivities[String(activity.id)]?.status === 'completed'
);

export const getLessonStatus = (
  activities: ActivitySummary[],
  localActivities: LocalActivities,
): LessonStatus => {
  if (activities.length > 0 && activities.every((activity) => isActivityCompleted(activity, localActivities))) {
    return 'completed';
  }

  if (activities.some((activity) => (
    isActivityCompleted(activity, localActivities)
    || activity.progress_status === 'started'
    || localActivities[String(activity.id)]?.status === 'started'
  ))) {
    return 'in-progress';
  }

  return 'not-started';
};

export const getCompletedLessonsCount = (
  lessons: LessonActivities[],
  localActivities: LocalActivities,
) => lessons.filter((lesson) => getLessonStatus(lesson.activities, localActivities) === 'completed').length;
