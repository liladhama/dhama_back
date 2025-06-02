import React from "react";
import { MAIN_COLOR } from "./astroUtils";

export default function ForecastsSection() {
  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 18, color: MAIN_COLOR }}>Прогнозы</h2>
      <p style={{ fontSize: 13 }}>Общие прогнозы доступны бесплатно.</p>
      <button style={{
        padding: "9px 14px",
        marginTop: 8,
        background: MAIN_COLOR,
        color: "#fff",
        fontWeight: 600,
        border: "none",
        borderRadius: 7,
        fontSize: 14
      }}>Оформить подписку на индивидуальные прогнозы (Toncoin)</button>
    </div>
  );
}