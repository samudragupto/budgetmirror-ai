"use client";

/**
 * Leaflet + OpenStreetMap ward hotspot map (client-only, dynamic ssr:false).
 * CircleMarkers sized by report volume, coloured by worst alignment.
 */
import { useMemo } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import type { Ward } from "@/types/report";

export interface WardHotspot extends Ward {
  reportCount: number;
  worstAlignment: number | null;
  topCategory: string | null;
}

function colorFor(alignment: number | null): string {
  if (alignment === null) return "#64748B";
  if (alignment >= 80) return "#0F766E";
  if (alignment >= 60) return "#B98A2F";
  if (alignment >= 40) return "#C45C26";
  return "#C45C26";
}

export function WardMap({ wards, height = 380 }: { wards: WardHotspot[]; height?: number }) {
  const center = useMemo<[number, number]>(() => {
    const withGeo = wards.filter((w) => w.lat !== null && w.lng !== null);
    if (withGeo.length === 0) return [18.528, 73.855];
    const lat = withGeo.reduce((s, w) => s + (w.lat ?? 0), 0) / withGeo.length;
    const lng = withGeo.reduce((s, w) => s + (w.lng ?? 0), 0) / withGeo.length;
    return [lat, lng];
  }, [wards]);

  return (
    <div>
      <div style={{ height }} className="overflow-hidden rounded-lg border border-ink/12 dark:border-paper/15">
        <MapContainer center={center} zoom={12} scrollWheelZoom={false} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {wards
            .filter((w) => w.lat !== null && w.lng !== null)
            .map((w) => (
              <CircleMarker
                key={w.id}
                center={[w.lat as number, w.lng as number]}
                radius={Math.min(26, 8 + Math.sqrt(w.reportCount) * 1.6)}
                pathOptions={{
                  color: colorFor(w.worstAlignment),
                  fillColor: colorFor(w.worstAlignment),
                  fillOpacity: 0.55,
                  weight: 2,
                }}
              >
                <Tooltip direction="top" offset={[0, -8]}>
                  {w.ward_no ? `Ward ${w.ward_no} · ` : ""}{w.ward_name} — {w.reportCount} reports
                </Tooltip>
                <Popup>
                  <div style={{ fontSize: 13 }}>
                    <strong>{w.ward_no ? `Ward ${w.ward_no} · ` : ""}{w.ward_name}</strong>
                    <br />
                    Reports: {w.reportCount}
                    <br />
                    Worst alignment: {w.worstAlignment ?? "N/A"}
                    {w.topCategory ? (<><br />Top need: {w.topCategory}</>) : null}
                  </div>
                </Popup>
              </CircleMarker>
            ))}
        </MapContainer>
      </div>
      <p className="mt-2 text-xs text-slateink dark:text-paper/60">
        Map summary: {wards.length} wards · circle size = report volume · colour = worst alignment
        (teal aligned → gold fair → coral critical). Ward 5 (Ujjwal Nagar) shows the largest coral hotspot.
      </p>
    </div>
  );
}
