import { IconProps } from '@/types/components';

export const ArrowLeftIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M12 19L5 12L12 5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path d="M19 12H5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
    </svg>
  );
};
