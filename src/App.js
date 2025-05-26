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
  const [ctaVisible, setCtaVisible] = useState(true);
  const [soundPlayed, setSoundPlayed] = useState(false);
  const videoRef = useRef(null);
  const audioRef = useRef(null);

  // --- для анимации огня ---
  const [showFireAnim, setShowFireAnim] = useState(false);
  const [fireAnimKey, setFireAnimKey] = useState(0);

  const handleFireAnimStart = () => {
    setFireAnimKey(Date.now());
    setShowFireAnim(true);
  };

  const handleFireAnimEnd = () => {
    setShowFireAnim(false);
  };

  // Автозапуск видео сразу
  useEffect(() => {
    videoRef.current?.play().catch(() => {});
  }, []);

  // При завершении видео
  const handleVideoEnd = () => {
    setVideoFinished(true);
    audioRef.current?.pause();
    audioRef.current && (audioRef.current.currentTime = 0);
  };

  // Клик по призыву к действию (CTA)
  const handleCtaClick = () => {
    audioRef.current?.play().then(() => {
      setSoundPlayed(true);
      setCtaVisible(false);
    }).catch(() => {
      setCtaVisible(false);
    });
  };

  // Если видео закончилось, CTA скрываем
  useEffect(() => {
    if (videoFinished) setCtaVisible(false);
  }, [videoFinished]);

  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen w-screen overflow-hidden relative">
        {/* Видео-заставка */}
        {!videoFinished && (
          <>
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              onEnded={handleVideoEnd}
              className="absolute top-0 left-0 w-full h-full object-cover z-40"
            >
              <source src="/videos/hanuman-full.mp4" type="video/mp4" />
            </video>
            <audio
              ref={audioRef}
              src="/audio/hanuman-intro.mp3"
              preload="auto"
            />
            {/* Призыв к действию — внизу, еще более прозрачный, на английском */}
            {ctaVisible && (
              <div
                className="fixed bottom-6 left-0 w-full flex justify-center"
                style={{
                  zIndex: 50,
                  pointerEvents: 'none',
                }}
              >
                <button
                  onClick={handleCtaClick}
                  className="pointer-events-auto px-6 py-3 rounded-full text-lg shadow-lg transition-opacity duration-300"
                  style={{
                    background: 'rgba(0, 0, 0, 0.28)', // ещё прозрачнее
                    color: 'white',
                    backdropFilter: 'blur(6px)',
                    border: '1px solid rgba(255,255,255,0.13)',
                    fontWeight: 500,
                  }}
                >
                  🔊 Tap to enable sound
                </button>
              </div>
            )}
          </>
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
                    className="w-full h-full object-cover"
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