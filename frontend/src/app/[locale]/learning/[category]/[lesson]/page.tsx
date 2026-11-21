import { LessonActivities } from '@/components/learning';

type LessonPageProps = {
  params: Promise<{ category: string; lesson: string }>;
};

export default async function LessonPage({ params }: LessonPageProps) {
  const { category, lesson } = await params;

  return (
    <main className="flex-1">
      <LessonActivities category={category} lessonSlug={lesson} />
    </main>
  );
}
