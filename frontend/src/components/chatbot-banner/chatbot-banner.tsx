import { getTranslations } from 'next-intl/server';
import { buttonVariants } from '@/ui';
import { ChatsIcon } from '@/icons/chats';
import { Link } from '@/i18n/navigation';
import clsx from 'clsx';
import { routes } from '@/utils/routes';
import { SharkWaveEasterEgg } from './shark-wave-easter-egg';

export const ChatbotBanner = async () => {
  const t = await getTranslations('components.chatbot-banner');

  return (
    <section className="grid grid-cols-2 grow isolate">
      <div className="bg-white relative drop-shadow-outline shadow-blue-100 rounded-md p-4 flex flex-col gap-2 self-start">
        <span className="size-4 rotate-45 bg-white absolute right-0 translate-x-1/2 top-10" />
        <h2 className="font-medium leading-none">
          <span className="line-through text-grey-600">{t('heading-strike-through')}</span>
          <span className="text-2xl text-blue-950">{t('heading')}</span>
        </h2>
        <p className="text-grey-600 text-sm">{t('description')}</p>
        <Link href={routes.chat} className={clsx('gap-2', buttonVariants())}>
          {t('cta')}
          <ChatsIcon className="stroke-2 text-xl" />
        </Link>
      </div>
      <div className="-z-10">
        <SharkWaveEasterEgg />
      </div>
    </section>
  );
};
