'use client';

import { Link, usePathname } from '@/i18n/navigation';
import React from 'react';
import clsx from 'clsx';

type BottomNavItemProps = {
  href: string;
  children?: React.ReactNode;
};

export const BottomNavItem = ({ href, children }: BottomNavItemProps) => {
  const pathname = usePathname();
  const isActive =
    pathname === href ||
    (href === '/' && (pathname === '' || pathname === '/')) ||
    (href !== '/' && pathname.startsWith(href));

  return (
    <Link
      href={href}
      className={clsx(
        'grow shrink-0 flex items-center justify-center gap-0.5 flex-col stroke-[1.5] py-2 rounded-lg text-blue-950 transition-colors',
        '[span]:text-xs [span]:font-medium [svg]:text-xl',
        isActive ? 'bg-blue-100 font-semibold' : 'hover:bg-blue-50'
      )}
    >
      {children}
    </Link>
  );
};
