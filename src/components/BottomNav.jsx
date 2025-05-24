import React from 'react';
import { NavLink } from 'react-router-dom';

// Импорт иконок из папки src/icons
import altarIcon from '../icons/icon_altar.png';
import japaIcon from '../icons/icon_japa.png';
import gyanIcon from '../icons/icon_gyan.png';
import shikshaIcon from '../icons/icon_shiksha.png';
import marketIcon from '../icons/icon_market.png';

export default function BottomNav() {
  const tabs = [
    { to: '/',        label: 'Алтарь',  icon: altarIcon },
    { to: '/japa',    label: 'Джапа',   icon: japaIcon },
    { to: '/gyan',    label: 'Гьяна',   icon: gyanIcon },
    { to: '/shiksha', label: 'Шикша',   icon: shikshaIcon },
    { to: '/market',  label: 'Рынок',   icon: marketIcon },
  ];

  return (
    <nav className="flex justify-around bg-white shadow p-2">
      {tabs.map((tab, idx) => {
        // Центральная иконка "Алтарь" (idx 0) крупнее и в круге
        const isCenter = idx === 0;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center text-xs ${
                isActive ? 'text-blue-600' : 'text-gray-500'
              }`
            }
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className={`transition-transform ${
                isCenter
                  ? 'w-10 h-10 -mt-1 rounded-full border-2 border-yellow-400 p-1'
                  : 'w-6 h-6'
              }`}
            />
            <span className="mt-1">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
