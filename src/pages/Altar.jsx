import React from 'react';

export default function Altar() {
  return (
    <div
      className="h-full bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: "url('/images/altar-bg.png')",
        minHeight: 'calc(100vh - 136px)', // 56 TopBar + 80 BottomNav
      }}
    >
      {/* Здесь можно добавить интерактивные элементы */}
    </div>
  );
}
