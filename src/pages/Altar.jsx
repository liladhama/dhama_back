import React from 'react';

export default function Altar() {
  return (
    <div
      className="w-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/altar-bg.png')",
        height: 'calc(100vh - 136px)',
        overflow: 'hidden'
      }}
    >
      <div className="text-white text-center pt-10 text-xl drop-shadow">
        🕉 Алтарь загружен
      </div>
    </div>
  );
}
