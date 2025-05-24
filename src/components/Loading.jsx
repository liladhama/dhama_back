// src/components/Loading.jsx
import React from 'react';

export default function Loading() {
  return (
    <div className="flex items-center justify-center h-full w-full bg-white">
      <img
        src="/hanuman-loading.png"           // файл в public/
        alt="Загрузка DHAMA"
        className="absolute inset-0 w-full h-full object-cover"
      />
    </div>
  );
}
