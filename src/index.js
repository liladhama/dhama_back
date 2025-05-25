import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

function showApp() {
  const container = document.getElementById('root');
  const root = createRoot(container);
  root.render(<App />);
}

function playIntroAndStart() {
  const video = document.createElement('video');
  video.src = '/videos/hanuman-intro.mp4';
  video.muted = true;
  video.playsInline = true;
  video.className = 'fixed inset-0 z-50 w-full h-full object-cover';
  video.setAttribute('preload', 'auto');
  video.setAttribute('webkit-playsinline', '');
  video.setAttribute('playsinline', '');

  document.body.appendChild(video);

  video.onended = () => {
    video.remove();
    showApp();
  };

  video.onerror = () => {
    console.error('⚠️ Ошибка воспроизведения видео, fallback на App');
    video.remove();
    showApp();
  };

  video.play().catch((err) => {
    console.error('⚠️ Autoplay не удался:', err);
    video.remove();
    showApp(); // fallback
  });
}

playIntroAndStart();
