import React, { useEffect } from 'react';

function App() {
  // Telegram WebApp API
  const tg = window.Telegram?.WebApp;

  useEffect(() => {
    if (tg) {
      tg.expand();                      // развернуть на весь экран
      tg.MainButton.setText('Отправить');
      tg.MainButton.show();
    }
  }, [tg]);

  const onSend = () => {
    const payload = { message: 'Привет, бот!', time: Date.now() };
    tg.sendData(JSON.stringify(payload));
  };
const handleClick = () => {
  const payload = { message: 'Привет, бот!', time: Date.now() };
  console.log('→ отправляем в бот', payload);
  tg.sendData(JSON.stringify(payload));
};
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-4">
      <h1 className="text-3xl font-bold mb-6">Моё Telegram Web App</h1>
      <button
        onClick={onSend}
        className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700"
      >
        Отправить боту
      </button>
    </div>
  );
}

export default App;
