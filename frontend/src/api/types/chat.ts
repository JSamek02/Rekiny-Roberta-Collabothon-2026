import { ApiRequest } from '@/api/types/common';

export namespace ApiPostChatMessage {
  type ChatSource = {
    id: string;
    title: string;
    category: string;
    score?: number;
    related_course_slug?: string;
  };

  type SuggestedLesson = {
    slug: string;
    title: string;
    category: string;
  };

  export type Body = {
    message: string;
    voice?: string;
    voice_enabled?: boolean;
    history?: { role: string; content: string }[];
  };

  export type Request = ApiRequest<never, never, never, Body>;

  export type Response = {
    reply: string;
    model: string;
    voice: string;
    voice_enabled: boolean;
    audio_base64?: string | null;
    mime_type?: string | null;
    sources: ChatSource[];
    suggested_lessons: SuggestedLesson[];
  };
}

export namespace ApiGetChatVoices {
  type VoiceOption = {
    id: string;
    name: string;
    style: string;
    description: string;
    gender: 'male' | 'female';
    recommended: boolean;
  };

  export type Response = {
    voices: VoiceOption[];
    default_voice: string;
    model: string;
  };
}

export namespace ApiSynthesizeTTS {
  export type Body = {
    text: string;
    voice: string;
    format: string;
  };

  export type Request = ApiRequest<never, never, never, Body>;

  export type Response = Blob;
}
