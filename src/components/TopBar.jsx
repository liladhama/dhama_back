import React, { useEffect, useState } from 'react';
import sukritiIcon from '../assets/icons/sukriti.svg';
import lakshmiIcon from '../assets/icons/lakshmi.svg';
import toncoinIcon from '../assets/icons/toncoin.svg';

export default function TopBar() {
  const [avatar, setAvatar] = useState(null);

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    const photo = tg?.initDataUnsafe?.user?.photo_url;
    if (photo) setAvatar(photo);
  }, []);

  return (
    <div className="bg-[#e0c8b0] border-b border-gray-300 px-4 py-2 flex justify-between items-center">
      {/* Балансы */}
      <div className="flex space-x-4 items-center">
        <div className="flex items-center space-x-1">
          <img src={sukritiIcon} alt="Sukriti" className="w-6 h-6" />
          <span className="text-sm font-medium text-gray-800">512</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={lakshmiIcon} alt="Lakshmi" className="w-6 h-6" />
          <span className="text-sm font-medium text-gray-800">39</span>
        </div>
        <div className="flex items-center space-x-1">
          <img src={toncoinIcon} alt="Toncoin" className="w-6 h-6" />
          <span className="text-sm font-medium text-gray-800">7</span>
        </div>
      </div>

      {/* Аватар */}
      <div className="w-10 h-10 rounded-full overflow-hidden border border-gray-400 shadow">
        {avatar ? (
          <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gray-300" />
        )}
      </div>
    </div>
  );
}
