import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;
const R = SQ / 2;

// Вершины внешнего квадрата (по часовой, начиная сверху)
const VERTICES = [
  [CENTER, PADDING],              // верх
  [SIZE - PADDING, CENTER],       // право
  [CENTER, SIZE - PADDING],       // низ
  [PADDING, CENTER],              // лево
];

// Центры ромбов — середины сторон квадрата
const ROMBES = [
  { num: 1,  cx: CENTER,            cy: PADDING + R,    angle:   0 },
  { num: 4,  cx: PADDING + R,       cy: CENTER,         angle:  90 },
  { num: 7,  cx: CENTER,            cy: SIZE - PADDING - R, angle: 180 },
  { num:10,  cx: SIZE - PADDING - R,cy: CENTER,         angle: 270 },
];

// Для ромба: вершина (угол квадрата), 2 боковых точки (на сторонах квадрата), внутренний угол (центр)
function getDiamondPoints(idx) {
  const [vx, vy] = VERTICES[idx];                       // Вершина ромба
  const [vxl, vyl] = VERTICES[(idx + 3) % 4];           // Левая соседняя вершина
  const [vxr, vyr] = VERTICES[(idx + 1) % 4];           // Правая соседняя вершина

  // Боковые точки: 1/2 между вершинами
  const pxl = (vx + vxl) / 2, pyl = (vy + vyl) / 2;
  const pxr = (vx + vxr) / 2, pyr = (vy + vyr) / 2;

  // Центр ромба — центр SVG
  return [
    [vx, vy],           // наружный угол (вершина квадрата)
    [pxr, pyr],         // правая боковая точка
    [CENTER, CENTER],   // внутренний угол (центр)
    [pxl, pyl]          // левая боковая точка
  ];
}

// Треугольники между ромбами и углом квадрата
// Каждый треугольник: вершина квадрата + внешние боковые углы двух соседних ромбов
const TRIANGLES = [
  // 2 дом — левый верхний треугольник (между 1 и 4 ромбом, верхний левый угол)
  [VERTICES[0], getDiamondPoints(0)[3], getDiamondPoints(1)[1]],

  // 3 дом — левый верхний угловой треугольник (между 4 и 1 ромбом, верхний левый угол)
  [VERTICES[3], getDiamondPoints(1)[0], getDiamondPoints(0)[3]],

  // 5 дом — левый нижний угловой треугольник
  [VERTICES[3], getDiamondPoints(1)[2], getDiamondPoints(2)[0]],

  // 6 дом — левый нижний треугольник
  [VERTICES[2], getDiamondPoints(2)[3], getDiamondPoints(1)[2]],

  // 8 дом — нижний правый треугольник
  [VERTICES[2], getDiamondPoints(2)[1], getDiamondPoints(3)[2]],

  // 9 дом — нижний правый угловой треугольник
  [VERTICES[1], getDiamondPoints(3)[0], getDiamondPoints(2)[1]],

  // 11 дом — правый верхний угловой треугольник
  [VERTICES[1], getDiamondPoints(3)[2], getDiamondPoints(0)[1]],

  // 12 дом — правый верхний треугольник
  [VERTICES[0], getDiamondPoints(0)[1], getDiamondPoints(3)[2]],
];

// Финальный порядок домов (против часовой стрелки, начиная с верхнего ромба)
const houseLayout = [
  { num: 1,  type: "diamond", idx: 0 },
  { num: 2,  type: "triangle", idx: 0 },
  { num: 3,  type: "triangle", idx: 1 },
  { num: 4,  type: "diamond", idx: 1 },
  { num: 5,  type: "triangle", idx: 2 },
  { num: 6,  type: "triangle", idx: 3 },
  { num: 7,  type: "diamond", idx: 2 },
  { num: 8,  type: "triangle", idx: 4 },
  { num: 9,  type: "triangle", idx: 5 },
  { num:10,  type: "diamond", idx: 3 },
  { num:11,  type: "triangle", idx: 6 },
  { num:12,  type: "triangle", idx: 7 },
];

// Центр фигуры для текста (среднее по точкам)
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
          if (h.type === "diamond") {
            const pts = getDiamondPoints(h.idx);
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
                {/* Номер дома — ближе к центру, но не жёстко */}
                <text x={cx} y={cy - 18} textAnchor="middle" fontWeight={700} fontSize={13} fill="#8B0000">{num}</text>
                {/* Знак — ближе к правому внешнему углу */}
                <text x={pts[1][0] - 8} y={pts[1][1] - 4} textAnchor="end" fontWeight={700} fontSize={12} fill="#8B0000">{SIGN_SHORT[signIdx]}</text>
                {/* Планеты — по центру фигуры */}
                {housePlanets.length > 0 && (
                  <text
                    x={cx}
                    y={cy + 4 - (housePlanets.length - 1) * 9 / 2}
                    textAnchor="middle"
                    fontWeight={700}
                    fontSize={housePlanets.length > 2 ? 11 : 14}
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
          } else {
            // Треугольник
            const pts = TRIANGLES[h.idx];
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
                <text x={cx} y={cy - 12} textAnchor="middle" fontWeight={700} fontSize={11} fill="#8B0000">{num}</text>
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
          }
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