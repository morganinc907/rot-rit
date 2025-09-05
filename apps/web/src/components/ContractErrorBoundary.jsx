/**
 * Error boundary specifically for contract/SDK related errors
 */

import React from 'react';

class ContractErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Contract SDK Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black text-white flex items-center justify-center">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-400 mb-4">
              Contract Connection Error
            </h1>
            <p className="text-gray-300 mb-6 max-w-md">
              There was an error connecting to the smart contracts. 
              This might be due to network issues or unsupported chain.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg font-semibold transition"
            >
              Reload Page
            </button>
            {process.env.NODE_ENV === 'development' && (
              <details className="mt-6 text-left">
                <summary className="cursor-pointer text-sm text-gray-400">
                  Error Details (Dev Mode)
                </summary>
                <pre className="mt-2 p-4 bg-gray-900 text-xs overflow-auto rounded">
                  {this.state.error?.stack || this.state.error?.message}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ContractErrorBoundary;