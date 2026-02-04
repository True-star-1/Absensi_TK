
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Polyfill process object for browser environment to prevent startup crashes
if (typeof window !== 'undefined') {
  (window as any).process = (window as any).process || {};
  (window as any).process.env = (window as any).process.env || { NODE_ENV: 'production' };
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
