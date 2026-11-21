import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';

type SharkbotChatHeaderProps = {
  voiceEnabled: boolean;
  onVoiceEnabledChange: (enabled: boolean) => void;
};

export const SharkbotChatHeader = ({
  voiceEnabled,
  onVoiceEnabledChange,
}: SharkbotChatHeaderProps) => {
  const t = useTranslations('components.sharkbot-chat');

  return (
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

        <div className="flex items-center gap-2 rounded-xl border border-blue-100 bg-white px-3 py-1.5 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-blue-950">
            <input
              type="checkbox"
              checked={voiceEnabled}
              onChange={(event) => onVoiceEnabledChange(event.target.checked)}
              className="size-4 accent-blue-500 cursor-pointer"
            />
            {t('voice')}
          </label>
        </div>
      </div>
    </div>
  );
};
