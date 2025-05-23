// src/index.js
import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Loading from './components/Loading';
import App from './App';
import './index.css';

const container = document.getElementById('root');
const root = createRoot(container);

function Root() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Если запущено в WebApp Telegram — вызываем ready() и expand()
    if (window.Telegram && window.Telegram.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    // Показываем loading 1.5 секунды
    const timer = setTimeout(() => setLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  return loaded ? <App /> : <Loading />;
}

root.render(<Root />);
