import { cva, type VariantProps } from 'class-variance-authority';
import clsx from 'clsx';
import React from 'react';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-lg font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-blue-500 text-white hover:bg-blue-950 active:scale-95',
        ghost: 'border border-blue-100 bg-transparent text-blue-950 hover:bg-blue-50 active:scale-95',
      },
      size: {
        sm: 'h-9 px-3 text-xs',
        md: 'h-11 px-4 text-sm',
        icon: 'size-11 p-0',
        iconSm: 'size-9 p-0',
      },
      color: {
        blue: '',
      },
    },
    defaultVariants: {
      variant: 'solid',
      size: 'md',
      color: 'blue',
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants>;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, color, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={clsx(buttonVariants({ variant, size, color }), className)}
      {...props}
    />
  ),
);

Button.displayName = 'Button';
