import React from 'react';

export default function Altar() {
  return (
    <div
      className="bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/altar-bg.png')",
        height: 'calc(100vh - 136px)', // TopBar + BottomNav
        overflow: 'hidden'
      }}
    >
      {/* Можно добавить кнопки подношений здесь */}
    </div>
  );
}
