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
    <main className="flex flex-1 items-center justify-center p-2">
      <div className="w-full h-[calc(100dvh-1rem)] max-w-md overflow-y-auto rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
        <StartingQuizView onComplete={handleFinish} onSkip={handleFinish} />
      </div>
    </main>
  );
}
