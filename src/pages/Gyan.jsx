import React, { useState, useRef } from "react";

// ---- Геокодирование и часовой пояс ----

async function fetchCoordinates(city) {
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

async function fetchTimezone(lat, lon, date) {
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

const ASTRO_API_URL = "https://astroapi.dev/api/vedic/v0/kundali/";
const ASTRO_API_TOKEN = "455ff2c4ab095b7552215dfcad7a3569c3026741";

function NatalCardForm({ onSave, onCancel }) {
  const [name, setName] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [place, setPlace] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [timezone, setTimezone] = useState("");
  const [tzOffset, setTzOffset] = useState("");
  const [loading, setLoading] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);
  const [natalData, setNatalData] = useState(null);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const latInput = useRef();
  const lonInput = useRef();

  async function autoFillGeo() {
    setGeoError("");
    if (!place || !date) {
      setGeoError("Введите город и дату");
      return;
    }
    setGeoLoading(true);
    try {
      const coord = await fetchCoordinates(place);
      if (!coord) throw new Error("Город не найден");
      setLatitude(coord.latitude);
      setLongitude(coord.longitude);
      setPlace(coord.displayName);

      const tz = await fetchTimezone(coord.latitude, coord.longitude, date);
      if (!tz) throw new Error("Не удалось определить временную зону");
      setTimezone(tz.timezoneId);
      setTzOffset(tz.dstOffset);
    } catch (e) {
      setGeoError("Ошибка: " + e.message);
      setLatitude("");
      setLongitude("");
      setTimezone("");
      setTzOffset("");
      console.error("Geo error details:", e);
    }
    setGeoLoading(false);
  }

  async function handleCalc(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setNatalData(null);

    if (!date || !time || !latitude || !longitude || !timezone) {
      setError("Пожалуйста, заполните дату, время, координаты и временную зону.");
      setLoading(false);
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);

    try {
      const res = await fetch(ASTRO_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${ASTRO_API_TOKEN}`,
        },
        body: JSON.stringify({
          year,
          month,
          day,
          hour,
          minute,
          second: 0,
          timezone,
          dst: false,
          name,
          lat: parseFloat(latitude),
          lon: parseFloat(longitude),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Ошибка ответа от AstroAPI");
      }
      const data = await res.json();
      if (!data.planets || !data.houses || !data.charts) throw new Error("Данные не получены");
      setNatalData(data);
    } catch (err) {
      setError("Ошибка: " + (err.message || err));
    }
    setLoading(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!natalData) {
      setError("Сначала рассчитайте данные");
      return;
    }
    onSave({
      name: name || `${date} ${time}`,
      date,
      time,
      place,
      latitude,
      longitude,
      timezone,
      tzOffset,
      ...natalData,
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: "#f9f9fb", padding: 16, borderRadius: 10 }}>
      <h3 style={{ marginTop: 0 }}>Создать натальную карту</h3>
      <input placeholder="Имя" value={name} onChange={e => setName(e.target.value)} required />
      <input type="date" value={date} onChange={e => setDate(e.target.value)} required />
      <input type="time" value={time} onChange={e => setTime(e.target.value)} required />
      <input placeholder="Город" value={place} onChange={e => setPlace(e.target.value)} required />
      <button type="button" onClick={autoFillGeo} disabled={geoLoading}>{geoLoading ? "Поиск..." : "Авто"}</button>
      <input type="number" placeholder="Широта" value={latitude} onChange={e => setLatitude(e.target.value)} required />
      <input type="number" placeholder="Долгота" value={longitude} onChange={e => setLongitude(e.target.value)} required />
      <input value={timezone} readOnly placeholder="Временная зона" />
      <button type="button" onClick={handleCalc} disabled={loading}>{loading ? "Рассчитываем..." : "Рассчитать"}</button>
      <button type="submit" disabled={!natalData}>Сохранить</button>
      <button type="button" onClick={onCancel}>Отмена</button>
      {error && <div style={{ color: "red" }}>{error}</div>}
      {natalData?.planets && (
        <div style={{ background: "#eef", padding: 10, borderRadius: 6, marginTop: 10 }}>
          <h4>Планеты:</h4>
          <ul>
            {Object.entries(natalData.planets).map(([planet, p]) => (
              <li key={planet}>{planet}: {p.position}, Накшатра: {p.nakshatra?.join(".")}</li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

export default function GyanPage() {
  return (
    <div>
      <NatalCardForm onSave={console.log} onCancel={() => {}} />
    </div>
  );
}
