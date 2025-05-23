import React from 'react';

const items = [
  { id: 'token', title: 'Лакшмикоин', description: 'Токены за Toncoin' },
  { id: 'deep-reading', title: 'Глубокая трактовка', description: 'Купи за Лакшмикоины' },
];

export default function Market() {
  const handleBuy = itemId => {
    const payload = { type: 'buy', itemId, time: Date.now() };
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Рынок</h2>
      {items.map(i => (
        <div key={i.id} className="border p-4 rounded">
          <h3 className="text-lg font-semibold">{i.title}</h3>
          <p className="text-sm mb-2">{i.description}</p>
          <button
            onClick={() => handleBuy(i.id)}
            className="py-2 px-4 bg-yellow-600 text-white rounded"
          >
            Купить
          </button>
        </div>
      ))}
    </div>
  );
}
