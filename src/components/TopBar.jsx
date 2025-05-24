import React from 'react';

import sukrityIcon from '../icons/sukriti.png';
import lakshmiIcon from '../icons/lakshmi.png';
import tonIcon from '../icons/toncoin.png';

export default function TopBar() {
  const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
  const avatarUrl = user?.username
    ? `https://t.me/i/userpic/320/${user.username}.jpg`
    : null;

  return (
    <div className="flex justify-between items-center h-14 bg-[#fef8ec] px-4 shadow-sm">
      {/* Балансы */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <img src={sukrityIcon} alt="Сукрити" className="w-5 h-5" />
          <span className="text-sm font-medium">125</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={lakshmiIcon} alt="Лакшмикоины" className="w-5 h-5" />
          <span className="text-sm font-medium">12</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={tonIcon} alt="Тонкоины" className="w-5 h-5" />
          <span className="text-sm font-medium">3.5</span>
        </div>
      </div>

      {/* Аватар */}
      <div>
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt="Профиль"
            className="w-9 h-9 rounded-full border border-gray-300 shadow"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-gray-300" />
        )}
      </div>
    </div>
  );
}
