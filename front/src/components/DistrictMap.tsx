import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import { useNavigate } from "@tanstack/react-router";
import { MAHALLA_COORDS, type Mahalla } from "@/lib/data";
import { Button } from "./ui/button";

export type MahallaStat = {
  mahalla: Mahalla;
  total: number;
  employed: number;
  neet: number;
  share: number;
};

function color(share: number) {
  if (share < 5) return "#059669";
  if (share <= 12) return "#d97706";
  return "#dc2626";
}

export default function DistrictMap({ stats }: { stats: MahallaStat[] }) {
  const navigate = useNavigate();

  return (
    <MapContainer center={[41.335, 69.335]} zoom={13} scrollWheelZoom style={{ height: 540 }}>
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {stats.map((s) => (
        <CircleMarker
          key={s.mahalla}
          center={MAHALLA_COORDS[s.mahalla]}
          radius={Math.max(12, Math.min(38, Math.sqrt(s.total) * 3.2))}
          pathOptions={{
            color: color(s.share),
            fillColor: color(s.share),
            fillOpacity: 0.35,
            weight: 2,
          }}
        >
          <Popup>
            <div className="min-w-44 font-sans">
              <div className="text-sm font-semibold">{s.mahalla}</div>
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
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
