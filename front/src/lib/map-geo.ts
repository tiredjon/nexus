export const UZBEKISTAN_CENTER: [number, number] = [41.3, 64.6];
export const UZBEKISTAN_ZOOM = 6;

export const TASHKENT_VIEW_CENTER: [number, number] = [41.31, 69.24];
export const TASHKENT_VIEW_ZOOM = 10;

// Центр bbox полигона Мирзо-Улугбек из tashkent-districts.geojson: при этом
// центре зоны махаллей целиком помещаются в кадр на DISTRICT_ZOOM.
export const DISTRICT_CENTER: [number, number] = [41.3015, 69.3145];
export const DISTRICT_ZOOM = 13;

export const MIRZO_DISTRICT_NAME = "Mirzo Ulugbek";
export const TASHKENT_REGION_CODES = new Set(["UZ-TK", "UZ-TO"]);

export const NO_DATA_TOAST =
  "Данные пока доступны только для Мирзо-Улугбекского района";

export const CARTO_TILE_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export const CARTO_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

export type RegionProperties = {
  shapeName: string;
  shapeISO: string;
};

export type DistrictProperties = {
  shapeName: string;
};
