export type SharkbotChatSource = {
  id: string;
  title: string;
  category: string;
  score?: number;
  related_course_slug?: string;
};

export type SharkbotSuggestedLesson = {
  slug: string;
  title: string;
  category: string;
};

export type SharkbotChatMessage = {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  sources?: SharkbotChatSource[];
  suggested_lessons?: SharkbotSuggestedLesson[];
  audio_base64?: string | null;
  mime_type?: string | null;
  voice?: string;
  model?: string;
};
