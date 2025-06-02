import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Углы внешнего квадрата: вверх, право, низ, лево (по часовой)
const corners = [
  [PADDING, PADDING],               // A (левый верхний)
  [SIZE - PADDING, PADDING],        // B (правый верхний)
  [PADDING, SIZE - PADDING],        // C (левый нижний)
  [SIZE - PADDING, SIZE - PADDING], // D (правый нижний)
];

// Середины сторон квадрата: верх, право, низ, лево (по часовой)
const mids = [
  [(corners[0][0] + corners[1][0]) / 2, (corners[0][1] + corners[1][1]) / 2], // S1
  [(corners[1][0] + corners[2][0]) / 2, (corners[1][1] + corners[2][1]) / 2], // S2
  [(corners[2][0] + corners[3][0]) / 2, (corners[2][1] + corners[3][1]) / 2], // S3
  [(corners[3][0] + corners[0][0]) / 2, (corners[3][1] + corners[0][1]) / 2], // S4
];

// Центр
const CENTER_POINT = [CENTER, CENTER];

// Точки между углом и центром (M1–M4): между каждым углом квадрата и центром
const midsDiagonals = [
  [(corners[0][0] + CENTER) / 2, (corners[0][1] + CENTER) / 2], // M1 (между A и X)
  [(corners[1][0] + CENTER) / 2, (corners[1][1] + CENTER) / 2], // M2 (между B и X)
  [(corners[2][0] + CENTER) / 2, (corners[2][1] + CENTER) / 2], // M3 (между C и X)
  [(corners[3][0] + CENTER) / 2, (corners[3][1] + CENTER) / 2], // M4 (между D и X)
];

// Классическая логика построения домов (1–12) для квадратной карты по твоей схеме
// Каждый дом — это или ромб (4 точки: Sx, Mx, X, My) или треугольник (3 точки)
const housePolygons = [
  // 1 дом — ромб S1-M1-X-M2
  [ mids[0], midsDiagonals[0], CENTER_POINT, midsDiagonals[1] ],
  // 2 дом — треугольник S1-M1-A
  [ mids[0], midsDiagonals[0], corners[0] ],
  // 3 дом — треугольник A-M1-S4
  [ corners[0], midsDiagonals[0], mids[3] ],
  // 4 дом — ромб M1-S4-M4-X
  [ midsDiagonals[0], mids[3], midsDiagonals[3], CENTER_POINT ],
  // 5 дом — треугольник S4-M4-D
  [ mids[3], midsDiagonals[3], corners[3] ],
  // 6 дом — треугольник M4-D-S3
  [ midsDiagonals[3], corners[3], mids[2] ],
  // 7 дом — ромб X-M4-S3-M3
  [ CENTER_POINT, midsDiagonals[3], mids[2], midsDiagonals[2] ],
  // 8 дом — треугольник M3-S3-C
  [ midsDiagonals[2], mids[2], corners[2] ],
  // 9 дом — треугольник M3-S2-C
  [ midsDiagonals[2], mids[1], corners[2] ],
  // 10 дом — ромб M2-X-M3-S2
  [ midsDiagonals[1], CENTER_POINT, midsDiagonals[2], mids[1] ],
  // 11 дом — треугольник M2-B-S2
  [ midsDiagonals[1], corners[1], mids[1] ],
  // 12 дом — треугольник S1-B-M2
  [ mids[0], corners[1], midsDiagonals[1] ],
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
        {/* Внешний квадрат и диагонали */}
        <rect x={PADDING} y={PADDING} width={SQ} height={SQ}
          fill="none"
          stroke="#8B0000"
          strokeWidth={3}
        />
        {/* Диагонали */}
        <line x1={corners[0][0]} y1={corners[0][1]} x2={corners[2][0]} y2={corners[2][1]} stroke="#d88" strokeWidth={1.5}/>
        <line x1={corners[1][0]} y1={corners[1][1]} x2={corners[3][0]} y2={corners[3][1]} stroke="#d88" strokeWidth={1.5}/>
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
        {/* Вспомогательные точки (можно убрать, если не нужно визуально) */}
        {/* Углы */}
        {/* {corners.map(([x, y], idx) => (
          <circle cx={x} cy={y} r={3.5} fill="#000" key={"corner"+idx}/>
        ))} */}
        {/* Середины сторон */}
        {/* {mids.map(([x, y], idx) => (
          <circle cx={x} cy={y} r={3} fill="#1e90ff" key={"mid"+idx}/>
        ))} */}
        {/* Точки между углом и центром */}
        {/* {midsDiagonals.map(([x, y], idx) => (
          <circle cx={x} cy={y} r={2.7} fill="#b200b2" key={"midiag"+idx}/>
        ))} */}
        {/* Центр */}
        {/* <circle cx={CENTER} cy={CENTER} r={3} fill="#090"/> */}
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