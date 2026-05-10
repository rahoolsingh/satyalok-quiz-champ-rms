import React from 'react';
import satyalokLogo from '../assets/satyalok.png';

export function SatyalokBadge({ variant = 'inline' }: { variant?: 'inline' | 'footer' }) {
  if (variant === 'footer') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-gray-200">An Initiative by</p>
        <a
          href="https://satyalok.in"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 hover:opacity-75 transition-opacity"
          aria-label="Visit Satyalok website"
        >
          <img src={satyalokLogo} alt="Satyalok logo" className="h-7 w-auto object-contain" />
          <span className="sr-only">Satyalok</span>
        </a>
      </div>
    );
  }

  return (
    <a
      href="https://satyalok.in"
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-1.5 px-3 py-1 border border-[#d2d2d7] rounded-full hover:border-[#0071e3] transition-colors"
      aria-label="An Initiative by Satyalok"
    >
      <img src={satyalokLogo} alt="Satyalok" className="h-4 w-auto object-contain" />
      <span className="text-xs font-medium text-[#86868b] whitespace-nowrap">
        An Initiative by <span className="text-[#1d1d1f] font-semibold">Satyalok</span>
      </span>
    </a>
  );
}
