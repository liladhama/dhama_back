import React, { useEffect, useRef } from 'react';

export default function Loading({ onFinish }) {
  const videoRef = useRef(null);
  const hasEnded = useRef(false); // ✅ предотвращает повторный вызов

  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      video.play().catch((err) => {
        console.error('Video autoplay failed:', err);
      });
    }
  }, []);

  const handleEnded = () => {
    if (!hasEnded.current) {
      hasEnded.current = true;
      if (typeof onFinish === 'function') {
        onFinish();
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <video
        ref={videoRef}
        src="/videos/hanuman-intro.mp4"
        muted
        playsInline
        onEnded={handleEnded}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
