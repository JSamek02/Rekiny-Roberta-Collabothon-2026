'use client';

import { useLogoutMutation } from '@/api/services/auth-service';
import { RoleBadge, UserAvatar, useViewer } from '@/components/auth';
import { Link } from '@/i18n/navigation';
import { Button } from '@/ui';
import { routes } from '@/utils/routes';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/avatar';
import React, { useEffect, useRef, useState } from 'react';

/** Left side of the header: "Log in" for guests, avatar with an account menu for signed-in users. */
export const HeaderUser = () => {
  const t = useTranslations('components.auth');
  const { status, user, viewerType } = useViewer();
  const logout = useLogoutMutation();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close the menu on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (status === 'loading') {
    return <div className="size-10 rounded-full bg-white animate-pulse" aria-hidden />;
  }

  if (!user) {
    return (
      <Link
        href={routes.login}
        className="flex h-10 items-center gap-2 rounded-full border border-blue-100 bg-white pl-1 pr-4 text-sm font-semibold text-blue-950 transition-colors hover:bg-blue-100"
      >
        <UserAvatar user={null} className="size-8 bg-blue-50" />
        {t('log-in')}
      </Link>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t('account-menu')}
        className="flex items-center gap-2 rounded-full cursor-pointer"
      >
        {/* <UserAvatar user={user} /> */}
        <Avatar />
        <RoleBadge type={viewerType} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 top-12 z-30 flex w-64 flex-col gap-3 rounded-xl border border-blue-100 bg-white p-4 shadow-lg"
        >
          <div className="flex items-center gap-3">
            <UserAvatar user={user} className="bg-blue-50" />
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-blue-950">{user.name || t('no-name')}</p>
              {user.email && <p className="truncate text-xs text-grey-600">{user.email}</p>}
            </div>
          </div>
          <div className="flex items-center justify-between text-xs text-grey-600">
            <span>{t('account-type')}</span>
            <RoleBadge type={viewerType} />
          </div>
          <Button
            role="menuitem"
            variant="ghost"
            size="sm"
            disabled={logout.isPending}
            onClick={() => logout.mutate(undefined, { onSuccess: () => setOpen(false) })}
          >
            {t('log-out')}
          </Button>
          {logout.isError && <p className="text-xs text-[#b42318]">{t('error')}</p>}
        </div>
      )}
    </div>
  );
};
