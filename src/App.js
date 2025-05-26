import React from 'react';

export default function App() {
  return (
    <div className="relative min-h-screen bg-black">
      <video
        autoPlay
        muted
        loop
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="/videos/hanuman-intro.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div className="relative z-10 flex justify-center items-center h-screen text-white text-xl font-bold">
        Видеофон должен быть виден за этим текстом
      </div>
    </div>
  );
}
