import { LessonRoadmap } from '@/components/lessons-list';
import { buttonVariants } from '@/ui';
import { Link } from '@/i18n/navigation';
import { ArrowLeftIcon } from '@/icons/arrow-left';
import { routes } from '@/utils/routes';
import clsx from 'clsx';
import { getTranslations } from 'next-intl/server';

type CategoryPageProps = {
  params: Promise<{
    category: string;
  }>;
};

export default async function LearningCategoryPage({ params }: CategoryPageProps) {
  const { category } = await params;
  const t = await getTranslations('components.learning-category');

  return (
    <main className="flex-1 px-3 pt-4 pb-8">
      <Link
        href={routes.learning}
        className={clsx(
          buttonVariants({ variant: 'ghost', size: 'sm', color: 'blue' }),
          'mb-4 w-fit border-0 px-0 text-sm uppercase',
        )}
      >
        <ArrowLeftIcon className="text-2xl stroke-[1.5]" />
        <span>{t('back')}</span>
      </Link>

      <LessonRoadmap category={category} />
    </main>
  );
}
