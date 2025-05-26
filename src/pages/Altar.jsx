import React, { useState } from 'react';

export default function Altar() {
  const [showFlash, setShowFlash] = useState(false);

  const handleFireClick = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    console.log('🔥 Огонь предложен');
  };

  return (
    <div className="relative w-full min-h-screen overflow-hidden">
      {/* 🖼️ Фоновое изображение */}
      <img
        src="/images/altar-bg.png"
        alt="Фон"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/* 🔥 Элемент огня */}
      <img
        src="/images/fire.png"
        alt="Огонь"
        onClick={handleFireClick}
        className="absolute cursor-pointer"
        style={{
          top: '73%',
          left: '75%',
          width: '70px',
          transform: 'translate(-50%, 0)',
        }}
      />

      {/* 💥 Вспышка */}
      {showFlash && (
        <div
          className="absolute bg-yellow-300 rounded-full opacity-80 animate-ping"
          style={{
            top: '73%',
            left: '75%',
            width: '80px',
            height: '80px',
            transform: 'translate(-50%, -50%)',
            zIndex: 10,
          }}
        />
      )}
    </div>
  );
}
