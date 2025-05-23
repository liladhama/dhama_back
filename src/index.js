import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) {
  console.error('Root container not found');
} else {
  console.log('🏷️ Found root container:', container);
  const root = createRoot(container);
  root.render(<App />);
}
