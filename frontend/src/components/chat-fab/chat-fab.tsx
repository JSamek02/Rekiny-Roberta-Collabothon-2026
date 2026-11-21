'use client';

import { Link, usePathname } from '@/i18n/navigation';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';

/** Floating chat-bubble button that opens the Sharkbot chat view. */
export const ChatFab = () => {
  const t = useTranslations('components.chat-fab');
  const pathname = usePathname();

  if (pathname === routes.learning) {
    return null;
  }

  return (
    <Link
      href={routes.chat}
      aria-label={t('label')}
      className="fixed right-4 bottom-28 z-20 block w-37 h-18 text-blue-500 drop-shadow-lg transition-transform origin-bottom-right hover:scale-105 active:scale-95"
    >
      {/* Speech bubble with a tail at the bottom right */}
      <svg viewBox="0 0 148 72" className="absolute inset-0 size-full" aria-hidden>
        <path
          d="M24 0H124A24 24 0 0 1 148 24V32A24 24 0 0 1 124 56H122L130 72L104 56H24A24 24 0 0 1 0 32V24A24 24 0 0 1 24 0Z"
          fill="currentColor"
        />
      </svg>
      <span className="absolute inset-x-0 top-0 h-14 flex items-center justify-center text-white font-semibold text-lg">
        Sharkbot
      </span>
    </Link>
  );
};
