import { buttonVariants } from '@/ui';
import { Link } from '@/i18n/navigation';
import { ArrowRightIcon } from '@/icons/arrow-right';
import { routes } from '@/utils/routes';
import { getTranslations } from 'next-intl/server';

type LessonItemProps = {
  category: string;
  slug: string;
  title: string;
  number: number;
  side: 'left' | 'right';
  status: 'read' | 'unread';
  isLast: boolean;
};

export const LessonItem = async ({
  category,
  slug,
  title,
  number,
  side,
  status,
  isLast,
}: LessonItemProps) => {
  const t = await getTranslations('components.learning-category');

  return (
    <article
      className={[
        'relative flex h-24 w-full items-center',
        side === 'left' ? 'text-left' : 'text-right',
      ].join(' ')}
    >
      {!isLast && (
        <svg
          aria-hidden
          viewBox="0 0 100 24"
          preserveAspectRatio="none"
          className="pointer-events-none absolute left-0 top-[88px] h-6 w-full overflow-visible"
        >
          {side === 'left' ? (
            <path
              d="M14 0 V12 Q14 24 26 24 H74 Q86 24 86 12 V0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
              className="text-blue-950"
            />
          ) : (
            <path
              d="M86 0 V12 Q86 24 74 24 H26 Q14 24 14 12 V0"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray="4 5"
              vectorEffect="non-scaling-stroke"
              className="text-blue-950"
            />
          )}
        </svg>
      )}

      {side === 'left' ? (
        <>
          <Link
            href={routes.learningLesson(category, slug)}
            aria-label={t('open-lesson', { number })}
            className={[
              buttonVariants({ variant: 'solid', size: 'icon', color: 'blue' }),
              'absolute left-0 z-10 size-14 shrink-0 rounded-full border-2 border-white text-xl shadow-sm',
            ].join(' ')}
          >
            <ArrowRightIcon aria-hidden className="size-5 stroke-[1.5]" />
          </Link>
          <div
            className={[
              'ml-[72px] flex-1 min-w-0 px-2 py-2 text-left',
              status === 'read' ? 'opacity-70' : '',
            ].join(' ')}
          >
            <p className="text-lg font-medium leading-tight text-blue-950">
              {t('lesson-number', { number })}
            </p>
            <p className="mt-1 text-base font-medium leading-tight text-blue-950">{title}</p>
          </div>
        </>
      ) : (
        <>
          <div
            className={[
              'mr-[72px] flex-1 min-w-0 px-2 py-2 text-right',
              status === 'read' ? 'opacity-70' : '',
            ].join(' ')}
          >
            <p className="text-lg font-medium leading-tight text-blue-950">
              {t('lesson-number', { number })}
            </p>
            <p className="mt-1 text-base font-medium leading-tight text-blue-950">{title}</p>
          </div>
          <Link
            href={routes.learningLesson(category, slug)}
            aria-label={t('open-lesson', { number })}
            className={[
              buttonVariants({ variant: 'solid', size: 'icon', color: 'blue' }),
              'absolute right-0 z-10 size-14 shrink-0 rounded-full border-2 border-white text-xl shadow-sm',
            ].join(' ')}
          >
            <ArrowRightIcon aria-hidden className="size-5 stroke-[1.5]" />
          </Link>
        </>
      )}
    </article>
  );
};
