'use client';

import React from 'react';
import { clsx } from 'clsx';
import Badge from './Badge';

interface CardProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  badge?: string;
  badgeVariant?: 'teal' | 'navy' | 'amber' | 'green' | 'red';
  variant?: 'default' | 'highlighted' | 'dark';
  className?: string;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({
  children,
  title,
  subtitle,
  badge,
  badgeVariant = 'teal',
  variant = 'default',
  className,
  onClick,
}) => {
  const variantStyles = {
    default: 'bg-[#111827] border border-[#2A3A55]',
    highlighted: 'bg-[#111827] border-2 border-teal-600 shadow-lg shadow-teal-600/10',
    dark: 'bg-[#0f1c33] border border-[#1B2A4A]',
  };

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      className={clsx(
        'rounded-lg p-6 transition-all duration-200',
        variantStyles[variant],
        'hover:border-[#3A4A65] hover:shadow-lg hover:shadow-black/20',
        onClick && 'cursor-pointer',
        className
      )}
    >
      {(title || badge) && (
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            {title && (
              <h3 className="text-xl font-semibold text-[#FFFFFF]">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[#8899BB] mt-1">
                {subtitle}
              </p>
            )}
          </div>
          {badge && (
            <Badge variant={badgeVariant} className="ml-3 shrink-0">
              {badge}
            </Badge>
          )}
        </div>
      )}
      {children}
    </div>
  );
};

export default Card;
