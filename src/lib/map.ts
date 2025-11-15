// Shared map config for Leaflet/Google map components
// Keep this file side-effect free; consume only in client components.

// Default to standard OSM tiles with street/place labels.
// Can be overridden via NEXT_PUBLIC_OSM_TILE_URL if needed.
export const tileUrl =
  process.env.NEXT_PUBLIC_OSM_TILE_URL ||
  "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";

// We render attribution via a tiny overlay near the map UI.
// This string can be overridden via NEXT_PUBLIC_OSM_ATTRIBUTION.
export const tileAttribution =
  process.env.NEXT_PUBLIC_OSM_ATTRIBUTION ||
  "@ Khidmaty & CloudAI Academy";

// Reusable HTML for a simple green circular marker rendered via Leaflet divIcon
export const markerHtml =
  '<div style="width:20px;height:20px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.15)"></div>';
