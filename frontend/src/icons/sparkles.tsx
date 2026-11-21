import { IconProps } from '@/types/components';

// SVG from Lucide "sparkles" (https://lucide.dev), ISC License, Copyright (c) Lucide Icons and Contributors.
export const SparklesIcon = ({ ...props }: IconProps) => {
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
      <path
        d="M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path d="M20 2v4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M22 4h-4" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <circle cx="4" cy="20" r="2" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
};
