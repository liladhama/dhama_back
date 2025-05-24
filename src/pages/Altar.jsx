import React from 'react';

export default function Altar() {
  return (
    <div
      className="w-full flex-1 bg-cover bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${process.env.PUBLIC_URL}/images/altar-bg.png)`,
        height: 'calc(100vh - 136px)',
        overflow: 'hidden'
      }}
    >
      {/* Доп. элементы на алтаре */}
    </div>
  );
}
