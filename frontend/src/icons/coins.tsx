import { IconProps } from '@/types/components';

// SVG from Lucide "coins" (https://lucide.dev), ISC License, Copyright (c) Lucide Icons and Contributors.
export const CoinsIcon = ({ ...props }: IconProps) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth={2}
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      <path d="M13.744 17.736a6 6 0 1 1-7.48-7.48" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M15 6h1v4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="m6.134 14.768.866-.5 2 3.464" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <circle cx="16" cy="8" r="6" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
};
