'use client';

import { useLogoutMutation } from '@/api/services/auth-service';
import { Button } from '@/ui';
import { useTranslations } from 'next-intl';

export const ProfileLogoutButton = () => {
  const t = useTranslations('components.auth');
  const logout = useLogoutMutation();

  return (
    <div className="mt-auto pt-6">
      <Button
        variant="ghost"
        size="md"
        className="w-full"
        disabled={logout.isPending}
        onClick={() => logout.mutate()}
      >
        {t('log-out')}
      </Button>
      {logout.isError && <p className="mt-2 text-center text-xs text-red-800">{t('error')}</p>}
    </div>
  );
};
