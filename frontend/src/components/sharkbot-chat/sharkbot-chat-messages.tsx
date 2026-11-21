import { FormattedText } from '@/components/sharkbot-chat/formatted-text';
import { SharkbotChatMessage } from '@/components/sharkbot-chat/sharkbot-chat-types';
import { Link } from '@/i18n/navigation';
import { SpeakerIcon } from '@/icons/speaker';
import clsx from 'clsx';
import { Lottie } from 'lottie-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { RefObject } from 'react';
import sharkLoadingAnimation from '../../../public/lottie/shark-loading.json';

const SUGGESTION_KEYS = ['stocks-bonds', 'compound-interest', 'emergency-fund', 'etf', 'ike-ikze'] as const;

type SharkbotChatMessagesProps = {
  messages: SharkbotChatMessage[];
  isLoading: boolean;
  playingId: string | null;
  messagesEndRef: RefObject<HTMLDivElement | null>;
  onSendSuggestion: (text: string) => void;
  onListen: (message: SharkbotChatMessage) => void;
};

export const SharkbotChatMessages = ({
  messages,
  isLoading,
  playingId,
  messagesEndRef,
  onSendSuggestion,
  onListen,
}: SharkbotChatMessagesProps) => {
  const t = useTranslations('components.sharkbot-chat');

  return (
    <div className="flex flex-col gap-3 flex-1">
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
                onClick={() => onSendSuggestion(t(`suggestions.${key}`))}
                className="rounded-full border border-blue-100 bg-white px-3 py-1.5 text-xs text-blue-950 transition-colors hover:bg-blue-100 cursor-pointer"
              >
                {t(`suggestions.${key}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {messages.map((message) =>
        message.sender === 'user' ? (
          <div key={message.id} className="flex flex-col items-end gap-1">
            <div className="max-w-[85%] rounded-xl rounded-br-sm bg-blue-500 px-4 py-2.5 text-sm text-white whitespace-pre-line">
              {message.text}
            </div>
            <span className="text-[10px] text-grey-400">{message.timestamp}</span>
          </div>
        ) : (
          <div key={message.id} className="flex flex-col items-start gap-1">
            <div className="max-w-[92%] flex flex-col gap-3 rounded-xl rounded-bl-sm border border-blue-100 bg-white p-4 text-blue-950">
              <FormattedText text={message.text} />

              {message.sources && message.sources.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-grey-600">{t('sources')}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {message.sources.map((source) => (
                      <span key={source.id} className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] text-blue-950">
                        {source.title}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {message.suggested_lessons && message.suggested_lessons.length > 0 && (
                <div className="flex flex-col gap-1.5">
                  <p className="text-xs font-medium text-grey-600">{t('lessons')}</p>
                  {message.suggested_lessons.map((lesson) => (
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

              {!message.id.startsWith('error') && (
                <button
                  type="button"
                  onClick={() => onListen(message)}
                  className={clsx(
                    'flex w-fit items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer',
                    playingId === message.id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500 hover:bg-blue-100',
                  )}
                >
                  <SpeakerIcon className="text-base stroke-[1.5]" />
                  {playingId === message.id ? t('stop') : t('listen')}
                </button>
              )}
            </div>
            <span className="text-[10px] text-grey-400">{message.timestamp}</span>
          </div>
        ),
      )}

      {!isLoading && (
        <div className="flex items-end gap-3 rounded-xl border border-blue-100 bg-white p-4 isolate relative aspect-390/250 overflow-hidden">
          <div className="flex min-w-0 flex-1 flex-col gap-1 z-10 text-shadow-md">
            <p className="text-2xl font-medium text-white">{t('waiting-title')}</p>
            <p className="text-base text-white">{t('waiting-subtitle')}</p>
          </div>
          <div className="absolute inset-0">
            <Lottie src={sharkLoadingAnimation} loop autoplay aria-hidden />
          </div>
        </div>
      )}

      <div ref={messagesEndRef} />
    </div>
  );
};
