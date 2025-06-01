import { julian, moonposition } from "astronomia";
import vsop87Bearth from "../astrodata/vsop87Bearth.js";
import vsop87Bmercury from "../astrodata/vsop87Bmercury.js";
import vsop87Bvenus from "../astrodata/vsop87Bvenus.js";
import vsop87Bmars from "../astrodata/vsop87Bmars.js";
import vsop87Bjupiter from "../astrodata/vsop87Bjupiter.js";
import vsop87Bsaturn from "../astrodata/vsop87Bsaturn.js";

// Лахири айанамша
function lahiriAyanamsha(jd) {
  const baseAyanamsha = 23.8572986;
  const baseJD = 2451545.0;
  const rate = 50.290966 / 3600;
  const years = (jd - baseJD) / 365.242198781;
  return baseAyanamsha + years * rate;
}

// Перевод сферических в декартовы координаты
function sph2cart(lon, lat, r) {
  return [
    r * Math.cos(lat) * Math.cos(lon),
    r * Math.cos(lat) * Math.sin(lon),
    r * Math.sin(lat)
  ];
}

// Перевод декартовых в сферические координаты
function cart2sph(x, y, z) {
  const r = Math.sqrt(x * x + y * y + z * z);
  const lon = Math.atan2(y, x);
  const lat = Math.asin(z / r);
  return { lon, lat, range: r };
}

// Универсальная функция: вычисляет гелиоцентрические координаты по твоим VSOP87 данным
function vsop87Heliocentric(planetData, jd) {
  function sumSeries(series, t) {
    let sum = 0;
    for (const [A, B, C] of series) {
      sum += A * Math.cos(B + C * t);
    }
    return sum;
  }
  function calc(coord, t) {
    let res = 0;
    for (let i = 0; i < 6; i++) {
      const key = String(i);
      if (coord[key]) {
        res += sumSeries(coord[key], t) * Math.pow(t, i);
      }
    }
    return res;
  }
  // JD → столетия от J2000
  const T = (jd - 2451545.0) / 365250;
  const lon = calc(planetData.L, T);
  const lat = calc(planetData.B, T);
  const range = calc(planetData.R, T);
  return { lon, lat, range };
}

// Геоцентрическая долгота планеты
function planetGeoLongitude(planetData, earthData, jd) {
  const planetPos = vsop87Heliocentric(planetData, jd);
  const earthPos = vsop87Heliocentric(earthData, jd);

  const planetCart = sph2cart(planetPos.lon, planetPos.lat, planetPos.range);
  const earthCart = sph2cart(earthPos.lon, earthPos.lat, earthPos.range);

  const geoCart = [
    planetCart[0] - earthCart[0],
    planetCart[1] - earthCart[1],
    planetCart[2] - earthCart[2]
  ];
  const geo = cart2sph(...geoCart);

  // Нормализация в диапазон 0-2π и перевод в градусы
  return ((geo.lon * 180) / Math.PI + 360) % 360;
}

// Солнце (геоцентрически!)
// Солнце — это положение Земли + 180°
function sunLongitude(earthData, jd) {
  const earthPos = vsop87Heliocentric(earthData, jd);
  let sunLon = ((earthPos.lon * 180) / Math.PI + 180) % 360;
  return sunLon;
}

// Луна
function moonLongitude(jd) {
  const lon = moonposition.position(jd).lon;
  return ((lon * 180) / Math.PI + 360) % 360;
}

// Узлы (Раху и Кету)
function trueRahuKetu(jd) {
  const T = (jd - 2451545.0) / 36525;
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  omega = ((omega % 360) + 360) % 360;
  const rahu = omega;
  const ketu = (omega + 180) % 360;
  return { rahu, ketu };
}

// --- Ручной асцендент (тропический) ---
function calcTropicalAscendant(jd, lat, lon) {
  // jd — юлианская дата (UT), lat/lon — в градусах
  // Формула: https://astronexus.com/node/34, https://github.com/andrmoel/astro
  const d = jd - 2451545.0;
  // Гринвичское звёздное время (GMST), в градусах
  let GMST = (280.46061837 + 360.98564736629 * d) % 360;
  if (GMST < 0) GMST += 360;
  // Местное звёздное время (LST)
  let LST = (GMST + lon) % 360;
  if (LST < 0) LST += 360;
  // Эклиптический наклон
  const obliquity = 23.439291 - 0.0130042 * ((jd - 2451545.0) / 36525); // градусы
  // Все в радианах
  const LSTr = LST * Math.PI / 180;
  const latr = lat * Math.PI / 180;
  const oblr = obliquity * Math.PI / 180;
  // Формула асцендента по эклиптике
  let tanAsc = (Math.cos(LSTr) / (Math.sin(LSTr) * Math.cos(oblr) - Math.tan(latr) * Math.sin(oblr)));
  let ascRad = Math.atan(tanAsc);
  if (LST > 180) ascRad += Math.PI;
  let ascDeg = (ascRad * 180 / Math.PI) % 360;
  if (ascDeg < 0) ascDeg += 360;
  return ascDeg;
}

// Сидерический асцендент
function calcAscendant({ jd, lat, lon }) {
  const tropAsc = calcTropicalAscendant(jd, lat, lon);
  const ayanamsha = lahiriAyanamsha(jd);
  let sidAsc = tropAsc - ayanamsha;
  if (sidAsc < 0) sidAsc += 360;
  if (sidAsc >= 360) sidAsc -= 360;
  return sidAsc;
}

// Перевод градусов в астрологическую строку
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

export function getSiderealPositions({
  year, month, day, hour, minute,
  lat = 55.75, lon = 37.6167, tzOffset = 3
}) {
  const jd = julian.CalendarGregorianToJD(year, month, day)
    + ((hour - tzOffset) + minute / 60) / 24;
  const ayanamsha = lahiriAyanamsha(jd);

  const mercuryLon = planetGeoLongitude(vsop87Bmercury, vsop87Bearth, jd);
  const venusLon   = planetGeoLongitude(vsop87Bvenus, vsop87Bearth, jd);
  const marsLon    = planetGeoLongitude(vsop87Bmars, vsop87Bearth, jd);
  const jupiterLon = planetGeoLongitude(vsop87Bjupiter, vsop87Bearth, jd);
  const saturnLon  = planetGeoLongitude(vsop87Bsaturn, vsop87Bearth, jd);

  const sunLon = sunLongitude(vsop87Bearth, jd);
  const moonLon = moonLongitude(jd);

  let rahu = NaN, ketu = NaN;
  try {
    const nodes = trueRahuKetu(jd);
    rahu = nodes.rahu;
    ketu = nodes.ketu;
  } catch (err) {
    // Можно добавить обработку ошибок
  }

  // Асцендент (сидерический)
  const asc = calcAscendant({ jd, lat, lon });

  function toSidereal(trop) {
    let sid = trop - ayanamsha;
    if (sid < 0) sid += 360;
    if (sid >= 360) sid -= 360;
    return sid;
  }

  // Для отладки: вернуть тропический асцендент
  const ascTropical = calcTropicalAscendant(jd, lat, lon);

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
    ascendant: asc, // уже сидерический!
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
      ascendant: ascTropical, // тропический асцендент
    },
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
      ascendant: degToZodiacString(asc),
    }
  };
}