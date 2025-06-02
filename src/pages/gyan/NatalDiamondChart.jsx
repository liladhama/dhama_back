import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Углы внешнего квадрата: вверх, право, низ, лево (по часовой)
const corners = [
  [CENTER, PADDING],
  [SIZE - PADDING, CENTER],
  [CENTER, SIZE - PADDING],
  [PADDING, CENTER],
];

// Середины сторон квадрата: верх, право, низ, лево (по часовой)
const mids = [
  [(corners[0][0] + corners[1][0]) / 2, (corners[0][1] + corners[1][1]) / 2],
  [(corners[1][0] + corners[2][0]) / 2, (corners[1][1] + corners[2][1]) / 2],
  [(corners[2][0] + corners[3][0]) / 2, (corners[2][1] + corners[3][1]) / 2],
  [(corners[3][0] + corners[0][0]) / 2, (corners[3][1] + corners[0][1]) / 2],
];

// Ромбы: 1 (верх), 4 (лево), 7 (низ), 10 (право)
// Каждый ромб: 4 точки — внешний угол (середина стороны), две боковые (между центром и соседними углами), внутренний угол (центр)
function getDiamondPoints(idx) {
  // idx: 0-вверх, 1-лево, 2-низ, 3-право (по против часовой!)
  // внешний угол ромба (мид), две боковые — между центром и соседними углами квадрата
  const mid = mids[idx];
  const prev = corners[(idx + 3) % 4];
  const next = corners[(idx + 1) % 4];
  return [
    mid, // внешний угол (середина стороны)
    [(mid[0] + prev[0]) / 2, (mid[1] + prev[1]) / 2], // боковая к предыдущему углу
    [CENTER, CENTER], // внутренний угол (центр)
    [(mid[0] + next[0]) / 2, (mid[1] + next[1]) / 2], // боковая к следующему углу
  ];
}

// Треугольники: между двумя соседними ромбами и углом квадрата
// Для i-го треугольника: угол — corners[i], основания — боковые внешние углы двух соседних ромбов
function getTrianglePoints(idx) {
  // idx: 0-вверх, 1-право, 2-низ, 3-лево (по часовой)
  const corner = corners[idx];
  const rightDiamond = getDiamondPoints((idx + 3) % 4); // ромб слева от угла
  const leftDiamond = getDiamondPoints(idx); // ромб справа от угла
  // Боковые точки ромба: [1] (к предыдущему углу), [3] (к следующему углу)
  // Для треугольника в углу idx:
  // - основание: боковая точка левого ромба ближе к этому углу
  // - основание: боковая точка правого ромба ближе к этому углу
  return [
    corner,
    leftDiamond[1], // боковая ближе к углу
    rightDiamond[3], // боковая ближе к углу
  ];
}

// Порядок домов: строго против часовой стрелки, начиная с верхнего ромба (1 дом)
const houseLayout = [
  { num: 1,  type: "diamond", idx: 0 }, // верх
  { num: 2,  type: "triangle", idx: 0 }, // верх-право
  { num: 3,  type: "diamond", idx: 3 }, // право
  { num: 4,  type: "triangle", idx: 1 }, // право-низ
  { num: 5,  type: "diamond", idx: 2 }, // низ
  { num: 6,  type: "triangle", idx: 2 }, // низ-лево
  { num: 7,  type: "diamond", idx: 1 }, // лево
  { num: 8,  type: "triangle", idx: 3 }, // лево-верх
  { num: 9,  type: "triangle", idx: 0 }, // верх-лево (между 1 и 7)
  { num:10,  type: "triangle", idx: 1 }, // право-верх (между 1 и 3)
  { num:11,  type: "triangle", idx: 2 }, // низ-право (между 3 и 5)
  { num:12,  type: "triangle", idx: 3 }, // низ-лево (между 5 и 7)
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
        {/* Рамка */}
        <rect x={8} y={8} width={SIZE-16} height={SIZE-16}
          fill="#fff"
          stroke="#8B0000"
          strokeWidth={5}
          rx={16}
        />
        {/* Дома */}
        {houseLayout.map((h, i) => {
          const num = h.num;
          const signIdx = (ascSignIndex + num - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(num)] || [];
          let pts;
          if (h.type === "diamond") {
            pts = getDiamondPoints(h.idx);
          } else {
            pts = getTrianglePoints(h.idx);
          }
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
              <text x={cx} y={cy - 12} textAnchor="middle" fontWeight={700} fontSize={h.type === "diamond" ? 13 : 11} fill="#8B0000">{num}</text>
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