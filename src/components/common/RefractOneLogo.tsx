'use client';

import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
    textColor?: string;
}

export const RefractOneLogo: React.FC<LogoProps> = ({
    className = "",
    size = 40,
    showText = true,
    textColor = "#ffffff"
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo Mark */}
            <svg
                width={size}
                height={size}
                viewBox="0 0 100 100"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ flexShrink: 0 }}
            >
                {/* Outer triangle border - Dark Navy */}
                <path
                    d="M50 8L94 84H6L50 8Z"
                    stroke="#0C3649"
                    strokeWidth="6"
                    strokeLinejoin="round"
                />

                {/* Blue Segment (Left) - Stylized blade */}
                <path
                    d="M45 48L26 68L36 38L45 22V48Z"
                    fill="#3491E8"
                />

                {/* Gold Segment (Right) - Stylized blade */}
                <path
                    d="M55 48V22L64 38L74 68L55 48Z"
                    fill="#F5C22D"
                />

                {/* Red Segment (Bottom) - Wide Chevron */}
                <path
                    d="M50 56L76 80H24L50 56Z"
                    fill="#F53646"
                />
            </svg>

            {/* Brand Text */}
            {showText && (
                <div style={{ color: textColor }}>
                    <div style={{ fontSize: 18, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                        RefractOne
                    </div>
                </div>
            )}
        </div>
    );
};
