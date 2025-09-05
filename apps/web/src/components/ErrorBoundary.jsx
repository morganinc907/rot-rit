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
    console.error('App crashed:', error, errorInfo);
    
    // Optional: Send to error tracking service
    // reportError(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <div className="error-content">
            <h1>🔥 The Ritual Failed</h1>
            <p>Something went wrong in the depths of the crypt.</p>
            <details>
              <summary>Technical Details</summary>
              <pre>{this.state.error?.toString()}</pre>
            </details>
            <button 
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              Try Again
            </button>
          </div>

          <style jsx>{`
            .error-boundary {
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              background: linear-gradient(180deg, #0a0a0a 0%, #1a0f1a 100%);
              color: #d4c5db;
              font-family: 'Courier New', monospace;
              padding: 20px;
            }

            .error-content {
              text-align: center;
              max-width: 500px;
              background: rgba(26, 11, 11, 0.9);
              border: 2px solid #8b0000;
              border-radius: 12px;
              padding: 40px;
            }

            .error-content h1 {
              color: #ff6b6b;
              font-size: 32px;
              margin-bottom: 16px;
              text-shadow: 0 0 10px rgba(255, 107, 107, 0.5);
            }

            .error-content p {
              color: #8b4513;
              margin-bottom: 24px;
              font-style: italic;
            }

            details {
              text-align: left;
              margin: 20px 0;
              background: rgba(0, 0, 0, 0.5);
              border-radius: 4px;
              padding: 12px;
            }

            summary {
              cursor: pointer;
              color: #a89bb0;
              font-size: 14px;
            }

            pre {
              margin-top: 8px;
              font-size: 12px;
              color: #ff6b6b;
              overflow-x: auto;
            }

            .retry-button {
              background: linear-gradient(135deg, #8b0000 0%, #ff0000 100%);
              border: 2px solid #ff0000;
              color: #fff;
              padding: 16px 24px;
              border-radius: 8px;
              font-weight: bold;
              cursor: pointer;
              transition: all 0.3s;
              text-transform: uppercase;
              letter-spacing: 1px;
            }

            .retry-button:hover {
              background: linear-gradient(135deg, #ff0000 0%, #ff6b6b 100%);
              box-shadow: 0 0 20px rgba(255, 0, 0, 0.5);
              transform: translateY(-2px);
            }
          `}</style>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;