import React from 'react';

export default function Altar() {
  return (
    <div
      className="fixed top-[56px] left-0 w-full"
      style={{
        height: 'calc(100vh - 136px)', // 56px TopBar + 80px BottomNav
        overflow: 'hidden',
        zIndex: 1,
      }}
    >
      <img
        src="/images/altar-bg.png"
        alt="Altar"
        className="w-full h-full object-cover"
      />

      {/* Сюда можно вернуть кнопки-подношения позже */}
    </div>
  );
}
