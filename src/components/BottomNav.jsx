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
    <nav className="relative flex justify-around bg-white shadow px-2 pt-2 pb-3">
      {tabs.map((tab, idx) => {
        const isCenter = idx === 0; // Алтарь — по центру и больше
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `relative flex flex-col items-center justify-center ${
                isCenter ? 'w-16 h-16 -translate-y-4 z-10' : 'w-full'
              } ${isActive ? 'text-blue-600' : 'text-gray-500'}`
            }
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className={`transition-transform ${
                isCenter
                  ? 'w-14 h-14 rounded-full border-4 border-yellow-400 bg-white p-1 shadow-lg'
                  : 'w-6 h-6'
              }`}
            />
            {!isCenter && <span className="text-xs mt-1">{tab.label}</span>}
          </NavLink>
        );
      })}
    </nav>
  );
}
