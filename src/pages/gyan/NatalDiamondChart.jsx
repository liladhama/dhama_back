import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Углы квадрата: A — левый верхний, B — правый верхний, D — правый нижний, C — левый нижний
const A = [PADDING, PADDING];
const B = [SIZE - PADDING, PADDING];
const C = [PADDING, SIZE - PADDING];
const D = [SIZE - PADDING, SIZE - PADDING];

// Середины сторон
const S1 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
const S2 = [(B[0] + D[0]) / 2, (B[1] + D[1]) / 2];
const S3 = [(D[0] + C[0]) / 2, (D[1] + C[1]) / 2];
const S4 = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2];

// Центр
const X = [CENTER, CENTER];

// Точки между углом и центром
const M1 = [(A[0] + X[0]) / 2, (A[1] + X[1]) / 2];
const M2 = [(B[0] + X[0]) / 2, (B[1] + X[1]) / 2];
const M3 = [(D[0] + X[0]) / 2, (D[1] + X[1]) / 2];
const M4 = [(C[0] + X[0]) / 2, (C[1] + X[1]) / 2];

// Хранилище всех точек для удобства ссылок
const pointsMap = {
  A, B, C, D, S1, S2, S3, S4, X, M1, M2, M3, M4,
};
// Пронумерованные полигоны домов против часовой стрелки
const housePolygons = [
  [S1, M1, X, M2],            // 1 верх
  [A, S1, M1],                // 2 верх-лево
  [S4, A, M1],                // 3 лево-верх
  [M1, S4, M4, X],            // 4 лево
  [S4, D, M4],                // 5 лево-низ
  [D, S3, M4],                // 6 низ-лево
  [M4, S3, M3, X],            // 7 низ
  [C, S3, M3],                // 8 низ-право
  [S2, C, M3],                // 9 право-низ
  [M3, S2, M2, X],            // 10 право
  [S2, B, M2],                // 11 право-верх
  [S1, B, M2],                // 12 верх-право
];

// Для каждого дома определяем углы для номеров/знаков
function getHouseLabelPositions(points) {
  // Первый угол полигона (points[0]) — для номера дома (верхний/левый по обходу)
  // Второй угол (points[1]) — для знака (он часто правый/верхний)
  // Центр — для планет
  const [hx, hy] = points[0];
  const [sx, sy] = points[1];
  const { cx, cy } = getPolygonCenter(points);
  return {
    houseNum: { x: hx + (cx - hx) * 0.14, y: hy + (cy - hy) * 0.14 }, // смещён немного к центру
    sign: { x: sx + (cx - sx) * 0.18, y: sy + (cy - sy) * 0.18 },
    center: { x: cx, y: cy }
  };
}

// Центр полигона
function getPolygonCenter(points) {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  return {
    cx: xs.reduce((a, b) => a + b) / xs.length,
    cy: ys.reduce((a, b) => a + b) / ys.length,
  };
}

export default function NatalDiamondChart({ planets }) {
  if (!planets) return null;
  const ascSign = planets.ascendant?.sign || SIGNS[0];
  const ascSignIndex = SIGNS.indexOf(ascSign);
  const houseMap = getPlanetHouseMap(planets, ascSignIndex);

  function getHouseIndex(num) {
    return (num - 1 + 12) % 12;
  }

  // Планеты для таблицы
  const planetNakshMap = {};
  for (const [planet, pObj] of Object.entries(planets)) {
    if (typeof pObj.deg_in_sign === "number" && typeof pObj.sign === "string") {
      const signIdx = SIGNS.indexOf(pObj.sign);
      const totalDeg = signIdx * 30 + pObj.deg_in_sign;
      planetNakshMap[planet] = calcNakshatraPada(totalDeg);
    }
  }

  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 18
    }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} style={{ display: "block" }}>
        {/* Внешний квадрат */}
        <rect x={PADDING} y={PADDING} width={SQ} height={SQ}
          fill="none"
          stroke="#8B0000"
          strokeWidth={3}
        />
        {/* Диагонали */}
        <line x1={A[0]} y1={A[1]} x2={D[0]} y2={D[1]} stroke="#d88" strokeWidth={1.5}/>
        <line x1={B[0]} y1={B[1]} x2={C[0]} y2={C[1]} stroke="#d88" strokeWidth={1.5}/>
        {/* Дома */}
        {housePolygons.map((pts, i) => {
          const num = i + 1;
          const signIdx = (ascSignIndex + num - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(num)] || [];
          const pointsAttr = pts.map(p => p.join(",")).join(" ");
          const pos = getHouseLabelPositions(pts);

          return (
            <g key={i}>
              <polygon
                points={pointsAttr}
                fill="#fbeeee"
                stroke="#8B0000"
                strokeWidth={2}
              />
              {/* Номер дома — угол полигона */}
              <text x={pos.houseNum.x} y={pos.houseNum.y} textAnchor="middle"
                fontWeight={700} fontSize={13} fill="#8B0000"
                style={{ pointerEvents: "none", dominantBaseline: "hanging" }}>
                {num}
              </text>
              {/* Знак — другой угол */}
              <text x={pos.sign.x} y={pos.sign.y} textAnchor="middle"
                fontWeight={700} fontSize={10} fill="#8B0000"
                style={{ pointerEvents: "none", dominantBaseline: "hanging" }}>
                {SIGN_SHORT[signIdx]}
              </text>
              {/* Планеты — по центру */}
              {housePlanets.length > 0 && (
                <text
                  x={pos.center.x}
                  y={pos.center.y - ((housePlanets.length - 1) * 10) / 2}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={housePlanets.length > 2 ? 10 : 12}
                  fill="#333"
                  style={{ pointerEvents: "none" }}
                >
                  {housePlanets.map((p, idx) => (
                    <tspan
                      x={pos.center.x}
                      dy={idx === 0 ? 0 : 14}
                      key={p}
                    >
                      {PLANET_LABELS_DIAMOND[p]}
                    </tspan>
                  ))}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {/* Таблица */}
      <div style={{
        width: 320,
        maxWidth: "100%",
        background: "#fff",
        borderRadius: 12,
        boxShadow: "0 1px 8px #8B000022",
        padding: "8px 7px 8px 7px",
        marginTop: 2,
        overflowX: "auto"
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 14,
          tableLayout: "fixed"
        }}>
          <thead>
            <tr style={{ color: "#8B0000", fontWeight: 700 }}>
              <th style={{ textAlign: "left", padding: "2px 2px", width: "17%" }}>Планета</th>
              <th style={{ textAlign: "left", padding: "2px 2px", width: "18%" }}>Градусы</th>
              <th style={{ textAlign: "left", padding: "2px 2px", width: "17%" }}>Знак</th>
              <th style={{ textAlign: "left", padding: "2px 2px", width: "33%" }}>Накшатра</th>
              <th style={{ textAlign: "left", padding: "2px 2px", width: "15%" }}>Пада</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(PLANET_LABELS_DIAMOND).map((planetKey) => {
              const p = planets[planetKey];
              const n = planetNakshMap[planetKey] || {};
              if (!p) return null;
              return (
                <tr key={planetKey} style={{ borderBottom: "1px solid #f1b6c1" }}>
                  <td style={{ padding: "1px 2px", whiteSpace: "nowrap" }}>{PLANET_LABELS_DIAMOND[planetKey]}</td>
                  <td style={{ padding: "1px 2px", whiteSpace: "nowrap" }}>{p.deg_in_sign_str || ""}</td>
                  <td style={{ padding: "1px 2px", whiteSpace: "nowrap" }}>{p.sign || ""}</td>
                  <td
                    style={{
                      padding: "1px 2px",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      maxWidth: 90,
                      cursor: n.nakshatra && n.nakshatra.length > 8 ? "pointer" : "default"
                    }}
                    title={n.nakshatra}
                  >
                    {n.nakshatra || ""}
                  </td>
                  <td style={{ padding: "1px 2px", whiteSpace: "nowrap" }}>{n.pada || ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}