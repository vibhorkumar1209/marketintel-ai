'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
    className?: string;
    size?: number;
    showText?: boolean;
    textColor?: string;
}

export const RefractOneLogo: React.FC<LogoProps> = ({
    className = "",
    size = 60,
    showText = true,
    textColor = "#ffffff"
}) => {
    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Logo Mark as Image */}
            <div style={{ width: size, height: size, position: 'relative', flexShrink: 0 }}>
                <Image
                    src="/logo.png"
                    alt="RefractOne Logo"
                    fill
                    style={{ objectFit: 'contain' }}
                />
            </div>

            {/* Brand Text */}
            {showText && (
                <div style={{ color: textColor }}>
                    <div style={{ fontSize: 27, fontWeight: 900, lineHeight: 1, letterSpacing: '-0.02em', fontFamily: 'Inter, sans-serif' }}>
                        RefractOne
                    </div>
                </div>
            )}
        </div>
    );
};
