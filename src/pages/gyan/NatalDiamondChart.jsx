import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Вершины (углы) внешнего квадрата: вверх, вправо, вниз, влево (по часовой)
const corners = [
  [CENTER, PADDING],
  [SIZE - PADDING, CENTER],
  [CENTER, SIZE - PADDING],
  [PADDING, CENTER],
];

// Центры сторон квадрата (там будут внешние углы ромбов)
const sideMids = [
  [(corners[0][0] + corners[1][0]) / 2, (corners[0][1] + corners[1][1]) / 2], // верх-право
  [(corners[1][0] + corners[2][0]) / 2, (corners[1][1] + corners[2][1]) / 2], // право-низ
  [(corners[2][0] + corners[3][0]) / 2, (corners[2][1] + corners[3][1]) / 2], // низ-лево
  [(corners[3][0] + corners[0][0]) / 2, (corners[3][1] + corners[0][1]) / 2], // лево-верх
];

// Ромбы: 1 (верх), 4 (лево), 7 (низ), 10 (право)
// Каждый ромб: 4 точки — внешний угол (середина стороны), 2 боковых (между центром и углами), внутренний угол (центр)
function getDiamondPoints(idx) {
  // idx: 0-вверх, 1-влево, 2-вниз, 3-вправо
  const mid = sideMids[idx];
  const prev = corners[(idx + 3) % 4];
  const next = corners[(idx + 1) % 4];

  // Верхний ромб: внешняя точка — середина верхней стороны, боковые — середины между центром и верхним левым/правым углом
  return [
    mid, // внешний угол (на середине стороны)
    [(mid[0] + prev[0]) / 2, (mid[1] + prev[1]) / 2], // боковой к предыдущему углу
    [CENTER, CENTER], // внутренний острый угол (центр карты)
    [(mid[0] + next[0]) / 2, (mid[1] + next[1]) / 2], // боковой к следующему углу
  ];
}

// Треугольники: между двумя соседними ромбами и углом квадрата
// Для i-го треугольника: вершина — угол квадрата i, основания — боковые внешние углы ромбов по обе стороны от этой вершины
function getTrianglePoints(idx) {
  // idx: угол квадрата, между ромбами
  // для idx=0 (верх): угол-квадрата[0], ромб-1 (idx=0) правый бок, ромб-10 (idx=3) левый бок
  const corner = corners[idx];
  const rightDiamond = getDiamondPoints(idx); // ромб по часовой от угла
  const leftDiamond = getDiamondPoints((idx + 3) % 4); // ромб по против-часовой от угла
  // Порядок обхода: угол, боковой ромб справа, боковой ромб слева
  // Боковые точки ромба: getDiamondPoints(x)[1] — к prev, getDiamondPoints(x)[3] — к next
  // Для угла idx, берем:
  //  - правый ромб: боковая, которая ближе к углу (если idx=0, ромб 1, точка 1)
  //  - левый ромб: боковая, которая ближе к углу (если idx=0, ромб 10, точка 3)
  return [
    corner,
    rightDiamond[1],
    leftDiamond[3],
  ];
}

// Порядок домов против часовой стрелки, начиная с верхнего ромба — классика!
// 1 ромб, 2 треуг, 3 треуг, 4 ромб, 5 треуг, 6 треуг, 7 ромб, 8 треуг, 9 треуг, 10 ромб, 11 треуг, 12 треуг
const houseLayout = [
  { num: 1,  type: "diamond", idx: 0 }, // верх
  { num: 2,  type: "triangle", idx: 0 }, // верх-право
  { num: 3,  type: "triangle", idx: 1 }, // право-верх
  { num: 4,  type: "diamond", idx: 1 }, // лево
  { num: 5,  type: "triangle", idx: 3 }, // лево-верх
  { num: 6,  type: "triangle", idx: 2 }, // низ-лево
  { num: 7,  type: "diamond", idx: 2 }, // низ
  { num: 8,  type: "triangle", idx: 2 }, // низ-право
  { num: 9,  type: "triangle", idx: 3 }, // право-низ
  { num:10,  type: "diamond", idx: 3 }, // право
  { num:11,  type: "triangle", idx: 1 }, // право-верх
  { num:12,  type: "triangle", idx: 0 }, // верх-право
];

// Центр многоугольника для текста
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
              {/* Номер дома */}
              <text x={cx} y={cy - 12} textAnchor="middle" fontWeight={700} fontSize={h.type === "diamond" ? 13 : 11} fill="#8B0000">{num}</text>
              {/* Знак */}
              <text x={cx + 18} y={cy - 10} textAnchor="end" fontWeight={700} fontSize={10} fill="#8B0000">{SIGN_SHORT[signIdx]}</text>
              {/* Планеты */}
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