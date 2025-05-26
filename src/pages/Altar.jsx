import React, { useState } from 'react';

export default function Altar() {
  const [showFlash, setShowFlash] = useState(false);

  const handleFireClick = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    console.log('🔥 Огонь предложен');
  };

  return (
    <div className="relative w-full h-full overflow-hidden"> {/* h-full вместо h-[100dvh] */}
      {/* Фоновое изображение */}
      <img
        src="/images/altar-bg.png"
        alt="Фон"
        className="absolute top-0 left-0 w-full h-full object-cover -z-10"
      />

      {/* Контент */}
      <div className="relative w-full h-full max-w-[480px] mx-auto">
        {/* Кнопка огня */}
        <img
          src="/images/fire.png"
          alt="Огонь"
          onClick={handleFireClick}
          className="absolute cursor-pointer"
          style={{
            top: '61%',
            left: '90%',
            width: '60px',
            transform: 'translate(-50%, 0)',
          }}
        />

        {/* Вспышка */}
        {showFlash && (
          <div
            className="absolute bg-yellow-300 rounded-full opacity-80 animate-ping"
            style={{
              top: '61%',
              left: '90%',
              width: '80px',
              height: '80px',
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          />
        )}
      </div>
    </div>
  );
}