import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

const SIZE = 320;
const CENTER = SIZE / 2;
const BIG = 48; // радиус ромба
const TRI = 38; // радиус треугольников

// Ромбы (по диагоналям)
const diamonds = [
  { cx: CENTER, cy: CENTER - 96 },    // 1 дом (верх)
  { cx: CENTER - 96, cy: CENTER },    // 4 дом (лево)
  { cx: CENTER, cy: CENTER + 96 },    // 7 дом (низ)
  { cx: CENTER + 96, cy: CENTER },    // 10 дом (право)
];

// Треугольники против часовой стрелки, начиная с левого верхнего
const triangles = [
  { cx: CENTER - 54, cy: CENTER - 82, angle: -120 },  // 2 дом (левый верхний)
  { cx: CENTER - 82, cy: CENTER - 54, angle: -150 },  // 3 дом (левый верхний угол)
  { cx: CENTER - 82, cy: CENTER + 54, angle: -210 },  // 5 дом (левый нижний угол)
  { cx: CENTER - 54, cy: CENTER + 82, angle: -240 },  // 6 дом (левый нижний)
  { cx: CENTER + 54, cy: CENTER + 82, angle: -300 },  // 8 дом (нижний правый)
  { cx: CENTER + 82, cy: CENTER + 54, angle: -330 },  // 9 дом (нижний правый угол)
  { cx: CENTER + 82, cy: CENTER - 54, angle: -30 },   // 11 дом (правый верхний угол)
  { cx: CENTER + 54, cy: CENTER - 82, angle: 0 },     // 12 дом (правый верхний)
];

// Соответствие домов фигурам (против часовой!)
const houseLayout = [
  { num: 1,  type: "diamond", idx: 0 },   // верхний ромб
  { num: 2,  type: "triangle", idx: 0 },  // левый верхний треугольник
  { num: 3,  type: "triangle", idx: 1 },  // левый верхний угол
  { num: 4,  type: "diamond", idx: 1 },   // левый ромб
  { num: 5,  type: "triangle", idx: 2 },  // левый нижний угол
  { num: 6,  type: "triangle", idx: 3 },  // левый нижний треугольник
  { num: 7,  type: "diamond", idx: 2 },   // нижний ромб
  { num: 8,  type: "triangle", idx: 4 },  // нижний правый треугольник
  { num: 9,  type: "triangle", idx: 5 },  // нижний правый угол
  { num:10,  type: "diamond", idx: 3 },   // правый ромб
  { num:11,  type: "triangle", idx: 6 },  // правый верхний угол
  { num:12,  type: "triangle", idx: 7 },  // правый верхний треугольник
];

// Ромбы
function diamondPoints(cx, cy, r) {
  return [
    [cx, cy - r],
    [cx + r, cy],
    [cx, cy + r],
    [cx - r, cy]
  ].map(p => p.join(",")).join(" ");
}

// Треугольники (основание к центру, вершина наружу)
function trianglePoints(cx, cy, r, angle) {
  const toRad = a => a * Math.PI / 180;
  const a1 = toRad(angle);
  const a2 = toRad(angle + 120);
  const a3 = toRad(angle - 120);
  return [
    [cx + r * Math.cos(a1), cy + r * Math.sin(a1)],
    [cx + r * 0.82 * Math.cos(a2), cy + r * 0.82 * Math.sin(a2)],
    [cx + r * 0.82 * Math.cos(a3), cy + r * 0.82 * Math.sin(a3)]
  ].map(p => p.join(",")).join(" ");
}

// Центр фигуры для текста
function getCenter(type, idx) {
  return type === "diamond" ? diamonds[idx] : triangles[idx];
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
          const { num, type, idx } = h;
          const r = (type === "diamond" ? BIG : TRI);
          const { cx, cy, angle } = getCenter(type, idx);
          const signIdx = (ascSignIndex + num - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(num)] || [];
          return (
            <g key={i}>
              {type === "diamond"
                ? <polygon
                    points={diamondPoints(cx, cy, r)}
                    fill="#fbeeee"
                    stroke="#8B0000"
                    strokeWidth={2}
                  />
                : <polygon
                    points={trianglePoints(cx, cy, r, angle)}
                    fill="#fbeeee"
                    stroke="#8B0000"
                    strokeWidth={2}
                  />
              }
              {/* номер дома — чуть выше центра фигуры */}
              <text
                x={cx}
                y={cy - (type === "diamond" ? r - 16 : r - 10)}
                textAnchor="middle"
                fontWeight={700}
                fontSize={type === "diamond" ? 13 : 11}
                fill="#8B0000"
              >{num}</text>
              {/* знак — правый верхний угол фигуры */}
              <text
                x={cx + (type === "diamond" ? r - 13 : r * 0.7)}
                y={cy - (type === "diamond" ? r - 16 : r * 0.7)}
                textAnchor="end"
                fontWeight={700}
                fontSize={type === "diamond" ? 13 : 11}
                fill="#8B0000"
              >{SIGN_SHORT[signIdx]}</text>
              {/* планеты — по центру, вертикально */}
              {housePlanets.length > 0 && (
                <text
                  x={cx}
                  y={cy + 4 - (housePlanets.length - 1) * 9 / 2}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={housePlanets.length > 2 ? 11 : (type === "diamond" ? 14 : 12)}
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