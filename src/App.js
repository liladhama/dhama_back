import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import BottomNav from './components/BottomNav';
import Altar from './pages/Altar';
import Japa from './pages/Japa';
import Gyan from './pages/Gyan';
import Shiksha from './pages/Shiksha';
import Market from './pages/Market';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col h-screen">
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
      </div>
    </Router>
  );
}

