import React from 'react';

export default function Altar() {
  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 136px)', overflow: 'hidden' }}>
      <img
        src="/images/altar-bg.png"
        alt="Altar"
        className="w-full h-full object-cover"
      />

      {/* Подношения — пока отключены */}
      {/* <div className="absolute bottom-4 w-full flex justify-around px-4 z-10">
        ...
      </div> */}
    </div>
  );
}
