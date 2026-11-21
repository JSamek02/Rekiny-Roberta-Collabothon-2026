import { IconProps } from '@/types/components';

export const MinusIcon = ({ ...props }: IconProps) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      strokeLinecap="round"
      strokeLinejoin="round"
      stroke="currentColor"
      {...props}
    >
      <path d="M5 12h14" />
    </svg>
  );
};
