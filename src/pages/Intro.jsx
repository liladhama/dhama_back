import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Intro() {
  const videoRef = useRef(null);
  const navigate = useNavigate();

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
    // 📏 Сброс принудительного зума через style
    document.body.style.zoom = '1';
    document.body.style.transform = 'scale(1)';
    document.body.style.transformOrigin = 'top left';

    // 🚀 Плавный переход без перезагрузки
    navigate('/altar');
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
