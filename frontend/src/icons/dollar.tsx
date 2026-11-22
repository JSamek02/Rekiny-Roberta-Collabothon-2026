import { IconProps } from '@/types/components';

export const DollarIcon = ({ ...props }: IconProps) => {
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
      <path d="M12 3v18" />
      <path d="M17 5H9.5a1 1 0 000 7h5a1 1 0 010 7H6" />
    </svg>
  );
};
