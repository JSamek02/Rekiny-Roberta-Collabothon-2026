import { IconProps } from '@/types/components';

export const SendIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path d="M17.5 2.5L9.16667 10.8333" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path
        d="M17.5 2.5L12.0833 17.5L9.16667 10.8333L2.5 7.91667L17.5 2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
};
