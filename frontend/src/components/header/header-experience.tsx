'use client';

import { useViewer } from '@/components/auth';
import { Link } from '@/i18n/navigation';
import { routes } from '@/utils/routes';
import { getExperienceProgress } from '@/utils/experience';
import { useFormatter, useTranslations } from 'next-intl';

export const HeaderExperience = () => {
  const t = useTranslations('components.auth');
  const format = useFormatter();
  const { status, user } = useViewer();

  if (status === 'loading') {
    return <div className="h-6 w-16 rounded-full bg-white animate-pulse" aria-hidden />;
  }

  if (!user) return null;

  const { experience, level, nextLevelExperience } = getExperienceProgress(user.experience_points ?? 0);
  const label = t('level-progress', {
    level,
    current: format.number(experience),
    total: format.number(nextLevelExperience),
  });

  return (
    <Link
      href={routes.ranking}
      className="flex size-7 shrink-0 items-center justify-center rounded-full bg-blue-500 text-xs font-semibold text-white transition-colors hover:bg-blue-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      aria-label={label}
      title={label}
    >
      {level}
    </Link>
  );
};
