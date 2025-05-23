// src/index.js
import React, { useState, useEffect } from 'react';
import { createRoot }      from 'react-dom/client';
import Loading             from './components/Loading';
import App                 from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

function Root() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      // Сразу разворачиваем интерфейс
      window.Telegram.WebApp.expand();
    }
    // Показываем Loading минимум 1.5с
    const timer = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  return loaded ? <App /> : <Loading />;
}

root.render(<Root />);
