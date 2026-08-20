import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// Đăng ký Service Worker PWA (Chạy nền lưu cache và hỗ trợ cài đặt app)
if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('PWA Service Worker đã sẵn sàng:', reg.scope);
      })
      .catch((err) => {
        console.warn('Đăng ký Service Worker thất bại:', err);
      });
  });
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
