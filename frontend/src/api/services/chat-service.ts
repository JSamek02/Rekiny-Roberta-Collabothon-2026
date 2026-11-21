import { getApiClient } from '@/api/api-client';
import { ApiGetChatVoices, ApiPostChatMessage, ApiSynthesizeTTS } from '@/api/types/chat';
import { ApiResponse } from '@/api/types/common';
import { UseReactQuery, UseReactQueryMutation } from '@/api/types/react-query';
import { useMutation, useQuery } from '@tanstack/react-query';

export async function apiGetChatVoices(): Promise<ApiResponse<ApiGetChatVoices.Response>> {
  const client = await getApiClient();
  return await client.get<ApiGetChatVoices.Response>('/api/chat/voices');
}

export const useApiGetChatVoicesQuery: UseReactQuery<ApiGetChatVoices.Response, {}> = (_, options) => {
  return useQuery({
    queryKey: ['chat-voices'],
    queryFn: async () => {
      const result = await apiGetChatVoices();
      return result.data;
    },
    ...options,
  });
};

export async function apiSendChatMessage({
  body,
}: ApiPostChatMessage.Request): Promise<ApiResponse<ApiPostChatMessage.Response>> {
  const client = await getApiClient();
  return await client.post<ApiPostChatMessage.Response, ApiPostChatMessage.Body>('/api/chat/message', body);
}

export const useSendChatMessageMutation: UseReactQueryMutation<ApiPostChatMessage.Response, ApiPostChatMessage.Body> = (
  options,
) => {
  return useMutation({
    mutationKey: ['post-chat-message'],
    mutationFn: async (body: ApiPostChatMessage.Body) => {
      const res = await apiSendChatMessage({ body });
      return res.data;
    },
    ...options,
  });
};

export async function apiSynthesizeTts({
  body,
}: ApiSynthesizeTTS.Request): Promise<ApiResponse<ApiSynthesizeTTS.Response>> {
  const client = await getApiClient();
  return await client.post<ApiSynthesizeTTS.Response, ApiSynthesizeTTS.Body>('/api/chat/tts', body);
}

export const useSynthesizeTtsMutation: UseReactQueryMutation<ApiSynthesizeTTS.Response, ApiSynthesizeTTS.Body> = (
  options,
) => {
  return useMutation({
    mutationKey: ['synthesize-tts'],
    mutationFn: async (body: ApiSynthesizeTTS.Body) => {
      const res = await apiSynthesizeTts({ body });
      return res.data;
    },
    ...options,
  });
};
