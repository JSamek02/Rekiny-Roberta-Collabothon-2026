import { Link } from '@/i18n/navigation';
import { BooksIcon } from '@/icons/books';
import { routes } from '@/utils/routes';
import { getTranslations } from 'next-intl/server';

type LessonItemProps = {
  category: string;
  slug: string;
  title: string;
  number: number;
  side: 'left' | 'right';
  status: 'read' | 'unread';
  isNext: boolean;
  isLast: boolean;
};

export const LessonItem = async ({
  category, slug, title, number, side, status, isNext, isLast,
}: LessonItemProps) => {
  const t = await getTranslations('components.learning-category');
  const isRead = status === 'read';

  return (
    <li className="relative">
      {!isLast && (
        <svg
          aria-hidden="true"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="pointer-events-none absolute top-[calc(50%+36px)] right-9 left-9 h-[calc(100%-72px)] w-[calc(100%-72px)] overflow-visible text-blue-500/40"
        >
          <path
            d={side === 'left' ? 'M0 0 V30 Q0 50 12 50 H88 Q100 50 100 70 V100' : 'M100 0 V30 Q100 50 88 50 H12 Q0 50 0 70 V100'}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 7"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      )}

      <Link
        href={routes.learningLesson(category, slug)}
        className={[
          'group relative z-10 flex min-h-40 w-full items-center gap-4 rounded-2xl py-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-blue-50',
          side === 'right' ? 'flex-row-reverse text-right' : 'text-left',
        ].join(' ')}
      >
        <span
          aria-hidden="true"
          className={[
            'flex size-[72px] shrink-0 items-center justify-center rounded-full border-4 border-white ring-2 ring-black transition-transform group-hover:-translate-y-1',
            isRead
              ? 'bg-[#16a34a] text-white'
              : isNext
                ? 'bg-blue-500 text-white'
                : 'bg-white text-blue-500',
          ].join(' ')}
        >
          {isRead ? (
            <svg viewBox="0 0 24 24" fill="none" className="size-7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="m5 12 4 4L19 6" />
            </svg>
          ) : (
            <BooksIcon className="size-7 stroke-2" />
          )}
        </span>

        <span className="flex min-w-0 flex-1 flex-col">
          <span className="text-lg font-semibold leading-tight text-blue-950 transition-colors group-hover:text-blue-500 sm:text-xl">
            {t('lesson-number', { number })}
          </span>
          <span className="mt-1 text-sm leading-snug text-grey-600">{title}</span>
          <span className="sr-only">
            {isRead ? t('completed') : isNext ? t('next') : t('available')}
          </span>
        </span>
      </Link>
    </li>
  );
};
