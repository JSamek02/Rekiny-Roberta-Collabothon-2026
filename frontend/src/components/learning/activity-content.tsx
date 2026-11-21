'use client';

import { LearningActivity, SubmitQuizResponse } from '@/api/types/learning';
import { useTranslations } from 'next-intl';
import { ActivityCompleteButton } from './activity-complete-button';
import { ArticleActivity } from './article-activity';
import { QuizActivity } from './quiz-activity';

type ActivityContentProps = {
  activity: LearningActivity;
  isCompleted: boolean;
  isCompleting: boolean;
  isSubmittingQuiz: boolean;
  quizResult: SubmitQuizResponse | null;
  onComplete: () => void;
  onQuizSubmit: (answers: Record<string, string>) => void;
  onQuizRetry: () => void;
};

const toApiUrl = (path: string) => {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${process.env.NEXT_PUBLIC_API_URL || ''}${path}`;
};

export const ActivityContent = ({
  activity,
  isCompleted,
  isCompleting,
  isSubmittingQuiz,
  quizResult,
  onComplete,
  onQuizSubmit,
  onQuizRetry,
}: ActivityContentProps) => {
  const t = useTranslations('components.learning-activity');

  if (activity.activity_type === 'article') {
    return (
      <div className="flex flex-col gap-6">
        <ArticleActivity content={activity.content} />
        <ActivityCompleteButton
          completed={isCompleted}
          loading={isCompleting}
          onClick={onComplete}
          label={t('mark-read')}
          loadingLabel={t('saving')}
          completedLabel={t('completed')}
        />
      </div>
    );
  }

  if (activity.activity_type === 'quiz') {
    return (
      <QuizActivity
        content={activity.content}
        isSubmitting={isSubmittingQuiz}
        result={quizResult}
        onSubmit={onQuizSubmit}
        onRetry={onQuizRetry}
      />
    );
  }

  const { content } = activity;
  return (
    <div className="flex flex-col gap-5">
      {content.description && <p className="text-sm leading-7 text-grey-600">{content.description}</p>}
      {content.video_url ? (
        <video className="w-full rounded-xl bg-blue-950" controls preload="metadata" onEnded={isCompleted ? undefined : onComplete}>
          <source src={toApiUrl(content.video_url)} type={content.video_mime_type || 'video/mp4'} />
          {t('video-not-supported')}
        </video>
      ) : (
        <p className="rounded-xl bg-blue-50 p-4 text-sm text-grey-600">{t('video-unavailable')}</p>
      )}
      <ActivityCompleteButton
        completed={isCompleted}
        loading={isCompleting}
        onClick={onComplete}
        label={t('mark-watched')}
        loadingLabel={t('saving')}
        completedLabel={t('completed')}
      />
    </div>
  );
};
