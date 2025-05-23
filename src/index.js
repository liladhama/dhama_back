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
    // Telegram WebApp API доступен только в WebView Telegram
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
    // Показ лоадера минимум 3 секунды
    const timer = setTimeout(() => {
      setLoaded(true);
      // Повторный expand уже после рендера App
      window.Telegram?.WebApp?.expand();
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return loaded ? <App /> : <Loading />;
}

root.render(<Root />);
