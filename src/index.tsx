import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
// Lato is the typeface of ENGIE's Fluid Design System. It is bundled with the app (no Google
// Fonts request), so it also works offline.
import '@fontsource/lato/latin-400.css';
import '@fontsource/lato/latin-700.css';
import '@fontsource/lato/latin-900.css';
import './index.css';

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