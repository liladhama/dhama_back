import { julian, planetposition, solar, moonposition, node, sidereal, sexagesimal as sexa } from "astronomia";
import vsop87Bearth from "../astrodata/vsop87Bearth.js";
import vsop87Bmercury from "../astrodata/vsop87Bmercury.js";
import vsop87Bvenus from "../astrodata/vsop87Bvenus.js";
import vsop87Bmars from "../astrodata/vsop87Bmars.js";
import vsop87Bjupiter from "../astrodata/vsop87Bjupiter.js";
import vsop87Bsaturn from "../astrodata/vsop87Bsaturn.js";

// Lahiri ayanamsa, J2000 epoch
function lahiriAyanamsha(jd) {
  const baseAyanamsha = 23.8572986; // degrees, for J2000.0
  const baseJD = 2451545.0;         // JD for J2000.0
  const rate = 50.290966 / 3600;    // degrees per year

  const years = (jd - baseJD) / 365.242198781;
  return baseAyanamsha + years * rate;
}

// Геоцентрическая долгота планеты (VSOP87B, эклиптические координаты)
function planetGeoLongitude(planetData, earthData, jd) {
  const earth = new planetposition.Planet(earthData);
  const planet = new planetposition.Planet(planetData);
  // position2000: эклиптические координаты относ. Земли на эпоху J2000
  const { lon } = planet.position2000(earth, jd);
  return ((lon * 180) / Math.PI + 360) % 360;
}

// Солнце и Луна
function sunLongitude(earth, jd) {
  return ((solar.apparentVSOP87(earth, jd).lon * 180) / Math.PI + 360) % 360;
}
function moonLongitude(jd) {
  return ((moonposition.position(jd).lon * 180) / Math.PI + 360) % 360;
}

// Истинный восходящий лунный узел (Rahu), Ketu = Rahu + 180°
function trueRahuKetu(jd) {
  // node.true(jd): {lon, lat, dist}
  console.log("NODE TRUE TYPE:", typeof node.true); // <-- логирование типа функции
  const rahuLon = ((node.true(jd).lon * 180) / Math.PI + 360) % 360;
  const ketuLon = (rahuLon + 180) % 360;
  return { rahu: rahuLon, ketu: ketuLon };
}

// Асцендент (лагна)
// lat, lon — в градусах (широта, вост. долгота); jd — эпоха;
// tzOffset — смещение по UTC (например, для Москвы летом 3, зимой 3)
function calcAscendant({ jd, lat, lon, tzOffset }) {
  // Местное звёздное время
  // 1. Получить зелёный звёздный час (GST)
  const gst = sidereal.apparent(jd);
  // 2. Местное звёздное время (LST) в градусах:
  const lst = ((gst * 180) / Math.PI + lon + 360) % 360; // lon вост. долгота
  // 3. Эклиптическая широта (lat) в радианах
  const latRad = (lat * Math.PI) / 180;
  // 4. Тангенс эклиптической долготы лагны
  const e = 23.439291111; // наклон эклиптики на J2000, градусы
  const eRad = (e * Math.PI) / 180;
  const lstRad = (lst * Math.PI) / 180;
  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(eRad) * Math.tan(latRad) + Math.cos(eRad) * Math.sin(lstRad)
  );
  let ascDeg = (ascRad * 180) / Math.PI;
  // Переводим в диапазон [0,360)
  ascDeg = (ascDeg + 360) % 360;
  return ascDeg;
}

// Удобная функция перевода градусов в знак и градусы/минуты
function degToZodiacString(deg) {
  const signs = [
    "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
    "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
  ];
  const sign = Math.floor(deg / 30);
  const inSign = deg % 30;
  const d = Math.floor(inSign);
  const m = Math.floor((inSign - d) * 60);
  return `${signs[sign]} ${d}°${m.toString().padStart(2, "0")}'`;
}

// Главная функция расчёта всех сидерических координат
// lat, lon — широта и долгота места (градусы, восточная долгота положительная)
// tzOffset — смещение в часах от UTC (например, Москва = 3 зимой, 3 летом)
export function getSiderealPositions({
  year, month, day, hour, minute,
  lat = 55.75, lon = 37.6167, tzOffset = 3
}) {
  // JD: сначала UTC
  const jd = julian.CalendarGregorianToJD(year, month, day)
    + ((hour - tzOffset) + minute / 60) / 24;

  const ayanamsha = lahiriAyanamsha(jd);

  // Земля — для VSOP87B нужна как earthData
  // Используем отдельные данные для каждой планеты!
  const mercuryLon = planetGeoLongitude(vsop87Bmercury, vsop87Bearth, jd);
  const venusLon   = planetGeoLongitude(vsop87Bvenus, vsop87Bearth, jd);
  const marsLon    = planetGeoLongitude(vsop87Bmars, vsop87Bearth, jd);
  const jupiterLon = planetGeoLongitude(vsop87Bjupiter, vsop87Bearth, jd);
  const saturnLon  = planetGeoLongitude(vsop87Bsaturn, vsop87Bearth, jd);

  // Земля как объект для солнца
  const earthObj = new planetposition.Planet(vsop87Bearth);
  const sunLon = sunLongitude(earthObj, jd);

  const moonLon = moonLongitude(jd);

  // Истинные лунные узлы
  const { rahu, ketu } = trueRahuKetu(jd);

  // Асцендент
  const asc = calcAscendant({ jd, lat, lon, tzOffset });

  // Переводим все в сидерические координаты
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
    rahu: toSidereal(rahu),
    ketu: toSidereal(ketu),
    ascendant: toSidereal(asc),
    // Для отладки можно добавить все тропические значения
    _tropical: {
      sun: sunLon,
      moon: moonLon,
      mercury: mercuryLon,
      venus: venusLon,
      mars: marsLon,
      jupiter: jupiterLon,
      saturn: saturnLon,
      rahu,
      ketu,
      ascendant: asc,
    },
    // Для удобства сразу удобные строки:
    zodiac: {
      sun: degToZodiacString(toSidereal(sunLon)),
      moon: degToZodiacString(toSidereal(moonLon)),
      mercury: degToZodiacString(toSidereal(mercuryLon)),
      venus: degToZodiacString(toSidereal(venusLon)),
      mars: degToZodiacString(toSidereal(marsLon)),
      jupiter: degToZodiacString(toSidereal(jupiterLon)),
      saturn: degToZodiacString(toSidereal(saturnLon)),
      rahu: degToZodiacString(toSidereal(rahu)),
      ketu: degToZodiacString(toSidereal(ketu)),
      ascendant: degToZodiacString(toSidereal(asc)),
    }
  };
}   