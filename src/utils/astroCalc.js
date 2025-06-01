import { julian, moonposition } from "astronomia";
import vsop87Bearth from "../astrodata/vsop87Bearth.js";
import vsop87Bmercury from "../astrodata/vsop87Bmercury.js";
import vsop87Bvenus from "../astrodata/vsop87Bvenus.js";
import vsop87Bmars from "../astrodata/vsop87Bmars.js";
import vsop87Bjupiter from "../astrodata/vsop87Bjupiter.js";
import vsop87Bsaturn from "../astrodata/vsop87Bsaturn.js";

// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---

function normalize(deg) {
  return ((deg % 360) + 360) % 360;
}

// Эклиптический наклон (градусы)
function meanObliquity(jd) {
  const T = (jd - 2451545.0) / 36525;
  return 23.43929111
    - 0.0130041667 * T
    - 0.0000001639 * T * T
    + 0.0000005036 * T * T * T;
}

// Перевод времени в JD
function toJD({ year, month, day, hour, minute, second = 0, tzOffset = 0 }) {
  return julian.CalendarGregorianToJD(year, month, day)
    + ((hour - tzOffset) + minute / 60 + second / 3600) / 24;
}

// Местное сидерическое время (LST) в градусах
function localSiderealTime(jd, lon) {
  const T = (jd - 2451545.0) / 36525;
  let GMST = 280.46061837
    + 360.98564736629 * (jd - 2451545.0)
    + 0.000387933 * T * T
    - T * T * T / 38710000;
  let LST = GMST + lon;
  return normalize(LST);
}

// Лахири айанамша
function lahiriAyanamsha(jd) {
  const baseAyanamsha = 23.8572986;
  const baseJD = 2451545.0;
  const rate = 50.290966 / 3600;
  const years = (jd - baseJD) / 365.242198781;
  return baseAyanamsha + years * rate;
}

// --- КООРДИНАТЫ ПЛАНЕТ ---

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
  return normalize(geo.lon * 180 / Math.PI);
}

// Солнце (геоцентрически!)
// Солнце — это положение Земли + 180°
function sunLongitude(earthData, jd) {
  const earthPos = vsop87Heliocentric(earthData, jd);
  let sunLon = normalize((earthPos.lon * 180) / Math.PI + 180);
  return sunLon;
}

// Луна
function moonLongitude(jd) {
  const lon = moonposition.position(jd).lon;
  return normalize((lon * 180) / Math.PI);
}

// Узлы (Раху и Кету)
function trueRahuKetu(jd) {
  const T = (jd - 2451545.0) / 36525;
  let omega = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
  omega = normalize(omega);
  const rahu = omega;
  const ketu = normalize(omega + 180);
  return { rahu, ketu };
}

// --- АССЦЕНДЕНТ ---
// Астрономический расчет асцендента Meeus + возможность подкорректировать результат

const ASC_CORRECTION_DEG = 0; // ← сюда можно подставить опытный сдвиг, например +2.5

function calcAscendantAstronomia(jd, lat, lon) {
  // Meeus AA, стр. 98
  const eps = meanObliquity(jd) * Math.PI / 180;
  const LST = localSiderealTime(jd, lon) * Math.PI / 180;
  const latr = lat * Math.PI / 180;
  const ascRad = Math.atan2(
    -Math.cos(LST),
    Math.sin(LST) * Math.cos(eps) - Math.tan(latr) * Math.sin(eps)
  );
  let ascDeg = normalize(ascRad * 180 / Math.PI);
  return ascDeg;
}

function calcAscendantSiderealAstronomia(jd, lat, lon) {
  const ascTrop = calcAscendantAstronomia(jd, lat, lon);
  const ayanamsha = lahiriAyanamsha(jd);
  // Вот здесь можно вводить любые поправки, если надо подогнать под vedic-horo.ru
  let sidAsc = normalize(ascTrop - ayanamsha + ASC_CORRECTION_DEG);
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

// --- ГЛАВНАЯ ФУНКЦИЯ ---

export function getSiderealPositions({
  year, month, day, hour, minute,
  lat = 55.75, lon = 37.6167, tzOffset = 3
}) {
  const jd = toJD({ year, month, day, hour, minute, tzOffset });
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

  // Новый асцендент с astronomia + коррекция
  const asc = calcAscendantSiderealAstronomia(jd, lat, lon);
  const ascTropical = calcAscendantAstronomia(jd, lat, lon);

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
    ascendant: asc, // сидерический астрономический асцендент с коррекцией!
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