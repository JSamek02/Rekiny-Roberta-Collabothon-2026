'use client';

import { Link } from '@/i18n/navigation';
import { usePathname } from 'next/navigation';
import React from 'react';
import clsx from 'clsx';

type BottomNavItemProps = {
  href: string;
  children?: React.ReactNode;
};

export const BottomNavItem = ({ href, children }: BottomNavItemProps) => {
  const pathname = usePathname();

  return (
    <Link
      href={href}
      className={clsx(
        'grow shrink-0 flex items-center justify-center gap-0.5 flex-col stroke-[1.5] py-2 rounded-lg text-blue-950 transition-colors',
        '[span]:text-xs [span]:font-medium [svg]:text-xl',
        'hover:bg-blue-50',
        pathname === href && 'bg-blue-50'
      )}
    >
      {children}
    </Link>
  );
};
