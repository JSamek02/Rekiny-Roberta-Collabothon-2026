'use client';

import {
  getGoogleLoginUrl,
  useAuthConfigQuery,
  useLogoutMutation,
  useMockLoginMutation,
} from '@/api/services/auth-service';
import { UserRole } from '@/api/types/auth';
import { RoleBadge, UserAvatar, useViewer } from '@/components/auth';
import { Link, useRouter } from '@/i18n/navigation';
import { Button, buttonVariants } from '@/ui';
import { routes } from '@/utils/routes';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

const DEMO_ROLES: UserRole[] = ['user', 'creator', 'partner'];

const GoogleLogo = () => (
  <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden>
    <path
      fill="#FFC107"
      d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"
    />
    <path
      fill="#FF3D00"
      d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"
    />
    <path
      fill="#4CAF50"
      d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"
    />
    <path
      fill="#1976D2"
      d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"
    />
  </svg>
);

export const LoginView = () => {
  const t = useTranslations('components.login-view');
  const router = useRouter();
  const { status, user, viewerType } = useViewer();
  const config = useAuthConfigQuery({});
  const mockLogin = useMockLoginMutation();
  const logout = useLogoutMutation();

  const error = mockLogin.isError || logout.isError;

  return (
    <div className="flex flex-1 flex-col gap-4 px-5 py-6">
      <div>
        <p className="text-base text-grey-600">{t('kicker')}</p>
        <h1 className="text-2xl font-medium text-blue-950">{t('title')}</h1>
      </div>

      <div className="flex flex-col gap-4 rounded-xl border border-blue-100 bg-white p-4">
        {status === 'loading' && <div className="h-24 animate-pulse rounded-lg bg-blue-50" aria-hidden />}

        {status === 'authenticated' && user && (
          <>
            <div className="flex items-center gap-3">
              <UserAvatar user={user} className="bg-blue-50" />
              <div className="min-w-0">
                <p className="text-xs text-grey-600">{t('signed-in-as')}</p>
                <p className="truncate text-sm font-semibold text-blue-950">{user.name || user.email}</p>
              </div>
              <RoleBadge type={viewerType} className="ml-auto" />
            </div>
            <div className="flex gap-2">
              <Link href={routes.home} className={clsx(buttonVariants({ size: 'sm' }), 'flex-1')}>
                {t('go-home')}
              </Link>
              <Button variant="ghost" size="sm" className="flex-1" disabled={logout.isPending} onClick={() => logout.mutate()}>
                {t('log-out')}
              </Button>
            </div>
          </>
        )}

        {status === 'guest' && (
          <>
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm text-grey-600">{t('guest-info')}</p>
              <RoleBadge type="guest" />
            </div>

            {config.isPending && <div className="h-11 animate-pulse rounded-lg bg-blue-50" aria-hidden />}
            {config.isError && <p className="text-sm text-[#b42318]">{t('config-error')}</p>}

            {config.data?.mode === 'google' && (
              // Full-page navigation: the backend redirects to Google and back to FRONTEND_URL.
              <a
                href={getGoogleLoginUrl()}
                className={clsx(buttonVariants({ variant: 'ghost' }), 'gap-3 border-grey-200 bg-white')}
              >
                <GoogleLogo />
                {t('google')}
              </a>
            )}

            {config.data?.mode === 'mock' && (
              <div className="flex flex-col gap-2">
                <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs text-blue-950">{t('mock-info')}</p>
                {DEMO_ROLES.map((role) => (
                  <Button
                    key={role}
                    variant="ghost"
                    disabled={mockLogin.isPending}
                    onClick={() => mockLogin.mutate({ role }, { onSuccess: () => router.push(routes.home) })}
                  >
                    <span className="flex w-full items-center justify-between">
                      <span>{t('mock-as')}</span>
                      <RoleBadge type={role} />
                    </span>
                  </Button>
                ))}
              </div>
            )}

            <Link href={routes.home} className="text-center text-sm text-blue-500 underline-offset-2 hover:underline">
              {t('continue-as-guest')}
            </Link>
          </>
        )}

        {error && <p className="text-sm text-[#b42318]">{t('error')}</p>}
      </div>
    </div>
  );
};
