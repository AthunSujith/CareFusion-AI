import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// PWA Detection & Enhancement Logic
const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;

if (isStandalone) {
  document.body.classList.add('pwa-mode');
  console.log('📱 CareFusion launched in Clinical App Mode');
}

// Service Worker Registration for Android Installation support
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('✅ Service Worker Registered:', reg.scope))
      .catch(err => console.log('❌ Service Worker Mesh Failure:', err));
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
