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
    return result