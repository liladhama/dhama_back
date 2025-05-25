import React, { useState, useEffect, useRef } from 'react';

export default function Loading({ onFinish }) {
  const [hasPlayed, setHasPlayed] = useState(false);
  const videoRef = useRef(null);
  const playAttempted = useRef(false);

  useEffect(() => {
    console.log('Loading component mounted');
    if (videoRef.current && !hasPlayed && !playAttempted.current) {
      playAttempted.current = true;
      videoRef.current.play().then(() => {
        console.log('Video playback started successfully');
      }).catch(err => {
        console.error('Video play error:', err);
        playAttempted.current = false;
      });
    }
    return () => {
      console.log('Loading component unmounted');
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.src = ''; // Очистка источника
      }
    };
  }, []);

  const handleEnded = () => {
    console.log('Video ended');
    if (!hasPlayed) {
      setHasPlayed(true);
      onFinish();
    }
  };

  const handlePlay = () => {
    console.log('Video started playing');
  };

  const handleError = (e) => {
    console.error('Video error:', e);
  };

  const handleSeeking = () => {
    console.log('Video seeking');
  };

  const handleLoadedData = () => {
    console.log('Video data loaded');
  };

  if (hasPlayed) {
    console.log('Video has played, returning null');
    return null;
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black z-50">
      <video
        ref={videoRef}
        src="/videos/hanuman-intro.mp4"
        muted
        playsInline
        onEnded={handleEnded}
        onPlay={handlePlay}
        onError={handleError}
        onSeeking={handleSeeking}
        onLoadedData={handleLoadedData}
        className="w-full h-full object-cover"
      />
    </div>
  );
}