import { getApiClient } from '@/api/api-client';
import { invalidateExperienceQueries } from '@/api/services/auth-service';
import { ApiResponse } from '@/api/types/common';
import {
  CompleteActivityResponse,
  LearningActivityResponse,
  RoadmapCourseResponse,
  SubmitLearningQuizParams,
  SubmitQuizResponse,
} from '@/api/types/learning';
import { UseReactQuery, UseReactQueryMutation } from '@/api/types/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

type ActivityParams = {
  activityId: number;
};

type RoadmapCourseParams = {
  courseSlug: string;
};

export const LEARNING_QUERY_KEYS = {
  root: ['learning'],
  roadmapCourse: (courseSlug: string) => ['learning', 'roadmap-course', courseSlug],
  activity: (activityId: number) => ['learning', 'activity', activityId],
};

export async function apiGetRoadmapCourse({
  courseSlug,
}: RoadmapCourseParams): Promise<ApiResponse<RoadmapCourseResponse>> {
  const client = await getApiClient();
  return client.get<RoadmapCourseResponse>(`/api/courses/${courseSlug}`);
}

export const useApiGetRoadmapCourseQuery: UseReactQuery<RoadmapCourseResponse, RoadmapCourseParams> = (
  { courseSlug },
  options,
) => {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.roadmapCourse(courseSlug),
    queryFn: async () => {
      const result = await apiGetRoadmapCourse({ courseSlug });
      return result.data;
    },
    ...options,
  });
};

export async function apiGetLearningActivity({
  activityId,
}: ActivityParams): Promise<ApiResponse<LearningActivityResponse>> {
  const client = await getApiClient();
  return client.get<LearningActivityResponse>(`/api/activities/${activityId}`);
}

export const useApiGetLearningActivityQuery: UseReactQuery<LearningActivityResponse, ActivityParams> = (
  { activityId },
  options,
) => {
  return useQuery({
    queryKey: LEARNING_QUERY_KEYS.activity(activityId),
    queryFn: async () => {
      const result = await apiGetLearningActivity({ activityId });
      return result.data;
    },
    ...options,
  });
};

export async function apiCompleteLearningActivity({
  activityId,
}: ActivityParams): Promise<ApiResponse<CompleteActivityResponse>> {
  const client = await getApiClient();
  return client.post<CompleteActivityResponse>(`/api/activities/${activityId}/complete`);
}

export const useCompleteLearningActivityMutation: UseReactQueryMutation<CompleteActivityResponse, ActivityParams> = (
  options,
) => {
  const queryClient = useQueryClient();
  return useMutation<CompleteActivityResponse, Error, ActivityParams>({
    mutationKey: ['complete-learning-activity'],
    mutationFn: async ({ activityId }) => {
      const result = await apiCompleteLearningActivity({ activityId });
      return result.data;
    },
    ...options,
    onSuccess: async (data, ...rest) => {
      // EXP was added to the account only when the backend saved the completion.
      if (data.persisted) await invalidateExperienceQueries(queryClient);
      await options?.onSuccess?.(data, ...rest);
    },
  });
};

export async function apiSubmitLearningQuiz({
  activityId,
  answers,
}: SubmitLearningQuizParams): Promise<ApiResponse<SubmitQuizResponse>> {
  const client = await getApiClient();
  return client.post<SubmitQuizResponse, { answers: Record<string, string> }>(
    `/api/activities/${activityId}/quiz-submit`,
    { answers },
  );
}

export const useSubmitLearningQuizMutation: UseReactQueryMutation<SubmitQuizResponse, SubmitLearningQuizParams> = (
  options,
) => {
  const queryClient = useQueryClient();
  return useMutation<SubmitQuizResponse, Error, SubmitLearningQuizParams>({
    mutationKey: ['submit-learning-quiz'],
    mutationFn: async (params) => {
      const result = await apiSubmitLearningQuiz(params);
      return result.data;
    },
    ...options,
    onSuccess: async (data, ...rest) => {
      // A passed quiz saved for a signed-in user awards EXP.
      if (data.persisted && data.passed) await invalidateExperienceQueries(queryClient);
      await options?.onSuccess?.(data, ...rest);
    },
  });
};
