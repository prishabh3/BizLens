import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('BizLens render error:', error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-lg w-full">
          <div className="h-1.5 w-16 bg-[#2251FF] mb-8" />
          <p className="text-[11px] font-bold text-red-500 uppercase tracking-widest mb-3">Unexpected Error</p>
          <h1 className="font-serif-heading text-3xl font-bold text-gray-900 mb-4">
            Something went wrong.
          </h1>
          <p className="text-[15px] text-gray-600 leading-relaxed mb-2">
            BizLens encountered an unexpected error in this component.
            Your data has not been lost.
          </p>
          <p className="text-[12px] font-mono text-red-400 bg-red-50 border border-red-100 p-3 mb-8 break-all">
            {this.state.error?.message || 'Unknown error'}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => this.setState({ hasError: false, error: null })}
              className="px-6 py-3 bg-[#2251FF] text-white text-[13px] font-bold uppercase tracking-wider hover:bg-[#002D72] transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 border border-gray-300 text-gray-700 text-[13px] font-bold uppercase tracking-wider hover:bg-gray-50 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      </div>
    );
  }
}
