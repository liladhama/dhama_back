import React from 'react';

export default function Altar() {
  return (
    <div className="w-full bg-[#f5f5f5]">
      <div
        className="relative overflow-hidden"
        style={{
          height: 'calc(100vh - 136px)', // 56 (TopBar) + 80 (BottomNav)
        }}
      >
        <img
          src="/images/altar-bg.png"
          alt="Altar"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 flex justify-center items-center">
          <p className="text-white text-xl font-bold">🕉 Алтарь загружен</p>
        </div>
      </div>
    </div>
  );
}
