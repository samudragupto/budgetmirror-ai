"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "@/components/ui/skeleton";
import type { WardHotspot } from "@/components/dashboard/ward-map";

const Map = dynamic(
  () => import("@/components/dashboard/ward-map").then((m) => m.WardMap),
  { ssr: false, loading: () => <Skeleton className="h-[380px] w-full" /> },
);

/** Client boundary so server pages can embed the Leaflet map without SSR. */
export function WardMapClient({ wards, height }: { wards: WardHotspot[]; height?: number }) {
  return <Map wards={wards} height={height} />;
}
