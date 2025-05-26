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

  // --- для анимации огня ---
  const [showFireAnim, setShowFireAnim] = useState(false);
  const [fireAnimKey, setFireAnimKey] = useState(0); // чтобы сбрасывать видео всегда

  const handleFireAnimStart = () => {
    setFireAnimKey(Date.now()); // будет уникальным при каждом клике
    setShowFireAnim(true);
  };

  const handleFireAnimEnd = () => {
    setShowFireAnim(false);
  };
  // --- конец для анимации огня ---

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
            <div className="flex-1 overflow-auto relative">
              <Routes>
                <Route path="/" element={<Altar onFireAnim={handleFireAnimStart} />} />
                <Route path="/japa" element={<Japa />} />
                <Route path="/gyan" element={<Gyan />} />
                <Route path="/shiksha" element={<Shiksha />} />
                <Route path="/market" element={<Market />} />
              </Routes>
              {/* --- Видео-анимация огня --- */}
              {showFireAnim && (
                <div className="absolute inset-0 z-40 bg-black/30 flex items-center justify-center">
                  <video
                    key={fireAnimKey}
                    src="/videos/fire-animation.mp4"
                    className="w-full h-full object-contain"
                    autoPlay
                    playsInline
                    muted
                    onEnded={handleFireAnimEnd}
                    style={{ pointerEvents: 'none' }}
                  />
                </div>
              )}
            </div>
            <BottomNav />
          </>
        )}
      </div>
    </BrowserRouter>
  );
}