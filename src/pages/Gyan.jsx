import React, { useState } from 'react';

export default function Gyan() {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [place, setPlace] = useState('');

  const handleSubmit = e => {
    e.preventDefault();
    const payload = { type: 'natalChart', date, time, place };
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Калькулятор натальной карты</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Дата рождения</label>
          <input
            type="date"
            value={date}
            onChange={e => setDate(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Время рождения</label>
          <input
            type="time"
            value={time}
            onChange={e => setTime(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <div>
          <label className="block mb-1">Место рождения</label>
          <input
            type="text"
            value={place}
            onChange={e => setPlace(e.target.value)}
            placeholder="Город, страна"
            className="w-full p-2 border rounded"
            required
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 bg-blue-600 text-white rounded font-semibold"
        >
          Рассчитать
        </button>
      </form>
    </div>
  );
}
