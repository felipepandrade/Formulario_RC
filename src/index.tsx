import React from 'react';
import ReactDOM from 'react-dom/client';
import { inject } from '@vercel/analytics';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
// Lato is the typeface of ENGIE's Fluid Design System. It is bundled with the app (no Google
// Fonts request), so it also works offline.
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-700.css';
import './index.css';

// Cookieless visit counts from Vercel Web Analytics, only in builds made on Vercel.
// Nothing is collected until Web Analytics is enabled in the project's dashboard.
if (__VERCEL_ANALYTICS__) inject({ mode: 'production' });

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
