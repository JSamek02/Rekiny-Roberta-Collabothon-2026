'use client';

import { HeaderExperience } from '@/components/header/header-experience';
import { HeaderUser } from '@/components/header/header-user';
import { useSharkCoins } from '@/hooks/use-shark-coins';
import { usePathname } from '@/i18n/navigation';
import { routes } from '@/utils/routes';
import Image from 'next/image';
import React from 'react';

export const Header = () => {
  const { sharkCoins } = useSharkCoins();
  const pathname = usePathname();
  const isQuiz = pathname === routes.startingQuiz;

  if (isQuiz) {
    return null;
  }

  return (
    <header className="w-full px-5 pt-10 pb-4 flex justify-between sticky top-0 z-10 bg-blue-50">
      <HeaderUser />
      <div className="flex items-center gap-4">
        <HeaderExperience />
        <div className="flex items-center gap-1">
          <Image src="/img/SharkCoin.svg" alt="" width={24} height={24} />
          <p className="text-sm font-medium">{sharkCoins.toLocaleString()} SC</p>
        </div>
      </div>
      <span className="absolute bottom-0 left-0 right-0 mx-5 h-px bg-grey-100" />
    </header>
  );
};
