import React, { useState } from 'react';

export default function Altar() {
  const [showFlash, setShowFlash] = useState(false);

  const handleFireClick = () => {
    setShowFlash(true);
    setTimeout(() => setShowFlash(false), 400);
    console.log('🔥 Огонь предложен');
  };

  return (
    <div
      className="w-full min-h-screen bg-[url('/images/altar-bg.png')] bg-cover bg-center bg-no-repeat relative"
    >
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
