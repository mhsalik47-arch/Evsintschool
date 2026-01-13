
import React from 'react';
import ReactDOM from 'react-dom/client';

// CRITICAL: Global process shim for browser environment
if (typeof (window as any).process === 'undefined') {
  (window as any).process = { env: {} };
}

import App from './App';

const renderApp = () => {
  try {
    const rootElement = document.getElementById('root');
    if (!rootElement) {
      console.error("Root element not found");
      return;
    }

    const root = ReactDOM.createRoot(rootElement);
    root.render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log("App mounted successfully");
  } catch (err) {
    console.error("Mount error:", err);
    // This will be caught by window.onerror in index.html
    throw err;
  }
};

// Start the app
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', renderApp);
} else {
    renderApp();
}

// Register Service Worker for PWA
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(registration => {
        console.log('SW registered');
      })
      .catch(registrationError => {
        console.warn('SW registration failed');
      });
  });
}

