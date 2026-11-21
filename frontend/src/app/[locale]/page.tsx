import { ChatbotBanner } from '@/components/chatbot-banner';
import { LessonCategoryGrid } from '@/components/lesson-category-grid';
import { LevelBar } from '@/components/level-bar';
import { StartingQuizModal } from '@/components/starting-quiz';
import { StockMarketHeroWidget } from '@/components/stock/StockMarketHeroWidget';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col px-3 pt-6 gap-6 overflow-x-clip overflow-y-clip">
      <StartingQuizModal />
      <LevelBar />
      <LessonCategoryGrid />
      <StockMarketHeroWidget />
      <ChatbotBanner />
    </main>
  );
}
