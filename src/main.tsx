import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Safely ignore benign dev-time WebSocket disconnection errors per environment specifications
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    if (
      event.message?.includes('WebSocket') ||
      event.message?.includes('closed without opened')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });

  window.addEventListener('unhandledrejection', (event) => {
    if (
      event.reason?.message?.includes('WebSocket') ||
      String(event.reason).includes('WebSocket')
    ) {
      event.stopImmediatePropagation();
      event.preventDefault();
    }
  });
}

createRoot(document.getElementById('root')!).render(<App />);
