'use client';

import { ViewerType } from '@/api/types/auth';
import clsx from 'clsx';
import { useTranslations } from 'next-intl';

const STYLES: Record<ViewerType, string> = {
  guest: 'bg-grey-100 text-grey-600',
  user: 'bg-blue-50 text-blue-500',
  creator: 'bg-[#e3f7ec] text-[#0f7a43]',
  partner: 'bg-[#fff3d1] text-[#8a5a00]',
};

export const RoleBadge = ({ type, className }: { type: ViewerType; className?: string }) => {
  const t = useTranslations('components.auth.roles');

  return (
    <span
      className={clsx(
        'inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap',
        STYLES[type],
        className,
      )}
    >
      {t(type)}
    </span>
  );
};
