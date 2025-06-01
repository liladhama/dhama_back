import { julian, vsop87, solar, moonposition, node, sidereal } from "astronomia";
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

// Геоцентрическая долгота планеты (новый способ)
function planetGeoLongitude(planetData, earthData, jd) {
  const planet = new vsop87.VSOP87B(planetData);
  const earth = new vsop87.VSOP87B(earthData);
  const planetPos = planet.position(jd);
  const earthPos = earth.position(jd);

  const planetCart = sph2cart(planetPos.lon, planetPos.lat, planetPos.range);
  const earthCart = sph2cart(earthPos.lon, earthPos.lat, earthPos.range);

  const geoCart = [
    planetCart[0] - earthCart[0],
    planetCart[1] - earthCart[1],
    planetCart[2] - earthCart[2]
  ];
  const geo = cart2sph(...geoCart);

  return ((geo.lon * 180) / Math.PI + 360) % 360;
}

// Солнце (VSOP87B, всегда Земля)
function sunLongitude(earthData, jd) {
  // Солнце — это геоцентрическая долгота Земли + 180°
  const earth = new vsop87.VSOP87B(earthData);
  const epos = earth.position(jd);
  let sunLon = ((epos.lon * 180) / Math.PI + 180) % 360;
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

// Асцендент
function calcAscendant({ jd, lat, lon, tzOffset }) {
  const gst = sidereal.apparent(jd);
  const lst = ((gst * 180) / Math.PI + lon + 360) % 360;
  const latRad = (lat * Math.PI) / 180;
  const e = 23.439291111;
  const eRad = (e * Math.PI) / 180;
  const lstRad = (lst * Math.PI) / 180;
  const ascRad = Math.atan2(
    -Math.cos(lstRad),
    Math.sin(eRad) * Math.tan(latRad) + Math.cos(eRad) * Math.sin(lstRad)
  );
  let ascDeg = (ascRad * 180) / Math.PI;
  ascDeg = (ascDeg + 360) % 360;
  return ascDeg;
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

  const asc = calcAscendant({ jd, lat, lon, tzOffset });

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