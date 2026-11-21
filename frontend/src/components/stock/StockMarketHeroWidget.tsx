import React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { routes } from '@/utils/routes';

interface StockMarketHeroWidgetProps {
  isLink?: boolean;
}

export const StockMarketHeroWidget: React.FC<StockMarketHeroWidgetProps> = ({ isLink = true }) => {
  const content = (
    <div className="relative overflow-hidden bg-blue-500 rounded-2xl p-5 text-white shadow-xs">
      <div className="relative z-10 max-w-[70%]">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/20 text-xs font-medium backdrop-blur-xs mb-2">
          <span>🦈</span> Robert Biznesu poleca
        </div>
        <h2 className="text-xl font-bold leading-tight mb-1">Symulator Giełdowy</h2>
        <p className="text-xs text-blue-100 leading-relaxed">
          Zarządzaj portfelem w realnych, historycznych kryzysach. Sprawdź, czy pokonasz inflację i ocalisz kapitał!
        </p>
        <div className="mt-3 flex items-center gap-2 text-xs font-semibold bg-white/15 px-2.5 py-1.5 rounded-lg w-fit">
          <span>Kapitał startowy:</span>
          <span className="font-bold text-white">10 000 zł</span>
        </div>
      </div>

      {/* Mascot Shark */}
      <div className="absolute -bottom-2 -right-4 w-28 h-36 pointer-events-none">
        <Image
          src="/img/shark.png"
          alt="Robert Biznesu"
          width={120}
          height={150}
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
