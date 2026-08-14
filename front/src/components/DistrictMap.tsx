import L from "leaflet";
import { Fragment, useEffect, useMemo, useState } from "react";
import {
  GeoJSON,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  Tooltip,
  useMap,
  useMapEvents,
} from "react-leaflet";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import type { Feature, GeoJsonObject } from "geojson";

import regionsData from "@/data/geo/uzbekistan-regions.geojson";
import districtsData from "@/data/geo/tashkent-districts.geojson";
import { type Mahalla } from "@/lib/data";
import { darken, mahallaColor, type ZoneColorMode } from "@/lib/mahalla-colors";
import { buildMahallaZones } from "@/lib/mahallaVoronoi";
import {
  CARTO_ATTRIBUTION,
  CARTO_TILE_URL,
  DISTRICT_CENTER,
  DISTRICT_ZOOM,
  MIRZO_DISTRICT_NAME,
  NO_DATA_TOAST,
  TASHKENT_REGION_CODES,
  TASHKENT_VIEW_CENTER,
  TASHKENT_VIEW_ZOOM,
  UZBEKISTAN_CENTER,
  UZBEKISTAN_ZOOM,
  type DistrictProperties,
  type RegionProperties,
} from "@/lib/map-geo";
import { Button } from "./ui/button";

export type MahallaStat = {
  mahalla: Mahalla;
  total: number;
  employed: number;
  neet: number;
  share: number;
};

const REGION_ZOOM_MAX = 9;
const DISTRICT_ZOOM_MAX = 13;

const regionInactiveStyle: L.PathOptions = {
  fillColor: "#f8fafc",
  fillOpacity: 0.85,
  color: "#64748b",
  weight: 1,
};

const regionActiveStyle: L.PathOptions = {
  fillColor: "#1d4ed8",
  fillOpacity: 0.05,
  color: "#1d4ed8",
  weight: 1.5,
};

const districtInactiveStyle: L.PathOptions = {
  fillColor: "#f1f5f9",
  fillOpacity: 0.75,
  color: "#94a3b8",
  weight: 1,
};

const districtActiveStyle: L.PathOptions = {
  fillColor: "#1d4ed8",
  fillOpacity: 0.1,
  color: "#1d4ed8",
  weight: 2,
};

function neetColor(share: number) {
  if (share < 5) return "#059669";
  if (share <= 12) return "#d97706";
  return "#dc2626";
}

/** Более насыщенный вариант того же статуса — для контура зоны. */
function neetStroke(share: number) {
  if (share < 5) return "#047857";
  if (share <= 12) return "#b45309";
  return "#b91c1c";
}

// Категориальная заливка плотнее статусной: цвета там разные у соседей,
// и при 0.35 карта читается как выцветшая.
const ZONE_OPACITY = {
  neet: { base: 0.35, hover: 0.55 },
  mahalla: { base: 0.45, hover: 0.65 },
} as const satisfies Record<ZoneColorMode, { base: number; hover: number }>;

function zoneStyle(stat: MahallaStat, mode: ZoneColorMode) {
  const fillColor = mode === "mahalla" ? mahallaColor(stat.mahalla) : neetColor(stat.share);
  return {
    fillColor,
    color: mode === "mahalla" ? darken(fillColor) : neetStroke(stat.share),
    ...ZONE_OPACITY[mode],
  };
}

function MapBridge({
  onMap,
  onZoom,
}: {
  onMap: (map: L.Map) => void;
  onZoom: (zoom: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    onMap(map);
  }, [map, onMap]);

  useMapEvents({
    zoomend: () => onZoom(map.getZoom()),
  });

  useEffect(() => {
    onZoom(map.getZoom());
    const timer = window.setTimeout(() => {
      map.flyTo(DISTRICT_CENTER, DISTRICT_ZOOM, { duration: 1.8 });
    }, 500);
    return () => window.clearTimeout(timer);
  }, [map, onZoom]);

  return null;
}

function RegionsLayer() {
  const map = useMap();

  const style = (feature?: Feature) => {
    const iso = (feature?.properties as RegionProperties | undefined)?.shapeISO ?? "";
    return TASHKENT_REGION_CODES.has(iso) ? regionActiveStyle : regionInactiveStyle;
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const props = feature.properties as RegionProperties;
    const isTashkent = TASHKENT_REGION_CODES.has(props.shapeISO);

    if (isTashkent) {
      layer.on({
        mouseover: (event) => {
          (event.target as L.Path).setStyle({ ...regionActiveStyle, fillOpacity: 0.12 });
        },
        mouseout: (event) => {
          (event.target as L.Path).setStyle(regionActiveStyle);
        },
        click: () => {
          map.flyTo(TASHKENT_VIEW_CENTER, TASHKENT_VIEW_ZOOM, { duration: 1.2 });
        },
      });
      return;
    }

    layer.on("click", () => toast.info(NO_DATA_TOAST));
  };

  return (
    <GeoJSON
      key="regions"
      data={regionsData as GeoJsonObject}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

function DistrictsLayer() {
  const map = useMap();

  const style = (feature?: Feature) => {
    const name = (feature?.properties as DistrictProperties | undefined)?.shapeName ?? "";
    return name === MIRZO_DISTRICT_NAME ? districtActiveStyle : districtInactiveStyle;
  };

  const onEachFeature = (feature: Feature, layer: L.Layer) => {
    const name = (feature.properties as DistrictProperties).shapeName;
    const isMirzo = name === MIRZO_DISTRICT_NAME;

    if (isMirzo) {
      layer.on({
        mouseover: (event) => {
          (event.target as L.Path).setStyle({ ...districtActiveStyle, fillOpacity: 0.2 });
          (event.target as L.Path).getElement()?.style.setProperty("cursor", "pointer");
        },
        mouseout: (event) => {
          (event.target as L.Path).setStyle(districtActiveStyle);
        },
        click: () => {
          map.flyTo(DISTRICT_CENTER, DISTRICT_ZOOM, { duration: 1.2 });
        },
      });
      return;
    }

    layer.on("click", () => toast.info(NO_DATA_TOAST));
  };

  return (
    <GeoJSON
      key="districts"
      data={districtsData as GeoJsonObject}
      style={style}
      onEachFeature={onEachFeature}
    />
  );
}

function MahallaZones({ stats, colorMode }: { stats: MahallaStat[]; colorMode: ZoneColorMode }) {
  const navigate = useNavigate();

  // Геометрия зависит только от набора махаллей, а не от их статистики,
  // поэтому пересчитываем её лишь когда меняется сам список.
  const mahallaKey = stats.map((s) => s.mahalla).join("|");
  const zones = useMemo(
    () => buildMahallaZones(mahallaKey ? (mahallaKey.split("|") as Mahalla[]) : []),
    [mahallaKey],
  );

  const statByMahalla = new Map(stats.map((s) => [s.mahalla, s]));

  // Пустая иконка-якорь: Leaflet ставит tooltip полигона в его геометрический
  // центр, который у вогнутых зон попадает наружу. Поэтому подпись вешаем
  // на отдельный некликабельный маркер в заведомо внутренней точке зоны.
  const labelAnchor = useMemo(() => L.divIcon({ className: "", iconSize: [0, 0] }), []);

  return (
    <>
      {zones.map((zone) => {
        const s = statByMahalla.get(zone.mahalla);
        if (!s) return null;

        const { fillColor, color, base, hover } = zoneStyle(s, colorMode);

        return (
          <Fragment key={zone.mahalla}>
            <Polygon
              positions={zone.positions}
              className="mahalla-zone"
              pathOptions={{ color, fillColor, fillOpacity: base, weight: 1.5 }}
              eventHandlers={{
                mouseover: (event) =>
                  (event.target as L.Path).setStyle({ fillOpacity: hover }),
                mouseout: (event) => (event.target as L.Path).setStyle({ fillOpacity: base }),
              }}
            >
              <Popup>
                <div className="min-w-44 font-sans">
                  <div className="text-sm font-semibold">{zone.mahalla}</div>
                  <div className="mt-1 text-xs text-slate-600">
                    Всего молодёжи: <b>{s.total}</b>
                    <br />
                    Занятые: <b>{s.employed}</b>
                    <br />
                    NEET: <b>{s.neet}</b> ({s.share.toFixed(1)}%)
                  </div>
                  <Button
                    size="sm"
                    className="mt-3 w-full"
                    onClick={() => navigate({ to: "/registry", search: { mahalla: s.mahalla } })}
                  >
                    Открыть махаллю
                  </Button>
                </div>
              </Popup>
            </Polygon>

            {/* keyboard={false} — иначе Leaflet делает пустой якорь подписи
                фокусируемой кнопкой и добавляет 12 лишних шагов в Tab-навигацию */}
            <Marker
              position={zone.center}
              icon={labelAnchor}
              interactive={false}
              keyboard={false}
            >
              <Tooltip
                permanent
                direction="center"
                className="mahalla-zone-label bg-white/80 rounded px-1 text-xs font-medium border-none shadow-none"
              >
                {zone.mahalla}
              </Tooltip>
            </Marker>
          </Fragment>
        );
      })}
    </>
  );
}

function MapLayers({
  zoom,
  stats,
  colorMode,
}: {
  zoom: number;
  stats: MahallaStat[];
  colorMode: ZoneColorMode;
}) {
  if (zoom < REGION_ZOOM_MAX) return <RegionsLayer />;
  if (zoom < DISTRICT_ZOOM_MAX) return <DistrictsLayer />;
  return <MahallaZones stats={stats} colorMode={colorMode} />;
}

export default function DistrictMap({
  stats,
  colorMode,
}: {
  stats: MahallaStat[];
  colorMode: ZoneColorMode;
}) {
  const [map, setMap] = useState<L.Map | null>(null);
  const [zoom, setZoom] = useState(UZBEKISTAN_ZOOM);

  return (
    <div className="relative h-[540px]">
      <MapContainer
        center={UZBEKISTAN_CENTER}
        zoom={UZBEKISTAN_ZOOM}
        scrollWheelZoom
        className="h-full w-full"
      >
        <TileLayer attribution={CARTO_ATTRIBUTION} url={CARTO_TILE_URL} />
        <MapBridge onMap={setMap} onZoom={setZoom} />
        <MapLayers zoom={zoom} stats={stats} colorMode={colorMode} />
      </MapContainer>

      {map && (
        <div className="absolute right-3 top-3 z-[1000] flex flex-col gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="shadow-md"
            onClick={() => map.flyTo(UZBEKISTAN_CENTER, UZBEKISTAN_ZOOM, { duration: 1.2 })}
          >
            Показать весь Узбекистан
          </Button>
          <Button
            size="sm"
            className="shadow-md"
            onClick={() => map.flyTo(DISTRICT_CENTER, DISTRICT_ZOOM, { duration: 1.2 })}
          >
            Вернуться к району
          </Button>
        </div>
      )}
    </div>
  );
}
