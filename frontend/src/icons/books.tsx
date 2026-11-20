import { IconProps } from '@/types/components';

export const BooksIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M3.33333 2.5H8.33333C8.79357 2.5 9.16667 2.8731 9.16667 3.33333V16.6667C9.16667 17.1269 8.79357 17.5 8.33333 17.5H3.33333C2.8731 17.5 2.5 17.1269 2.5 16.6667V3.33333C2.5 2.8731 2.8731 2.5 3.33333 2.5Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path d="M5.83334 2.5V17.5" strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" />
      <path
        d="M17.3022 16.2189C17.4689 16.6355 17.2189 17.1355 16.8022 17.3022L15.2189 17.8855C14.8022 18.0522 14.3022 17.8022 14.1355 17.3855L9.55221 4.71887C9.38554 4.30221 9.63554 3.80221 10.0522 3.63554L11.6355 3.05221C12.0522 2.88554 12.5522 3.13554 12.7189 3.55221L17.3022 16.2189Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
};
