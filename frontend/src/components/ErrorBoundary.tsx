import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div style={styles.container} role="alert">
          <div style={styles.card}>
            <span style={styles.icon}>⚠️</span>
            <h2 style={styles.title}>Something went wrong</h2>
            <p style={styles.message}>{this.state.error?.message || 'An unexpected error occurred.'}</p>
            <button style={styles.btn} onClick={() => this.setState({ hasError: false })}>
              Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles: Record<string, React.CSSProperties> = {
  container: { display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '200px', padding: '20px' },
  card: { background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', maxWidth: '400px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' },
  icon: { fontSize: '2.5rem' },
  title: { fontSize: '1.2rem', fontWeight: 700, color: '#374151', margin: '12px 0 8px' },
  message: { color: '#6b7280', fontSize: '0.9rem', marginBottom: '20px' },
  btn: { padding: '10px 24px', background: '#1a237e', color: 'white', borderRadius: '8px', fontWeight: 600, cursor: 'pointer' },
};
