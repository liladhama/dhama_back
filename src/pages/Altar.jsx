import React from 'react';

export default function Altar() {
  return (
    <div className="w-full bg-[#f5f5f5]">
      <div className="relative overflow-hidden" style={{ aspectRatio: '9 / 16' }}>
        <img
          src="/images/altar-bg.png"
          alt="Altar"
          className="absolute inset-0 w-full h-full object-cover"
        />
      </div>
    </div>
  );
}
