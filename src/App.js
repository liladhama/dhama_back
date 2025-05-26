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
      <div className="flex flex-col h-screen w-screen overflow-hidden relative">
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
          <>
            <TopBar />
            {/* Контент скроллится только внутри, панели всегда видимы */}
            <div className="flex-1 overflow-auto">
              <Routes>
                <Route path="/" element={<Altar />} />
                <Route path="/japa" element={<Japa />} />
                <Route path="/gyan" element={<Gyan />} />
                <Route path="/shiksha" element={<Shiksha />} />
                <Route path="/market" element={<Market />} />
              </Routes>
            </div>
            <BottomNav />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}