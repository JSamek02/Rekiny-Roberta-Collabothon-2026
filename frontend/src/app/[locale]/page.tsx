import { LessonCategoryNavItem } from '@/components/lesson-category-nav-item';
import { LevelBar } from '@/components/level-bar';
import { StockMarketHeroWidget } from '@/components/stock/StockMarketHeroWidget';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col px-3 py-6 gap-6">
      <LevelBar />
      <div className="grid grid-cols-2 gap-2">
        <LessonCategoryNavItem />
        <LessonCategoryNavItem />
        <LessonCategoryNavItem />
        <LessonCategoryNavItem />
      </div>
      <StockMarketHeroWidget />
    </main>
  );
}
