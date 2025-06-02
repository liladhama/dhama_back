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

  return (
    <div style={{
      transition: "box-shadow 0.2s",
      boxShadow: expanded ? "0 4px 32px #0002" : "none",
      background: "#fff",
      borderRadius: 16,
      marginBottom: 8,
      marginTop: 0,
      overflow: "hidden"
    }}>
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
        <form onSubmit={handleSubmit} style={{
          marginTop: 12,
          background: "#f9f9fb",
          padding: 16,
          borderRadius: 10,
          marginBottom: 0
        }}>
          <div>
            <label>
              Имя/метка:
              <input value={values.name} onChange={e => setValues(v => ({ ...v, name: e.target.value }))} required style={{ marginLeft: 8 }} />
            </label>
          </div>
          <div>
            <label>
              Дата рождения:
              <input type="date" value={values.date} onChange={e => setValues(v => ({ ...v, date: e.target.value }))} required style={{ marginLeft: 8 }} />
            </label>
          </div>
          <div>
            <label>
              Время рождения:
              <input type="time" value={values.time} onChange={e => setValues(v => ({ ...v, time: e.target.value }))} required style={{ marginLeft: 8 }} />
            </label>
          </div>
          <div>
            <label>
              Город/место рождения:
              <input
                value={values.place}
                onChange={e => setValues(v => ({ ...v, place: e.target.value }))}
                required
                style={{ marginLeft: 8, width: 220 }}
                placeholder="Москва"
              />
            </label>
            <button
              type="button"
              onClick={autoFillGeo}
              disabled={!values.place || !values.date || geoLoading}
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
                value={values.latitude}
                onChange={e => setValues(v => ({ ...v, latitude: e.target.value }))}
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
                value={values.longitude}
                onChange={e => setValues(v => ({ ...v, longitude: e.target.value }))}
                placeholder="37.6166"
                required
                style={{ marginLeft: 8, width: 100 }}
              />
            </label>
          </div>
          <div>
            <label>
              Временная зона:
              <input value={values.timezone} readOnly style={{ marginLeft: 8, width: 180, background: "#eee" }} />
            </label>
            <label style={{ marginLeft: 16 }}>
              UTC-offset:
              <input value={values.tzOffset} readOnly style={{ marginLeft: 8, width: 60, background: "#eee" }} />
            </label>
          </div>
          <div style={{ marginTop: 12 }}>
            <button type="button" onClick={handleCalc} disabled={loading || !values.date || !values.time}>
              {loading ? "Рассчитываем..." : "Рассчитать планеты"}
            </button>
            <button type="submit" style={{ marginLeft: 10 }} disabled={!planets}>
              Сохранить
            </button>
            <button type="button" onClick={() => setExpanded(false)} style={{ marginLeft: 10 }}>Отмена</button>
          </div>
          {error && <div style={{ color: "red", marginTop: 8 }}>{error}</div>}
          {ayanamsha !== null && (
            <div style={{ marginTop: 10, color: "#555" }}>
              <b>Аянамша Лахири:</b> {ayanamsha.toFixed(6)}°
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
  expanded, setExpanded,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 65,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(350px, 98vw)",
        background: "rgba(250,245,255,0.97)",
        boxShadow: "0 0 24px #7b3ff266",
        zIndex: 2050,
        padding: 14,
        overflow: "hidden",
        borderRadius: 18,
        display: "flex",
        flexDirection: "column",
        backdropFilter: "blur(10px)",
        transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1)",
        maxHeight: expanded ? 320 : 46,
        minHeight: 46,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", marginBottom: expanded ? 6 : 0 }}>
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            background: "none",
            border: "none",
            fontSize: 20,
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
        <span style={{ fontSize: 16, fontWeight: 700, color: "#7b3ff2" }}>Сохранённые карты</span>
        <button onClick={onClose}
          style={{
            marginLeft: "auto",
            background: "none",
            border: "none",
            fontSize: 20,
            color: "#7b3ff2",
            cursor: "pointer"
          }}
          aria-label="Закрыть"
        >×</button>
      </div>
      {expanded && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          {cards.length === 0 ? (
            <p style={{ color: "#777", margin: 0, marginTop: 8 }}>Нет сохранённых карт</p>
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

  // --- Состояние для формы, чтобы сохранять введённые данные! ---
  const [formExpanded, setFormExpanded] = useState(false);
  const [savedPanelExpanded, setSavedPanelExpanded] = useState(false);
  const [showSavedPanel, setShowSavedPanel] = useState(false);

  const [formValues, setFormValues] = useState({
    name: "",
    date: "",
    time: "",
    place: "",
    latitude: "",
    longitude: "",
    timezone: "",
    tzOffset: ""
  });
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

  const sectionBg = "#f3e6d7";

  // --- Контент основной секции ---
  let mainSectionContent = null;
  if (selectedSection === "natal") {
    mainSectionContent = (
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        marginTop: 8,
        gap: 12,
        width: "100%",
        position: "relative"
      }}>
        {/* Кнопка "Открыть сохранённые карты" СВЕРХУ! */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginBottom: 8 }}>
          <button
            onClick={() => { setShowSavedPanel(v => !v); setSavedPanelExpanded(true); }}
            style={{
              minWidth: 200,
              padding: "12px 24px",
              fontSize: 18,
              fontWeight: 700,
              color: "#7b3ff2",
              background: "#fff",
              border: "2px solid #7b3ff2",
              borderRadius: 14,
              boxShadow: "0 2px 8px #7b3ff211",
              cursor: "pointer",
              transition: "background 0.2s, color 0.2s",
              marginTop: 8
            }}
          >
            Открыть сохранённые карты
          </button>
        </div>
        {/* --- Всплывающая панель со списком карт --- */}
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
        {/* --- Карта, если посчитана --- */}
        {formPlanets && (
          <div style={{
            marginTop: showSavedPanel ? 16 : 32,
            background: "#eef",
            borderRadius: 10,
            padding: 16,
            width: "min(500px, 98vw)",
            boxShadow: "0 2px 8px #7b3ff233"
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
        {/* Кнопка "Создать новую карту" ВНИЗУ! */}
        <div style={{ width: "100%", display: "flex", justifyContent: "center", marginTop: 26 }}>
          <button
            onClick={() => setFormExpanded((p) => !p)}
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
              marginBottom: 0,
              transition: "background 0.2s",
              marginTop: 0
            }}
          >
            Создать новую карту
          </button>
        </div>
        {/* --- Форма создания карты прямо ВНУТРИ страницы, сохраняет состояние --- */}
        <div style={{ width: "min(500px, 98vw)", marginTop: 14 }}>
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
      background: sectionBg,
      transition: "background 0.3s",
      position: "relative",
      paddingBottom: 80,
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

      {/* --- Основная секция --- */}
      <div style={{
        width: "100%",
        maxWidth: 800,
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