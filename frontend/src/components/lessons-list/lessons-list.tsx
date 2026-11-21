import { LessonItem } from '@/components/lessons-list/lesson-item';
import { getTranslations } from 'next-intl/server';

export type LessonListItem = {
  slug: string;
  title: string;
  status?: 'read' | 'unread';
};

type LessonsListProps = {
  category: string;
  lessons: LessonListItem[];
};

export const LessonsList = async ({ category, lessons }: LessonsListProps) => {
  const t = await getTranslations('components.learning-category');
  const nextLesson = lessons.findIndex((lesson) => lesson.status !== 'read');

  return (
    <section aria-label={t('roadmap')} className="relative mx-auto w-full max-w-lg pb-6">
      <h2 className="px-1 text-xs font-semibold uppercase tracking-[0.12em] text-grey-600">{t('roadmap')}</h2>
      <ol className="relative mt-1 flex flex-col">
        {lessons.map((lesson, index) => (
          <LessonItem
            key={lesson.slug}
            category={category}
            slug={lesson.slug}
            title={lesson.title}
            number={index + 1}
            side={index % 2 === 0 ? 'left' : 'right'}
            status={lesson.status || 'unread'}
            isNext={index === nextLesson}
            isLast={index === lessons.length - 1}
          />
        ))}
      </ol>
    </section>
  );
};
