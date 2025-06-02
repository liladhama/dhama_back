import React from "react";
import {
  SIGNS,
  SIGN_SHORT,
  PLANET_LABELS_DIAMOND,
  calcNakshatraPada,
  getPlanetHouseMap,
} from "./astroUtils";

// Размер SVG и отступы
const SIZE = 320;
const PADDING = 24;
const CENTER = SIZE / 2;
const SQ = SIZE - 2 * PADDING;

// Углы и середины
const A = [PADDING, PADDING]; // левый верх
const B = [SIZE - PADDING, PADDING]; // правый верх
const C = [SIZE - PADDING, SIZE - PADDING]; // правый низ
const D = [PADDING, SIZE - PADDING]; // левый низ

const S1 = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; // верх
const S2 = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]; // право
const S3 = [(C[0] + D[0]) / 2, (C[1] + D[1]) / 2]; // низ
const S4 = [(D[0] + A[0]) / 2, (D[1] + A[1]) / 2]; // лево

const X = [CENTER, CENTER];

// 1, 4, 7, 10 дома — это ромбы между серединами сторон
// Остальные дома — треугольники между углом, двумя ближайшими серединами и центром

// Индексы для ромбов (основные дома)
const mainRombs = [
  [S1, X, S3, S4], // 1 дом (верхний ромб)
  [S4, X, S2, S1], // 4 дом (левый ромб)
  [S3, X, S1, S2], // 7 дом (нижний ромб)
  [S2, X, S4, S3], // 10 дом (правый ромб)
];

// Индексы для треугольников (доп. дома)
const triangles = [
  [A, S1, X], // 12 дом (лево-верх)
  [S1, B, X], // 2 дом (право-верх)
  [B, S2, X], // 3 дом (право)
  [S2, C, X], // 5 дом (право-низ)
  [C, S3, X], // 6 дом (низ)
  [S3, D, X], // 8 дом (лево-низ)
  [D, S4, X], // 9 дом (лево)
  [S4, A, X], // 11 дом (лево-верх)
];

// Итоговый порядок домов (против часовой стрелки, начиная с верхнего ромба, как в классике):
const housePolygons = [
  mainRombs[0], // 1 верхний ромб
  triangles[1], // 2 верх-право
  triangles[2], // 3 право
  mainRombs[1], // 4 левый ромб
  triangles[3], // 5 низ-право
  triangles[4], // 6 низ
  mainRombs[2], // 7 нижний ромб
  triangles[5], // 8 низ-лево
  triangles[6], // 9 лево
  mainRombs[3], // 10 правый ромб
  triangles[7], // 11 верх-лево
  triangles[0], // 12 верх
];

// Для каждого дома аккуратно разместим:
// - номер дома: в первом углу полигона (например, верхний/левый)
// - знак: во втором углу полигона (например, противоположный угол)
// - планеты: по центру полигона

function getPolygonLabelPositions(pts) {
  const [x1, y1] = pts[0];
  const [x2, y2] = pts[1];
  const { cx, cy } = getPolygonCenter(pts);
  return {
    houseNum: { x: x1 + (cx - x1) * 0.18, y: y1 + (cy - y1) * 0.18 }, // чуть ближе к центру
    sign: { x: x2 + (cx - x2) * 0.18, y: y2 + (cy - y2) * 0.18 },
    center: { x: cx, y: cy },
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
        <line x1={A[0]} y1={A[1]} x2={C[0]} y2={C[1]} stroke="#d88" strokeWidth={1.5}/>
        <line x1={B[0]} y1={B[1]} x2={D[0]} y2={D[1]} stroke="#d88" strokeWidth={1.5}/>
        {/* Дома */}
        {housePolygons.map((pts, i) => {
          const num = i + 1;
          // Знак. Первый дом — асцендент, далее по кругу
          const signIdx = (ascSignIndex + num - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(num)] || [];
          const pointsAttr = pts.map(p => p.join(",")).join(" ");
          const pos = getPolygonLabelPositions(pts);

          return (
            <g key={i}>
              <polygon
                points={pointsAttr}
                fill="#fbeeee"
                stroke="#8B0000"
                strokeWidth={2}
              />
              {/* Номер дома */}
              <text x={pos.houseNum.x} y={pos.houseNum.y} textAnchor="middle"
                fontWeight={700} fontSize={13} fill="#8B0000"
                style={{ pointerEvents: "none", dominantBaseline: "hanging" }}>
                {num}
              </text>
              {/* Знак */}
              <text x={pos.sign.x} y={pos.sign.y} textAnchor="middle"
                fontWeight={700} fontSize={10} fill="#8B0000"
                style={{ pointerEvents: "none", dominantBaseline: "hanging" }}>
                {SIGN_SHORT[signIdx]}
              </text>
              {/* Планеты */}
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