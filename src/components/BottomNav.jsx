import React from 'react';
import { NavLink } from 'react-router-dom';

import altarIcon from '../icons/icon_altar.png';
import japaIcon from '../icons/icon_japa.png';
import gyanIcon from '../icons/icon_gyan.png';
import shikshaIcon from '../icons/icon_shiksha.png';
import marketIcon from '../icons/icon_market.png';

export default function BottomNav() {
  return (
    <nav className="w-full bg-[#DCC7A0]/80 backdrop-blur-sm border-t border-[#c7b288]">
      <div className="flex justify-around items-center h-20 text-xs text-center">
        <NavLink to="/market" className="flex flex-col items-center">
          <img src={marketIcon} alt="Market" className="w-7 h-7 mb-1" />
          <span>Рынок</span>
        </NavLink>
        <NavLink to="/japa" className="flex flex-col items-center">
          <img src={japaIcon} alt="Japa" className="w-7 h-7 mb-1" />
          <span>Джапа</span>
        </NavLink>
        <NavLink to="/altar" className="flex flex-col items-center">
          <img
            src={altarIcon}
            alt="Altar"
            className="w-12 h-12 mb-0 -mt-4 rounded-full border-2 border-yellow-500 bg-white"
          />
          <span className="-mt-1">Алтарь</span>
        </NavLink>
        <NavLink to="/gyan" className="flex flex-col items-center">
          <img src={gyanIcon} alt="Gyan" className="w-7 h-7 mb-1" />
          <span>Гьяна</span>
        </NavLink>
        <NavLink to="/shiksha" className="flex flex-col items-center">
          <img src={shikshaIcon} alt="Shiksha" className="w-7 h-7 mb-1" />
          <span>Шикша</span>
        </NavLink>
      </div>
    </nav>
  );
}
