'use client';

import { ProfileAchievements } from '@/components/profile/profile-achievements';
import { ProfileLogoutButton } from '@/components/profile/profile-logout-button';
import { useViewer } from '@/components/auth';
import { ShopButton } from '@/components/shop';
import { Link } from '@/i18n/navigation';
import { buttonVariants } from '@/ui';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';

export function ProfileActions() {
  const { user } = useViewer();
  const t = useTranslations('components.auth');

  return (
    <>
      <ShopButton disabled={!user} />
      {user && <ProfileAchievements />}
      {user ? (
        <ProfileLogoutButton />
      ) : (
        <div className="mt-auto pt-6">
          <Link href={routes.login} className={clsx(buttonVariants({ variant: 'ghost', size: 'md' }), 'w-full')}>
            {t('log-in')}
          </Link>
        </div>
      )}
    </>
  );
}
