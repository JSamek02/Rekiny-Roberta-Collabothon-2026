'use client';

import { useViewer } from '@/components/auth';
import { useFormatter, useTranslations } from 'next-intl';
import Image from 'next/image';

/**
 * Signed-in user's EXP from `/api/auth/me`. The query is invalidated after every action
 * that awards EXP (see `invalidateExperienceQueries`), so the value refreshes on its own.
 * Guests have no account EXP, so nothing is shown for them.
 */
export const HeaderExperience = () => {
  const t = useTranslations('components.auth');
  const format = useFormatter();
  const { status, user } = useViewer();

  if (status === 'loading') {
    return <div className="h-6 w-16 rounded-full bg-white animate-pulse" aria-hidden />;
  }

  if (!user) return null;

  return (
    <div className="flex items-center gap-1" title={t('experience')}>
      <Image src="/img/green-gem.svg" alt="" width={24} height={24} />
      <p className="text-sm font-medium">
        {format.number(user.experience_points ?? 0)} {t('xp')}
      </p>
    </div>
  );
};
