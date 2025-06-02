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

// ---- Новый fetch: получить данные планет с FastAPI ----

async function fetchPlanetsFromServer({ date, time, lat, lon, tzOffset }) {
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

// ---- Компоненты ----

const PLANET_LABELS = {
  sun: "Солнце",
  moon: "Луна",
  mercury: "Меркурий",
  venus: "Венера",
  mars: "Марс",
  jupiter: "Юпитер",
  saturn: "Сатурн",
  rahu: "Раху (Северный узел)",
  ketu: "Кету (Южный узел)",
  ascendant: "Асцендент"
};

function getSign(deg) {
  const signs = [
    "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
    "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
  ];
  return signs[Math.floor(deg / 30) % 12];
}

function NatalCardForm({ onSave, onCancel, style, initiallyOpen }) {
  const [expanded, setExpanded] = useState(initiallyOpen ?? true);
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
  const [ayanamsha, setAyanamsha] = useState(null);
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
    setAyanamsha(null);

    if (!date || !time) {
      setError("Пожалуйста, заполните дату и время.");
      setLoading(false);
      return;
    }

    try {
      const planetsData = await fetchPlanetsFromServer({
        date,
        time,
        lat: latitude ? Number(latitude) : 55.75,
        lon: longitude ? Number(longitude) : 37.6167,
        tzOffset: tzOffset !== "" ? Number(tzOffset) : 3,
      });

      const planetsObj = {};
      for (const p of ["sun", "moon", "mercury", "venus", "mars", "jupiter", "saturn", "rahu", "ketu", "ascendant"]) {
        planetsObj[p] = {
          sign: getSign(planetsData[p]),
          deg_in_sign: planetsData[p] % 30,
          deg_in_sign_str: `${Math.floor(planetsData[p] % 30)}°${Math.round(((planetsData[p] % 30) % 1) * 60)}'`,
        };
      }
      setPlanets(planetsObj);
      setAyanamsha(null);
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
      ayanamsha,
    });
    setExpanded(false);
  };

  return (
    <div style={{ ...style, transition: "box-shadow 0.2s", boxShadow: expanded ? "0 4px 32px #0002" : "none" }}>
      <div style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            marginRight: 6,
            cursor: "pointer",
            color: "#7b3ff2",
            fontWeight: 700,
            padding: 0,
            lineHeight: "1",
          }}
          aria-label={expanded ? "Свернуть" : "Развернуть"}
        >
          {expanded ? "▼" : "▶"}
        </button>
        <span style={{ fontSize: 18, fontWeight: 700, color: "#7b3ff2" }}>Форма расчета натальной карты</span>
      </div>
      {expanded && (
        <form onSubmit={handleSubmit} style={{ marginTop: 12, background: "#f9f9fb", padding: 16, borderRadius: 10 }}>
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
            <button type="button" onClick={handleCalc} disabled={loading || !date || !time}>
              {loading ? "Рассчитываем..." : "Рассчитать планеты"}
            </button>
            <button type="submit" style={{ marginLeft: 10 }} disabled={!planets}>
              Сохранить
            </button>
            <button type="button" onClick={onCancel} style={{ marginLeft: 10 }}>Отмена</button>
          </div>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          {ayanamsha !== null && (
            <div style={{ marginTop: 10, color: "#555" }}>
              <b>Аянамша Лахири:</b> {ayanamsha.toFixed(6)}°
            </div>
          )}
          {planets && (
            <div style={{ marginTop: 16, fontSize: 14, background: "#eef", padding: 10, borderRadius: 8 }}>
              <b>Планеты (сидерический зодиак):</b>
              <ul>
                {Object.entries(planets).map(([planet, pos]) => (
                  <li key={planet}>
                    {PLANET_LABELS[planet] || planet}: {pos.sign + " " + pos.deg_in_sign_str}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </form>
      )}
    </div>
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
      {card.ayanamsha !== undefined &&
        <div>Аянамша Лахири: {card.ayanamsha?.toFixed(6)}°</div>
      }
      <div style={{ marginTop: 8 }}>
        <b>Планеты:</b>
        {card.planets ? (
          <ul>
            {Object.entries(card.planets).map(([planet, pos]) => (
              <li key={planet}>
                {PLANET_LABELS[planet] || planet}: {pos.sign + " " + pos.deg_in_sign_str}
              </li>
            ))}
          </ul>
        ) : <span>Нет данных о планетах</span>}
      </div>
    </div>
  );
}

function SavedCardsPanel({
  cards, onSelectCard, selectedCardId, onClose,
}) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%)",
        height: "min(380px, 90vh)",
        width: "min(350px, 98vw)",
        background: "rgba(250,245,255,0.97)",
        boxShadow: "0 0 32px #7b3ff266",
        zIndex: 2050,
        padding: 18,
        overflow: "hidden",
        borderRadius: 24,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(10px)"
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: 6 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            fontSize: 22,
            marginRight: 6,
            cursor: "pointer",
            color: "#7b3ff2",
            fontWeight: 700,
            padding: 0,
            lineHeight: "1",
          }}
          aria-label={expanded ? "Свернуть" : "Развернуть"}
        >
          {expanded ? "▼" : "▶"}
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#7b3ff2" }}>Сохранённые карты</span>
        <button onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            fontSize: 22,
            color: "#7b3ff2",
            cursor: "pointer"
          }}
          aria-label="Закрыть"
        >×</button>
      </div>
      {expanded && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {cards.length === 0 ? (
            <p style={{ color: "#777" }}>Нет сохранённых карт</p>
          ) : (
            <div
              style={{
                overflowX: "auto",
                flexDirection: "row",
                display: "flex",
                gap: 12,
                padding: "8px 0",
                minHeight: 64,
                alignItems: "flex-start",
                // можно добавить swipe с помощью react-swipeable, но тут просто скролл
              }}
            >
              {cards.map((card, idx) => (
                <div
                  key={card.id}
                  style={{
                    minWidth: 120,
                    maxWidth: 170,
                    boxShadow: selectedCardId === card.id
                      ? "0 2px 12px #7b3ff288"
                      : "0 1px 3px #aaa2",
                    borderRadius: 10,
                    background: selectedCardId === card.id ? "#e7dbff" : "#f3f3fa",
                    padding: "8px 10px",
                    marginBottom: 7,
                    cursor: "pointer",
                    fontWeight: selectedCardId === card.id ? "bold" : "normal",
                    border: selectedCardId === card.id ? "2px solid #7b3ff2" : "1px solid #d1c2e7"
                  }}
                  onClick={() => onSelectCard(card.id)}
                >
                  <div style={{ fontSize: 14 }}>
                    <b>{card.name}</b>
                  </div>
                  <div style={{ fontSize: 12, color: "#555" }}>
                    {card.date} {card.time}
                  </div>
                  <div style={{ fontSize: 12, color: "#999" }}>
                    {card.place || "—"}
                  </div>
                </div>
              ))}
            </div>
          )}
          <div style={{ overflowY: "auto", flex: 1, marginTop: 4 }}>
            {selectedCardId &&
              <NatalCardDetails card={cards.find(c => c.id === selectedCardId)} />
            }
          </div>
        </div>
      )}
    </div>
  );
}

function SideMenuHandle({ onClick, visible }) {
  if (!visible) return null;
  return (
    <div
      onClick={onClick}
      style={{
        position: "fixed",
        top: "50%",
        left: 0,
        transform: "translateY(-50%)",
        zIndex: 1300,
        cursor: "pointer",
        width: 24,
        height: 80,
        background: "rgba(123,63,242,0.5)",
        borderTopRightRadius: 16,
        borderBottomRightRadius: 16,
        boxShadow: "2px 0 8px #0002",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 16,
          height: 16,
          background: "#fff",
          border: "2px solid #7b3ff2",
          borderRadius: "50%",
          marginLeft: 3,
          boxShadow: "0 1px 4px #0001",
        }}
      />
    </div>
  );
}

// --- Секции (для левого меню) ---
const SECTIONS = [
  { id: "natal", label: "Мои карты" },
  { id: "interpret", label: "Трактовки" },
  { id: "forecast", label: "Прогнозы" },
];

function InterpretationsSection() {
  return (
    <div style={{ marginTop: 38 }}>
      <h2 style={{ fontSize: 26, color: "#7b3ff2" }}>Трактовки положений планет</h2>
      <p style={{ color: "#aaa" }}>Здесь будут трактовки по выбранной карте</p>
    </div>
  );
}

function ForecastsSection() {
  return (
    <div style={{ marginTop: 38 }}>
      <h2 style={{ fontSize: 26, color: "#7b3ff2" }}>Прогнозы</h2>
      <p>Общие прогнозы доступны бесплатно.</p>
      <button style={{
        padding: "12px 20px",
        marginTop: 8,
        background: "#7b3ff2",
        color: "#fff",
        fontWeight: 600,
        border: "none",
        borderRadius: 9,
      }}>Оформить подписку на индивидуальные прогнозы (Toncoin)</button>
    </div>
  );
}

export default function GyanPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("natal");
  const [natalCards, setNatalCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);
  const [showFormPanel, setShowFormPanel] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  const NATAL_LIMIT = 5;

  const handleAddCard = (card) => {
    if (natalCards.length < NATAL_LIMIT) {
      const id = Date.now().toString();
      setNatalCards([
        ...natalCards,
        { ...card, id }
      ]);
      setSelectedCardId(id);
      setShowSavedPanel(true);
    }
  };

  const handleSelectCard = (id) => setSelectedCardId(id);

  const sectionBg = "#f3e6d7";

  return (
    <div style={{
      minHeight: "100vh",
      background: sectionBg,
      transition: "background 0.3s",
      position: "relative",
      paddingBottom: 80,
      margin: 0, // чтобы не было отступа
      boxSizing: "border-box"
    }}>
      {/* --- "Ручка" для открытия меню --- */}
      <SideMenuHandle onClick={() => setMenuOpen(true)} visible={!menuOpen} />

      {/* --- Левое всплывающее меню --- */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "40vw",
          maxWidth: 320,
          height: "100vh",
          background: "rgba(255,255,255,0.94)",
          boxShadow: menuOpen ? "2px 0 12px #0003" : "none",
          zIndex: 1200,
          transition: "transform 0.3s",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          padding: 24,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(4px)",
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
              padding: "14px 0",
              textAlign: "left",
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontSize: 19,
              color: "#7b3ff2",
              borderRadius: 7,
              marginBottom: 2,
              transition: "background 0.15s"
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* --- Кнопки-команды по центру страницы --- */}
      {selectedSection === "natal" && (
        <div style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          marginTop: 80,
          gap: 32,
        }}>
          <button
            onClick={() => setShowFormPanel(p => !p)}
            style={{
              minWidth: 240,
              padding: "18px 30px",
              fontSize: 22,
              fontWeight: 700,
              color: "#fff",
              background: "linear-gradient(90deg, #7b3ff2 60%, #613fc9 100%)",
              border: "none",
              borderRadius: 18,
              boxShadow: "0 4px 18px #7b3ff233",
              cursor: "pointer",
              marginBottom: 10,
              transition: "background 0.2s",
            }}
          >
            Создать новую карту
          </button>
          <button
            onClick={() => setShowSavedPanel(true)}
            style={{
              minWidth: 240,
              padding: "18px 30px",
              fontSize: 22,
              fontWeight: 700,
              color: "#7b3ff2",
              background: "#fff",
              border: "2px solid #7b3ff2",
              borderRadius: 18,
              boxShadow: "0 2px 10px #7b3ff211",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
            }}
          >
            Открыть сохранённые карты
          </button>
          {/* --- Форма создания карты прямо ВНУТРИ страницы --- */}
          {showFormPanel && (
            <div style={{
              marginTop: 28,
              width: "min(500px, 98vw)",
              background: "rgba(255,255,255,0.98)",
              borderRadius: 22,
              boxShadow: "0 0 24px #7b3ff266",
              padding: 22,
              position: "relative",
              zIndex: 5,
            }}>
              <NatalCardForm
                onSave={handleAddCard}
                onCancel={() => setShowFormPanel(false)}
                initiallyOpen={true}
              />
            </div>
          )}
        </div>
      )}

      {/* --- Панель сохранённых карт --- */}
      {showSavedPanel && (
        <SavedCardsPanel
          cards={natalCards}
          onSelectCard={handleSelectCard}
          selectedCardId={selectedCardId}
          onClose={() => setShowSavedPanel(false)}
        />
      )}

      {/* --- Остальные секции --- */}
      {selectedSection === "interpret" && <InterpretationsSection />}
      {selectedSection === "forecast" && <ForecastsSection />}
    </div>
  );
}