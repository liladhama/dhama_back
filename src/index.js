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

  // Первый эффект: ready() + первичный expand()
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    const timer = setTimeout(() => setLoaded(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  // Второй эффект: повторный expand() уже при показе App
  useEffect(() => {
    if (loaded && window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, [loaded]);

  return loaded ? <App /> : <Loading />;
}

root.render(<Root />);
