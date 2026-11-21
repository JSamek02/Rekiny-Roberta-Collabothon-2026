import { ChatbotBanner } from '@/components/chatbot-banner';
import { LessonCategoryNavItem } from '@/components/lesson-category-nav-item';
import { LevelBar } from '@/components/level-bar';
import { BankIcon } from '@/icons/bank';
import { DollarIcon } from '@/icons/dollar';
import { HandCoinsIcon } from '@/icons/hand-coins';
import { WalletIcon } from '@/icons/wallet';
import { routes } from '@/utils/routes';

export default function Home() {
  return (
    <main className="flex-1 flex flex-col px-3 py-6 gap-6 overflow-x-clip overflow-y-clip">
      <LevelBar />
      <div className="grid grid-cols-2 gap-2">
        <LessonCategoryNavItem
          title="Stocks and Bonds"
          icon={<BankIcon className="text-2xl stroke-[1.5]" />}
          href={routes.learningCategory('stocks-bonds')}
        />
        <LessonCategoryNavItem
          title="Investing"
          icon={<DollarIcon className="text-2xl stroke-[1.5]" />}
          href={routes.learningCategory('investing')}
        />
        <LessonCategoryNavItem
          title="Budgeting"
          icon={<WalletIcon className="text-2xl stroke-[1.5]" />}
          href={routes.learningCategory('budgeting')}
        />
        <LessonCategoryNavItem
          title="Economics"
          icon={<HandCoinsIcon className="text-2xl stroke-[1.5]" />}
          href={routes.learningCategory('economics')}
        />
      </div>
      <ChatbotBanner />
    </main>
  );
}
