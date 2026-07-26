import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Uncaught React Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-6 text-on-surface">
          <div className="max-w-xl w-full bg-white border border-outline-variant rounded-2xl p-8 custom-shadow text-center space-y-4">
            <div className="w-16 h-16 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-xl font-bold font-headline-md">Something went wrong</h2>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              An unexpected system exception occurred.
            </p>
            {this.state.error && (
              <div className="p-3 bg-error/5 border border-error/20 text-error text-xs font-mono text-left rounded-lg overflow-auto max-h-40">
                {this.state.error.toString()}
              </div>
            )}
            <div className="pt-2 flex justify-center gap-3">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/dashboard';
                }}
                className="px-6 py-2.5 bg-primary text-white text-xs font-bold rounded-xl shadow-md hover:bg-on-primary-fixed-variant transition-colors"
              >
                Go to Dashboard
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-6 py-2.5 bg-surface-container-high text-on-surface text-xs font-bold rounded-xl border border-outline-variant hover:bg-surface-variant transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
