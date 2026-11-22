'use client';

import { useViewer } from '@/components/auth';
import { getExperienceProgress } from '@/utils/experience';
import { useFormatter, useTranslations } from 'next-intl';

export const LevelBar = () => {
  const t = useTranslations('components.level-bar');
  const format = useFormatter();
  const { status, user } = useViewer();

  if (status === 'loading') {
    return <div className="h-16 animate-pulse rounded-lg bg-white" aria-hidden="true" />;
  }

  if (!user) return null;

  const { experience, level, nextLevelExperience, progress } = getExperienceProgress(user.experience_points ?? 0);

  return (
    <section>
      <div className="h-11 flex justify-end relative isolate">
        <div className="bg-grey-200 rounded-full flex h-3 w-[calc(100%-2.75rem+0.75rem)] absolute left-0 top-1/2 -translate-y-1/2 -z-10">
          <div
            className="h-full rounded-full bg-blue-500 contrast-bw:bg-white contrast-by:bg-white contrast-bw:border contrast-by:border contrast-bw:border-blue-500 contrast-by:border-blue-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="size-11 rounded-full border-2 border-blue-500 bg-white text-blue-950 font-semibold flex items-center justify-center">
          {level}
        </div>
      </div>
      <div className="flex justify-between w-[calc(100%-2.75rem)] -mt-2 text-grey-400">
        <p>{format.number(experience)} XP</p>
        <p>{t('next-level', { points: format.number(nextLevelExperience) })}</p>
      </div>
    </section>
  );
};
