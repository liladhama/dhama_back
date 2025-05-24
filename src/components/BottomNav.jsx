import React from 'react';
import { NavLink } from 'react-router-dom';

import altarIcon from '../icons/icon_altar.png';
import japaIcon from '../icons/icon_japa.png';
import gyanIcon from '../icons/icon_gyan.png';
import shikshaIcon from '../icons/icon_shiksha.png';
import marketIcon from '../icons/icon_market.png';

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#DCC7A0]/80 backdrop-blur-sm border-t border-[#c7b288] z-50">
      <div className="flex justify-around items-center h-20">
        <NavLink to="/market">
          <img src={marketIcon} alt="Market" className="w-8 h-8" />
        </NavLink>
        <NavLink to="/japa">
          <img src={japaIcon} alt="Japa" className="w-8 h-8" />
        </NavLink>
        <NavLink to="/altar">
          <img
            src={altarIcon}
            alt="Altar"
            className="w-14 h-14 rounded-full border-2 border-yellow-500 -mt-4 bg-white"
          />
        </NavLink>
        <NavLink to="/gyan">
          <img src={gyanIcon} alt="Gyan" className="w-8 h-8" />
        </NavLink>
        <NavLink to="/shiksha">
          <img src={shikshaIcon} alt="Shiksha" className="w-8 h-8" />
        </NavLink>
      </div>
    </nav>
  );
}
