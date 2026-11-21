import { LessonItem } from '@/components/lessons-list/lesson-item';
import { type LessonListItem } from '@/components/lessons-list/lesson-roadmap-types';
import { useTranslations } from 'next-intl';

type LessonsListProps = {
  category: string;
  lessons: LessonListItem[];
};

export const LessonsList = ({ category, lessons }: LessonsListProps) => {
  const t = useTranslations('components.learning-category');

  return (
    <section aria-label={t('roadmap')} className="relative isolate mx-auto w-full max-w-lg pb-6">
      <ol className="relative mt-1 flex flex-col">
        {lessons.map((lesson, index) => (
          <LessonItem
            key={lesson.slug}
            category={category}
            slug={lesson.slug}
            title={lesson.title}
            number={index + 1}
            side={index % 2 === 0 ? 'left' : 'right'}
            status={lesson.status}
            isLast={index === lessons.length - 1}
          />
        ))}
      </ol>
    </section>
  );
};
