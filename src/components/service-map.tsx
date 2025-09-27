'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';

// Dynamically import react-leaflet components on client only to avoid double-initialization
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false }) as any;
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false }) as any;
const Marker = dynamic(() => import('react-leaflet').then((m) => m.Marker), { ssr: false }) as any;
const Popup = dynamic(() => import('react-leaflet').then((m) => m.Popup), { ssr: false }) as any;
const ScaleControl = dynamic(() => import('react-leaflet').then((m) => m.ScaleControl), { ssr: false }) as any;

export type ServiceMapProps = {
  lat: number;
  lng: number;
  title?: string;
  area?: string;
  city?: string;
  zoom?: number;
};

export default function ServiceMap({ lat, lng, title, area, city, zoom = 14 }: ServiceMapProps) {
  const center = useMemo(() => [lat, lng] as [number, number], [lat, lng]);
  const [mounted, setMounted] = useState(false);
  const mapKey = useMemo(() => `${lat}-${lng}-${zoom}`, [lat, lng, zoom]);
  const provider = (process.env.NEXT_PUBLIC_MAP_PROVIDER || 'osm').toLowerCase();
  const googleKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  const prefersGoogle = provider === 'google' && !!googleKey;
  const mapDivRef = useRef<HTMLDivElement | null>(null);
  const gMapRef = useRef<any>(null);
  const gMarkerRef = useRef<any>(null);
  const [googleReady, setGoogleReady] = useState(false);

  // Leaflet extras for the free map
  const markerIcon = useMemo(() => {
    return L.divIcon({
      className: '',
      html: '<div style="width:18px;height:18px;border-radius:50%;background:#22c55e;border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,0.15)"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    });
  }, []);
  const tileUrl = process.env.NEXT_PUBLIC_OSM_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const tileAttrib = process.env.NEXT_PUBLIC_OSM_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load Google Maps script if key provided
  useEffect(() => {
    if (!mounted || !prefersGoogle) return;
    if (typeof window === 'undefined') return;
    const w = window as any;
    if (w.google && w.google.maps) {
      setGoogleReady(true);
      return;
    }
    const existing = document.getElementById('google-maps-script') as HTMLScriptElement | null;
    if (existing) {
      if (w.google && w.google.maps) {
        setGoogleReady(true);
      } else {
        existing.addEventListener('load', () => setGoogleReady(true), { once: true } as any);
      }
      return;
    }
    const lang = (document.documentElement.getAttribute('lang') || 'en').toLowerCase().startsWith('ar') ? 'ar' : 'en';
    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&language=${lang}&region=LY&libraries=places`;
    script.onload = () => setGoogleReady(true);
    document.head.appendChild(script);
  }, [mounted, prefersGoogle, googleKey, provider]);

  // Initialize or update Google Map
  useEffect(() => {
    if (!prefersGoogle || !googleReady || !mapDivRef.current) return;
    const w = window as any;
    const pos = { lat: Number(lat), lng: Number(lng) };
    if (!gMapRef.current) {
      gMapRef.current = new w.google.maps.Map(mapDivRef.current, {
        center: pos,
        zoom,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        zoomControl: true,
      });
      gMarkerRef.current = new w.google.maps.Marker({
        position: pos,
        map: gMapRef.current,
        title: title || 'Service Location',
      });
      if (title || city || area) {
        const info = new w.google.maps.InfoWindow({
          content: `<div class="text-sm"><div class="font-semibold">${title || 'Service Location'}</div><div class="text-muted-foreground">${[area, city].filter(Boolean).join(', ')}</div></div>`,
        });
        gMarkerRef.current.addListener('click', () => info.open({ anchor: gMarkerRef.current, map: gMapRef.current }));
      }
    } else {
      gMapRef.current.setCenter(pos);
      gMapRef.current.setZoom(zoom);
      if (gMarkerRef.current) gMarkerRef.current.setPosition(pos);
    }
  }, [prefersGoogle, googleReady, lat, lng, zoom, title, area, city]);

  return (
    <div className="relative w-full h-72 rounded-lg overflow-hidden border">
      {mounted && prefersGoogle ? (
        <div ref={mapDivRef} className="h-full w-full" />
      ) : mounted && (
        <MapContainer key={mapKey} center={center} zoom={zoom} className="h-full w-full" scrollWheelZoom={false}>
          <TileLayer attribution={tileAttrib} url={tileUrl} />
          <ScaleControl position="bottomleft" />
          <Marker position={center as any} icon={markerIcon as any}>
            <Popup>
              <div className="text-sm space-y-1">
                <div className="font-semibold">{title || 'Service Location'}</div>
                <div className="text-muted-foreground">{[area, city].filter(Boolean).join(', ')}</div>
                <div className="pt-1">
                  <a
                    className="underline"
                    href={`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${zoom}/${lat}/${lng}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    View on OpenStreetMap
                  </a>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      )}
      {provider !== 'google' && process.env.NODE_ENV !== 'production' && (
        <div className="pointer-events-none absolute bottom-2 right-2 rounded bg-background/80 px-2 py-1 text-xs text-muted-foreground shadow">
          Using OpenStreetMap (free)
        </div>
      )}
    </div>
  );
}
