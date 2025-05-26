import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

export default function App() {
  const [videoFinished, setVideoFinished] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    // Вызов Telegram.WebApp.expand() для максимизации окна в Telegram WebView
    if (window.Telegram && window.Telegram.WebApp && window.Telegram.WebApp.expand) {
      window.Telegram.WebApp.expand();
    }

    const tryPlay = () => {
      videoRef.current?.play().catch(() => {});
    };
    window.addEventListener('click', tryPlay);
    window.addEventListener('touchstart', tryPlay);
    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  const handleVideoEnd = () => {
    setVideoFinished(true);
  };

  return (
    <BrowserRouter>
      <div className="relative w-screen min-h-screen overflow-hidden">
        {/* Видео-заставка поверх всего */}
        {!videoFinished && (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            onEnded={handleVideoEnd}
            className="absolute top-0 left-0 w-full h-full object-cover z-50"
          >
            <source src="/videos/hanuman-full.mp4" type="video/mp4" />
          </video>
        )}

        {/* Основной интерфейс — показываем только после видео */}
        {videoFinished && (
          <div className="flex flex-col min-h-screen w-screen overflow-hidden relative z-10">
            <TopBar />
            <div className="flex-grow overflow-hidden">
              <Routes>
                <Route path="/" element={<Altar />} />
                <Route path="/japa" element={<Japa />} />
                <Route path="/gyan" element={<Gyan />} />
                <Route path="/shiksha" element={<Shiksha />} />
                <Route path="/market" element={<Market />} />
              </Routes>
            </div>
            <BottomNav />
          </div>
        )}
      </div>
    </BrowserRouter>
  );
}