import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Размеры
const SIZE = 320;
const CENTER = SIZE / 2;
const R = 100; // Радиус для центра ромба
const DIAMOND = 48; // "радиус" ромба (половина диагонали)
const TRIANGLE = 48; // "радиус" основания треугольника

// Координаты центров ромбов (дома 1, 4, 7, 10)
const DIAMONDS = [
  { cx: CENTER - R, cy: CENTER }, // 1 house (лево)
  { cx: CENTER, cy: CENTER + R }, // 4 house (низ)
  { cx: CENTER + R, cy: CENTER }, // 7 house (право)
  { cx: CENTER, cy: CENTER - R }  // 10 house (верх)
];

// Для треугольников — центры между ромбами
const M = R * Math.SQRT1_2; // offset для диагональных треугольников
const TRIANGLES = [
  { cx: CENTER - M, cy: CENTER - M }, // 12
  { cx: CENTER,     cy: CENTER - R }, // 11 (верх)
  { cx: CENTER + M, cy: CENTER - M }, // 9
  { cx: CENTER + R, cy: CENTER },     // 8 (право)
  { cx: CENTER + M, cy: CENTER + M }, // 6
  { cx: CENTER,     cy: CENTER + R }, // 5 (низ)
  { cx: CENTER - M, cy: CENTER + M }, // 3
  { cx: CENTER - R, cy: CENTER }      // 2 (лево)
];

// Дом: тип, индекс в массиве DIAMONDS/TRIANGLES, номер дома (индийская схема)
const HOUSES = [
  { type: "diamond", idx: 0, num: 1 },
  { type: "triangle", idx: 7, num: 2 },
  { type: "triangle", idx: 0, num: 3 },
  { type: "diamond", idx: 1, num: 4 },
  { type: "triangle", idx: 5, num: 5 },
  { type: "triangle", idx: 4, num: 6 },
  { type: "diamond", idx: 2, num: 7 },
  { type: "triangle", idx: 3, num: 8 },
  { type: "triangle", idx: 2, num: 9 },
  { type: "diamond", idx: 3, num: 10 },
  { type: "triangle", idx: 1, num: 11 },
  { type: "triangle", idx: 0, num: 12 }
];

// Функция для точек ромба
function getDiamondPoints(cx, cy, size = DIAMOND) {
  return [
    [cx, cy - size],
    [cx + size, cy],
    [cx, cy + size],
    [cx - size, cy]
  ].map(p => p.join(",")).join(" ");
}

// Функция для точек треугольника (основание на внешней стороне)
function getTrianglePoints(cx, cy, houseIdx) {
  // houseIdx: 0-7, задаёт направление треугольника
  // 0: 12 (лево-верх), 1: 11 (верх), 2: 9 (право-верх), 3: 8 (право), 4: 6 (право-низ), 5: 5 (низ), 6: 3 (лево-низ), 7: 2 (лево)
  const angle = Math.PI / 6 * (houseIdx * 2 + 1); // смещаем на 30°/60° для правильного расположения
  const a = TRIANGLE;
  // Центр треугольника — cx, cy
  // Вершина наружу:
  const x1 = cx + a * Math.cos(angle);
  const y1 = cy + a * Math.sin(angle);
  // Основание (два остальных угла) — симметрично относительно центра
  const angle1 = angle + Math.PI / 2;
  const angle2 = angle - Math.PI / 2;
  const x2 = cx + a * 0.7 * Math.cos(angle1);
  const y2 = cy + a * 0.7 * Math.sin(angle1);
  const x3 = cx + a * 0.7 * Math.cos(angle2);
  const y3 = cy + a * 0.7 * Math.sin(angle2);
  return [
    [x1, y1],
    [x2, y2],
    [x3, y3]
  ].map(p => p.join(",")).join(" ");
}

// Центр треугольника (для текста)
function getTriangleCenter(cx, cy, houseIdx) {
  const pts = getTrianglePoints(cx, cy, houseIdx).split(" ").map(s => s.split(",").map(Number));
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[1];
  const [x3, y3] = pts[2];
  return {
    cx: (x1 + x2 + x3) / 3,
    cy: (y1 + y2 + y3) / 3
  };
}

export default function NatalDiamondChart({ planets }) {
  if (!planets) return null;
  const ascSign = planets.ascendant?.sign || SIGNS[0];
  const ascSignIndex = SIGNS.indexOf(ascSign);
  const houseMap = getPlanetHouseMap(planets, ascSignIndex);

  // Привязка номера дома к индексу в houseMap
  function getHouseIndex(num) {
    return (num - 1 + 12) % 12;
  }

  // Планеты и накшатры
  const planetNakshMap = {};
  for (const [planet, pObj] of Object.entries(planets)) {
    if (typeof pObj.deg_in_sign === "number" && typeof pObj.sign === "string") {
      const signIdx = SIGNS.indexOf(pObj.sign);
      const totalDeg = signIdx * 30 + pObj.deg_in_sign;
      planetNakshMap[planet] = calcNakshatraPada(totalDeg);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 20, marginTop: 18 }}>
      <svg viewBox="0 0 320 320" width={320} height={320} style={{ display: "block" }}>
        {/* Рамка */}
        <rect x={8} y={8} width={304} height={304}
          fill="#fff"
          stroke="#8B0000"
          strokeWidth={5}
          rx={16}
        />
        {/* 12 домов */}
        {HOUSES.map((h, i) => {
          const houseNum = h.num;
          const signIdx = (ascSignIndex + houseNum - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(houseNum)] || [];
          let shapePoints, center;
          if (h.type === "diamond") {
            // Ромб
            const { cx, cy } = DIAMONDS[h.idx];
            shapePoints = getDiamondPoints(cx, cy);
            center = { cx, cy };
          } else {
            // Треугольник
            const { cx, cy } = TRIANGLES[h.idx];
            shapePoints = getTrianglePoints(cx, cy, h.idx);
            center = getTriangleCenter(cx, cy, h.idx);
          }
          return (
            <g key={i}>
              <polygon
                points={shapePoints}
                fill="#fbeeee"
                stroke="#8B0000"
                strokeWidth={2}
              />
              {/* номер дома (верхний левый угол фигуры) */}
              <text
                x={center.cx - 17}
                y={center.cy - 10}
                textAnchor="start"
                fontWeight={700}
                fontSize={11}
                fill="#8B0000"
              >{houseNum}</text>
              {/* знак (правый верхний угол фигуры) */}
              <text
                x={center.cx + 17}
                y={center.cy - 10}
                textAnchor="end"
                fontWeight={700}
                fontSize={11}
                fill="#8B0000"
              >{SIGN_SHORT[signIdx]}</text>
              {/* планеты — вертикально, центр фигуры */}
              {housePlanets.length > 0 && (
                <text
                  x={center.cx}
                  y={center.cy + 4 - (housePlanets.length - 1) * 9 / 2}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={housePlanets.length > 2 ? 11 : 15}
                  fill="#333"
                  style={{ pointerEvents: "none" }}
                >
                  {housePlanets.map((p, idx) => (
                    <tspan
                      x={center.cx}
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