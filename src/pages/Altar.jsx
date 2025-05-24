import React from 'react';

export default function Altar() {
  return (
    <div
      className="bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/altar-bg.png)`,
        height: 'calc(100vh - 136px)', // TopBar + BottomNav
        overflow: 'hidden',
      }}
    >
      {/* Здесь можно добавить интерактивные элементы */}
    </div>
  );
}
