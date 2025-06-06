export const SIGNS = [
  "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
  "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
];
export const SIGN_SHORT = [
  "Ов", "Те", "Бл", "Ра", "Ле", "Де",
  "Ве", "Ск", "Ст", "Ко", "Во", "Ры"
];
export const PLANET_LABELS_DIAMOND = {
  sun: "Су",
  moon: "Лу",
  mercury: "Ме",
  venus: "Ве",
  mars: "Ма",
  jupiter: "Юп",
  saturn: "Са",
  rahu: "Ра",
  ketu: "Ке",
  ascendant: "Ас"
};
export const NAKSHATRAS = [
  "Ашвини","Бхарани","Криттика","Рохини","Мригашира","Ардра","Пунарвасу",
  "Пушья","Ашлеша","Мага","Пурва Пхалгуни","Уттара Пхалгуни","Хаста",
  "Читра","Свати","Вишакха","Анурадха","Джйештха","Мула","Пурва Ашадха",
  "Уттара Ашадха","Шравана","Дхаништха","Шатабхиша","Пурва Бхадрапада",
  "Уттара Бхадрапада","Ревати"
];

// Защита от некорректных значений totalDeg — не будет pada = -3!
// Для rahu и ketu totalDeg = longitude (реальная долгота в градусах)
// Для остальных totalDeg = signIdx * 30 + deg_in_sign
export function calcNakshatraPada(totalDeg) {
  const nakLen = 13 + 1 / 3;
  const padaLen = nakLen / 4;
  if (typeof totalDeg !== "number" || isNaN(totalDeg) || totalDeg < 0) {
    return { nakshatra: undefined, pada: undefined };
  }
  const nakNum = Math.floor(totalDeg / nakLen);
  if (nakNum < 0 || nakNum >= NAKSHATRAS.length) {
    return { nakshatra: undefined, pada: undefined };
  }
  const pada = Math.floor((totalDeg % nakLen) / padaLen) + 1;
  if (pada < 1 || pada > 4) {
    return { nakshatra: NAKSHATRAS[nakNum], pada: undefined };
  }
  return {
    nakshatra: NAKSHATRAS[nakNum],
    pada
  };
}

// Получить дом для каждой планеты относительно асцендента
export function getPlanetHouseMap(planets, ascSignIndex) {
  const houseMap = Array(12).fill().map(() => []);
  for (const [planet, pos] of Object.entries(planets)) {
    let signIdx = SIGNS.indexOf(pos.sign);
    if (signIdx === -1) continue;
    let houseIdx = (12 + signIdx - ascSignIndex) % 12;
    houseMap[houseIdx].push(planet);
  }
  return houseMap;
}

export async function fetchCoordinates(city) {
  const apiKey = "b89b0e6fc3b949ebba403db8c42c0d09";
  const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(city)}&limit=1&format=json&apiKey=${apiKey}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data.results && data.results.length > 0) {
    return {
      latitude: data.results[0].lat,
      longitude: data.results[0].lon,
      displayName: data.results[0].formatted,
    };
  }
  return null;
}

export async function fetchTimezone(lat, lon, date) {
  const username = "pastoohkorov";
  const url = `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&date=${date}&username=${username}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data.status && data.status.message) {
    throw new Error(`GeoNames: ${data.status.message}`);
  }
  if (data && data.timezoneId) {
    return data;
  }
  return null;
}

export async function fetchPlanetsFromServer({ date, time, lat, lon, tzOffset }) {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  const localMinutes = (hour || 0) * 60 + (minute || 0);
  const utcMinutes = localMinutes - Math.round((tzOffset || 0) * 60);
  const utcDateObj = new Date(Date.UTC(year, month - 1, day, 0, 0));
  utcDateObj.setUTCMinutes(utcMinutes);

  const yyyy = utcDateObj.getUTCFullYear();
  const mm = String(utcDateObj.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(utcDateObj.getUTCDate()).padStart(2, "0");
  const hh = String(utcDateObj.getUTCHours()).padStart(2, "0");
  const min = String(utcDateObj.getUTCMinutes()).padStart(2, "0");
  const apiDate = `${yyyy}-${mm}-${dd}T${hh}:${min}`;

  const params = new URLSearchParams({
    date: apiDate,
    lat: lat,
    lon: lon,
  });
  const url = `https://astrogyan.duckdns.org/api/planets?${params.toString()}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error("Ошибка сервера: " + res.status);
  }
  return await res.json();
}

export function getSign(deg) {
  if (typeof deg !== "number" || isNaN(deg)) return undefined;
  return SIGNS[Math.floor(deg / 30) % 12];
}

export const defaultFormValues = {
  name: "",
  date: "",
  time: "",
  place: "",
  latitude: "",
  longitude: "",
  timezone: "",
  tzOffset: ""
};
export const MAIN_COLOR = "#8B0000";
export const BG_COLOR = "#f9f6f4";
