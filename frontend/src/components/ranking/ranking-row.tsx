'use client';

import { RankingEntry } from '@/api/types/ranking';
import { Avatar } from '@/components/avatar';
import clsx from 'clsx';
import { useFormatter, useTranslations } from 'next-intl';

// Gold, silver and bronze for the top three places.
const PODIUM_STYLES: Record<number, string> = {
  1: 'bg-[#ffd84d] text-[#5c4300]',
  2: 'bg-[#dfe3ea] text-[#3b4252]',
  3: 'bg-[#f2c19b] text-[#5e3214]',
};

type RankingRowProps = {
  entry: RankingEntry;
  isCurrentUser?: boolean;
  forceHat?: 1 | 2 | 3 | 4;
};

export const RankingRow = ({ entry, isCurrentUser = false, forceHat }: RankingRowProps) => {
  const t = useTranslations('components.ranking');
  const format = useFormatter();
  const name = entry.name || t('anonymous');

  return (
    <li
      className={clsx(
        'flex items-center gap-3 rounded-xl border bg-white p-2.5 shadow-xs',
        isCurrentUser ? 'border-blue-500 ring-1 ring-blue-500' : 'border-blue-100',
      )}
      aria-current={isCurrentUser ? 'true' : undefined}
    >
      <span
        className={clsx(
          'flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
          PODIUM_STYLES[entry.rank] ?? 'bg-blue-50 text-blue-950',
        )}
        aria-label={t('place', { rank: entry.rank })}
      >
        {entry.rank}
      </span>

      {/* <UserAvatar user={{ name: entry.name, picture: entry.picture }} className="bg-blue-50" /> */}
      <Avatar className="size-12 rounded-full bg-blue-100" hat={forceHat} />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-blue-950">{name}</p>
        {isCurrentUser && <p className="text-[11px] font-medium text-blue-500">{t('you')}</p>}
      </div>

      <p className="shrink-0 text-sm font-semibold text-blue-950">
        {format.number(entry.experience_points)}
        <span className="ml-1 text-xs font-medium text-grey-600">{t('xp')}</span>
      </p>
    </li>
  );
};
