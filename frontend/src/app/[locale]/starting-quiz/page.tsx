'use client';

import { StartingQuizView } from '@/components/starting-quiz';
import { useRouter } from '@/i18n/navigation';
import { routes } from '@/utils/routes';

export default function StartingQuizPage() {
  const router = useRouter();

  const handleFinish = () => {
    router.push(routes.home);
  };

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
        <StartingQuizView onComplete={handleFinish} onSkip={handleFinish} />
      </div>
    </main>
  );
}
