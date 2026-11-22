'use client';

import {
  useSendChatMessageMutation,
  useSynthesizeTtsMutation,
} from '@/api/services/chat-service';
import { SharkbotChatComposer } from '@/components/sharkbot-chat/sharkbot-chat-composer';
import { SharkbotChatHeader } from '@/components/sharkbot-chat/sharkbot-chat-header';
import { SharkbotChatMessages } from '@/components/sharkbot-chat/sharkbot-chat-messages';
import { SharkbotChatMessage } from '@/components/sharkbot-chat/sharkbot-chat-types';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useRef, useState } from 'react';

const VOICE = 'Algieba';
const HISTORY_LIMIT = 6;
const SPEECH_RECOGNITION_LOCALES = { pl: 'pl-PL', en: 'en-US', de: 'de-DE' } as const;

type SpeechRecognitionResultEvent = { results: ArrayLike<ArrayLike<{ transcript: string }>> };
type SpeechRecognitionInstance = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionResultEvent) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

const getSpeechRecognition = (): SpeechRecognitionConstructor | undefined => {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
};

const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

export const SharkbotChat = () => {
  const t = useTranslations('components.sharkbot-chat');
  const locale = useLocale();
  const sendChatMutation = useSendChatMessageMutation();
  const synthesizeTtsMutation = useSynthesizeTtsMutation();

  const [messages, setMessages] = useState<SharkbotChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [bottomOffset, setBottomOffset] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef(new Map<string, string>());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const observer = new ResizeObserver(() => setBottomOffset(nav.offsetHeight));
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sendChatMutation.isPending]);

  useEffect(() => {
    const urls = audioUrlsRef.current;
    return () => {
      audioRef.current?.pause();
      recognitionRef.current?.stop();
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const nextId = (prefix: string) => {
    idCounterRef.current += 1;
    return `${prefix}-${idCounterRef.current}`;
  };

  const stopAudio = () => {
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingId(null);
  };

  const playSource = (src: string, messageId: string) => {
    audioRef.current?.pause();
    const audio = new Audio(src);
    audioRef.current = audio;
    setPlayingId(messageId);
    audio.onended = () => setPlayingId((id) => (id === messageId ? null : id));
    audio.onerror = () => setPlayingId((id) => (id === messageId ? null : id));
    audio.play().catch((error) => {
      console.warn('[Sharkbot] Audio playback blocked:', error);
      setPlayingId(null);
    });
  };

  const handleListen = async (message: SharkbotChatMessage) => {
    if (playingId === message.id) {
      stopAudio();
      return;
    }

    if (message.audio_base64) {
      playSource(`data:${message.mime_type || 'audio/wav'};base64,${message.audio_base64}`, message.id);
      return;
    }

    const cachedUrl = audioUrlsRef.current.get(message.id);
    if (cachedUrl) {
      playSource(cachedUrl, message.id);
      return;
    }

    try {
      setPlayingId(message.id);
      const result = await synthesizeTtsMutation.mutateAsync({
        text: message.text,
        voice: VOICE,
        format: 'json',
      });
      const jsonResult = result as unknown as {
        audio_base64: string;
        mime_type: string;
      };
      playSource(
        `data:${jsonResult.mime_type || 'audio/wav'};base64,${jsonResult.audio_base64}`,
        message.id,
      );
    } catch (error) {
      console.error('[Sharkbot] TTS error:', error);
      setPlayingId(null);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || sendChatMutation.isPending) return;

    const userMessage: SharkbotChatMessage = {
      id: nextId('user'),
      sender: 'user',
      text,
      timestamp: formatTime(new Date()),
    };

    const history = messages
      .filter((message) => !message.id.startsWith('error'))
      .slice(-HISTORY_LIMIT)
      .map((message) => ({
        role: message.sender === 'user' ? 'user' : 'model',
        content: message.text,
      }));

    setMessages((previous) => [...previous, userMessage]);
    setInputText('');

    try {
      const response = await sendChatMutation.mutateAsync({
        message: text,
        language: locale,
        voice: VOICE,
        voice_enabled: voiceEnabled,
        history,
      });

      const botMessage: SharkbotChatMessage = {
        id: nextId('bot'),
        sender: 'assistant',
        text: response.reply,
        timestamp: formatTime(new Date()),
        sources: response.sources,
        suggested_lessons: response.suggested_lessons,
        audio_base64: response.audio_base64,
        mime_type: response.mime_type,
        voice: response.voice,
        model: response.model,
      };
      setMessages((previous) => [...previous, botMessage]);

      if (voiceEnabled && response.audio_base64) {
        playSource(
          `data:${response.mime_type || 'audio/wav'};base64,${response.audio_base64}`,
          botMessage.id,
        );
      }
    } catch (error: unknown) {
      console.error('[Sharkbot] Chat error:', error);
      let feedbackText = t('error');

      if (error && typeof error === 'object') {
        const errObj = error as {
          data?: { error?: string };
          response?: { data?: { error?: string } };
          message?: string;
        };
        const backendError = errObj.data?.error || errObj.response?.data?.error;
        if (typeof backendError === 'string' && backendError.trim()) {
          feedbackText = backendError;
        } else if (typeof errObj.message === 'string' && !errObj.message.startsWith('[API] HTTP')) {
          feedbackText = errObj.message;
        }
      }

      setMessages((previous) => [
        ...previous,
        {
          id: nextId('error'),
          sender: 'assistant',
          text: feedbackText,
          timestamp: formatTime(new Date()),
        },
      ]);
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      alert(t('mic-unsupported'));
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_RECOGNITION_LOCALES[locale];
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setIsRecording(false);
      if (transcript) void handleSend(transcript);
    };
    recognition.onerror = (event) => {
      console.warn('[Sharkbot] Speech recognition error:', event);
      setIsRecording(false);
    };
    recognition.onend = () => setIsRecording(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('[Sharkbot] Could not start speech recognition:', error);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-4 px-5 pt-4">
      <SharkbotChatHeader
        voiceEnabled={voiceEnabled}
        onVoiceEnabledChange={setVoiceEnabled}
      />
      <SharkbotChatMessages
        messages={messages}
        isLoading={sendChatMutation.isPending}
        playingId={playingId}
        messagesEndRef={messagesEndRef}
        onSendSuggestion={(text) => void handleSend(text)}
        onListen={(message) => void handleListen(message)}
      />
      <SharkbotChatComposer
        inputText={inputText}
        bottomOffset={bottomOffset}
        isLoading={sendChatMutation.isPending}
        isRecording={isRecording}
        onInputChange={setInputText}
        onSend={() => void handleSend()}
        onToggleRecording={toggleRecording}
      />
    </div>
  );
};
