import React, { useEffect, useRef } from 'react';

export default function Intro() {
  const videoRef = useRef(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }

    const tryPlay = () => {
      if (videoRef.current) {
        videoRef.current.play().catch(() => {});
      }
    };

    window.addEventListener('click', tryPlay);
    window.addEventListener('touchstart', tryPlay);

    return () => {
      window.removeEventListener('click', tryPlay);
      window.removeEventListener('touchstart', tryPlay);
    };
  }, []);

  const handleEnded = () => {
    // ❗ Жёсткий редирект (решает проблему масштаба Telegram WebView)
    window.location.href = '/altar';
  };

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-black">
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        className="absolute top-0 left-0 w-full h-full object-cover"
      >
        <source src="/videos/hanuman-full.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
