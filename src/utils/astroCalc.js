import { julian, planetposition, solar, moonposition } from "astronomia";
import vsop87Bearth from "../astrodata/vsop87Bearth.js";
import vsop87Bmercury from "../astrodata/vsop87Bmercury.js";
import vsop87Bvenus from "../astrodata/vsop87Bvenus.js";
import vsop87Bmars from "../astrodata/vsop87Bmars.js";
import vsop87Bjupiter from "../astrodata/vsop87Bjupiter.js";
import vsop87Bsaturn from "../astrodata/vsop87Bsaturn.js";

// Лахири айанамша (Chitrapaksha)
function lahiriAyanamsha(jd) {
  // Значение на эпоху 1900.0 (B1950)
  const baseAyanamsha = 22.460148;
  const baseJD = 2415020.0;
  const rate = 50.2564 / 3600; // в градусах в год

  const years = (jd - baseJD) / 365.242198781;
  return baseAyanamsha + years * rate;
}

// Геоцентрическая долгота планеты
function planetGeoLongitude(planet, earth, jd) {
  // Для astronomia 2.x: используем метод position2000, т.к. эфемериды VSOP87B
  // возвращают {lon, lat, range} в радианах, долгота эклиптическая
  const { lon } = planet.position2000(earth, jd);
  return ((lon * 180) / Math.PI + 360) % 360;
}

// Получить сидерические координаты планет
export function getSiderealPositions({ year, month, day, hour, minute }) {
  const jd =
    julian.CalendarGregorianToJD(year, month, day) +
    (hour + minute / 60) / 24;
  const ayanamsha = lahiriAyanamsha(jd);

  // планеты VSOP87: создаём экземпляры (astronomia 2.x)
  const earth = new planetposition.Planet(vsop87Bearth);
  const mercury = new planetposition.Planet(vsop87Bmercury);
  const venus = new planetposition.Planet(vsop87Bvenus);
  const mars = new planetposition.Planet(vsop87Bmars);
  const jupiter = new planetposition.Planet(vsop87Bjupiter);
  const saturn = new planetposition.Planet(vsop87Bsaturn);

  // Солнце: используем solar.apparentVSOP87 (вернёт {lon, lat, range} в радианах)
  const sunLon = (solar.apparentVSOP87(earth, jd).lon * 180) / Math.PI;
  // Луна: moonposition.position(jd) вернёт {lon, lat, range} в радианах
  const moonLon = (moonposition.position(jd).lon * 180) / Math.PI;

  // Основные планеты
  const mercuryLon = planetGeoLongitude(mercury, earth, jd);
  const venusLon = planetGeoLongitude(venus, earth, jd);
  const marsLon = planetGeoLongitude(mars, earth, jd);
  const jupiterLon = planetGeoLongitude(jupiter, earth, jd);
  const saturnLon = planetGeoLongitude(saturn, earth, jd);

  // Переводим в сидерические (звёздные) координаты
  function toSidereal(trop) {
    let sid = trop - ayanamsha;
    if (sid < 0) sid += 360;
    if (sid >= 360) sid -= 360;
    return sid;
  }

  return {
    ayanamsha,
    sun: toSidereal(sunLon),
    moon: toSidereal(moonLon),
    mercury: toSidereal(mercuryLon),
    venus: toSidereal(venusLon),
    mars: toSidereal(marsLon),
    jupiter: toSidereal(jupiterLon),
    saturn: toSidereal(saturnLon),
    _tropical: {
      sun: sunLon,
      moon: moonLon,
      mercury: mercuryLon,
      venus: venusLon,
      mars: marsLon,
      jupiter: jupiterLon,
      saturn: saturnLon,
    },
  };
}