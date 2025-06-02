import React from "react";
import { MAIN_COLOR } from "./astroUtils";

export default function InterpretationsSection() {
  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 18, color: MAIN_COLOR }}>Трактовки положений планет</h2>
      <p style={{ color: "#aaa", fontSize: 13 }}>Здесь будут трактовки по выбранной карте</p>
    </div>
  );
}