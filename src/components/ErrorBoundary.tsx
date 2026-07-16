import React, { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { showToast } from './Toast';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, info: any) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    console.error('ErrorBoundary caught:', error, info);
    this.props.onError?.(error, info);
    showToast(`UI Error: ${error.message}`, 'error');
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="p-8 flex flex-col items-center justify-center text-slate-600">
          <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-sm text-slate-500 max-w-md text-center mt-2">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
          >
            Reload Page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
