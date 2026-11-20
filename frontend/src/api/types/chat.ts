export type VoiceOption = {
  id: string;
  name: string;
  style: string;
  description: string;
  gender: 'male' | 'female';
  recommended: boolean;
};

export type ChatSource = {
  id: string;
  title: string;
  category: string;
  score?: number;
  related_course_slug?: string;
};

export type SuggestedLesson = {
  slug: string;
  title: string;
  category: string;
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: ChatSource[];
  suggested_lessons?: SuggestedLesson[];
  audio_base64?: string | null;
  mime_type?: string | null;
  voice?: string;
  model?: string;
};

export type ChatRequest = {
  message: string;
  voice?: string;
  voice_enabled?: boolean;
  history?: { role: string; content: string }[];
};

export type ChatResponse = {
  reply: string;
  model: string;
  voice: string;
  voice_enabled: boolean;
  audio_base64?: string | null;
  mime_type?: string | null;
  sources: ChatSource[];
  suggested_lessons: SuggestedLesson[];
};

export type VoicesResponse = {
  voices: VoiceOption[];
  default_voice: string;
  model: string;
};
