import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { verifyABIIntegrity } from './utils/abi-verification';
import './index.css';

// Verify ABIs before app starts
try {
  verifyABIIntegrity();
} catch (error) {
  console.error('ABI Verification Failed:', error);
  // In production, you might want to show an error page instead of continuing
  alert('Critical error: Contract ABIs are invalid or missing. Please refresh the page.');
}

// Development version with StrictMode
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);