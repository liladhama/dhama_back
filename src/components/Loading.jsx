import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-white">
      <img
        src="/hanuman_9_16.png"
        alt="Загрузка DHAMA"
        className="max-w-full max-h-full object-contain animate-pulse-scale"
      />
    </div>
  );
}
