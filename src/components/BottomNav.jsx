import React from 'react';
import { NavLink } from 'react-router-dom';

export default function BottomNav() {
  const tabs = [
    { to: '/',       label: 'Алтарь'   },
    { to: '/japa',   label: 'Джапа'    },
    { to: '/gyan',   label: 'Гьяна'    },
    { to: '/shiksha',label: 'Шикша'    },
    { to: '/market', label: 'Рынок'    },
  ];
  return (
    <nav className="flex justify-around bg-white shadow p-2">
      {tabs.map(tab => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `text-center text-sm ${isActive ? 'text-blue-600' : 'text-gray-500'}`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
