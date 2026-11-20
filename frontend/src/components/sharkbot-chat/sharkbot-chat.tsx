'use client';

import { fetchVoices, sendChatMessage, synthesizeTTS } from '@/api/chat';
import { ChatMessage, VoiceOption } from '@/api/types/chat';
import { FormattedText } from '@/components/sharkbot-chat/formatted-text';
import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { MicIcon } from '@/icons/mic';
import { SendIcon } from '@/icons/send';
import { SpeakerIcon } from '@/icons/speaker';
import { routes } from '@/utils/routes';
import clsx from 'clsx';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import React, { useEffect, useRef, useState } from 'react';

const DEFAULT_VOICE = 'Puck';
const HISTORY_LIMIT = 6;
const SUGGESTION_KEYS = ['stocks-bonds', 'compound-interest', 'emergency-fund', 'etf', 'ike-ikze'] as const;

// Minimal typings for the Web Speech API (not included in the TS DOM lib).
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

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [selectedVoice, setSelectedVoice] = useState(DEFAULT_VOICE);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [bottomOffset, setBottomOffset] = useState(0);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlsRef = useRef(new Map<string, string>());
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const idCounterRef = useRef(0);

  // Load voice list from the backend
  useEffect(() => {
    fetchVoices()
      .then((data) => {
        if (data.voices?.length) setVoices(data.voices);
        if (data.default_voice) setSelectedVoice(data.default_voice);
      })
      .catch((err) => console.warn('[Sharkbot] Could not load voices:', err));
  }, []);

  // Keep the composer just above the sticky bottom navigation
  useEffect(() => {
    const nav = document.querySelector('nav');
    if (!nav) return;
    const observer = new ResizeObserver(() => setBottomOffset(nav.offsetHeight));
    observer.observe(nav);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, isLoading]);

  // Stop audio and free object URLs when leaving the view
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
    audio.play().catch((err) => {
      console.warn('[Sharkbot] Audio playback blocked:', err);
      setPlayingId(null);
    });
  };

  const handleListen = async (msg: ChatMessage) => {
    if (playingId === msg.id) {
      stopAudio();
      return;
    }

    if (msg.audio_base64) {
      playSource(`data:${msg.mime_type || 'audio/wav'};base64,${msg.audio_base64}`, msg.id);
      return;
    }

    const cachedUrl = audioUrlsRef.current.get(msg.id);
    if (cachedUrl) {
      playSource(cachedUrl, msg.id);
      return;
    }

    try {
      setPlayingId(msg.id);
      const blob = await synthesizeTTS(msg.text, selectedVoice);
      const url = URL.createObjectURL(blob);
      audioUrlsRef.current.set(msg.id, url);
      playSource(url, msg.id);
    } catch (err) {
      console.error('[Sharkbot] TTS error:', err);
      setPlayingId(null);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend ?? inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: nextId('user'),
      sender: 'user',
      text,
      timestamp: formatTime(new Date()),
    };

    const history = messages
      .filter((m) => !m.id.startsWith('error'))
      .slice(-HISTORY_LIMIT)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'model', content: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const res = await sendChatMessage({
        message: text,
        voice: selectedVoice,
        voice_enabled: voiceEnabled,
        history,
      });

      const botMsg: ChatMessage = {
        id: nextId('bot'),
        sender: 'assistant',
        text: res.reply,
        timestamp: formatTime(new Date()),
        sources: res.sources,
        suggested_lessons: res.suggested_lessons,
        audio_base64: res.audio_base64,
        mime_type: res.mime_type,
        voice: res.voice,
        model: res.model,
      };
      setMessages((prev) => [...prev, botMsg]);

      if (voiceEnabled && res.audio_base64) {
        playSource(`data:${res.mime_type || 'audio/wav'};base64,${res.audio_base64}`, botMsg.id);
      }
    } catch (err) {
      console.error('[Sharkbot] Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: nextId('error'),
          sender: 'assistant',
          text: t('error'),
          timestamp: formatTime(new Date()),
        },
      ]);
    } finally {
      setIsLoading(false);
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
    recognition.lang = locale === 'pl' ? 'pl-PL' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript ?? '';
      setIsRecording(false);
      if (transcript) handleSend(transcript);
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
    } catch (err) {
      console.error('[Sharkbot] Could not start speech recognition:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col flex-1 gap-4 px-5 pt-4">
      {/* Back link + title */}
      <div className="flex flex-col gap-3">
        <Link href={routes.home} className="flex items-center gap-1 text-sm uppercase text-blue-950 w-fit">
          <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
          <span>{t('back')}</span>
        </Link>

        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-base text-grey-600 line-through">{t('title-strike')}</p>
            <h1 className="text-2xl font-medium leading-none text-blue-950">{t('title')}</h1>
          </div>

          {/* Voice controls */}
          <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-1.5 text-xs">
            <label className="flex items-center gap-1.5 cursor-pointer font-medium text-blue-950">
              <input
                type="checkbox"
                checked={voiceEnabled}
                onChange={(e) => setVoiceEnabled(e.target.checked)}
                className="size-4 accent-blue-500 cursor-pointer"
              />
              {t('voice')}
            </label>
            {voices.length > 0 && (
              <select
                value={selectedVoice}
                onChange={(e) => setSelectedVoice(e.target.value)}
                aria-label={t('voice-select')}
                className="rounded-md bg-blue-50 px-1.5 py-1 text-blue-950 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                {voices.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex flex-col gap-3 flex-1">
        {/* Intro card, styled like the "Sharkbot!" card from the dashboard design */}
        <div className="relative flex items-end gap-3 rounded-xl border border-blue-100 bg-white p-4 overflow-hidden">
          <p className="text-sm text-grey-600 flex-1">{t('intro')}</p>
          <Image src="/img/shark.svg" alt="" width={80} height={120} className="-mb-10 shrink-0" />
        </div>

        {messages.length === 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-medium text-grey-600">{t('suggestions-title')}</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTION_KEYS.map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSend(t(`suggestions.${key}`))}
                  className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs text-blue-950 transition-colors hover:bg-blue-100 cursor-pointer"
                >
                  {t(`suggestions.${key}`)}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) =>
          msg.sender === 'user' ? (
            <div key={msg.id} className="flex flex-col items-end gap-1">
              <div className="max-w-[85%] rounded-xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white whitespace-pre-line">
                {msg.text}
              </div>
              <span className="text-[10px] text-grey-400">{msg.timestamp}</span>
            </div>
          ) : (
            <div key={msg.id} className="flex flex-col items-start gap-1">
              <div className="max-w-[92%] flex flex-col gap-3 rounded-xl rounded-bl-sm border border-blue-100 bg-white p-4 text-blue-950">
                <FormattedText text={msg.text} />

                {msg.sources && msg.sources.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-grey-600">{t('sources')}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {msg.sources.map((src) => (
                        <span key={src.id} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] text-blue-950">
                          {src.title}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {msg.suggested_lessons && msg.suggested_lessons.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    <p className="text-xs font-medium text-grey-600">{t('lessons')}</p>
                    {msg.suggested_lessons.map((lesson) => (
                      <Link
                        key={lesson.slug}
                        href={`/courses/${lesson.slug}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-blue-100 px-3 py-2 text-xs font-semibold text-blue-950 transition-colors hover:bg-blue-50"
                      >
                        <span>{lesson.title}</span>
                        <span aria-hidden>→</span>
                      </Link>
                    ))}
                  </div>
                )}

                {!msg.id.startsWith('error') && (
                  <button
                    type="button"
                    onClick={() => handleListen(msg)}
                    className={clsx(
                      'flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                      playingId === msg.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500 hover:bg-blue-100',
                    )}
                  >
                    <SpeakerIcon className="text-base stroke-[1.5]" />
                    {playingId === msg.id ? t('stop') : t('listen')}
                  </button>
                )}
              </div>
              <span className="text-[10px] text-grey-400">{msg.timestamp}</span>
            </div>
          ),
        )}

        {isLoading && (
          <div className="relative flex flex-col gap-1 overflow-hidden rounded-xl border border-blue-100 bg-white p-4 pb-16">
            <p className="text-2xl font-medium text-[#617bff]">{t('waiting-title')}</p>
            <p className="text-base text-[#061d8d]">{t('waiting-subtitle')}</p>
            {/* Waves with the shark fin, from the "Please wait!" screen in the design */}
            <div className="absolute inset-x-0 bottom-0 h-14 animate-pulse">
              <Image src="/img/waves.svg" alt="" fill className="object-cover object-top" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ bottom: bottomOffset }}
        className="sticky z-10 -mx-5 flex items-center gap-2 bg-blue-50 px-5 py-3"
      >
        <button
          type="button"
          onClick={toggleRecording}
          aria-label={isRecording ? t('mic-stop') : t('mic-start')}
          title={isRecording ? t('mic-stop') : t('mic-start')}
          className={clsx(
            'flex size-10 shrink-0 items-center justify-center rounded-lg border transition-colors cursor-pointer',
            isRecording
              ? 'animate-pulse border-blue-500 bg-blue-500 text-white'
              : 'border-blue-100 bg-white text-blue-950 hover:bg-blue-100',
          )}
        >
          <MicIcon className="text-xl stroke-[1.5]" />
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={isRecording ? t('placeholder-listening') : t('placeholder')}
          className="h-10 min-w-0 flex-1 rounded-lg border border-blue-100 bg-white px-3 text-sm text-blue-950 placeholder:text-grey-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isLoading}
          aria-label={t('send')}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg bg-blue-500 px-4 text-sm font-semibold text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          <span className="hidden min-[380px]:inline">{t('send')}</span>
          <SendIcon className="text-lg stroke-[1.5]" />
        </button>
      </form>
    </div>
  );
};
