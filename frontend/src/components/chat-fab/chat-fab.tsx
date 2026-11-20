import { Link } from '@/i18n/navigation';
import { ChatIcon } from '@/icons/chat';
import { routes } from '@/utils/routes';
import { getTranslations } from 'next-intl/server';
import Image from 'next/image';

/** Floating button on the home view that opens the Sharkbot chat view. */
export const ChatFab = async () => {
  const t = await getTranslations('components.chat-fab');

  return (
    <Link
      href={routes.chat}
      aria-label={t('label')}
      className="fixed right-4 bottom-28 z-20 flex items-center gap-2 rounded-full bg-blue-500 py-2 pl-2 pr-4 text-white font-semibold text-sm shadow-lg shadow-blue-500/30 transition-transform hover:scale-105 active:scale-95"
    >
      <span className="size-10 rounded-full bg-white overflow-hidden flex items-end justify-center">
        <Image src="/img/shark.svg" alt="" width={34} height={51} className="translate-y-2" />
      </span>
      <span>{t('cta')}</span>
      <ChatIcon className="text-xl stroke-[1.5]" />
    </Link>
  );
};
