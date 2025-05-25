export default function App() {
  return (
    <div className="relative min-h-[100dvh] bg-black">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="fixed top-0 left-0 w-full h-full object-cover"
      >
        <source src="/videos/hanuman-intro-light.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      <div className="relative z-10 text-white text-center p-10">
        <h1>Тест видеофона</h1>
      </div>
    </div>
  );
}
