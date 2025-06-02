import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

const SIZE = 320;
const CENTER = SIZE / 2;
const R = 110; // расстояние от центра до центра ромба (подбирается визуально)
const D = 80;  // половина диагонали ромба

// 4 ромба: 1 (верх), 4 (лево), 7 (низ), 10 (право)
const diamonds = [
  { num: 1,  cx: CENTER,      cy: CENTER - R, angle: 0 },
  { num: 4,  cx: CENTER - R,  cy: CENTER,     angle: 90 },
  { num: 7,  cx: CENTER,      cy: CENTER + R, angle: 180 },
  { num:10,  cx: CENTER + R,  cy: CENTER,     angle: 270 },
];

// Вычисляем 8 точек стыка ромбов (куда будут "вклиниваться" треугольники)
function getDiamondCorners(cx, cy, angle, d) {
  // Возвращает 4 точки ромба (по часовой от вершины)
  const toRad = a => a * Math.PI / 180;
  return [
    [cx, cy - d], // вверх
    [cx + d, cy], // право
    [cx, cy + d], // низ
    [cx - d, cy], // лево
  ].map(([x, y]) => {
    // Повернуть вокруг центра на угол angle
    const dx = x - cx;
    const dy = y - cy;
    const rad = toRad(angle);
    return [
      cx + dx * Math.cos(rad) - dy * Math.sin(rad),
      cy + dx * Math.sin(rad) + dy * Math.cos(rad),
    ];
  });
}

// Считаем все углы ромбов (по часовой, начиная сверху)
const allCorners = diamonds.map(d =>
  getDiamondCorners(d.cx, d.cy, d.angle, D / Math.sqrt(2))
);

// Треугольники между ромбами (их вершины — это соседние углы ромбов плюс центр)
const triangles = [
  { num: 2,  points: [allCorners[0][1], allCorners[3][0], [CENTER, CENTER]] }, // между 1 и 10
  { num: 3,  points: [allCorners[3][0], allCorners[1][3], [CENTER, CENTER]] }, // между 10 и 4
  { num: 5,  points: [allCorners[1][3], allCorners[2][2], [CENTER, CENTER]] }, // между 4 и 7
  { num: 6,  points: [allCorners[2][2], allCorners[0][1], [CENTER, CENTER]] }, // между 7 и 1

  { num: 8,  points: [allCorners[2][0], allCorners[1][1], [CENTER, CENTER]] }, // между 7 и 4 (нижний правый)
  { num: 9,  points: [allCorners[1][1], allCorners[3][2], [CENTER, CENTER]] }, // между 4 и 10
  { num:11,  points: [allCorners[3][2], allCorners[0][3], [CENTER, CENTER]] }, // между 10 и 1
  { num:12,  points: [allCorners[0][3], allCorners[2][0], [CENTER, CENTER]] }, // между 1 и 7
];

// Финальный layout домов (против часовой стрелки!)
const houseLayout = [
  diamonds[0], // 1
  triangles[0], // 2
  triangles[1], // 3
  diamonds[1], // 4
  triangles[2], // 5
  triangles[3], // 6
  diamonds[2], // 7
  triangles[4], // 8
  triangles[5], // 9
  diamonds[3], // 10
  triangles[6], // 11
  triangles[7], // 12
];

// Функции для SVG
function diamondPoints(cx, cy, angle, d) {
  const pts = getDiamondCorners(cx, cy, angle, d);
  return pts.map(p => p.join(",")).join(" ");
}

function trianglePoints(pts) {
  return pts.map(p => p.join(",")).join(" ");
}

export default function NatalDiamondChart({ planets }) {
  if (!planets) return null;
  const ascSign = planets.ascendant?.sign || SIGNS[0];
  const ascSignIndex = SIGNS.indexOf(ascSign);
  const houseMap = getPlanetHouseMap(planets, ascSignIndex);

  function getHouseIndex(num) {
    return (num - 1 + 12) % 12;
  }

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
      <svg viewBox="0 0 320 320" width={320} height={320} style={{ display: "block" }}>
        {/* Рамка */}
        <rect x={8} y={8} width={304} height={304}
          fill="#fff"
          stroke="#8B0000"
          strokeWidth={5}
          rx={16}
        />
        {/* Дома */}
        {houseLayout.map((h, i) => {
          const num = i + 1;
          const signIdx = (ascSignIndex + num - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(num)] || [];
          if (h.cx !== undefined) {
            // Ромб
            const pts = getDiamondCorners(h.cx, h.cy, h.angle, D / Math.sqrt(2));
            const labelX = h.cx;
            const labelY = h.cy - (D / Math.sqrt(2)) + 16;
            return (
              <g key={i}>
                <polygon
                  points={diamondPoints(h.cx, h.cy, h.angle, D / Math.sqrt(2))}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                />
                <text x={labelX} y={labelY} textAnchor="middle" fontWeight={700} fontSize={13} fill="#8B0000">{num}</text>
                <text x={labelX+22} y={labelY} textAnchor="end" fontWeight={700} fontSize={12} fill="#8B0000">{SIGN_SHORT[signIdx]}</text>
                {housePlanets.length > 0 && (
                  <text
                    x={h.cx}
                    y={h.cy + 4 - (housePlanets.length - 1) * 9 / 2}
                    textAnchor="middle"
                    fontWeight={700}
                    fontSize={housePlanets.length > 2 ? 11 : 14}
                    fill="#333"
                    style={{ pointerEvents: "none" }}
                  >
                    {housePlanets.map((p, idx) => (
                      <tspan
                        x={h.cx}
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
            const cx = (h.points[0][0] + h.points[1][0] + h.points[2][0]) / 3;
            const cy = (h.points[0][1] + h.points[1][1] + h.points[2][1]) / 3;
            return (
              <g key={i}>
                <polygon
                  points={trianglePoints(h.points)}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                />
                <text x={cx} y={cy-12} textAnchor="middle" fontWeight={700} fontSize={11} fill="#8B0000">{num}</text>
                <text x={cx+18} y={cy-12} textAnchor="end" fontWeight={700} fontSize={10} fill="#8B0000">{SIGN_SHORT[signIdx]}</text>
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
      {/* Таблица как раньше */}
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