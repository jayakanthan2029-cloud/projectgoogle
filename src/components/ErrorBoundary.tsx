import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#0d0d0f] border border-red-500/20 rounded-3xl p-8 text-center shadow-2xl">
            <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl">⚠️</span>
            </div>
            <h1 className="text-xl font-bold text-white mb-2">System Interruption</h1>
            <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
              A.R.V.I.S. encountered an unexpected error. This may be due to a connection issue or a temporary system glitch.
            </p>
            <div className="bg-black/50 rounded-xl p-4 mb-6 text-left overflow-hidden">
              <p className="text-xs font-mono text-red-400 wrap-break-word">
                {this.state.error?.message || 'Unknown Error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-xl transition-all"
            >
              Restart System
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
