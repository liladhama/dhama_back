import React, { useRef, useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

export default function App() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (videoRef.current) {
      videoRef.current.play().catch((e) => console.log('Play blocked:', e));
    }
    setStarted(true);
  };

  return (
    <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
      {/* Видео фон */}
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source src="https://dhama--video.web.app/media/hanuman-intro.webm" type="video/webm" />
      </video>

      {/* Кнопка запуска */}
      {!started && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/80">
          <button
            onClick={handleStart}
            className="px-6 py-3 text-white text-lg font-semibold bg-indigo-600 rounded-xl shadow-xl"
          >
            Войти
          </button>
        </div>
      )}

      {started && (
        <>
          <TopBar />
          <div className="flex-grow relative z-10 overflow-y-auto">
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Altar />} />
                <Route path="/japa" element={<Japa />} />
                <Route path="/gyan" element={<Gyan />} />
                <Route path="/shiksha" element={<Shiksha />} />
                <Route path="/market" element={<Market />} />
              </Routes>
            </BrowserRouter>
          </div>
          <BottomNav />
        </>
      )}
    </div>
  );
}
