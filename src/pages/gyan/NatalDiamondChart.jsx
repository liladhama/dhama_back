import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Углы внешнего квадрата: A (левый верхний), B (правый верхний), C (левый нижний), D (правый нижний)
const A = [PADDING, PADDING];
const B = [SIZE - PADDING, PADDING];
const C = [PADDING, SIZE - PADDING];
const D = [SIZE - PADDING, SIZE - PADDING];

// Середины сторон квадрата: S1 (верх), S2 (право), S3 (низ), S4 (лево)
const S1 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2];
const S2 = [(B[0] + D[0]) / 2, (B[1] + D[1]) / 2];
const S3 = [(D[0] + C[0]) / 2, (D[1] + C[1]) / 2];
const S4 = [(C[0] + A[0]) / 2, (C[1] + A[1]) / 2];

// Центр квадрата
const X = [CENTER, CENTER];

// Точки между углом и центром (M1–M4): между каждым углом квадрата и центром
const M1 = [(A[0] + X[0]) / 2, (A[1] + X[1]) / 2];
const M2 = [(B[0] + X[0]) / 2, (B[1] + X[1]) / 2];
const M3 = [(D[0] + X[0]) / 2, (D[1] + X[1]) / 2];
const M4 = [(C[0] + X[0]) / 2, (C[1] + X[1]) / 2];

// Правильная ведическая квадратная разметка домов — строго против часовой стрелки, начиная сверху
const housePolygons = [
  // 1. Центральный ромб: S1, S2, S3, S4
  [S1, S2, S3, S4],
  // 2. Верхний треугольник: A, S1, M1
  [A, S1, M1],
  // 3. Верх-лево треугольник: S4, A, M1
  [S4, A, M1],
  // 4. Левый треугольник: C, S4, M4
  [C, S4, M4],
  // 5. Низ-лево треугольник: S3, C, M4
  [S3, C, M4],
  // 6. Нижний треугольник: D, S3, M3
  [D, S3, M3],
  // 7. Низ-право треугольник: S2, D, M3
  [S2, D, M3],
  // 8. Правый треугольник: B, S2, M2
  [B, S2, M2],
  // 9. Верх-право треугольник: S1, B, M2
  [S1, B, M2],
  // 10. Верхний внутренний ромб: M1, S1, M2, X
  [M1, S1, M2, X],
  // 11. Правый внутренний ромб: M2, S2, M3, X
  [M2, S2, M3, X],
  // 12. Нижний внутренний ромб: M3, S3, M4, X
  [M3, S3, M4, X],
];

// Центр многоугольника для подписи
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
          const { cx, cy } = getPolygonCenter(pts);
          return (
            <g key={i}>
              <polygon
                points={pointsAttr}
                fill="#fbeeee"
                stroke="#8B0000"
                strokeWidth={2}
              />
              <text x={cx} y={cy - 12} textAnchor="middle" fontWeight={700} fontSize={13} fill="#8B0000">{num}</text>
              <text x={cx + 18} y={cy - 10} textAnchor="end" fontWeight={700} fontSize={10} fill="#8B0000">{SIGN_SHORT[signIdx]}</text>
              {housePlanets.length > 0 && (
                <text
                  x={cx}
                  y={cy + 4 - (housePlanets.length - 1) * 9 / 2}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={housePlanets.length > 2 ? 10 : 12}
                  fill="#333"
                  style={{ pointerEvents: "none" }}
                >
                  {housePlanets.map((p, idx) => (
                    <tspan
                      x={cx}
                      dy={idx === 0 ? 0 : 13}
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
        {/* Вспомогательные точки (закомментировано, можно включить для отладки) */}
        {/* <circle cx={A[0]} cy={A[1]} r={3.5} fill="#000"/>
        <circle cx={B[0]} cy={B[1]} r={3.5} fill="#000"/>
        <circle cx={C[0]} cy={C[1]} r={3.5} fill="#000"/>
        <circle cx={D[0]} cy={D[1]} r={3.5} fill="#000"/>
        <circle cx={S1[0]} cy={S1[1]} r={3} fill="#1e90ff"/>
        <circle cx={S2[0]} cy={S2[1]} r={3} fill="#1e90ff"/>
        <circle cx={S3[0]} cy={S3[1]} r={3} fill="#1e90ff"/>
        <circle cx={S4[0]} cy={S4[1]} r={3} fill="#1e90ff"/>
        <circle cx={M1[0]} cy={M1[1]} r={2.7} fill="#b200b2"/>
        <circle cx={M2[0]} cy={M2[1]} r={2.7} fill="#b200b2"/>
        <circle cx={M3[0]} cy={M3[1]} r={2.7} fill="#b200b2"/>
        <circle cx={M4[0]} cy={M4[1]} r={2.7} fill="#b200b2"/>
        <circle cx={X[0]} cy={X[1]} r={3} fill="#090"/> */}
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