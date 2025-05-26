import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';   // Tailwind или базовые стили
import './App.css';     // Твои кастомные стили

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);