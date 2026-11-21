import React from 'react';
import { IconProps } from '@/types/components';

export const KremowkaIcon = ({ className = '', ...props }: IconProps) => {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Bottom Crust */}
      <path
        d="M3.5 14.5L12 18L20.5 14.5V16L12 19.5L3.5 16V14.5Z"
        fill="#C4781B"
        stroke="#000E56"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Thick Cream / Custard Layer */}
      <path
        d="M3.5 9L12 12.5V18L3.5 14.5V9Z"
        fill="#FFEA9F"
        stroke="#000E56"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      <path
        d="M12 12.5L20.5 9V14.5L12 18V12.5Z"
        fill="#FFDF73"
        stroke="#000E56"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Top Puff Pastry Edge & Crust */}
      <path
        d="M3.5 8L12 11.5L20.5 8V9L12 12.5L3.5 9V8Z"
        fill="#C4781B"
        stroke="#000E56"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />
      {/* Top Pastry Surface */}
      <path
        d="M3.5 8L12 4.5L20.5 8L12 11.5L3.5 8Z"
        fill="#E59838"
        stroke="#000E56"
        strokeWidth="0.9"
        strokeLinejoin="round"
      />

      {/* Powdered Sugar Layer on Top */}
      <path d="M6 7.7L12 5.3L18 7.7L12 10.1L6 7.7Z" fill="#FFFFFF" fillOpacity="0.96" />
      <circle cx="12" cy="7.7" r="1.1" fill="#FFFFFF" />
      <circle cx="9" cy="6.9" r="0.8" fill="#FFFFFF" />
      <circle cx="15" cy="6.9" r="0.8" fill="#FFFFFF" />
      <circle cx="12" cy="5.9" r="0.7" fill="#FFFFFF" />
    </svg>
  );
};
