import React from 'react';
import ReactDOM from 'react-dom/client';
import './lib/sentry';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import './lib/i18n';
import './index.css';

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>,
  );
} catch (e) {
  document.getElementById('root')!.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;">
      <div style="text-align:center;max-width:400px;">
        <h1 style="font-size:1.5rem;margin-bottom:0.5rem;">Error al iniciar la aplicación</h1>
        <p style="color:#666;font-size:0.875rem;">${e instanceof Error ? e.message : 'Error desconocido'}</p>
      </div>
    </div>
  `;
}
