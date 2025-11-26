import React, { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          padding: '20px',
          backgroundColor: '#1f2937',
          color: 'white',
          fontFamily: 'Arial, sans-serif'
        }}>
          <h1 style={{ fontSize: '24px', marginBottom: '16px' }}>
            應用程式載入錯誤
          </h1>
          <p style={{ marginBottom: '20px', textAlign: 'center' }}>
            您的瀏覽器可能不支援此應用程式的某些功能
          </p>
          <details style={{ marginBottom: '20px' }}>
            <summary style={{ cursor: 'pointer', marginBottom: '10px' }}>
              技術詳情
            </summary>
            <pre style={{ 
              backgroundColor: '#374151', 
              padding: '10px', 
              borderRadius: '4px',
              fontSize: '12px',
              overflow: 'auto'
            }}>
              {this.state.error?.toString()}
            </pre>
          </details>
          <button 
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#3b82f6',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '8px',
              fontSize: '16px',
              cursor: 'pointer'
            }}
          >
            重新載入
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}