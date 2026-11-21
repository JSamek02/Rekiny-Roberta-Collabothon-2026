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

  return (
    <section aria-label={t('roadmap')} className="relative w-full py-2">
      <div className="relative flex flex-col">
        {lessons.map((lesson, index) => (
          <LessonItem
            key={lesson.slug}
            category={category}
            slug={lesson.slug}
            title={lesson.title}
            number={index + 1}
            side={index % 2 === 0 ? 'left' : 'right'}
            status={lesson.status || 'unread'}
            isLast={index === lessons.length - 1}
          />
        ))}
      </div>
    </section>
  );
};
