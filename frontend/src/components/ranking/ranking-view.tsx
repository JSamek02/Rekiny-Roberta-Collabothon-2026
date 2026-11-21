'use client';

import { useApiGetRankingQuery } from '@/api/services/ranking-service';
import { RankingRow } from '@/components/ranking/ranking-row';
import { Link } from '@/i18n/navigation';
import { TrophyIcon } from '@/icons/trophy';
import { buttonVariants } from '@/ui';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';

const HATS_ORDER = [1, 3, 4, 2, 3, 1, 3, 2, 1, 3, 4, 1, 2, 1, 4] as const;
const RANKING_LIMIT = 50;

export const RankingView = () => {
  const t = useTranslations('components.ranking');
  const { data, isPending, isError, refetch, isFetching } = useApiGetRankingQuery({ limit: RANKING_LIMIT });

  const currentUser = data?.current_user ?? null;
  const currentUserInList = currentUser ? data?.ranking.some((e) => e.user_id === currentUser.user_id) : false;

  return (
    <main className="flex-1 px-3 pt-4 pb-8">
      <section className="mx-auto mb-5 w-full max-w-lg rounded-2xl border border-blue-100 bg-white p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-500">
            <TrophyIcon className="text-3xl stroke-[1.5]" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-grey-600">{t('kicker')}</p>
            <h1 className="text-xl font-semibold leading-tight text-blue-950">{t('title')}</h1>
          </div>
        </div>
        <p className="mt-3 text-xs text-grey-600">
          {data ? t('subtitle', { count: data.total_users }) : t('subtitle-loading')}
        </p>
      </section>

      <div className="mx-auto flex w-full max-w-lg flex-col gap-4">
        {currentUser && (
          <section className="flex flex-col gap-2">
            <h2 className="text-xs font-medium text-grey-600">{t('your-position')}</h2>
            <ul>
              <RankingRow entry={currentUser} isCurrentUser />
            </ul>
          </section>
        )}

        {!currentUser && data && (
          <p className="rounded-xl bg-blue-100/60 px-3 py-2 text-xs text-blue-950">
            {t('guest-info')}{' '}
            <Link href={routes.login} className="font-semibold text-blue-500 underline-offset-2 hover:underline">
              {t('log-in')}
            </Link>
          </p>
        )}

        <section className="flex flex-col gap-2" aria-busy={isPending}>
          <h2 className="text-xs font-medium text-grey-600">{t('top', { count: RANKING_LIMIT })}</h2>

          {isPending && (
            <ul className="flex flex-col gap-2" aria-hidden>
              {Array.from({ length: 5 }, (_, i) => (
                <li key={i} className="h-15 animate-pulse rounded-xl border border-blue-100 bg-white" />
              ))}
            </ul>
          )}

          {isError && (
            <div className="flex flex-col items-start gap-2 rounded-xl border border-blue-100 bg-white p-4">
              <p className="text-sm text-[#b42318]">{t('error')}</p>
              <button
                type="button"
                onClick={() => refetch()}
                disabled={isFetching}
                className={buttonVariants({ variant: 'ghost', size: 'sm' })}
              >
                {t('retry')}
              </button>
            </div>
          )}

          {data && data.ranking.length === 0 && (
            <p className="rounded-xl border border-blue-100 bg-white p-4 text-sm text-grey-600">{t('empty')}</p>
          )}

          {data && data.ranking.length > 0 && (
            <ol className="flex flex-col gap-2">
              {data.ranking.map((entry, i) => (
                <RankingRow
                  key={entry.user_id}
                  entry={entry}
                  isCurrentUser={currentUserInList && entry.user_id === currentUser?.user_id}
                  forceHat={HATS_ORDER[i]}
                />
              ))}
            </ol>
          )}
        </section>
      </div>
    </main>
  );
};
