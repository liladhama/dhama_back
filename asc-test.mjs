import { coord } from "astronomia";
console.log(Object.keys(coord));
import { coord } from "astronomia";
const lon = 37.6167, lat = 55.75, jd = 2451545.0;
console.log('ascendant:', coord.ascendant(lon, lat, jd));