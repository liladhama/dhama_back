import React, { useRef, useState } from 'react';

export default function App() {
  const videoRef = useRef(null);
  const [started, setStarted] = useState(false);

  const handleStart = () => {
    if (videoRef.current) {
      const played = videoRef.current.play();
      if (played instanceof Promise) {
        played.catch((e) => console.log('Play error:', e));
      }
    }
    setStarted(true);
  };

  return (
    <div className="relative min-h-[100dvh] bg-black overflow-hidden">
      <video
        ref={videoRef}
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover z-0"
      >
        <source src="https://dhama--video.web.app/media/hanuman-intro.webm" type="video/webm" />
      </video>

      {!started && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black">
          <button
            onClick={handleStart}
            className="px-6 py-3 bg-white text-black rounded-lg text-lg font-semibold"
          >
            Войти
          </button>
        </div>
      )}

      {started && (
        <div className="absolute inset-0 z-10 flex items-center justify-center text-white text-2xl">
          Видео запущено ✅
        </div>
      )}
    </div>
  );
}
