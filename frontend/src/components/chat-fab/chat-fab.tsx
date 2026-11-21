'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { ChatsIcon } from '@/icons/chats';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';

/** Floating chat-bubble button that opens the Sharkbot chat view. */
export const ChatFab = () => {
  const t = useTranslations('components.chat-fab');
  const pathname = usePathname();

  if (([routes.learning, routes.chat, routes.startingQuiz, routes.cakeGame] as string[]).includes(pathname)) {
    return null;
  }

  return (
    <Link
      href={routes.chat}
      aria-label={t('label')}
      className="fixed right-4 bottom-28 z-20 text-white bg-blue-500 size-14 flex items-center justify-center drop-shadow-lg transition-transform origin-bottom-right hover:scale-105 active:scale-95 rounded-full"
    >
      <ChatsIcon className="text-3xl stroke-2" />
    </Link>
  );
};
