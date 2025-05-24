import React from 'react';

export default function Altar() {
  return (
    <div className="relative w-full h-full overflow-hidden flex-grow">
      {/* Фоновое изображение */}
      <img
        src="/images/altar-bg.png"
        alt="Altar"
        className="w-full h-full object-cover absolute inset-0 z-0"
      />

      {/* Контейнер для интерактивных элементов */}
      <div className="relative z-10 flex flex-col items-center justify-end h-full pb-4">
        {/* Здесь можно разместить кнопки подношений */}
      </div>
    </div>
  );
}
