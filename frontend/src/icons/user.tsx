import { IconProps } from '@/types/components';

export const UserIcon = ({ ...props }: IconProps) => {
  return (
    <svg width="1em" height="1em" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <path
        d="M14.1667 6.66667C14.1667 8.96785 12.3012 10.8333 9.99999 10.8333C7.69881 10.8333 5.83333 8.96785 5.83333 6.66667C5.83333 4.36548 7.69881 2.5 9.99999 2.5C12.3012 2.5 14.1667 4.36548 14.1667 6.66667Z"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
      <path
        d="M16.6667 17.5C16.6667 15.7319 15.9643 14.0362 14.714 12.7859C13.4638 11.5357 11.7681 10.8333 9.99999 10.8333C8.23188 10.8333 6.53619 11.5357 5.28595 12.7859C4.03571 14.0362 3.33333 15.7319 3.33333 17.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        stroke="currentColor"
      />
    </svg>
  );
};
