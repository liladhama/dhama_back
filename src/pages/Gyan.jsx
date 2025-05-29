import React, { useState, useRef } from "react";

// ---- Геокодирование и часовой пояс ----

// Геокодирование города через Geoapify (CORS-friendly)
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

// Получение часового пояса и offset через GeoNames
async function fetchTimezone(lat, lon, date) {
  const username = "pastoohkorov";
  const url = `https://secure.geonames.org/timezoneJSON?lat=${lat}&lng=${lon}&date=${date}&username=${username}`;
  const res = await fetch(url);
  const data = await res.json();
  if (data && data.timezoneId) {
    return data;
  }
  return null;
}

// ---- Компоненты ----

const sectionTitleStyle = (menuOpen) => ({
  marginTop: 0,
  marginLeft: !menuOpen ? 80 : 0,
  transition: "margin-left 0.3s",
  fontSize: 32,
  fontWeight: 700,
  lineHeight: 1.2,
});

const NATAL_API_URL = "https://dhama-natal-api.vercel.app/api/natal"; // <<--- Внешний API

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
  const [planets, setPlanets] = useState(null);
  const [error, setError] = useState("");
  const [geoError, setGeoError] = useState("");
  const latInput = useRef();
  const lonInput = useRef();

  function handleLatChange(e) {
    setLatitude(e.target.value);
  }
  function handleLonChange(e) {
    setLongitude(e.target.value);
  }

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

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setPlanets(null);
    if (!date || !time || !latitude || !longitude) {
      setError("Пожалуйста, заполните дату, время и координаты.");
      setLoading(false);
      return;
    }
    const [year, month, day] = date.split("-").map(Number);
    const [hour, minute] = time.split(":").map(Number);
    try {
      const body = {
        year,
        month,
        day,
        hour,
        minute,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        tzOffset: tzOffset !== "" ? Number(tzOffset) : undefined,
      };
      const res = await fetch(NATAL_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error || "Ошибка ответа астрологического API");
      }
      const data = await res.json();
      if (!data.planets) throw new Error("Планеты не найдены в ответе");
      setPlanets(data.planets);
    } catch (err) {
      setError("Ошибка расчёта планет: " + (err.message || err));
    }
    setLoading(false);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!planets) {
      setError("Сначала рассчитайте положение планет");
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
      planets,
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 24, background: "#f9f9fb", padding: 16, borderRadius: 10 }}>
      <h3 style={{ marginLeft: 0, marginTop: 0 }}>Создать натальную карту</h3>
      <div>
        <label>
          Имя/метка:
          <input value={name} onChange={e => setName(e.target.value)} required style={{ marginLeft: 8 }} />
        </label>
      </div>
      <div>
        <label>
          Дата рождения:
          <input type="date" value={date} onChange={e => setDate(e.target.value)} required style={{ marginLeft: 8 }} />
        </label>
      </div>
      <div>
        <label>
          Время рождения:
          <input type="time" value={time} onChange={e => setTime(e.target.value)} required style={{ marginLeft: 8 }} />
        </label>
      </div>
      <div>
        <label>
          Город/место рождения:
          <input
            value={place}
            onChange={e => setPlace(e.target.value)}
            required
            style={{ marginLeft: 8, width: 220 }}
            placeholder="Москва"
          />
        </label>
        <button
          type="button"
          onClick={autoFillGeo}
          disabled={!place || !date || geoLoading}
          style={{ marginLeft: 8 }}
          title="Определить координаты и часовой пояс"
        >
          {geoLoading ? "Поиск..." : "Авто"}
        </button>
        {geoError && (
          <span style={{ color: "red", marginLeft: 10 }}>{geoError}</span>
        )}
      </div>
      <div>
        <label>
          Широта:
          <input
            ref={latInput}
            type="number"
            step="any"
            value={latitude}
            onChange={handleLatChange}
            placeholder="55.75"
            required
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>
        <label style={{ marginLeft: 16 }}>
          Долгота:
          <input
            ref={lonInput}
            type="number"
            step="any"
            value={longitude}
            onChange={handleLonChange}
            placeholder="37.6166"
            required
            style={{ marginLeft: 8, width: 100 }}
          />
        </label>
      </div>
      <div>
        <label>
          Временная зона:
          <input value={timezone} readOnly style={{ marginLeft: 8, width: 180, background: "#eee" }} />
        </label>
        <label style={{ marginLeft: 16 }}>
          UTC-offset:
          <input value={tzOffset} readOnly style={{ marginLeft: 8, width: 60, background: "#eee" }} />
        </label>
      </div>
      <div style={{ marginTop: 12 }}>
        <button type="button" onClick={handleCalc} disabled={loading || !date || !time || !latitude || !longitude}>
          {loading ? "Рассчитываем..." : "Рассчитать планеты"}
        </button>
        <button type="submit" style={{ marginLeft: 10 }} disabled={!planets}>
          Сохранить
        </button>
        <button type="button" onClick={onCancel} style={{ marginLeft: 10 }}>Отмена</button>
      </div>
      {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
      {planets && (
        <div style={{ marginTop: 16, fontSize: 14, background: "#eef", padding: 10, borderRadius: 8 }}>
          <b>Планеты:</b>
          <ul>
            {Object.entries(planets).map(([planet, pos]) => (
              <li key={planet}>
                {planet}: {pos.sign} {pos.deg}°
              </li>
            ))}
          </ul>
        </div>
      )}
    </form>
  );
}

function NatalCardDetails({ card }) {
  if (!card) return null;
  return (
    <div style={{ marginTop: 18, background: "#fffbe6", borderRadius: 10, padding: 16 }}>
      <b>Подробности карты:</b>
      <div>Имя: <b>{card.name}</b></div>
      <div>Дата: {card.date} {card.time}</div>
      <div>Место: {card.place || "—"}</div>
      <div>Широта: {card.latitude}, Долгота: {card.longitude}</div>
      <div>Временная зона: {card.timezone || "—"}, UTC-offset: {card.tzOffset !== undefined ? card.tzOffset : "—"}</div>
      <div style={{ marginTop: 8 }}>
        <b>Планеты:</b>
        {card.planets ? (
          <ul>
            {Object.entries(card.planets).map(([planet, pos]) => (
              <li key={planet}>
                {planet}: {pos.sign} {pos.deg}°
              </li>
            ))}
          </ul>
        ) : <span>Нет данных о планетах</span>}
      </div>
    </div>
  );
}

function NatalCardsSection({
  cards, onSelectCard, selectedCardId, limit,
  menuOpen, onAddCard, showForm, setShowForm
}) {
  return (
    <div>
      <h2 style={sectionTitleStyle(menuOpen)}>Мои натальные карты</h2>
      {showForm && (
        <NatalCardForm
          onSave={card => {
            onAddCard(card);
            setShowForm(false);
          }}
          onCancel={() => setShowForm(false)}
        />
      )}
      <ul style={{ marginTop: 0 }}>
        {cards.map((card, idx) => (
          <li
            key={card.id}
            style={{
              fontWeight: selectedCardId === card.id ? "bold" : "normal",
              cursor: "pointer",
              marginBottom: 6,
              background: "#f3f3fa",
              borderRadius: 6,
              padding: "4px 10px"
            }}
            onClick={() => onSelectCard(card.id)}
          >
            <b>{card.name}</b> — {card.date} {card.time} ({card.place || "—"})
          </li>
        ))}
      </ul>
      {!showForm && cards.length < limit && (
        <button onClick={() => setShowForm(true)}>Создать новую карту</button>
      )}
      {cards.length >= limit && (
        <p>Достигнут лимит бесплатных карт ({limit})</p>
      )}
      {selectedCardId && (
        <NatalCardDetails card={cards.find(c => c.id === selectedCardId)} />
      )}
    </div>
  );
}

function InterpretationsSection({ depth, onBuyLevel, menuOpen }) {
  return (
    <div>
      <h2 style={sectionTitleStyle(menuOpen)}>Трактовки положений планет</h2>
      <p>Глубина: {depth}</p>
      <button onClick={() => onBuyLevel(depth + 1)}>
        Открыть следующий уровень за Lakshmicoin
      </button>
      <p style={{ color: "#aaa" }}>Здесь будут трактовки по выбранной карте</p>
    </div>
  );
}

function ForecastsSection({ menuOpen }) {
  return (
    <div>
      <h2 style={sectionTitleStyle(menuOpen)}>Прогнозы</h2>
      <p>Общие прогнозы доступны бесплатно.</p>
      <button>Оформить подписку на индивидуальные прогнозы (Toncoin)</button>
    </div>
  );
}

const SECTIONS = [
  { id: "natal", label: "Мои натальные карты" },
  { id: "interpret", label: "Трактовки положений планет" },
  { id: "forecast", label: "Прогнозы" },
];

export default function GyanPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("natal");
  const [natalCards, setNatalCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [interpretDepth, setInterpretDepth] = useState(1);
  const [showForm, setShowForm] = useState(false);

  const NATAL_LIMIT = 5;

  const handleAddCard = (card) => {
    if (natalCards.length < NATAL_LIMIT) {
      const id = Date.now().toString();
      setNatalCards([
        ...natalCards,
        { ...card, id }
      ]);
      setSelectedCardId(id);
    }
  };

  const handleSelectCard = (id) => setSelectedCardId(id);

  const sectionBg = {
    natal: "#f3e6d7",
    interpret: "#e6f7fa",
    forecast: "#e6e6fa",
  }[selectedSection] || "#fff";

  const TOP_BAR_HEIGHT = 64;

  return (
    <div style={{ height: "100vh", background: sectionBg, transition: "background 0.3s", position: "relative" }}>
      {!menuOpen && (
        <button
          onClick={() => setMenuOpen(true)}
          aria-label="Открыть меню"
          style={{
            position: "fixed",
            top: TOP_BAR_HEIGHT + 12,
            left: 20,
            zIndex: 1201,
            width: 48,
            height: 48,
            borderRadius: "50%",
            background: "#7b3ff2",
            color: "#fff",
            border: "none",
            boxShadow: "0 2px 8px #0002",
            fontSize: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "background 0.2s",
          }}
        >
          ☰
        </button>
      )}
      <div
        style={{
          position: "fixed",
          left: menuOpen ? 0 : "-40vw",
          top: 0,
          width: "40vw",
          maxWidth: 320,
          height: "100vh",
          background: "#fff",
          boxShadow: menuOpen ? "2px 0 8px #0002" : "none",
          zIndex: 1200,
          transition: "left 0.3s",
          padding: 24,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <button
          onClick={() => setMenuOpen(false)}
          style={{
            alignSelf: "flex-end",
            marginBottom: 16,
            background: "none",
            border: "none",
            fontSize: 28,
            cursor: "pointer",
          }}
          aria-label="Закрыть меню"
        >
          ×
        </button>
        {SECTIONS.map((sec) => (
          <button
            key={sec.id}
            onClick={() => {
              setSelectedSection(sec.id);
              setMenuOpen(false);
            }}
            style={{
              background: selectedSection === sec.id ? "#e7dbff" : "transparent",
              fontWeight: selectedSection === sec.id ? 600 : 400,
              padding: "12px 0",
              textAlign: "left",
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>
      <div
        style={{
          marginLeft: menuOpen ? "40vw" : 0,
          transition: "margin-left 0.3s",
          padding: 32,
        }}
      >
        {selectedSection === "natal" && (
          <NatalCardsSection
            cards={natalCards}
            onSelectCard={handleSelectCard}
            selectedCardId={selectedCardId}
            limit={NATAL_LIMIT}
            menuOpen={menuOpen}
            onAddCard={handleAddCard}
            showForm={showForm}
            setShowForm={setShowForm}
          />
        )}
        {selectedSection === "interpret" && (
          <InterpretationsSection
            depth={interpretDepth}
            onBuyLevel={(newDepth) => setInterpretDepth(newDepth)}
            menuOpen={menuOpen}
          />
        )}
        {selectedSection === "forecast" && (
          <ForecastsSection menuOpen={menuOpen} />
        )}
      </div>
    </div>
  );
}