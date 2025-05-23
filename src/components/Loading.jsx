import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full bg-white">
      <img
        src="/hanuman-loading.png"
        alt="Загрузка DHAMA"
        className="w-1/3 animate-pulse"
      />
    </div>
  );
}
