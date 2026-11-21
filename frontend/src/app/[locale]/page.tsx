import { DashboardContent } from '@/components/dashboard/DashboardContent';
import { ChatFab } from '@/components/chat-fab';
import { LessonCategoryNavItem } from '@/components/lesson-category-nav-item';
import { LevelBar } from '@/components/level-bar';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col">
      <DashboardContent />
    </main>
  );
}
