import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import TopBar from './components/TopBar';
import BottomNav from './components/BottomNav';

import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

import Loading from './components/Loading'; // <== Импорт загрузочного экрана

function App() {
  const [showLoading, setShowLoading] = useState(true);

  return (
    <>
      {showLoading && <Loading onFinish={() => setShowLoading(false)} />}
      {!showLoading && (
        <Router>
          <div className="flex flex-col h-screen overflow-hidden">
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
        </Router>
      )}
    </>
  );
}

export default App;
