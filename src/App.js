import React from 'react';

export default function App() {
  return (
    <div style={{
      position: 'relative',
      width: '100%',
      height: '100vh',
      overflow: 'hidden',
      backgroundColor: 'black',
    }}>
      <video
        autoPlay
        loop
        muted
        playsInline
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
        <source src="/videos/hanuman-intro.webm" type="video/webm" />
        Your browser does not support the video tag.
      </video>

      <div style={{
        position: 'relative',
        zIndex: 1,
        color: 'white',
        fontSize: '24px',
        textAlign: 'center',
        paddingTop: '40vh',
      }}>
        <p>Тест: Видеофон должен быть на фоне</p>
      </div>
    </div>
  );
}
