import { IconProps } from '@/types/components';

export const SpeakerIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M9.16667 4.16669L5 7.50002H1.66667V12.5H5L9.16667 15.8334V4.16669Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M15.8917 4.10834C17.4539 5.67107 18.3316 7.79031 18.3316 10C18.3316 12.2097 17.4539 14.329 15.8917 15.8917M12.95 7.05001C13.7311 7.83137 14.1699 8.89099 14.1699 9.99584C14.1699 11.1007 13.7311 12.1603 12.95 12.9417"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
};
