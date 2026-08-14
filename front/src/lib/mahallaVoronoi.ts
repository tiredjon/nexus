import { Delaunay } from "d3-delaunay";
import {
  booleanPointInPolygon,
  centroid,
  featureCollection,
  intersect,
  pointOnFeature,
  polygon as turfPolygon,
} from "@turf/turf";
import type { Feature, MultiPolygon, Polygon, Position } from "geojson";

import districtsData from "@/data/geo/tashkent-districts.geojson";
import { MAHALLA_COORDS, type Mahalla } from "@/lib/data";
import { MIRZO_DISTRICT_NAME, type DistrictProperties } from "@/lib/map-geo";

/**
 * Официальных границ отдельных махаллей в открытых geo-датасетах нет — это
 * слишком детальный уровень. Поэтому территории строятся как диаграмма Вороного
 * от координат-центров махаллей, обрезанная по контуру района: 12 ячеек вместе
 * покрывают ровно район, без нахлёстов и без выходов за границу.
 * Это визуальная навигация, а не кадастровые границы.
 */

export type MahallaZone = {
  mahalla: Mahalla;
  /** Формат Leaflet для мультиполигона: [полигон][кольцо][точка] в [lat, lng]. */
  positions: [number, number][][][];
  /** Точка подписи и маркера — гарантированно внутри зоны. */
  center: [number, number];
};

type Seed = { mahalla: Mahalla; lat: number; lng: number };
type Zone = Feature<Polygon | MultiPolygon>;

/** Запас вокруг района, чтобы крайние ячейки Вороного не срезались по bbox. */
const BBOX_PADDING = 0.05;

/** Отступ от границы района при подгонке точек-центров внутрь контура. */
const FIT_INSET = 0.12;

/**
 * Шаги релаксации Ллойда: сдвигают центры к центроидам своих ячеек, из-за чего
 * зоны получаются сопоставимыми по площади, без узких «осколков» рядом
 * с огромными блоками. Двух проходов достаточно, дальше картинка не меняется.
 */
const RELAX_STEPS = 2;

const districtFeature = (districtsData.features as Zone[]).find(
  (feature) =>
    (feature.properties as DistrictProperties | null)?.shapeName === MIRZO_DISTRICT_NAME,
);

type Point = { lat: number; lng: number };

/** GeoJSON хранит координаты как [lng, lat] — разворачиваем в именованную пару. */
function toPoint(position: Position): Point {
  const [lng = 0, lat = 0] = position;
  return { lat, lng };
}

function ringsOf(geometry: Polygon | MultiPolygon): Position[][] {
  return geometry.type === "Polygon" ? geometry.coordinates : geometry.coordinates.flat();
}

function verticesOf(geometry: Polygon | MultiPolygon): Point[] {
  return ringsOf(geometry).flat().map(toPoint);
}

function bboxOf(points: Point[]) {
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/** Точка внутри геометрии: центроид, а для вогнутых форм — pointOnFeature. */
function innerPoint(zone: Zone): Point {
  const center = centroid(zone).geometry.coordinates;
  if (booleanPointInPolygon(center, zone)) return toPoint(center);
  return toPoint(pointOnFeature(featureCollection([zone])).geometry.coordinates);
}

/**
 * Координаты махаллей в данных синтетические и заданы по реальному городу,
 * а контур района берётся из geoBoundaries (ADM2) и заметно смещён относительно
 * реальной геометрии — часть точек лежит вне полигона, и обрезка Вороного дала
 * бы пустые зоны.
 *
 * Поэтому облако точек аффинно вписывается в bbox района с отступом: взаимное
 * расположение махаллей (кто севернее, кто западнее) сохраняется, но все центры
 * попадают внутрь территории.
 */
function fitSeedsToDistrict(seeds: Seed[], district: Zone): Seed[] {
  if (seeds.length < 2) return seeds;

  const districtVertices = verticesOf(district.geometry);
  const source = bboxOf(seeds);
  const target = bboxOf(districtVertices);

  const insetLat = (target.maxLat - target.minLat) * FIT_INSET;
  const insetLng = (target.maxLng - target.minLng) * FIT_INSET;

  const scaleLat =
    (target.maxLat - target.minLat - insetLat * 2) / (source.maxLat - source.minLat || 1);
  const scaleLng =
    (target.maxLng - target.minLng - insetLng * 2) / (source.maxLng - source.minLng || 1);

  const districtCenter = toPoint(centroid(district).geometry.coordinates);

  return seeds.map((seed) => {
    const fitted: Seed = {
      mahalla: seed.mahalla,
      lat: target.minLat + insetLat + (seed.lat - source.minLat) * scaleLat,
      lng: target.minLng + insetLng + (seed.lng - source.minLng) * scaleLng,
    };

    // Район невыпуклый — после подгонки точка всё ещё может попасть в «вырез».
    // Такие точки притягиваем к ближайшей вершине контура, сдвинутой к центру.
    if (booleanPointInPolygon([fitted.lng, fitted.lat], district)) return fitted;

    let nearest: Point = fitted;
    let bestDistance = Infinity;
    for (const vertex of districtVertices) {
      const distance = (vertex.lat - fitted.lat) ** 2 + (vertex.lng - fitted.lng) ** 2;
      if (distance < bestDistance) {
        bestDistance = distance;
        nearest = vertex;
      }
    }

    return {
      mahalla: seed.mahalla,
      lat: nearest.lat + (districtCenter.lat - nearest.lat) * FIT_INSET,
      lng: nearest.lng + (districtCenter.lng - nearest.lng) * FIT_INSET,
    };
  });
}

/** Ячейки Вороного, обрезанные по контуру района, в паре с их центрами. */
function clipCells(
  seeds: Seed[],
  district: Zone,
  bbox: Delaunay.Bounds,
): { seed: Seed; zone: Zone }[] {
  const voronoi = Delaunay.from(
    seeds,
    (seed) => seed.lng,
    (seed) => seed.lat,
  ).voronoi(bbox);

  return seeds.map((seed, index) => {
    const cell = voronoi.cellPolygon(index);
    // Ячейка отсутствует только у совпадающих точек — тогда зоны у махалли нет.
    if (!cell) return { seed, zone: district };

    const rawCell = turfPolygon([cell.map((point) => [...point] as Position)]);

    // turf.intersect возвращает null для непересекающихся геометрий и может
    // споткнуться о самопересечения — в обоих случаях показываем необрезанную
    // ячейку, а не теряем махаллю целиком.
    try {
      return { seed, zone: intersect(featureCollection([rawCell, district])) ?? rawCell };
    } catch {
      return { seed, zone: rawCell };
    }
  });
}

function toLeafletPositions(geometry: Polygon | MultiPolygon): [number, number][][][] {
  const polygons =
    geometry.type === "Polygon" ? [geometry.coordinates] : geometry.coordinates;

  return polygons.map((rings) =>
    rings.map((ring) => ring.map(([lng, lat]) => [lat, lng] as [number, number])),
  );
}

/** Центры зон после релаксации — общий вход и для геометрии, и для соседства. */
function relaxedSeeds(
  mahallas: readonly Mahalla[],
): { seeds: Seed[]; district: Zone; bbox: Delaunay.Bounds } | null {
  if (!districtFeature || mahallas.length === 0) return null;

  const bounds = bboxOf(verticesOf(districtFeature.geometry));
  const bbox: Delaunay.Bounds = [
    bounds.minLng - BBOX_PADDING,
    bounds.minLat - BBOX_PADDING,
    bounds.maxLng + BBOX_PADDING,
    bounds.maxLat + BBOX_PADDING,
  ];

  let seeds = fitSeedsToDistrict(
    mahallas.map((mahalla) => ({
      mahalla,
      lat: MAHALLA_COORDS[mahalla][0],
      lng: MAHALLA_COORDS[mahalla][1],
    })),
    districtFeature,
  );

  for (let step = 0; step < RELAX_STEPS; step++) {
    seeds = clipCells(seeds, districtFeature, bbox).map(({ seed, zone }) => ({
      mahalla: seed.mahalla,
      ...innerPoint(zone),
    }));
  }

  return { seeds, district: districtFeature, bbox };
}

export function buildMahallaZones(mahallas: readonly Mahalla[]): MahallaZone[] {
  const prepared = relaxedSeeds(mahallas);
  if (!prepared) return [];

  return clipCells(prepared.seeds, prepared.district, prepared.bbox).map(({ seed, zone }) => {
    const center = innerPoint(zone);
    return {
      mahalla: seed.mahalla,
      positions: toLeafletPositions(zone.geometry),
      center: [center.lat, center.lng] as [number, number],
    };
  });
}

/**
 * Граф смежности зон: у диаграммы Вороного соседями оказываются ровно те
 * ячейки, чьи центры связаны ребром триангуляции Делоне. Нужен раскраске —
 * иначе соседние на карте зоны получают похожие оттенки.
 */
export function mahallaNeighbors(mahallas: readonly Mahalla[]): Map<Mahalla, Mahalla[]> {
  const graph = new Map<Mahalla, Mahalla[]>(mahallas.map((mahalla) => [mahalla, []]));

  const prepared = relaxedSeeds(mahallas);
  if (!prepared) return graph;

  const delaunay = Delaunay.from(
    prepared.seeds,
    (seed) => seed.lng,
    (seed) => seed.lat,
  );

  prepared.seeds.forEach((seed, index) => {
    graph.set(
      seed.mahalla,
      [...delaunay.neighbors(index)]
        .map((neighbor) => prepared.seeds[neighbor]?.mahalla)
        .filter((mahalla): mahalla is Mahalla => Boolean(mahalla)),
    );
  });

  return graph;
}
