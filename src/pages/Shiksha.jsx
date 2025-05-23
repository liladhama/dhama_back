import React from 'react';

const courses = [
  { id: 'jyotish', title: 'Джйотиш: основа' },
  { id: 'ayurveda', title: 'Аюрведа: введение' },
  { id: 'vastu', title: 'Васту-шастра: основы' },
];

export default function Shiksha() {
  const handleEnroll = courseId => {
    const payload = { type: 'course', courseId, time: Date.now() };
    window.Telegram.WebApp.sendData(JSON.stringify(payload));
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-2xl font-bold">Шикша (Обучение)</h2>
      {courses.map(c => (
        <div key={c.id} className="border p-4 rounded space-y-2">
          <h3 className="text-lg font-semibold">{c.title}</h3>
          <button
            onClick={() => handleEnroll(c.id)}
            className="py-2 px-4 bg-purple-600 text-white rounded"
          >
            Записаться
          </button>
        </div>
      ))}
    </div>
  );
}
