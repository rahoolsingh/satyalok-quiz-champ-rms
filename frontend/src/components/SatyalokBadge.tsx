import React from 'react';
import satyalokLogo from '../assets/satyalok.png';

/**
 * "An Initiative by Satyalok" badge — links to satyalok.in
 * variant="inline"  → small horizontal pill (for hero / headings)
 * variant="footer"  → centered footer row
 */
export function SatyalokBadge({ variant = 'inline' }: { variant?: 'inline' | 'footer' }) {
  if (variant === 'footer') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, paddingTop: 24, borderTop: '1px solid #d2d2d7', marginTop: 40 }}>
        <p style={{ fontSize: '0.78rem', color: '#86868b', fontWeight: 400 }}>An Initiative by</p>
        <a
          href="https://satyalok.in"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}
          aria-label="Visit Satyalok website"
        >
          <img src={satyalokLogo} alt="Satyalok logo" style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        </a>
      </div>
    );
  }

  // inline pill
  return (
    <a
      href="https://satyalok.in"
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '4px 10px 4px 6px',
        border: '1px solid #d2d2d7', borderRadius: 20,
        textDecoration: 'none', background: 'transparent',
        transition: 'border-color 0.15s',
      }}
      aria-label="An Initiative by Satyalok"
    >
      <img src={satyalokLogo} alt="Satyalok" style={{ height: 18, width: 'auto', objectFit: 'contain' }} />
      <span style={{ fontSize: '0.78rem', fontWeight: 500, color: '#86868b', whiteSpace: 'nowrap' }}>
        An Initiative by <span style={{ color: '#1d1d1f', fontWeight: 600 }}>Satyalok</span>
      </span>
    </a>
  );
}
