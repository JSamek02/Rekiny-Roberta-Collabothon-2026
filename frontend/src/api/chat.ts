import { ChatRequest, ChatResponse, VoicesResponse } from './types/chat';

const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || '';

export async function fetchVoices(): Promise<VoicesResponse> {
  const url = `${API_BASE}/api/chat/voices`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { 'Accept': 'application/json' },
  });
  if (!res.ok) {
    throw new Error(`Failed to load voices: ${res.status}`);
  }
  return res.json();
}

export async function sendChatMessage(data: ChatRequest): Promise<ChatResponse> {
  const url = `${API_BASE}/api/chat/message`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const errorJson = await res.json().catch(() => ({}));
    throw new Error(errorJson.error || `HTTP ${res.status}: Failed to send message`);
  }
  return res.json();
}

export async function synthesizeTTS(text: string, voice: string = 'Puck'): Promise<Blob> {
  const url = `${API_BASE}/api/chat/tts`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'audio/wav',
    },
    body: JSON.stringify({ text, voice, format: 'audio' }),
  });
  if (!res.ok) {
    throw new Error(`TTS synthesis failed: ${res.status}`);
  }
  return res.blob();
}
