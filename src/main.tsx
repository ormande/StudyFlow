import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { ToastProvider } from './contexts/ToastContext'; // <--- Importe aqui

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ToastProvider> {/* <--- Envolva o App aqui */}
      <App />
    </ToastProvider>
  </StrictMode>
);