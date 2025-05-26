import React, { useEffect } from 'react';

export default function App() {
  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'black',
    }}>
      <img
        src="/videos/hanuman-intro.gif"
        alt="Заставка"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      <div style={{
        position: 'relative',
        zIndex: 1,
        color: 'white',
        fontSize: '24px',
        textAlign: 'center',
        paddingTop: '40vh',
      }}>
        <p>Добро пожаловать в Dhama</p>
      </div>
    </div>
  );
}
