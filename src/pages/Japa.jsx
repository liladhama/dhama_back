import React, { useState, useRef, useEffect } from 'react';

export default function Japa() {
  const [count, setCount] = useState(0);
  const intervalRef = useRef(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => setCount(c => c + 1), 1000);
  };

  const stop = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    const payload = { type: 'japa', count, time: Date.now() };
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  };

  useEffect(() => () => clearInterval(intervalRef.current), []);

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Джапа-медитация</h2>
      <div className="text-center text-4xl font-mono">{count}</div>
      <div className="flex space-x-2">
        <button onClick={start} className="flex-1 py-2 bg-green-500 text-white rounded">
          Начать
        </button>
        <button onClick={stop} className="flex-1 py-2 bg-red-500 text-white rounded">
          Остановить
        </button>
      </div>
    </div>
  );
}
