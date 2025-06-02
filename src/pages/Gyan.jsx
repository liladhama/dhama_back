import React, { useState, useRef } from "react";

// --- Геокодирование и часовой пояс ---
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

const defaultFormValues = {
  name: "",
  date: "",
  time: "",
  place: "",
  latitude: "",
  longitude: "",
  timezone: "",
  tzOffset: ""
};

const MAIN_COLOR = "#8B0000";
const BG_COLOR = "#f9f6f4";

function NatalCardForm({
  expanded, setExpanded,
  values, setValues,
  planets, setPlanets,
  ayanamsha, setAyanamsha,
  loading, setLoading,
  error, setError,
  geoError, setGeoError,
  geoLoading, setGeoLoading,
  onSave
}) {
  const latInput = useRef();
  const lonInput = useRef();

  async function autoFillGeo() {
    setGeoError("");
    if (!values.place || !values.date) {
      setGeoError("Введите город и дату");
      return;
    }
    setGeoLoading(true);
    try {
      const coord = await fetchCoordinates(values.place);
      if (!coord) throw new Error("Город не найден");
      setValues((prev) => ({
        ...prev,
        latitude: coord.latitude,
        longitude: coord.longitude,
        place: coord.displayName,
      }));

      const tz = await fetchTimezone(coord.latitude, coord.longitude, values.date);
      if (!tz) throw new Error("Не удалось определить временную зону");
      setValues((prev) => ({
        ...prev,
        timezone: tz.timezoneId,
        tzOffset: tz.dstOffset,
      }));
    } catch (e) {
      setGeoError("Ошибка: " + e.message);
      setValues((prev) => ({
        ...prev,
        latitude: "",
        longitude: "",
        timezone: "",
        tzOffset: "",
      }));
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

    if (!values.date || !values.time) {
      setError("Пожалуйста, заполните дату и время.");
      setLoading(false);
      return;
    }

    try {
      const planetsData = await fetchPlanetsFromServer({
        date: values.date,
        time: values.time,
        lat: values.latitude ? Number(values.latitude) : 55.75,
        lon: values.longitude ? Number(values.longitude) : 37.6167,
        tzOffset: values.tzOffset !== "" ? Number(values.tzOffset) : 3,
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
      ...values,
      planets,
      ayanamsha,
    });
    setExpanded(false);
  };

  const handleReset = () => {
    setValues(defaultFormValues);
    setPlanets(null);
    setAyanamsha(null);
    setError("");
    setGeoError("");
  };

  return (
    <div style={{
      transition: "box-shadow 0.2s",
      boxShadow: expanded ? "0 2px 16px #0001" : "none",
      background: "#fff",
      borderRadius: 12,
      marginBottom: 8,
      marginTop: 0,
      overflow: "hidden",
      width: "100%",
      maxWidth: 370,
      minWidth: 0
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: "100%",
          background: expanded ? MAIN_COLOR : "#fff",
          color: expanded ? "#fff" : MAIN_COLOR,
          border: expanded ? "none" : `1.5px solid ${MAIN_COLOR}`,
          borderRadius: 12,
          fontSize: 17,
          fontWeight: 700,
          cursor: "pointer",
          padding: "12px 0 10px 0",
          boxShadow: expanded ? "0 2px 8px #8B000033" : "none",
          outline: "none",
          letterSpacing: "0.02em",
          transition: "background 0.2s, color 0.2s",
          marginBottom: expanded ? 0 : 8
        }}
        aria-label={expanded ? "Свернуть" : "Развернуть"}
      >
        Создать карту {expanded ? "▲" : "▼"}
      </button>
      {expanded && (
        <form onSubmit={handleSubmit} style={{
          marginTop: 2,
          background: BG_COLOR,
          padding: "12px 14px 13px 14px",
          borderRadius: 12,
          marginBottom: 0,
          display: "flex",
          flexDirection: "column",
          gap: 7
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontWeight: 500, color: "#444", fontSize: 14 }}>
              Имя/метка
              <input
                value={values.name}
                onChange={e => setValues(v => ({ ...v, name: e.target.value }))}
                required
                style={{
                  marginTop: 3,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e7d6d6",
                  fontSize: 14,
                  outline: "none"
                }}
                placeholder="Моя карта"
              />
            </label>
            <label style={{ fontWeight: 500, color: "#444", fontSize: 14 }}>
              Дата рождения
              <input
                type="date"
                value={values.date}
                onChange={e => setValues(v => ({ ...v, date: e.target.value }))}
                required
                style={{
                  marginTop: 3,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e7d6d6",
                  fontSize: 14,
                  outline: "none"
                }}
              />
            </label>
            <label style={{ fontWeight: 500, color: "#444", fontSize: 14 }}>
              Время рождения
              <input
                type="time"
                value={values.time}
                onChange={e => setValues(v => ({ ...v, time: e.target.value }))}
                required
                style={{
                  marginTop: 3,
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "1px solid #e7d6d6",
                  fontSize: 14,
                  outline: "none"
                }}
              />
            </label>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7 }}>
              <label style={{ flex: 1, fontWeight: 500, color: "#444", fontSize: 14 }}>
                Город/место рождения
                <input
                  value={values.place}
                  onChange={e => setValues(v => ({ ...v, place: e.target.value }))}
                  required
                  style={{
                    marginTop: 3,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e7d6d6",
                    fontSize: 14,
                    outline: "none",
                    width: "100%"
                  }}
                  placeholder="Москва"
                />
              </label>
              <button
                type="button"
                onClick={autoFillGeo}
                disabled={!values.place || !values.date || geoLoading}
                style={{
                  marginBottom: 1,
                  padding: "5px 10px",
                  border: "none",
                  borderRadius: 7,
                  background: MAIN_COLOR,
                  color: "#fff",
                  fontWeight: 600,
                  fontSize: 13,
                  cursor: geoLoading ? "wait" : "pointer",
                  boxShadow: "0 1px 4px #8B000011",
                  minWidth: 44,
                  transition: "background 0.18s"
                }}
                title="Определить координаты и часовой пояс"
              >
                {geoLoading ? "..." : "Авто"}
              </button>
            </div>
            {geoError && (
              <span style={{ color: "red", marginLeft: 2, fontSize: 12 }}>{geoError}</span>
            )}
            <div style={{ display: "flex", gap: 7 }}>
              <label style={{ flex: 1, fontWeight: 500, color: "#444", fontSize: 14 }}>
                Широта
                <input
                  ref={latInput}
                  type="number"
                  step="any"
                  value={values.latitude}
                  onChange={e => setValues(v => ({ ...v, latitude: e.target.value }))}
                  placeholder="55.75"
                  required
                  style={{
                    marginTop: 3,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e7d6d6",
                    fontSize: 14,
                    outline: "none",
                    width: "100%"
                  }}
                />
              </label>
              <label style={{ flex: 1, fontWeight: 500, color: "#444", fontSize: 14 }}>
                Долгота
                <input
                  ref={lonInput}
                  type="number"
                  step="any"
                  value={values.longitude}
                  onChange={e => setValues(v => ({ ...v, longitude: e.target.value }))}
                  placeholder="37.6166"
                  required
                  style={{
                    marginTop: 3,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #e7d6d6",
                    fontSize: 14,
                    outline: "none",
                    width: "100%"
                  }}
                />
              </label>
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              <label style={{ flex: 1, fontWeight: 500, color: "#444", fontSize: 14 }}>
                Временная зона
                <input
                  value={values.timezone}
                  readOnly
                  style={{
                    marginTop: 3,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #eee",
                    background: "#eee",
                    fontSize: 14,
                    color: "#888",
                    outline: "none",
                    width: "100%"
                  }}
                />
              </label>
              <label style={{ flex: 1, fontWeight: 500, color: "#444", fontSize: 14 }}>
                UTC-offset
                <input
                  value={values.tzOffset}
                  readOnly
                  style={{
                    marginTop: 3,
                    padding: "6px 10px",
                    borderRadius: 6,
                    border: "1px solid #eee",
                    background: "#eee",
                    fontSize: 14,
                    color: "#888",
                    outline: "none",
                    width: "100%"
                  }}
                />
              </label>
            </div>
          </div>
          <div style={{
            marginTop: 7,
            display: "flex",
            gap: 7,
            flexWrap: "wrap"
          }}>
            <button
              type="button"
              onClick={handleCalc}
              disabled={loading || !values.date || !values.time}
              style={{
                flex: 1,
                padding: "7px 0",
                border: "none",
                borderRadius: 7,
                background: loading ? "#ccc" : MAIN_COLOR,
                color: "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: loading ? "wait" : "pointer",
                boxShadow: "0 1px 4px #8B000011"
              }}
            >
              {loading ? "Рассчитываем..." : "Рассчитать планеты"}
            </button>
            <button
              type="submit"
              disabled={!planets}
              style={{
                flex: 1,
                padding: "7px 0",
                border: "none",
                borderRadius: 7,
                background: !planets ? "#eee" : "#228B22",
                color: !planets ? "#888" : "#fff",
                fontWeight: 600,
                fontSize: 14,
                cursor: !planets ? "not-allowed" : "pointer",
                boxShadow: "0 1px 4px #8B000011"
              }}
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={() => setExpanded(false)}
              style={{
                flex: 1,
                padding: "7px 0",
                border: "none",
                borderRadius: 7,
                background: "#eee",
                color: "#444",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
                boxShadow: "0 1px 4px #8B000011"
              }}
            >
              Свернуть
            </button>
          </div>
          <button
            type="button"
            onClick={handleReset}
            style={{
              marginTop: 7,
              padding: "7px 0",
              border: "none",
              borderRadius: 7,
              background: "#F7D7DB",
              color: MAIN_COLOR,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
              boxShadow: "0 1px 4px #8B000011",
              width: "100%"
            }}
          >
            Новая карта
          </button>
          {error && <div style={{ color: "red", marginTop: 7, fontSize: 13 }}>{error}</div>}
          {ayanamsha !== null && (
            <div style={{ marginTop: 6, color: "#555", fontSize: 13 }}>
              <b>Аянамша Лахири:</b> {ayanamsha.toFixed(6)}°
            </div>
          )}
        </form>
      )}
    </div>
  );
}

function SavedCardsPanel({
  cards, onSelectCard, selectedCardId, onClose,
  expanded, setExpanded,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 65,
        left: "50%",
        transform: "translateX(-50%)",
        width: "100%",
        maxWidth: 370,
        minWidth: 0,
        background: "rgba(250,245,255,0.97)",
        boxShadow: "0 0 24px #8B000033",
        zIndex: 2050,
        padding: "10px 10px 12px 10px",
        overflow: "hidden",
        borderRadius: 12,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(10px)",
        transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: expanded ? 330 : 38,
        minHeight: 38,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: expanded ? 7 : 0 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            fontSize: 16,
            marginRight: 6,
            cursor: "pointer",
            color: MAIN_COLOR,
            fontWeight: 700,
            padding: 0,
            lineHeight: "1",
          }}
          aria-label={expanded ? "Свернуть" : "Развернуть"}
        >
          {expanded ? "▼" : "▶"}
        </button>
        <span style={{ fontSize: 14, fontWeight: 700, color: MAIN_COLOR }}>Сохранённые карты</span>
        <button onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            fontSize: 16,
            color: MAIN_COLOR,
            cursor: "pointer"
          }}
          aria-label="Закрыть"
        >×</button>
      </div>
      {expanded && (
        <ul style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          width: "100%",
          overflowY: "auto",
          maxHeight: 180
        }}>
          {cards.length === 0 ? (
            <li style={{ color: "#777", margin: 0, marginTop: 6, fontSize: 13 }}>Нет сохранённых карт</li>
          ) : (
            cards.map((card, idx) => (
              <li
                key={card.id}
                style={{
                  margin: 0,
                  marginBottom: 5,
                  borderRadius: 7,
                  background: selectedCardId === card.id ? "#F7D7DB" : "#f3f3fa",
                  padding: "6px 8px",
                  fontWeight: selectedCardId === card.id ? "bold" : "normal",
                  border: selectedCardId === card.id ? `2px solid ${MAIN_COLOR}` : "1px solid #e7d6d6",
                  fontSize: 13,
                  cursor: "pointer",
                  transition: "background 0.12s"
                }}
                onClick={() => onSelectCard(card.id)}
              >
                <div>
                  <b>{card.name}</b>
                </div>
                <div style={{ fontSize: 12, color: "#555" }}>
                  {card.date} {card.time} {card.place ? `(${card.place})` : ""}
                </div>
              </li>
            ))
          )}
        </ul>
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
        width: 20,
        height: 60,
        background: "rgba(139,0,0,0.5)",
        borderTopRightRadius: 12,
        borderBottomRightRadius: 12,
        boxShadow: "2px 0 8px #0002",
        display: "flex",
        alignItems: "center",
        justifyContent: "flex-start",
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          width: 13,
          height: 13,
          background: "#fff",
          border: `2px solid ${MAIN_COLOR}`,
          borderRadius: "50%",
          marginLeft: 3,
          boxShadow: "0 1px 4px #0001",
        }}
      />
    </div>
  );
}

const SECTIONS = [
  { id: "natal", label: "Мои карты" },
  { id: "interpret", label: "Трактовки" },
  { id: "forecast", label: "Прогнозы" },
];

function InterpretationsSection() {
  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 18, color: MAIN_COLOR }}>Трактовки положений планет</h2>
      <p style={{ color: "#aaa", fontSize: 13 }}>Здесь будут трактовки по выбранной карте</p>
    </div>
  );
}

function ForecastsSection() {
  return (
    <div style={{ marginTop: 30 }}>
      <h2 style={{ fontSize: 18, color: MAIN_COLOR }}>Прогнозы</h2>
      <p style={{ fontSize: 13 }}>Общие прогнозы доступны бесплатно.</p>
      <button style={{
        padding: "9px 14px",
        marginTop: 8,
        background: MAIN_COLOR,
        color: "#fff",
        fontWeight: 600,
        border: "none",
        borderRadius: 7,
        fontSize: 14
      }}>Оформить подписку на индивидуальные прогнозы (Toncoin)</button>
    </div>
  );
}

export default function GyanPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState("natal");
  const [natalCards, setNatalCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState(null);

  const [formExpanded, setFormExpanded] = useState(false);
  const [savedPanelExpanded, setSavedPanelExpanded] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  const [formValues, setFormValues] = useState({ ...defaultFormValues });
  const [formPlanets, setFormPlanets] = useState(null);
  const [formAyanamsha, setFormAyanamsha] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [formGeoError, setFormGeoError] = useState("");
  const [formGeoLoading, setFormGeoLoading] = useState(false);

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
      setSavedPanelExpanded(true);
    }
  };

  const handleSelectCard = (id) => setSelectedCardId(id);

  let mainSectionContent = null;
  if (selectedSection === "natal") {
    mainSectionContent = (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 6,
        gap: 10,
        width: "100%",
        position: "relative",
        maxWidth: 370
      }}>
        <div style={{ width: "100%", maxWidth: 370, minWidth: 0, display: "flex", justifyContent: "center", marginBottom: 7 }}>
          <button
            onClick={() => { setShowSavedPanel(v => !v); setSavedPanelExpanded(true); }}
            style={{
              width: "100%",
              maxWidth: 370,
              minWidth: 0,
              padding: "9px 0",
              fontSize: 15,
              fontWeight: 700,
              color: MAIN_COLOR,
              background: "#fff",
              border: `1.5px solid ${MAIN_COLOR}`,
              borderRadius: 12,
              boxShadow: "0 1px 4px #8B000011",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              marginTop: 7
            }}
          >
            Открыть сохранённые карты
          </button>
        </div>
        {showSavedPanel && (
          <SavedCardsPanel
            cards={natalCards}
            onSelectCard={handleSelectCard}
            selectedCardId={selectedCardId}
            onClose={() => setShowSavedPanel(false)}
            expanded={savedPanelExpanded}
            setExpanded={setSavedPanelExpanded}
          />
        )}
        {formPlanets && (
          <div style={{
            marginTop: showSavedPanel ? 11 : 18,
            background: "#fbeeee",
            borderRadius: 8,
            padding: 10,
            width: "100%",
            maxWidth: 370,
            fontSize: 13,
            boxShadow: "0 1px 4px #8B000011"
          }}>
            <b>Планеты (сидерический зодиак):</b>
            <ul>
              {Object.entries(formPlanets).map(([planet, pos]) => (
                <li key={planet}>
                  {PLANET_LABELS[planet] || planet}: {pos.sign + " " + pos.deg_in_sign_str}
                </li>
              ))}
            </ul>
          </div>
        )}
        <div style={{ width: "100%", maxWidth: 370, marginTop: 10 }}>
          <NatalCardForm
            expanded={formExpanded}
            setExpanded={setFormExpanded}
            values={formValues}
            setValues={setFormValues}
            planets={formPlanets}
            setPlanets={setFormPlanets}
            ayanamsha={formAyanamsha}
            setAyanamsha={setFormAyanamsha}
            loading={formLoading}
            setLoading={setFormLoading}
            error={formError}
            setError={setFormError}
            geoError={formGeoError}
            setGeoError={setFormGeoError}
            geoLoading={formGeoLoading}
            setGeoLoading={setFormGeoLoading}
            onSave={handleAddCard}
          />
        </div>
      </div>
    );
  } else if (selectedSection === "interpret") {
    mainSectionContent = <InterpretationsSection />;
  } else if (selectedSection === "forecast") {
    mainSectionContent = <ForecastsSection />;
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: BG_COLOR,
      transition: "background 0.3s",
      position: "relative",
      paddingBottom: 50,
      margin: 0,
      boxSizing: "border-box"
    }}>
      <SideMenuHandle onClick={() => setMenuOpen(true)} visible={!menuOpen} />

      {/* --- Левое всплывающее меню --- */}
      <div
        style={{
          position: "fixed",
          left: 0,
          top: 0,
          width: "38vw",
          maxWidth: 220,
          height: "100vh",
          background: "#fff6f6",
          boxShadow: menuOpen ? "2px 0 10px #8B000022" : "none",
          zIndex: 1200,
          transition: "transform 0.3s",
          transform: menuOpen ? "translateX(0)" : "translateX(-100%)",
          padding: 16,
          display: "flex",
          flexDirection: "column",
          backdropFilter: "blur(3px)",
        }}
      >
        <button
          onClick={() => setMenuOpen(false)}
          style={{
            alignSelf: "flex-end",
            marginBottom: 8,
            background: "none",
            border: "none",
            fontSize: 18,
            cursor: "pointer",
            color: MAIN_COLOR,
            fontWeight: 700
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
              background: selectedSection === sec.id ? "#F7D7DB" : "transparent",
              fontWeight: selectedSection === sec.id ? 600 : 400,
              padding: "8px 0",
              textAlign: "left",
              border: "none",
              width: "100%",
              cursor: "pointer",
              fontSize: 14,
              color: MAIN_COLOR,
              borderRadius: 7,
              marginBottom: 2,
              transition: "background 0.15s"
            }}
          >
            {sec.label}
          </button>
        ))}
      </div>

      {/* --- Основная секция --- */}
      <div style={{
        width: "100%",
        maxWidth: 440,
        margin: "0 auto",
        minHeight: 0,
        marginTop: 0,
        padding: 0,
        background: "none",
        position: "relative"
      }}>
        {mainSectionContent}
      </div>
    </div>
  );
}