import { ActivityPlayer } from '@/components/learning';
import { notFound } from 'next/navigation';

type ActivityPageProps = {
  params: Promise<{ activityId: string }>;
};

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { activityId } = await params;
  const id = Number(activityId);
  if (!Number.isInteger(id) || id < 1) {
    notFound();
  }

  return (
    <main className="flex-1">
      <ActivityPlayer activityId={id} />
    </main>
  );
}
