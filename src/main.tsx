import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Офлайн-режим только для веб-версии по https (не в Electron и не в Android-приложении)
if (
  import.meta.env.PROD &&
  'serviceWorker' in navigator &&
  location.protocol === 'https:' &&
  !window.electronAPI &&
  !window.Capacitor
) {
  navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
