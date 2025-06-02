import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, NAKSHATRAS, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Геометрия для квадратной карты
const SQR = 320;
const P = 36;
const CHART_FIGURES = [
  { type: "diamond", x: SQR/2, y: P },
  { type: "triangle", x: SQR-P, y: P, angle: 90},
  { type: "triangle", x: SQR-P, y: SQR/2, angle: 0},
  { type: "diamond", x: SQR-P, y: SQR/2 },
  { type: "triangle", x: SQR-P, y: SQR-P, angle: -90},
  { type: "triangle", x: SQR/2, y: SQR-P, angle: 180 },
  { type: "diamond", x: SQR/2, y: SQR-P },
  { type: "triangle", x: P, y: SQR-P, angle: 90},
  { type: "triangle", x: P, y: SQR/2, angle: 0},
  { type: "diamond", x: P, y: SQR/2 },
  { type: "triangle", x: P, y: P, angle: -90 },
  { type: "triangle", x: SQR/2, y: P, angle: 180 },
];
const CHART_SIGNS_CORNERS = [
  { x: SQR/2, y: 18, align: "middle", valign: "hanging" }, // север
  { x: SQR-18, y: SQR/2, align: "end", valign: "middle" }, // восток
  { x: SQR/2, y: SQR-18, align: "middle", valign: "baseline" }, // юг
  { x: 18, y: SQR/2, align: "start", valign: "middle" }, // запад
];

function getDiamondPoints(cx, cy, size = 29) {
  return [
    [cx, cy - size],
    [cx + size, cy],
    [cx, cy + size],
    [cx - size, cy]
  ].map(p => p.join(",")).join(" ");
}
function getTrianglePoints(cx, cy, size = 29, angle = 0) {
  const a = angle * Math.PI / 180;
  return [
    [cx, cy - size],
    [cx + size * Math.cos(Math.PI/6 + a), cy + size * Math.sin(Math.PI/6 + a)],
    [cx - size * Math.cos(Math.PI/6 - a), cy + size * Math.sin(Math.PI/6 - a)],
  ].map(p => p.join(",")).join(" ");
}

export default function NatalDiamondChart({ planets }) {
  if (!planets) return null;
  const ascSign = planets.ascendant?.sign || SIGNS[0];
  const ascSignIndex = SIGNS.indexOf(ascSign);
  const houseMap = getPlanetHouseMap(planets, ascSignIndex);

  const signOrder = [];
  for (let i = 0; i < 12; ++i) {
    signOrder.push((ascSignIndex + i) % 12);
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
      <svg viewBox={`0 0 ${SQR} ${SQR}`} width={320} height={320} style={{ display: "block" }}>
        {/* Квадратная рамка */}
        <rect x={8} y={8} width={SQR-16} height={SQR-16}
          fill="#fff"
          stroke="#8B0000"
          strokeWidth={5}
          rx={20}
        />
        {/* 12 фигур внутри квадрата */}
        {CHART_FIGURES.map((fig, i) => {
          const houseNum = i + 1;
          const signIdx = (ascSignIndex + i) % 12;
          const housePlanets = houseMap[i] || [];
          let numX = fig.x - 19, numY = fig.y - 16;
          let signX = fig.x + 19, signY = fig.y - 16;
          if (fig.type === "triangle" && fig.angle === 90) { numY -= 6; signY -= 6; }
          if (fig.type === "triangle" && fig.angle === -90) { numY += 6; signY += 6; }
          return (
            <g key={i}>
              {fig.type === "diamond" ? (
                <polygon
                  points={getDiamondPoints(fig.x, fig.y, 29)}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                />
              ) : (
                <polygon
                  points={getTrianglePoints(fig.x, fig.y, 29, fig.angle || 0)}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                />
              )}
              <text
                x={numX}
                y={numY}
                textAnchor="middle"
                fontWeight={700}
                fontSize={12}
                fill="#8B0000"
                dy={0}
              >
                {houseNum}
              </text>
              <text
                x={signX}
                y={signY}
                textAnchor="middle"
                fontWeight={700}
                fontSize={12}
                fill="#8B0000"
                dy={0}
              >
                {SIGN_SHORT[signIdx]}
              </text>
              {housePlanets.length > 0 && (
                <text
                  x={fig.x}
                  y={fig.y + 5}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={15}
                  fill="#333"
                >
                  {housePlanets.map((p) => PLANET_LABELS_DIAMOND[p]).join(" ")}
                </text>
              )}
            </g>
          );
        })}
        {/* Знаки по углам квадрата */}
        {CHART_SIGNS_CORNERS.map((pt, i) => (
          <text
            key={i}
            x={pt.x}
            y={pt.y}
            textAnchor={pt.align}
            dominantBaseline={pt.valign}
            fontWeight={700}
            fontSize={15}
            fill="#8B0000"
            style={{
              paintOrder: "stroke",
              stroke: "#fff",
              strokeWidth: 4,
              strokeLinejoin: "round"
            }}
          >
            {SIGN_SHORT[signOrder[i * 3]]}
          </text>
        ))}
      </svg>
      {/* Таблица */}
      <div style={{
        width: 270, maxWidth: "100%", background: "#fff", borderRadius: 12,
        boxShadow: "0 1px 8px #8B000022", padding: "8px 7px 8px 7px", marginTop: 2
      }}>
        <table style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 13,
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
                  <td style={{ padding: "1px 2px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{n.nakshatra || ""}</td>
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