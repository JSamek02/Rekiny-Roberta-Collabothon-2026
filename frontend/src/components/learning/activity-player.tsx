'use client';

import {
  LEARNING_QUERY_KEYS,
  useApiGetLearningActivityQuery,
  useCompleteLearningActivityMutation,
  useSubmitLearningQuizMutation,
} from '@/api/services/learning-service';
import { CompleteActivityResponse, SubmitQuizResponse } from '@/api/types/learning';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import {
  saveGuestActivityCompletion,
  saveGuestQuizProgress,
  useLocalLearningProgress,
} from '@/hooks/use-local-learning-progress';
import { useRouter } from '@/i18n/navigation';
import { Button } from '@/ui';
import { useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { ActivityContent } from './activity-content';
import { ActivityMessage } from './activity-message';

type ActivityPlayerProps = {
  activityId: number;
};

const activityIcons = {
  article: '▤',
  quiz: '?',
  video: '▶',
} as const;

export const ActivityPlayer = ({ activityId }: ActivityPlayerProps) => {
  const t = useTranslations('components.learning-activity');
  const router = useRouter();
  const queryClient = useQueryClient();
  const localActivities = useLocalLearningProgress();
  const [completion, setCompletion] = useState<CompleteActivityResponse | null>(null);
  const [quizResult, setQuizResult] = useState<SubmitQuizResponse | null>(null);
  const activityQuery = useApiGetLearningActivityQuery({ activityId });
  const completeMutation = useCompleteLearningActivityMutation();
  const quizMutation = useSubmitLearningQuizMutation();

  const handleComplete = async () => {
    try {
      const result = await completeMutation.mutateAsync({ activityId });
      if (!result.persisted) {
        saveGuestActivityCompletion(activityId, result);
      }
      setCompletion(result);
      await queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEYS.root });
    } catch {
      // The mutation state supplies the visible error message.
    }
  };

  const handleQuizSubmit = async (answers: Record<string, string>) => {
    try {
      const result = await quizMutation.mutateAsync({ activityId, answers });
      if (!result.persisted) {
        saveGuestQuizProgress(activityId, result);
      }
      setQuizResult(result);
      await queryClient.invalidateQueries({ queryKey: LEARNING_QUERY_KEYS.root });
    } catch {
      // The mutation state supplies the visible error message.
    }
  };

  if (activityQuery.isPending) {
    return <ActivityMessage message={t('loading')} />;
  }

  if (activityQuery.isError || !activityQuery.data) {
    return (
      <ActivityMessage
        message={t('load-error')}
        action={
          <Button variant="ghost" size="sm" className="mt-3 self-center" onClick={() => void activityQuery.refetch()}>
            {t('retry')}
          </Button>
        }
      />
    );
  }

  const activity = activityQuery.data.activity;
  const localProgress = localActivities[String(activity.id)];
  const isCompleted = activity.user_progress?.status === 'completed'
    || localProgress?.status === 'completed'
    || Boolean(completion)
    || Boolean(quizResult?.passed);
  const mutationError = completeMutation.isError || quizMutation.isError ? t('action-error') : null;
  const localReward = localProgress?.status === 'completed'
    ? {
      is_first_completion: true,
      xp_earned: localProgress.xpEarned,
      coins_earned: localProgress.coinsEarned,
    }
    : null;
  const reward = completion || (quizResult?.passed ? quizResult : null) || localReward || quizResult;

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-5 px-4 py-6">
      <Button variant="ghost" size="sm" className="w-fit border-0 px-0 text-sm uppercase" onClick={() => router.back()}>
        <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
      </Button>

      <header className="rounded-2xl border border-blue-100 bg-white p-5">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-lg font-semibold text-blue-500">
            {activityIcons[activity.activity_type]}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-500">{t(activity.activity_type)}</p>
            <h1 className="mt-1 text-xl font-semibold text-blue-950">{activity.title}</h1>
            <p className="mt-2 text-xs text-grey-600">
              {t('activity-meta', { minutes: activity.estimated_minutes, xp: activity.xp_reward, coins: activity.coin_reward })}
            </p>
          </div>
        </div>
      </header>

      <div className="rounded-2xl border border-blue-100 bg-white p-5">
        <ActivityContent
          activity={activity}
          isCompleted={isCompleted}
          isCompleting={completeMutation.isPending}
          isSubmittingQuiz={quizMutation.isPending}
          quizResult={quizResult}
          onComplete={() => void handleComplete()}
          onQuizSubmit={(answers) => void handleQuizSubmit(answers)}
          onQuizRetry={() => setQuizResult(null)}
        />
      </div>

      {mutationError && <p role="alert" className="rounded-xl border border-red-300 bg-red-50 p-3 text-sm text-red-800">{mutationError}</p>}
      {isCompleted && (
        <div className="rounded-2xl border border-green-500 bg-green-50 p-4">
          <p className="font-semibold text-green-800">
            {reward?.is_first_completion ? t('activity-completed') : t('completed')}
          </p>
          {reward?.is_first_completion && (
            <p className="mt-1 text-sm text-green-800">{t('reward-earned', { xp: reward.xp_earned, coins: reward.coins_earned })}</p>
          )}
          <Button
            onClick={() => router.back()}
            className="mt-4 w-full rounded-xl"
          >
            {t('return-to-lesson')}
          </Button>
        </div>
      )}
    </section>
  );
};
