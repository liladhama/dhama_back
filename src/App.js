import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

export default function App() {
  console.log('App component rendered');

  return (
    <BrowserRouter>
      <div className="relative flex flex-col min-h-[100dvh] overflow-hidden">
        {/* Фон (на всякий случай, если видео не загрузится) */}
        <div className="absolute inset-0 bg-black -z-20" />

        {/* Видео фон */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="fixed top-0 left-0 w-full h-full object-cover -z-10"
        >
          <source src="/videos/hanuman-intro-light.mp4" type="video/mp4" />
        </video>

        {/* Основной интерфейс */}
        <TopBar />
        <div className="flex-grow overflow-hidden relative z-10">
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
    </BrowserRouter>
  );
}
