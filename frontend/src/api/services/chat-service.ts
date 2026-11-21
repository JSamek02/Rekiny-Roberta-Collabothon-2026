import { getApiClient } from '@/api/api-client';
import { ApiGetChatVoices, ApiPostChatMessage, ApiSynthesizeTTS } from '@/api/types/chat';
import { ApiResponse } from '@/api/types/common';

export async function apiGetChatVoices(): Promise<ApiResponse<ApiGetChatVoices.Response>> {
  const client = await getApiClient();
  return await client.get<ApiGetChatVoices.Response>('/api/chat/voices');
}

export async function sendChatMessage({
  body,
}: ApiPostChatMessage.Request): Promise<ApiResponse<ApiPostChatMessage.Response>> {
  const client = await getApiClient();
  return await client.post<ApiPostChatMessage.Response, ApiPostChatMessage.Body>('/api/chat/message', body);
}

export async function synthesizeTTS({
  body,
}: ApiSynthesizeTTS.Request): Promise<ApiResponse<ApiSynthesizeTTS.Response>> {
  const client = await getApiClient();
  return await client.post<ApiSynthesizeTTS.Response, ApiSynthesizeTTS.Body>('/api/chat/tts', body);
}
