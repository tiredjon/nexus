import { useEffect } from "react";
import type L from "leaflet";
import { SIDEBAR_TRANSITION_EVENT } from "./sidebar-collapse";

export function useMapInvalidateOnSidebar(map: L.Map | null) {
  useEffect(() => {
    if (!map) return;

    const onEnd = () => {
      map.invalidateSize();
    };

    window.addEventListener(SIDEBAR_TRANSITION_EVENT, onEnd);
    return () => window.removeEventListener(SIDEBAR_TRANSITION_EVENT, onEnd);
  }, [map]);
}
