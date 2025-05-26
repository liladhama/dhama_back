import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Intro() {
  const navigate = useNavigate();
  const videoRef = useRef(null);

  useEffect(() => {
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.ready();
      window.Telegram.WebApp.expand();
    }
  }, []);

  const handleEnded = () => {
    navigate('/altar');
  };

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'black',
    }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        playsInline
        onEnded={handleEnded}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      >
        <source src="/videos/hanuman-full.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
}
