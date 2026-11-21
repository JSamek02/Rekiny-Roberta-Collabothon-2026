import { IconProps } from '@/types/components';

export const ArrowRightIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 5L19 12L12 19" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M5 12H19" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
};
