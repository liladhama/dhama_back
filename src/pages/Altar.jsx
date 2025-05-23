import React from 'react';

export default function Altar() {
  const actions = [
    { key: 'bhoga', label: 'Бхога — подношение пищи' },
    { key: 'arati', label: 'Арати — поклонение огнём' },
    { key: 'japa', label: 'Джапа — мантры' },
  ];

  const handleClick = actionKey => {
    const payload = { type: 'altar', action: actionKey, time: Date.now() };
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Алтарь (дхамы)</h2>
      {actions.map(a => (
        <button
          key={a.key}
          onClick={() => handleClick(a.key)}
          className="w-full py-3 bg-yellow-500 text-white rounded shadow"
        >
          {a.label}
        </button>
      ))}
    </div>
  );
}
