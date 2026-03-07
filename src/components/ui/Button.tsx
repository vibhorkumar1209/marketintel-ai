'use client';

import React, { forwardRef } from 'react';
import Link from 'next/link';
import { clsx } from 'clsx';
import Spinner from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  href?: string;
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      href,
      fullWidth = false,
      children,
      className,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles = 'font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2 whitespace-nowrap btn-focus-ring';

    // Variant styles
    const variantStyles = {
      primary: 'bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-600 disabled:opacity-50',
      secondary: 'bg-navy-700 text-white hover:bg-navy-800 border border-navy-600 disabled:opacity-50',
      outline: 'border-2 border-teal-600 text-teal-400 hover:bg-teal-600 hover:bg-opacity-10 disabled:opacity-50',
      ghost: 'text-teal-400 hover:bg-navy-700 hover:bg-opacity-50 disabled:opacity-50',
      danger: 'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-600 disabled:opacity-50',
    };

    // Size styles
    const sizeStyles = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2.5 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    const classes = clsx(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      loading && 'opacity-75',
      disabled && 'cursor-not-allowed opacity-50',
      fullWidth && 'w-full',
      className
    );

    const content = (
      <>
        {loading && <Spinner size="sm" color="currentColor" />}
        {children}
      </>
    );

    // If href is provided, render as Link
    if (href && !disabled && !loading) {
      return (
        <Link href={href} className={classes}>
          {content}
        </Link>
      );
    }

    // Otherwise render as button
    return (
      <button
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        onClick={onClick}
        {...props}
      >
        {content}
      </button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
