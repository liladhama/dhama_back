import React from 'react';

export default function Altar() {
  return (
    <div className="flex flex-col flex-grow min-h-screen">
      <div className="relative flex-grow overflow-hidden">
        {/* Фоновое изображение */}
        <img
          src="/images/altar-bg.png"
          alt="Altar"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* Под интерактивные элементы */}
        <div className="relative z-10 h-full w-full flex items-end justify-center pb-4">
          {/* Подношения будут здесь */}
        </div>
      </div>
    </div>
  );
}
