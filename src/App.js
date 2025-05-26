import React, { useRef, useEffect } from 'react';
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
        const played = videoRef.current.play();
        if (played instanceof Promise) {
          played.catch((e) => console.log('Autoplay blocked:', e));
        }
      }
    };

    document.body.addEventListener('click', tryPlay, { once: true });
    document.body.addEventListener('touchstart', tryPlay, { once: true });

    return () => {
      document.body.removeEventListener('click', tryPlay);
      document.body.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  return (
    <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
      {/* Видео фон с Firebase */}
      <video
        ref={videoRef}
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover -z-10"
      >
        <source
          src="https://dhama--video.web.app/media/hanuman-intro.webm"
          type="video/webm"
        />
        {/* Fallback если видео не работает */}
        <img
          src="/fallback.png"
          alt="Background"
          className="w-full h-full object-cover"
        />
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
