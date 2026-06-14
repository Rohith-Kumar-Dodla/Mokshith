import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex items-center justify-center p-4 sm:p-8">
          <div className="max-w-md w-full bg-white border border-red-200 rounded-lg p-6 text-center space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-600">An unexpected error occurred. Please try again.</p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2.5 min-h-[44px] bg-blue-600 text-white rounded-lg text-sm"
              >
                Try Again
              </button>
              <a href="/" className="px-4 py-2.5 min-h-[44px] border rounded-lg text-sm inline-flex items-center justify-center">
                Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
