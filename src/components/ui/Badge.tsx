'use client';

import React from 'react';
import { clsx } from 'clsx';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'teal' | 'navy' | 'amber' | 'green' | 'red';
  className?: string;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'teal', className }) => {
  const variantStyles = {
    teal: 'bg-teal-600 bg-opacity-20 text-teal-300 border border-teal-600 border-opacity-30',
    navy: 'bg-navy-600 bg-opacity-20 text-navy-300 border border-navy-600 border-opacity-30',
    amber: 'bg-amber-600 bg-opacity-20 text-amber-300 border border-amber-600 border-opacity-30',
    green: 'bg-green-600 bg-opacity-20 text-green-300 border border-green-600 border-opacity-30',
    red: 'bg-red-600 bg-opacity-20 text-red-300 border border-red-600 border-opacity-30',
  };

  return (
    <span
      className={clsx(
        'inline-block px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
};

export default Badge;
