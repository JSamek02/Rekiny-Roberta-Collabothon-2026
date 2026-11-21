import { MicIcon } from '@/icons/mic';
import { SendIcon } from '@/icons/send';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

type SharkbotChatComposerProps = {
  inputText: string;
  bottomOffset: number;
  isLoading: boolean;
  isRecording: boolean;
  onInputChange: (text: string) => void;
  onSend: () => void;
  onToggleRecording: () => void;
};

export const SharkbotChatComposer = ({
  inputText,
  bottomOffset,
  isLoading,
  isRecording,
  onInputChange,
  onSend,
  onToggleRecording,
}: SharkbotChatComposerProps) => {
  const t = useTranslations('components.sharkbot-chat');

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        onSend();
      }}
      style={{ bottom: bottomOffset }}
      className="sticky z-10 -mx-5 flex items-center gap-2 bg-blue-50 px-5 py-3"
    >
      <button
        type="button"
        onClick={onToggleRecording}
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
        onChange={(event) => onInputChange(event.target.value)}
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
  );
};
