import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { routes } from '@/utils/routes';
import { CoinsIcon } from '@/icons/coins';
import { SparklesIcon } from '@/icons/sparkles';

interface StockMarketHeroWidgetProps {
  isLink?: boolean;
}

export const StockMarketHeroWidget: React.FC<StockMarketHeroWidgetProps> = ({ isLink = true }) => {
  const content = (
    <div className="relative overflow-hidden bg-blue-500 rounded-xl p-3 text-white shadow-xs h-[102px] flex flex-col justify-between">
      <div className="relative z-10 max-w-[70%] flex flex-col justify-between h-full">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-medium backdrop-blur-xs mb-1 w-fit">
            <SparklesIcon className="w-3 h-3 text-white" />
            <span>Robert Biznesu poleca</span>
          </div>
          <h2 className="text-sm font-bold leading-tight">Symulator Giełdowy</h2>
        </div>

        <div className="flex items-center gap-1.5 text-[11px] font-semibold bg-white/15 px-2 py-0.5 rounded-lg w-fit">
          <CoinsIcon className="w-3.5 h-3.5 text-white" />
          <span>Kapitał startowy: 10 000 zł</span>
        </div>
      </div>

      {/* Mascot Shark */}
      <div className="absolute -bottom-3 -right-2 w-24 h-28 pointer-events-none">
        <Image
          src="/img/shark.svg"
          alt="Robert Biznesu"
          width={96}
          height={112}
          className="object-contain drop-shadow-md"
        />
      </div>
    </div>
  );

  if (isLink) {
    return (
      <Link
        href={routes.stock}
        className="block cursor-pointer"
      >
        {content}
      </Link>
    );
  }

  return content;
};
