import { BottomNavItem } from '@/components/bottom-nav/bottom-nav-item';
import { BankIcon } from '@/icons/bank';
import { BooksIcon } from '@/icons/books';
import { UserIcon } from '@/icons/user';
import { WalletIcon } from '@/icons/wallet';
import { routes } from '@/utils/routes';
import { getTranslations } from 'next-intl/server';

export const BottomNav = async () => {
  const t = await getTranslations('global.routes');

  return (
    <nav className="px-1.5 pt-2 pb-4 bg-white sticky bottom-0 w-full flex gap-2 shadow-bottom-nav z-10">
      <BottomNavItem href={routes.learning}>
        <BooksIcon />
        <span>{t('learning')}</span>
      </BottomNavItem>
      <BottomNavItem href={routes.investmentPlatform}>
        <BankIcon />
        <span>{t('investment-platform')}</span>
      </BottomNavItem>
      <BottomNavItem href={routes.stock}>
        <WalletIcon />
        <span>{t('stock')}</span>
      </BottomNavItem>
      <BottomNavItem href={routes.profile}>
        <UserIcon />
        <span>{t('profile')}</span>
      </BottomNavItem>
    </nav>
  );
};
