import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Intro from './pages/Intro'; // ← добавили
import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex flex-col h-screen overflow-hidden">
        <TopBar />
        <div className="flex-grow overflow-hidden">
          <Routes>
            <Route path="/" element={<Intro />} />
            <Route path="/altar" element={<Altar />} />
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
