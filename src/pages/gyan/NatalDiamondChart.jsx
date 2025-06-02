import React from "react";
import { SIGNS, SIGN_SHORT, PLANET_LABELS_DIAMOND, NAKSHATRAS, calcNakshatraPada, getPlanetHouseMap } from "./astroUtils";

// Координаты для ромбов и треугольников — North Indian Style
const DIAMOND_SIZE = 60; // Диаметр ромба
const CENTER = 160; // Центр SVG
const OFFSET = 96;  // Смещение для ромба от центра

// 4 ромба (дома 1, 4, 7, 10)
const DIAMONDS = [
  { cx: CENTER, cy: CENTER - OFFSET }, // 10
  { cx: CENTER + OFFSET, cy: CENTER }, // 7
  { cx: CENTER, cy: CENTER + OFFSET }, // 4
  { cx: CENTER - OFFSET, cy: CENTER }, // 1
];
// 8 треугольников (по 2 между ромбами)
const TRIANGLES = [
  // верх-право (11, 12)
  { points: getTrianglePoints(CENTER, CENTER - OFFSET, "topright"), house: 11 },
  { points: getTrianglePoints(CENTER, CENTER - OFFSET, "topleft"), house: 12 },
  // право-центр (8, 9)
  { points: getTrianglePoints(CENTER + OFFSET, CENTER, "righttop"), house: 8 },
  { points: getTrianglePoints(CENTER + OFFSET, CENTER, "rightbottom"), house: 9 },
  // низ-право (5, 6)
  { points: getTrianglePoints(CENTER, CENTER + OFFSET, "bottomright"), house: 5 },
  { points: getTrianglePoints(CENTER, CENTER + OFFSET, "bottomleft"), house: 6 },
  // лево-центр (2, 3)
  { points: getTrianglePoints(CENTER - OFFSET, CENTER, "lefttop"), house: 2 },
  { points: getTrianglePoints(CENTER - OFFSET, CENTER, "leftbottom"), house: 3 },
];

// Вспомогательная функция для треугольников
function getTrianglePoints(cx, cy, dir) {
  const s = DIAMOND_SIZE;
  switch (dir) {
    case "topright":   // 11
      return `${cx},${cy - s} ${cx + s},${cy} ${cx},${cy}`;
    case "topleft":    // 12
      return `${cx},${cy - s} ${cx},${cy} ${cx - s},${cy}`;
    case "righttop":   // 8
      return `${cx + s},${cy} ${cx},${cy - s} ${cx},${cy}`;
    case "rightbottom":// 9
      return `${cx + s},${cy} ${cx},${cy} ${cx},${cy + s}`;
    case "bottomright":// 5
      return `${cx},${cy + s} ${cx + s},${cy} ${cx},${cy}`;
    case "bottomleft": // 6
      return `${cx},${cy + s} ${cx},${cy} ${cx - s},${cy}`;
    case "lefttop":    // 2
      return `${cx - s},${cy} ${cx},${cy - s} ${cx},${cy}`;
    case "leftbottom": // 3
      return `${cx - s},${cy} ${cx},${cy} ${cx},${cy + s}`;
    default:
      return "";
  }
}

// Ромба
function getDiamondPoints(cx, cy, size = DIAMOND_SIZE) {
  return [
    [cx, cy - size],
    [cx + size, cy],
    [cx, cy + size],
    [cx - size, cy]
  ].map(p => p.join(",")).join(" ");
}

// Сопоставление: номер дома → индекс в массиве домов
// По часовой стрелке: 1 (лево), 2-3 (лево-верх), 4 (низ), 5-6 (низ-право), 7 (право), 8-9 (право-верх), 10 (верх), 11-12 (верх-лево)
const HOUSE_SEQUENCE = [1,2,3,4,5,6,7,8,9,10,11,12];

// Классический порядок домов для подписи
const HOUSE_POS = [
  { type: "diamond", idx: 3 }, // 1
  { type: "triangle", idx: 7 }, // 2
  { type: "triangle", idx: 8 }, // 3
  { type: "diamond", idx: 2 }, // 4
  { type: "triangle", idx: 4 }, // 5
  { type: "triangle", idx: 5 }, // 6
  { type: "diamond", idx: 1 }, // 7
  { type: "triangle", idx: 2 }, // 8
  { type: "triangle", idx: 3 }, // 9
  { type: "diamond", idx: 0 }, // 10
  { type: "triangle", idx: 0 }, // 11
  { type: "triangle", idx: 1 }  // 12
];

export default function NatalDiamondChart({ planets }) {
  if (!planets) return null;
  const ascSign = planets.ascendant?.sign || SIGNS[0];
  const ascSignIndex = SIGNS.indexOf(ascSign);
  const houseMap = getPlanetHouseMap(planets, ascSignIndex);

  // Порядок домов по индийской схеме
  function getHouseIndex(houseNum) {
    return (houseNum + 12 - 1) % 12;
  }

  // Сопоставление домов и позиций для рендера
  const houseRenderable = HOUSE_POS.map((pos, i) => {
    if (pos.type === "diamond") {
      return {
        ...pos,
        points: getDiamondPoints(DIAMONDS[pos.idx].cx, DIAMONDS[pos.idx].cy),
        cx: DIAMONDS[pos.idx].cx,
        cy: DIAMONDS[pos.idx].cy
      };
    } else {
      return {
        ...pos,
        points: TRIANGLES[pos.idx].points,
        // центр треугольника для текста: среднее арифметическое координат
        ...getTriangleCenter(TRIANGLES[pos.idx].points)
      };
    }
  });

  // Вспомогательная для центра треугольника
  function getTriangleCenter(pointsStr) {
    const pts = pointsStr.split(" ").map(s => {
      const [x, y] = s.split(",").map(Number);
      return { x, y };
    });
    const cx = (pts[0].x + pts[1].x + pts[2].x) / 3;
    const cy = (pts[0].y + pts[1].y + pts[2].y) / 3;
    return { cx, cy };
  }

  // Планеты по дому
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
        {/* 12 домов - ромбы и треугольники */}
        {houseRenderable.map((h, i) => {
          const houseNum = HOUSE_SEQUENCE[i];
          const signIdx = (ascSignIndex + houseNum - 1) % 12;
          const housePlanets = houseMap[getHouseIndex(houseNum)] || [];
          return (
            <g key={i}>
              {h.type === "diamond" ?
                <polygon
                  points={h.points}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                /> :
                <polygon
                  points={h.points}
                  fill="#fbeeee"
                  stroke="#8B0000"
                  strokeWidth={2}
                />
              }
              {/* номер дома */}
              <text
                x={h.cx-19}
                y={h.cy-11}
                textAnchor="start"
                fontWeight={700}
                fontSize={11}
                fill="#8B0000"
              >{houseNum}</text>
              {/* знак */}
              <text
                x={h.cx+19}
                y={h.cy-11}
                textAnchor="end"
                fontWeight={700}
                fontSize={11}
                fill="#8B0000"
              >{SIGN_SHORT[signIdx]}</text>
              {/* планеты — вертикально, центр фигуры */}
              {housePlanets.length > 0 && (
                <text
                  x={h.cx}
                  y={h.cy + 4 - (housePlanets.length - 1) * 9 / 2}
                  textAnchor="middle"
                  fontWeight={700}
                  fontSize={housePlanets.length > 2 ? 11 : 15}
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
        })}
      </svg>
      {/* Таблица — можно оставить как раньше */}
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