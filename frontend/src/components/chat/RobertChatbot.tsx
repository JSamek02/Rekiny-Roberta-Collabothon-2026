'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ChatMessage, VoiceOption } from '@/api/types/chat';
import { fetchVoices, sendChatMessage, synthesizeTTS } from '@/api/chat';

const DEFAULT_VOICES: VoiceOption[] = [
  { id: 'Puck', name: 'Puck', style: 'Upbeat', description: 'Energiczny i dynamiczny — oficjalny głos Roberta!', gender: 'male', recommended: true },
  { id: 'Charon', name: 'Charon', style: 'Informative', description: 'Spokojny, analityczny mentor.', gender: 'male', recommended: false },
  { id: 'Aoede', name: 'Aoede', style: 'Breezy', description: 'Ciepły, swobodny i naturalny.', gender: 'female', recommended: false },
  { id: 'Kore', name: 'Kore', style: 'Firm', description: 'Zdecydowany i profesjonalny.', gender: 'female', recommended: false },
  { id: 'Zephyr', name: 'Zephyr', style: 'Bright', description: 'Jasny i pogodny.', gender: 'female', recommended: false },
  { id: 'Fenrir', name: 'Fenrir', style: 'Excitable', description: 'Pełen zapału do inwestycji.', gender: 'male', recommended: false },
];

const SUGGESTIONS = [
  '🦈 Czym się różni akcja od obligacji?',
  '💰 Jak działa procent składany?',
  '🛡️ Jak zbudować poduszkę finansową?',
  '📈 Czym są ETF-y i jak zacząć pasywnie?',
  '🇵🇱 Jak działa IKE i IKZE w Polsce?',
];

export function RobertChatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: 'Ahoj! Tu Robert Biznesu 🦈 — Twój osobisty mentor po oceanie finansów w platformie Finance Quest!\n\nZadaj mi dowolne pytanie o inwestowanie, budżetowanie, giełdę GPW czy fundusze ETF. Używam bazy wiedzy i lekcji platformy, a także potrafię rozmawiać wybranym głosem AI!',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      model: 'gemini-4-hydrogen',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [voices, setVoices] = useState<VoiceOption[]>(DEFAULT_VOICES);
  const [selectedVoice, setSelectedVoice] = useState('Puck');
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speechRecognitionRef = useRef<any>(null);

  useEffect(() => {
    fetchVoices()
      .then((data) => {
        if (data.voices && data.voices.length > 0) {
          setVoices(data.voices);
          if (data.default_voice) setSelectedVoice(data.default_voice);
        }
      })
      .catch((err) => {
        console.warn('Using default fallback voices:', err);
      });
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const playAudio = (audioBase64: string, messageId: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    try {
      const audioUrl = `data:audio/wav;base64,${audioBase64}`;
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      setPlayingAudioId(messageId);

      audio.onended = () => {
        setPlayingAudioId(null);
      };
      audio.onerror = () => {
        setPlayingAudioId(null);
      };
      audio.play().catch((err) => {
        console.warn('Audio play was interrupted:', err);
        setPlayingAudioId(null);
      });
    } catch (e) {
      console.error('Error playing audio:', e);
      setPlayingAudioId(null);
    }
  };

  const handleSynthesizeAndPlay = async (msg: ChatMessage) => {
    if (playingAudioId === msg.id) {
      audioRef.current?.pause();
      setPlayingAudioId(null);
      return;
    }

    if (msg.audio_base64) {
      playAudio(msg.audio_base64, msg.id);
      return;
    }

    try {
      setPlayingAudioId(msg.id);
      const blob = await synthesizeTTS(msg.text, selectedVoice);
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Data = (reader.result as string).split(',')[1];
        if (base64Data) {
          msg.audio_base64 = base64Data;
          playAudio(base64Data, msg.id);
        }
      };
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error('TTS synthesis error:', err);
      setPlayingAudioId(null);
    }
  };

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        content: m.text,
      }));

      const res = await sendChatMessage({
        message: text,
        voice: selectedVoice,
        voice_enabled: voiceEnabled,
        history,
      });

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sources: res.sources,
        suggested_lessons: res.suggested_lessons,
        audio_base64: res.audio_base64,
        voice: res.voice,
        model: res.model,
      };

      setMessages((prev) => [...prev, assistantMsg]);

      if (voiceEnabled && res.audio_base64) {
        playAudio(res.audio_base64, assistantMsg.id);
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sender: 'assistant',
        text: `Ups! Rekin natrafił na mieliznę techniczną: ${err?.message || 'Nie udało się połączyć z API'}. Spróbuj ponownie za chwilę!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Rozpoznawanie mowy w przeglądarce nie jest wspierane. Wpisz pytanie w pole tekstowe.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'pl-PL';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsRecording(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
        setIsRecording(false);
      };

      recognition.onerror = (err: any) => {
        console.warn('Speech recognition error:', err);
        setIsRecording(false);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      speechRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsRecording(false);
    }
  };

  return (
    <div className="flex flex-col h-[750px] w-full max-w-4xl mx-auto bg-white dark:bg-zinc-900 border border-cyan-200 dark:border-cyan-900/50 rounded-2xl shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:px-6 bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-700 text-white shadow-md">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 text-2xl shadow-inner">
            🦈
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 border-2 border-white rounded-full animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold tracking-tight">Robert Biznesu AI</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-400/30 border border-cyan-200/40 text-cyan-100 font-medium">
                Gemini 4 + 3.8 TTS RAG
              </span>
            </div>
            <p className="text-xs text-blue-100/90">
              Inteligentny mentor finansowy platformy Rekiny Roberta
            </p>
          </div>
        </div>

        {/* Voice Controls */}
        <div className="flex items-center gap-3 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/15">
          <label className="text-xs font-medium text-cyan-100 flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(e) => setVoiceEnabled(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
            <span>Głos AI</span>
          </label>

          <div className="h-4 w-px bg-white/20" />

          <div className="flex items-center gap-1 text-xs">
            <span className="text-blue-200">Głos:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="bg-white/10 text-white rounded-lg px-2 py-1 text-xs border border-white/20 focus:outline-none focus:ring-1 focus:ring-cyan-300 cursor-pointer"
            >
              {voices.map((v) => (
                <option key={v.id} value={v.id} className="text-black bg-white">
                  {v.name} ({v.style}) {v.recommended ? '★' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-zinc-50/50 dark:bg-zinc-950/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
          >
            <div
              className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-sm ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700/60 rounded-bl-none'
              }`}
            >
              {/* Header inside bubble */}
              <div className="flex items-center justify-between gap-4 mb-1 text-xs opacity-75">
                <span className="font-semibold">
                  {msg.sender === 'user' ? 'Ty' : 'Robert Biznesu 🦈'}
                </span>
                <span>{msg.timestamp}</span>
              </div>

              {/* Message text with basic whitespace & formatting */}
              <div className="whitespace-pre-line text-sm leading-relaxed">{msg.text}</div>

              {/* Audio playback button for assistant */}
              {msg.sender === 'assistant' && (
                <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-700/50 flex flex-wrap items-center justify-between gap-2">
                  <button
                    onClick={() => handleSynthesizeAndPlay(msg)}
                    className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 hover:bg-cyan-100 transition-colors cursor-pointer"
                  >
                    {playingAudioId === msg.id ? (
                      <>
                        <span className="inline-block w-2.5 h-2.5 bg-red-500 rounded-sm animate-pulse" />
                        <span>Zatrzymaj mowę</span>
                      </>
                    ) : (
                      <>
                        <span>🔊</span>
                        <span>Odsłuchaj ({selectedVoice})</span>
                      </>
                    )}
                  </button>

                  {msg.model && (
                    <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-mono">
                      {msg.model}
                    </span>
                  )}
                </div>
              )}

              {/* RAG Sources Citations */}
              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-3 pt-2 border-t border-cyan-100 dark:border-zinc-700/60 text-xs">
                  <div className="font-semibold text-cyan-800 dark:text-cyan-300 flex items-center gap-1 mb-1.5">
                    <span>📚</span> Źródła z Bazy Wiedzy RAG:
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.sources.map((src) => (
                      <span
                        key={src.id}
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-cyan-100/70 dark:bg-cyan-900/40 text-cyan-900 dark:text-cyan-200 text-[11px]"
                      >
                        {src.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggested Lessons from platform */}
              {msg.suggested_lessons && msg.suggested_lessons.length > 0 && (
                <div className="mt-2.5 text-xs">
                  <div className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1">
                    <span>🚀</span> Rekomendowane lekcje na platformie:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {msg.suggested_lessons.map((lesson) => (
                      <a
                        key={lesson.slug}
                        href={`/courses/${lesson.slug}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition-colors font-medium text-xs"
                      >
                        <span>Przejdź do: {lesson.title}</span>
                        <span>→</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-center gap-2 p-3 text-sm text-zinc-500 dark:text-zinc-400 bg-white/70 dark:bg-zinc-800/70 rounded-2xl w-fit border border-zinc-200 dark:border-zinc-700">
            <span className="animate-spin text-lg">🦈</span>
            <span>Robert Biznesu analizuje bazę wiedzy i przygotowuje odpowiedź...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Questions */}
      <div className="px-4 py-2 bg-zinc-100 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0">
          Podpowiedzi:
        </span>
        {SUGGESTIONS.map((sug, idx) => (
          <button
            key={idx}
            onClick={() => handleSendMessage(sug)}
            className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-zinc-800 hover:bg-cyan-50 dark:hover:bg-cyan-950 text-zinc-700 dark:text-zinc-300 border border-zinc-300/80 dark:border-zinc-700 transition-colors shrink-0 cursor-pointer"
          >
            {sug}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          {/* Voice input mic button */}
          <button
            type="button"
            onClick={toggleVoiceRecording}
            title={isRecording ? 'Zatrzymaj nagrywanie' : 'Czat głosowy — powiedz pytanie'}
            className={`flex items-center justify-center w-11 h-11 rounded-xl transition-all cursor-pointer ${
              isRecording
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-cyan-100 dark:hover:bg-cyan-950 hover:text-cyan-600'
            }`}
          >
            {isRecording ? '⏹️' : '🎙️'}
          </button>

          {/* Text Input */}
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              isRecording
                ? 'Mów teraz do mikrofonu...'
                : 'Zapytaj Roberta Biznesu o finanse, giełdę, ETF-y...'
            }
            className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-300/80 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-sm transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Wyślij
          </button>
        </form>
      </div>
    </div>
  );
}
