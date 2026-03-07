'use client';

import React, { forwardRef } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, fullWidth = true, icon, className, ...props }, ref) => {
    return (
      <div className={clsx('flex flex-col', fullWidth && 'w-full')}>
        {label && (
          <label className="block text-sm font-medium text-[#E8EDF5] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8899BB]">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={clsx(
              'w-full px-4 py-2.5 bg-[#111827] border rounded-lg',
              'text-[#E8EDF5] placeholder-[#8899BB]',
              'border-[#2A3A55] hover:border-[#3A4A65]',
              'focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600 focus:ring-opacity-20',
              'transition-all duration-200',
              error && 'border-red-500 focus:border-red-500 focus:ring-red-500',
              icon && 'pl-10',
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <p className="mt-1.5 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1.5 text-sm text-[#8899BB]">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;
