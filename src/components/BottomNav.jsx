import React from 'react';
import { NavLink } from 'react-router-dom';

import altarIcon from '../icons/icon_altar.png';
import japaIcon from '../icons/icon_japa.png';
import gyanIcon from '../icons/icon_gyan.png';
import shikshaIcon from '../icons/icon_shiksha.png';
import marketIcon from '../icons/icon_market.png';

export default function BottomNav() {
  const tabs = [
    { to: '/japa',    label: 'Джапа',   icon: japaIcon },
    { to: '/gyan',    label: 'Гьяна',   icon: gyanIcon },
    { to: '/',        label: 'Алтарь',  icon: altarIcon },
    { to: '/shiksha', label: 'Шикша',   icon: shikshaIcon },
    { to: '/market',  label: 'Рынок',   icon: marketIcon },
  ];

  return (
    <nav className="flex justify-between items-end bg-[#CD853F] px-2 pt-2 pb-4 shadow-md">

      {tabs.map((tab, idx) => {
        const isCenter = idx === 2;
        return (
          <NavLink
            key={tab.to}
            to={tab.to}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full ${
                isCenter ? 'relative -translate-y-1.5 z-10' : '-translate-y-1.5'
              }`
            }
          >
            <img
              src={tab.icon}
              alt={tab.label}
              className={`transition-transform ${
                isCenter
                  ? 'w-14 h-14 rounded-full border-4 border-yellow-400 bg-white shadow-lg'
                  : 'w-12 h-12'
              }`}
            />
            <span className="text-sm mt-1 font-soyuz text-white">{tab.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}