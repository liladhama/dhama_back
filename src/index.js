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
  video.autoplay = true;
  video.className = 'fixed inset-0 z-50 w-full h-full object-cover';
  document.body.appendChild(video);

  // Запуск приложения по завершению воспроизведения
  const finish = () => {
    video.remove();
    showApp();
  };

  video.onended = finish;
  video.onerror = finish;

  video.play().catch((err) => {
    console.warn('Autoplay failed, fallback to App:', err);
    finish();
  });
}

playIntroAndStart();
