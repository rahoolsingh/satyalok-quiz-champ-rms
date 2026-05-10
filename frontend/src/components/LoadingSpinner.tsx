import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
  fullPage?: boolean;
}

export function LoadingSpinner({ size = 36, color = '#1a237e', fullPage = false }: LoadingSpinnerProps) {
  const spinner = (
    <div
      style={{
        width: size,
        height: size,
        border: `${Math.max(3, size / 10)}px solid #e5e7eb`,
        borderTop: `${Math.max(3, size / 10)}px solid ${color}`,
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
      role="status"
      aria-label="Loading"
    />
  );

  if (fullPage) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        {spinner}
      </div>
    );
  }

  return spinner;
}
