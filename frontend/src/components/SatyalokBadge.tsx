import React from 'react';
import satyalokLogo from '../assets/satyalok.png';

export function SatyalokBadge({ variant = 'inline' }: { variant?: 'inline' | 'footer' }) {
  if (variant === 'footer') {
    return (
      <div className="flex flex-col items-center gap-2">
        <p className="text-xs text-muted-foreground">An Initiative by</p>
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
      className="inline-flex items-center gap-1.5 px-3 py-1 border border-border rounded-full hover:border-primary transition-colors"
      aria-label="An Initiative by Satyalok"
    >
      <img src={satyalokLogo} alt="Satyalok" className="size-4 object-contain" />
      <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
        An Initiative by <span className="text-foreground font-semibold">Satyalok</span>
      </span>
    </a>
  );
}
