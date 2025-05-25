import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import Loading from './components/Loading';
import App from './App';
import './index.css';

const root = createRoot(document.getElementById('root'));

function Root() {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    console.log('Root component mounted');
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
      console.log('Telegram Web App initialized');
    }
    return () => console.log('Root component unmounted');
  }, []);

  const handleFinish = () => {
    if (!loaded) {
      console.log('handleFinish called, setting loaded to true');
      setLoaded(true);
    } else {
      console.log('handleFinish called, but loaded is already true');
    }
  };

  if (loaded) {
    console.log('Rendering App');
    return <App />;
  }

  console.log('Rendering Loading');
  return <Loading onFinish={handleFinish} />;
}

root.render(<Root />);