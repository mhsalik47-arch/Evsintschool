
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (!(window as any).process) {
  (window as any).process = { env: {} };
}

const container = document.getElementById('root');
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
