import React from 'react';
import sukritiIcon from '../assets/icons/sukriti.svg';
import lakshmiIcon from '../assets/icons/lakshmi.svg';
import toncoinIcon from '../assets/icons/toncoin.svg';

export default function TopBar() {
  return (
    <div className="bg-white border-b border-gray-300 px-4 py-2 flex justify-between items-center">
      {/* Левая часть (пусто или для логотипа) */}
      <div className="w-10 h-10 rounded-full bg-gray-200"></div>

      {/* Центр (балансы) */}
      <div className="flex space-x-4 items-center">
        <div className="flex items-center space-x-1">
          <img src={sukritiIcon} alt="Sukriti" className="w-6 h-6" />
          <span className="text-sm font-medium">512</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={lakshmiIcon} alt="Lakshmi" className="w-6 h-6" />
          <span className="text-sm font-medium">39</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={toncoinIcon} alt="Toncoin" className="w-6 h-6" />
          <span className="text-sm font-medium">7</span>
        </div>
      </div>

      {/* Аватарка пользователя */}
      <div className="w-10 h-10 rounded-full bg-gray-300">
        {/* позже: аватарка Telegram */}
      </div>
    </div>
  );
}
