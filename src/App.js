import React, { useEffect, useRef } from 'react';
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

  useEffect(() => {
    const tryPlay = () => {
      if (videoRef.current) {
        videoRef.current.play().catch((e) => {
          console.log('Autoplay prevented:', e);
        });
      }
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };

    window.addEventListener('click', tryPlay);
    window.addEventListener('touchstart', tryPlay);
  }, []);

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
        <source src="/videos/hanuman-intro-mobile.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

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
    </div>
  );
}
