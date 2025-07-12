from fastapi import FastAPI, Query
from pydantic import BaseModel
from typing import Optional
import swisseph as swe
from datetime import datetime, timedelta
import pytz  # Добавлено для поддержки временных зон и DST
from pytz.exceptions import AmbiguousTimeError, NonExistentTimeError

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# --- Разрешаем CORS для локалки и продакшена ---
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dhama-sage.vercel.app",   # твой продакшен-фронт
        "http://localhost:3000",           # локальный React
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class PlanetInfo(BaseModel):
    longitude: float
    retrograde: Optional[bool] = None  # <-- исправлено: теперь можно None
    sign: Optional[str] = None         # ДОБАВЛЕН знак
    deg_in_sign: Optional[float] = None # ДОБАВЛЕН градус в знаке
    deg_in_sign_str: Optional[str] = None # ДОБАВЛЕН форматированный градус

class PlanetPositions(BaseModel):
    sun: PlanetInfo
    moon: PlanetInfo
    mars: PlanetInfo
    mercury: PlanetInfo
    jupiter: PlanetInfo
    venus: PlanetInfo
    saturn: PlanetInfo
    rahu: PlanetInfo
    ketu: PlanetInfo
    ascendant: float

SIGNS = [
    "Овен", "Телец", "Близнецы", "Рак", "Лев", "Дева",
    "Весы", "Скорпион", "Стрелец", "Козерог", "Водолей", "Рыбы"
]

# --- Определения для расчёта Панчанги ---
VARAS = ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"]

TITHIS = [
    "Новолуние", "Шукла Пратипада", "Шукла Двитья", "Шукла Тритья", "Шукла Чатуртхи",
    "Шукла Панчами", "Шукла Шашти", "Шукла Саптами", "Шукла Аштами", "Шукла Навами",
    "Шукла Дашами", "Шукла Экадаши", "Шукла Двадаши", "Шукла Трайодаши", "Шукла Чатурдаши",
    "Полнолуние", "Кришна Пратипада", "Кришна Двитья", "Кришна Тритья", "Кришна Чатуртхи",
    "Кришна Панчами", "Кришна Шашти", "Кришна Саптами", "Кришна Аштами", "Кришна Навами",
    "Кришна Дашами", "Кришна Экадаши", "Кришна Двадаши", "Кришна Трайодаши", "Кришна Чатурдаши"
]

KARANAS = [
    "Кимстугхна", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Бава", "Балава", "Каулава", "Тайтила", "Гара", "Ваниджа",
    "Вишти", "Шакуни", "Чатушпада", "Нага"
]

YOGAS = [
    "Вишкамбха", "Прити", "Аюшман", "Саубхагья", "Шобхана", "Атиганда", "Сукарман",
    "Дхрити", "Шула", "Ганда", "Вриддхи", "Дхрува", "Вьягхата", "Харшана",
    "Ваджра", "Сиддхи", "Вьятипата", "Варийан", "Паригха", "Шива",
    "Сиддха", "Садхья", "Шубха", "Шуклы", "Брахма", "Индра", "Вайдхрити"
]

NAKSHATRAS = [
    ("Ашвини", 4), ("Бхарани", 4), ("Криттика", 4), ("Рохини", 4), ("Мригашира", 4),
    ("Ардра", 4), ("Пунарвасу", 4), ("Пушья", 4), ("Ашлеша", 4), ("Магха", 4),
    ("Пурва Пхалгуни", 4), ("Уттара Пхалгуни", 4), ("Хаста", 4), ("Читра", 4), ("Свати", 4),
    ("Вишакха", 4), ("Анурадха", 4), ("Джйештха", 4), ("Мула", 4), ("Пурва Ашадха", 4),
    ("Уттара Ашадха", 4), ("Шравана", 4), ("Дхаништха", 4), ("Шатабхиша", 4),
    ("Пурва Бхадрапада", 4), ("Уттара Бхадрапада", 4), ("Ревати", 4)
]

# Новый вспомогательный метод для преобразования локального времени в UTC
# date: 'YYYY-MM-DD', time: 'HH:MM', tz_name: 'Europe/Moscow' или 'Asia/Almaty'
def local_to_utc(date: str, time: str, tz_name: str) -> datetime:
    dt_local = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    tz = pytz.timezone(tz_name)
    try:
        dt_localized = tz.localize(dt_local, is_dst=None)
    except AmbiguousTimeError:
        # Неоднозначное время (например, переход на зимнее время) — пробуем DST-версию
        dt_localized = tz.localize(dt_local, is_dst=True)
    except NonExistentTimeError:
        # Не существует (например, переход на летнее время) — сдвигаем на 1 час вперёд
        dt_local += timedelta(hours=1)
        dt_localized = tz.localize(dt_local, is_dst=True)
    dt_utc = dt_localized.astimezone(pytz.utc)
    return dt_utc

def date_to_jd(date_str: str) -> float:
    # Можно добавить время, если потребуется (разделитель T или пробел)
    if "T" in date_str or " " in date_str:
        try:
            date_obj = datetime.strptime(date_str, "%Y-%m-%dT%H:%M")
        except ValueError:
            date_obj = datetime.strptime(date_str, "%Y-%m-%d %H:%M")
        hour = date_obj.hour + date_obj.minute / 60.0
    else:
        date_obj = datetime.strptime(date_str, "%Y-%m-%d")
        hour = 0
    return swe.julday(date_obj.year, date_obj.month, date_obj.day, hour)

def get_longitude_and_retrograde(t):
    arr = t[0]
    longitude = float(arr[0])
    speed = float(arr[3])
    retrograde = speed < 0
    return longitude, retrograde

def get_sign_deg(longitude: float):
    sign_idx = int(longitude // 30) % 12
    sign = SIGNS[sign_idx]
    deg_in_sign = longitude % 30
    deg = int(deg_in_sign)
    minute = int(round((deg_in_sign - deg) * 60))
    deg_in_sign_str = f"{deg}°{minute:02d}'"
    return sign, deg_in_sign, deg_in_sign_str

# --- Вспомогательная функция для расчёта дробной карты D9 (Навамша) ---
def calc_navamsa(planets):
    d9 = {}
    asc_navamsa_sign_idx = None
    rahu_navamsa_sign_idx = None
    rahu_navamsa_num = None
    # Сначала вычисляем навамша-лагну (ascendant)
    for key, p in planets.items():
        if key == "ascendant":
            lon = p if isinstance(p, (int, float)) else p.get("longitude")
            sign_idx = int(lon // 30) % 12
            deg_in_sign = lon % 30
            navamsa_num = int(deg_in_sign // (30/9))  # 0..8
            navamsa_sign_idx = (sign_idx * 9 + navamsa_num) % 12
            navamsa_sign = SIGNS[navamsa_sign_idx]
            d9[key] = {
                "longitude": lon,
                "navamsa_sign": navamsa_sign,
                "navamsa_num": navamsa_num + 1,
                "navamsa_deg": deg_in_sign,
                "navamsa_sign_idx": navamsa_sign_idx
            }
            asc_navamsa_sign_idx = navamsa_sign_idx
            break
    # Сначала вычисляем Раху по обычной формуле, сохраняем индекс
    for key, p in planets.items():
        if key != "rahu":
            continue
        if not isinstance(p, dict) or "longitude" not in p:
            continue
        lon = p["longitude"]
        sign_idx = int(lon // 30) % 12
        deg_in_sign = lon % 30
        navamsa_num = int(deg_in_sign // (30/9))  # 0..8
        navamsa_sign_idx = (sign_idx * 9 + navamsa_num) % 12
        navamsa_sign = SIGNS[navamsa_sign_idx]
        if asc_navamsa_sign_idx is not None:
            navamsa_house = (navamsa_sign_idx - asc_navamsa_sign_idx) % 12 + 1
        else:
            navamsa_house = None
        d9[key] = {
            "longitude": lon,
            "navamsa_sign": navamsa_sign,
            "navamsa_num": navamsa_num + 1,
            "navamsa_deg": deg_in_sign,
            "navamsa_sign_idx": navamsa_sign_idx,
            "navamsa_house": navamsa_house
        }
        rahu_navamsa_sign_idx = navamsa_sign_idx
        rahu_navamsa_num = navamsa_num
    # Теперь Кету: строго напротив Раху
    if rahu_navamsa_sign_idx is not None:
        ketu_navamsa_sign_idx = (rahu_navamsa_sign_idx + 6) % 12
        ketu_navamsa_sign = SIGNS[ketu_navamsa_sign_idx]
        if asc_navamsa_sign_idx is not None:
            ketu_navamsa_house = (ketu_navamsa_sign_idx - asc_navamsa_sign_idx) % 12 + 1
        else:
            ketu_navamsa_house = None
        d9["ketu"] = {
            "longitude": planets["ketu"]["longitude"] if isinstance(planets["ketu"], dict) else planets["ketu"],
            "navamsa_sign": ketu_navamsa_sign,
            "navamsa_num": (rahu_navamsa_num + 1) if rahu_navamsa_num is not None else None,
            "navamsa_deg": d9["rahu"]["navamsa_deg"] if "rahu" in d9 else None,
            "navamsa_sign_idx": ketu_navamsa_sign_idx,
            "navamsa_house": ketu_navamsa_house
        }
    # Остальные планеты
    for key, p in planets.items():
        if key in ("ascendant", "rahu", "ketu"):
            continue
        if not isinstance(p, dict) or "longitude" not in p:
            continue
        lon = p["longitude"]
        sign_idx = int(lon // 30) % 12
        deg_in_sign = lon % 30
        navamsa_num = int(deg_in_sign // (30/9))  # 0..8
        navamsa_sign_idx = (sign_idx * 9 + navamsa_num) % 12
        navamsa_sign = SIGNS[navamsa_sign_idx]
        if asc_navamsa_sign_idx is not None:
            navamsa_house = (navamsa_sign_idx - asc_navamsa_sign_idx) % 12 + 1
        else:
            navamsa_house = None
        d9[key] = {
            "longitude": lon,
            "navamsa_sign": navamsa_sign,
            "navamsa_num": navamsa_num + 1,
            "navamsa_deg": deg_in_sign,
            "navamsa_sign_idx": navamsa_sign_idx,
            "navamsa_house": navamsa_house
        }
    # Для диагностики: печать распределения планет по знакам и домам D9
    print("[D9] Navamsa Ascendant:", d9.get("ascendant"))
    for k, v in d9.items():
        if k != "ascendant":
            print(f"[D9] {k}: sign={v['navamsa_sign']} house={v['navamsa_house']} num={v['navamsa_num']}")
    return d9

# --- Функция для расчёта Панчанги ---
def calc_panchanga(jd, sun_lon, moon_lon):
    """
    Расчёт элементов Панчанги для данного JD и позиций Солнца и Луны
    """
    panchanga = {}
    
    # 1. ВАРА (день недели) - начинается с восхода Солнца
    # Корректируем для ведического дня, который начинается с восхода
    # JD 0 соответствует понедельнику по григорианскому календарю
    # Добавляем сдвиг на +1 день для корректного расчёта ведического дня
    vara_index = int((jd + 1.5) % 7)  # 0.5 добавляем для учёта восхода
    panchanga["vara"] = VARAS[vara_index]
    
    # 2. ТИТХИ (лунный день) - разность долгот Луны и Солнца
    # Используем тропические долготы для расчёта титхи (как в предыдущей версии)
    sun_long_tropical = swe.calc_ut(jd, swe.SUN)[0][0]
    moon_long_tropical = swe.calc_ut(jd, swe.MOON)[0][0]
    tithi_angle = (moon_long_tropical - sun_long_tropical) % 360
    tithi_index = int(tithi_angle // 12)
    
    # Определяем фазу
    paksha = "Шукла" if tithi_angle < 180 else "Кришна"
    
    # Названия титхи без фазы
    basic_tithi_names = [
        "Пратипада", "Двитья", "Тритья", "Чатуртхи", "Панчами", "Шашти", "Саптами", "Аштами", "Навами", "Дашами",
        "Экадаши", "Двадаши", "Трайодаши", "Чатурдаши", "Полнолуние"
    ]
    
    # Для второй половины лунного месяца используем те же названия
    if tithi_index >= 15:
        tithi_name_index = tithi_index - 15
        if tithi_name_index >= len(basic_tithi_names):
            tithi_name_index = len(basic_tithi_names) - 1
    else:
        tithi_name_index = tithi_index
        
    if tithi_name_index >= len(basic_tithi_names):
        tithi_name_index = len(basic_tithi_names) - 1
        
    tithi_name = basic_tithi_names[tithi_name_index]
    
    # Для новолуния и полнолуния не добавляем фазу
    if tithi_index == 0:
        panchanga["tithi"] = "Новолуние"
    elif tithi_index == 15:
        panchanga["tithi"] = "Полнолуние"
    else:
        panchanga["tithi"] = f"{paksha} {tithi_name}"
    
    panchanga["tithi_progress"] = (tithi_angle % 12) / 12 * 100  # процент завершения титхи
    
    # 3. КАРАНА (половина титхи) - каждые 6 градусов разности
    karana_deg = tithi_angle % 6
    karana_index = int(tithi_angle / 6)
    if karana_index >= len(KARANAS):
        karana_index = len(KARANAS) - 1
    panchanga["karana"] = KARANAS[karana_index]
    panchanga["karana_progress"] = karana_deg / 6 * 100
    
    # 4. ЙОГА (нитья-йога) - сумма сидерических долгот Солнца и Луны
    yoga_deg = (sun_lon + moon_lon) % 360
    yoga_index = int(yoga_deg / (360/27))  # 27 йог на 360 градусов
    if yoga_index >= len(YOGAS):
        yoga_index = len(YOGAS) - 1
    panchanga["nitya_yoga"] = YOGAS[yoga_index]
    panchanga["yoga_progress"] = (yoga_deg % (360/27)) / (360/27) * 100
    
    # 5. НАКШАТРА (лунная стоянка) - позиция Луны в сидерическом зодиаке
    nakshatra_deg = moon_lon % 360
    nakshatra_index = int(nakshatra_deg / (360/27))  # 27 накшатр на 360 градусов
    if nakshatra_index >= len(NAKSHATRAS):
        nakshatra_index = len(NAKSHATRAS) - 1
    
    nakshatra_name, total_padas = NAKSHATRAS[nakshatra_index]
    # Вычисляем паду (четверть накшатры)
    pada_progress = (nakshatra_deg % (360/27)) / (360/27)
    pada = int(pada_progress * total_padas) + 1
    if pada > total_padas:
        pada = total_padas
    
    panchanga["nakshatra"] = f"{nakshatra_name} (пада {pada})"
    panchanga["nakshatra_name"] = nakshatra_name
    panchanga["nakshatra_pada"] = pada
    panchanga["nakshatra_progress"] = pada_progress * 100
    
    return panchanga

# --- Функция для расчёта времени гражданского восхода солнца ---
def calc_sunrise(date: str, lat: float, lon: float, tz_name: str):
    """
    Возвращает время восхода солнца (локальное и UTC) для заданных координат и даты.
    """
    try:
        # JD для утра заданного дня (6:00 локального времени)
        dt_local_morning = datetime.strptime(f"{date} 06:00", "%Y-%m-%d %H:%M")
        tz = pytz.timezone(tz_name)
        dt_local_morning = tz.localize(dt_local_morning, is_dst=None)
        dt_utc_morning = dt_local_morning.astimezone(pytz.utc)
        jd_morning = swe.julday(dt_utc_morning.year, dt_utc_morning.month, dt_utc_morning.day, 
                               dt_utc_morning.hour + dt_utc_morning.minute / 60.0)
        
        # Расчёт восхода солнца через обновленный API pyswisseph
        try:
            # Новый формат: rise_trans(tjdut, body, rsmi, geopos, atpress, attemp, flags)
            # geopos = [longitude, latitude, altitude_in_meters]
            geopos = [lon, lat, 0.0]  # долгота, широта, высота над уровнем моря
            res, tret = swe.rise_trans(jd_morning, swe.SUN, swe.CALC_RISE, geopos)
            
            # Проверяем результат: res=0 означает успех, tret[0] содержит JD события
            if res == 0 and len(tret) > 0:
                sunrise_jd = tret[0]  # JD восхода
            else:
                raise Exception(f"Событие не найдено: res={res}, tret={tret}")
        except Exception as rise_error:
            print(f"Ошибка rise_trans: {rise_error}")
            # Приблизительный расчет: восход около 5:00 UTC для Ульяновска в январе
            sunrise_jd = jd_morning + 0.08  # примерно 2 часа после 6:00 утра = 08:00 местного времени
        sunrise_utc = swe.revjul(sunrise_jd)  # преобразуем JD в дату
        
        # Переводим в datetime
        dt_sunrise_utc = datetime(int(sunrise_utc[0]), int(sunrise_utc[1]), int(sunrise_utc[2]), 
                                  int(sunrise_utc[3]), int((sunrise_utc[3] % 1) * 60))
        dt_sunrise_utc = pytz.utc.localize(dt_sunrise_utc)
        dt_sunrise_local = dt_sunrise_utc.astimezone(tz)
        
        print(f"Время восхода солнца (локальное): {dt_sunrise_local}, (UTC): {dt_sunrise_utc}")
        
        return dt_sunrise_local, dt_sunrise_utc
    except Exception as e:
        print(f"Ошибка расчета восхода: {e}")
        # Возвращаем примерное время восхода (06:00 местного времени)
        dt_local = datetime.strptime(f"{date} 06:00", "%Y-%m-%d %H:%M")
        tz = pytz.timezone(tz_name)
        dt_local = tz.localize(dt_local, is_dst=None)
        return dt_local, dt_local.astimezone(pytz.utc)

# --- Новый расчёт вары с учётом восхода солнца ---
def calc_vara_for_datetime(date: str, time: str, lat: float, lon: float, tz_name: str):
    """
    Возвращает ведическую вару (день недели), учитывая восход солнца.
    """
    try:
        # Получаем время восхода для текущего дня
        sunrise_today, _ = calc_sunrise(date, lat, lon, tz_name)
        
        # Время запроса пользователя
        dt_local = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
        tz = pytz.timezone(tz_name)
        dt_local = tz.localize(dt_local, is_dst=None)
        
        # Если время запроса до восхода - это предыдущая вара
        if dt_local < sunrise_today:
            # Вара предыдущего дня
            prev_date = (datetime.strptime(date, "%Y-%m-%d") - timedelta(days=1)).strftime("%Y-%m-%d")
            vara_idx = (datetime.strptime(prev_date, "%Y-%m-%d").weekday() + 1) % 7
        else:
            # Вара текущего дня
            vara_idx = (datetime.strptime(date, "%Y-%m-%d").weekday() + 1) % 7
        
        return VARAS[vara_idx], sunrise_today.strftime("%H:%M"), sunrise_today
    except Exception as e:
        print(f"Ошибка расчета вары: {e}")
        # Fallback к обычному расчёту
        vara_idx = (datetime.strptime(date, "%Y-%m-%d").weekday() + 1) % 7
        return VARAS[vara_idx], "08:00", None

# --- Внести изменения в API ---
@app.get("/api/planets")
def get_planet_positions(
    date: str = Query(..., description="Дата в формате YYYY-MM-DD"),
    time: str = Query(..., description="Время в формате HH:MM"),
    lat: float = Query(..., description="Широта"),
    lon: float = Query(..., description="Долгота"),
    timezone: str = Query(..., description="ID временной зоны, например 'Europe/Moscow'")
):
    # Преобразуем локальное время пользователя в UTC с учетом DST
    dt_local = datetime.strptime(f"{date} {time}", "%Y-%m-%d %H:%M")
    tz = pytz.timezone(timezone)
    try:
        dt_localized = tz.localize(dt_local, is_dst=None)
    except AmbiguousTimeError:
        dt_localized = tz.localize(dt_local, is_dst=True)
    except NonExistentTimeError:
        dt_local += timedelta(hours=1)
        dt_localized = tz.localize(dt_local, is_dst=True)
    dt_utc = dt_localized.astimezone(pytz.utc)
    offset = dt_localized.utcoffset().total_seconds() / 3600

    jd = swe.julday(dt_utc.year, dt_utc.month, dt_utc.day, dt_utc.hour + dt_utc.minute / 60.0)
    swe.set_sid_mode(swe.SIDM_LAHIRI, 0, 0)
    sidereal_flag = swe.FLG_SIDEREAL | swe.FLG_SPEED
    sun = get_longitude_and_retrograde(swe.calc_ut(jd, swe.SUN, sidereal_flag))[0]
    sun_sign, sun_deg, sun_deg_str = get_sign_deg(sun)
    moon = get_longitude_and_retrograde(swe.calc_ut(jd, swe.MOON, sidereal_flag))[0]
    moon_sign, moon_deg, moon_deg_str = get_sign_deg(moon)
    mars_lon, mars_retro = get_longitude_and_retrograde(swe.calc_ut(jd, swe.MARS, sidereal_flag))
    mars_sign, mars_deg, mars_deg_str = get_sign_deg(mars_lon)
    mercury_lon, mercury_retro = get_longitude_and_retrograde(swe.calc_ut(jd, swe.MERCURY, sidereal_flag))
    mercury_sign, mercury_deg, mercury_deg_str = get_sign_deg(mercury_lon)
    jupiter_lon, jupiter_retro = get_longitude_and_retrograde(swe.calc_ut(jd, swe.JUPITER, sidereal_flag))
    jupiter_sign, jupiter_deg, jupiter_deg_str = get_sign_deg(jupiter_lon)
    venus_lon, venus_retro = get_longitude_and_retrograde(swe.calc_ut(jd, swe.VENUS, sidereal_flag))
    venus_sign, venus_deg, venus_deg_str = get_sign_deg(venus_lon)
    saturn_lon, saturn_retro = get_longitude_and_retrograde(swe.calc_ut(jd, swe.SATURN, sidereal_flag))
    saturn_sign, saturn_deg, saturn_deg_str = get_sign_deg(saturn_lon)
    # Заменяем MEAN_NODE на TRUE_NODE для истинных узлов
    rahu_lon, _ = get_longitude_and_retrograde(swe.calc_ut(jd, swe.TRUE_NODE, sidereal_flag))
    rahu_sign, rahu_deg, rahu_deg_str = get_sign_deg(rahu_lon)
    rahu_retro = True
    ketu_lon = (rahu_lon + 180.0) % 360
    ketu_sign, ketu_deg, ketu_deg_str = get_sign_deg(ketu_lon)
    ketu_retro = True
    houses, asc_mc = swe.houses(jd, lat, lon, b'P')
    ayanamsa = swe.get_ayanamsa(jd)
    ascendant = (float(asc_mc[0]) - ayanamsa) % 360

    # --- Формируем основной ответ ---
    result = {
        "sun": dict(longitude=sun, retrograde=None, sign=sun_sign, deg_in_sign=sun_deg, deg_in_sign_str=sun_deg_str),
        "moon": dict(longitude=moon, retrograde=None, sign=moon_sign, deg_in_sign=moon_deg, deg_in_sign_str=moon_deg_str),
        "mars": dict(longitude=mars_lon, retrograde=mars_retro, sign=mars_sign, deg_in_sign=mars_deg, deg_in_sign_str=mars_deg_str),
        "mercury": dict(longitude=mercury_lon, retrograde=mercury_retro, sign=mercury_sign, deg_in_sign=mercury_deg, deg_in_sign_str=mercury_deg_str),
        "jupiter": dict(longitude=jupiter_lon, retrograde=jupiter_retro, sign=jupiter_sign, deg_in_sign=jupiter_deg, deg_in_sign_str=jupiter_deg_str),
        "venus": dict(longitude=venus_lon, retrograde=venus_retro, sign=venus_sign, deg_in_sign=venus_deg, deg_in_sign_str=venus_deg_str),
        "saturn": dict(longitude=saturn_lon, retrograde=saturn_retro, sign=saturn_sign, deg_in_sign=saturn_deg, deg_in_sign_str=saturn_deg_str),
        "rahu": dict(longitude=rahu_lon, retrograde=rahu_retro, sign=rahu_sign, deg_in_sign=rahu_deg, deg_in_sign_str=rahu_deg_str),
        "ketu": dict(longitude=ketu_lon, retrograde=ketu_retro, sign=ketu_sign, deg_in_sign=ketu_deg, deg_in_sign_str=ketu_deg_str),
        "ascendant": ascendant,
        "offset": offset
    }
    # --- Добавляем расчёт дробной карты D9 (Навамша) ---
    result["d9"] = calc_navamsa(result)
    # --- Добавляем расчёт Панчанги ---
    result["panchanga"] = calc_panchanga(jd, sun, moon)
    
    # --- Добавляем корректный расчёт вары с учётом восхода солнца ---
    vara, sunrise_str, sunrise_dt = calc_vara_for_datetime(date, time, lat, lon, timezone)
    result["panchanga"]["vara"] = vara  # Заменяем вару в panchanga
    result["sunrise"] = sunrise_str
    if sunrise_dt:
        result["sunrise_dt"] = sunrise_dt.isoformat()
    
    return result