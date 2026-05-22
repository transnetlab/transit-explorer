import { useEffect, useMemo, useRef, useState } from 'react';
import maplibregl, { LngLatBoundsLike } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-csp-worker.js?url';
import { getRouteDetails, getRouteStops } from '../api';
import { Stop, RouteResponse } from '../types';
import { Clock, Route } from 'lucide-react';

interface Map3DProps {
  path: [number, number][];
  selectedRouteId: string | null;
  selectedStop?: Stop | null;
  showStopOnly?: boolean;
  center?: [number, number];
}

const DEFAULT_CENTER: [number, number] = [12.9716, 77.5946];
const DEFAULT_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

const ROUTE_SOURCE_ID = 'route';
const ROUTE_LINE_LAYER_ID = 'route-line';
const ROUTE_LINE_ANIM_LAYER_ID = 'route-line-anim';

const ROUTE_LINE_COLOR = '#2563eb';
const ROUTE_LINE_WIDTH = 6;
const ROUTE_LINE_OPACITY = 0.9;

const BUS_SOURCE_ID = 'bus';
const BUS_LAYER_ID = 'bus-symbol';
const BUS_ICON_ID = 'bus-icon';
const BUS_ICON_SIZE = 0.09;
const BUS_SPEED_METERS_PER_SECOND = 30; // ~36 km/h

// User-provided icon (project root). Vite will bundle this and return a URL.
const BUS_PNG_URL = new URL('../../bus1.png', import.meta.url).toString();

const ensureRouteSourceWithLineMetrics = (map: maplibregl.Map, routeData: any) => {
  const existing = map.getSource(ROUTE_SOURCE_ID) as any;
  const hasLineMetrics = Boolean(existing?.__lineMetricsEnabled || existing?._options?.lineMetrics);

  if (existing && !hasLineMetrics) {
    try {
      if (map.getLayer(ROUTE_LINE_ANIM_LAYER_ID)) map.removeLayer(ROUTE_LINE_ANIM_LAYER_ID);
    } catch {
      // ignore
    }
    try {
      if (map.getLayer(ROUTE_LINE_LAYER_ID)) map.removeLayer(ROUTE_LINE_LAYER_ID);
    } catch {
      // ignore
    }
    try {
      map.removeSource(ROUTE_SOURCE_ID);
    } catch {
      // ignore
    }
  }

  if (!map.getSource(ROUTE_SOURCE_ID)) {
    map.addSource(ROUTE_SOURCE_ID, {
      type: 'geojson',
      data: routeData,
      lineMetrics: true,
    } as any);
    try {
      (map.getSource(ROUTE_SOURCE_ID) as any).__lineMetricsEnabled = true;
    } catch {
      // ignore
    }
  }
};

const ensureRouteAnimLayer = (map: maplibregl.Map) => {
  if (map.getLayer(ROUTE_LINE_ANIM_LAYER_ID)) return;

  // A moving, thicker highlight segment that travels along the route.
  // Uses `line-progress`, so the route source must have `lineMetrics: true`.
  map.addLayer(
    {
      id: ROUTE_LINE_ANIM_LAYER_ID,
      type: 'line',
      source: ROUTE_SOURCE_ID,
      layout: { 'line-join': 'round', 'line-cap': 'round' },
      paint: {
        'line-width': ROUTE_LINE_WIDTH + 4,
        'line-opacity': 0.9,
        'line-blur': 1,
        'line-gradient': ['interpolate', ['linear'], ['line-progress'], 0, 'transparent', 1, 'transparent'],
      },
    } as any,
    // Keep the animated highlight below stops (if stops are present).
    map.getLayer('stops-circle') ? 'stops-circle' : undefined
  );
};

const toLngLat = (p: [number, number]): [number, number] => [p[1], p[0]]; // [lat,lon] -> [lon,lat]

const haversineMeters = (a: [number, number], b: [number, number]): number => {
  const R = 6371000;
  const lat1 = (a[0] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const dLat = lat2 - lat1;
  const dLon = ((b[1] - a[1]) * Math.PI) / 180;
  const sinDLat = Math.sin(dLat / 2);
  const sinDLon = Math.sin(dLon / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const pointAtDistanceMeters = (pathLatLon: [number, number][], distMeters: number): [number, number] => {
  if (pathLatLon.length === 0) return DEFAULT_CENTER;
  if (pathLatLon.length === 1) return pathLatLon[0];

  const totalSegs = pathLatLon.length - 1;
  let remaining = Math.max(0, distMeters);

  for (let i = 0; i < totalSegs; i++) {
    const p0 = pathLatLon[i];
    const p1 = pathLatLon[i + 1];
    const seg = haversineMeters(p0, p1);
    if (seg <= 0) continue;
    if (remaining <= seg) {
      const t = remaining / seg;
      return [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)];
    }
    remaining -= seg;
  }

  return pathLatLon[pathLatLon.length - 1];
};

const ensureBusIcon = (map: maplibregl.Map) => {
  if (map.hasImage(BUS_ICON_ID)) return;

  const fallbackSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
      <rect x="14" y="10" width="36" height="34" rx="6" fill="#2563eb" stroke="#ffffff" stroke-width="3"/>
      <rect x="20" y="16" width="10" height="10" rx="2" fill="#ffffff" opacity="0.95"/>
      <rect x="34" y="16" width="10" height="10" rx="2" fill="#ffffff" opacity="0.95"/>
      <rect x="20" y="30" width="24" height="8" rx="2" fill="#1d4ed8" opacity="0.9"/>
      <circle cx="22" cy="48" r="6" fill="#0f172a"/>
      <circle cx="42" cy="48" r="6" fill="#0f172a"/>
      <circle cx="22" cy="48" r="3" fill="#ffffff" opacity="0.9"/>
      <circle cx="42" cy="48" r="3" fill="#ffffff" opacity="0.9"/>
    </svg>
  `.trim();

  const addToMap = (img: HTMLImageElement) => {
    try {
      if (!map.hasImage(BUS_ICON_ID)) {
        map.addImage(BUS_ICON_ID, img);
      }
      try {
        map.triggerRepaint();
      } catch {
        // ignore
      }
    } catch {
      // ignore
    }
  };

  const tryFallbackSvg = () => {
    const fallback = new Image();
    fallback.onload = () => addToMap(fallback);
    fallback.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(fallbackSvg)}`;
  };

  // Preferred: user-provided bus1.png
  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.onload = () => addToMap(img);
  img.onerror = () => tryFallbackSvg();
  img.src = BUS_PNG_URL;
};

const ensureBusLayer = (map: maplibregl.Map) => {
  // Make sure the icon is registered before we create the symbol layer.
  ensureBusIcon(map);

  const layer: any = map.getLayer(BUS_LAYER_ID) as any;
  const isSymbolLayer = layer && layer.type === 'symbol';

  // If an older bus layer exists (circle), remove it.
  if (layer && !isSymbolLayer) {
    try {
      map.removeLayer(BUS_LAYER_ID);
    } catch {
      // ignore
    }
  }

  if (!map.getLayer(BUS_LAYER_ID)) {
    map.addLayer({
      id: BUS_LAYER_ID,
      type: 'symbol',
      source: BUS_SOURCE_ID,
      layout: {
        'icon-image': BUS_ICON_ID,
        'icon-size': BUS_ICON_SIZE,
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-anchor': 'center',
      },
    });
  } else {
    // If the layer exists (symbol), re-assert its icon properties.
    try {
      map.setLayoutProperty(BUS_LAYER_ID, 'icon-image', BUS_ICON_ID);
      map.setLayoutProperty(BUS_LAYER_ID, 'icon-size', BUS_ICON_SIZE);
      map.setLayoutProperty(BUS_LAYER_ID, 'icon-allow-overlap', true);
      map.setLayoutProperty(BUS_LAYER_ID, 'icon-ignore-placement', true);
      map.setLayoutProperty(BUS_LAYER_ID, 'icon-anchor', 'center');
    } catch {
      // ignore
    }
  }
};

export function Map3D({ path, selectedRouteId, selectedStop, showStopOnly = false, center }: Map3DProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [styleReady, setStyleReady] = useState(false);

  const mapCenter = center || DEFAULT_CENTER;
  const [stops, setStops] = useState<Stop[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteResponse | null>(null);

  const busGeoJson = useMemo(() => {
    const startLngLat = path.length ? toLngLat(path[0]) : ([mapCenter[1], mapCenter[0]] as [number, number]);
    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: startLngLat,
          },
        },
      ],
    } as const;
  }, [path, mapCenter]);

  const busGeoJsonRef = useRef(busGeoJson);
  useEffect(() => {
    busGeoJsonRef.current = busGeoJson;
  }, [busGeoJson]);

  const routeGeoJson = useMemo(() => {
    return {
      type: 'FeatureCollection',
      features: path.length
        ? [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'LineString',
                coordinates: path.map(toLngLat),
              },
            },
          ]
        : [],
    } as const;
  }, [path]);

  const routeGeoJsonRef = useRef(routeGeoJson);
  useEffect(() => {
    routeGeoJsonRef.current = routeGeoJson;
  }, [routeGeoJson]);

  const stopsGeoJson = useMemo(() => {
    const effectiveStops = showStopOnly && selectedStop ? [selectedStop] : stops;
    return {
      type: 'FeatureCollection',
      features: effectiveStops
        .filter((s) => Number.isFinite(Number(s.stop_lat)) && Number.isFinite(Number(s.stop_lon)))
        .map((s, idx) => ({
          type: 'Feature',
          properties: {
            stop_id: s.stop_id,
            stop_name: s.stop_name,
            kind: idx === 0 ? 'start' : idx === effectiveStops.length - 1 ? 'end' : 'mid',
          },
          geometry: {
            type: 'Point',
            coordinates: [Number(s.stop_lon), Number(s.stop_lat)],
          },
        })),
    } as const;
  }, [stops, showStopOnly, selectedStop]);

  const stopsGeoJsonRef = useRef(stopsGeoJson);
  useEffect(() => {
    stopsGeoJsonRef.current = stopsGeoJson;
  }, [stopsGeoJson]);

  // Fetch stops + details (same as 2D map)
  useEffect(() => {
    const fetchRouteData = async () => {
      if (selectedRouteId !== null) {
        try {
          const routeStops = await getRouteStops(selectedRouteId);
          setStops(routeStops);
          const details = await getRouteDetails(selectedRouteId);
          setRouteInfo(details);
        } catch (error) {
          console.error('Error fetching route data:', error);
        }
      } else {
        setStops([]);
        setRouteInfo(null);
      }
    };

    fetchRouteData();
  }, [selectedRouteId]);

  // Init map
  useEffect(() => {
    if (!containerRef.current) return;
    if (mapRef.current) return;

    // Use the official CSP worker bundle. This avoids Blob/stringified workers
    // which can fail in some bundling/electron setups (e.g. "__publicField is not defined").
    try {
      maplibregl.setWorkerUrl(maplibreWorkerUrl);
    } catch {
      // ignore
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: DEFAULT_STYLE_URL,
      center: [mapCenter[1], mapCenter[0]],
      zoom: 14.5,
      pitch: 65,
      bearing: -17,
    });

    map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-right');

    const handleStyleLoad = () => {
      setStyleReady(true);

      // Route line
      ensureRouteSourceWithLineMetrics(map, routeGeoJsonRef.current as any);
      if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LINE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ROUTE_LINE_COLOR,
            'line-width': ROUTE_LINE_WIDTH,
            'line-opacity': ROUTE_LINE_OPACITY,
          },
        });
      }

      // Stops
      if (!map.getSource('stops')) {
        map.addSource('stops', { type: 'geojson', data: stopsGeoJsonRef.current as any });
      }
      if (!map.getLayer('stops-circle')) {
        map.addLayer({
          id: 'stops-circle',
          type: 'circle',
          source: 'stops',
          paint: {
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': '#ffffff',
            'circle-color': [
              'match',
              ['get', 'kind'],
              'start',
              '#16a34a',
              'end',
              '#dc2626',
              '#2563eb',
            ],
            'circle-opacity': 0.95,
          },
        });
      }

      // Animated highlight overlay on the route line
      try {
        ensureRouteAnimLayer(map);
      } catch {
        // ignore
      }

      // Animated bus marker
      if (!map.getSource(BUS_SOURCE_ID)) {
        map.addSource(BUS_SOURCE_ID, { type: 'geojson', data: busGeoJsonRef.current as any });
      }
      ensureBusLayer(map);

      // Popup on stop click
      map.on('click', 'stops-circle', (e) => {
        const feature = e.features?.[0];
        const coords = (feature?.geometry as any)?.coordinates as [number, number] | undefined;
        if (!coords) return;
        const stopName = String((feature?.properties as any)?.stop_name || 'Stop');
        new maplibregl.Popup({ closeButton: true, closeOnClick: true })
          .setLngLat(coords)
          .setHTML(`<div style="font-weight:600">${stopName}</div>`)
          .addTo(map);
      });

      map.on('mouseenter', 'stops-circle', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'stops-circle', () => {
        map.getCanvas().style.cursor = '';
      });

      // 3D buildings
      // Many public styles don't ship building heights; OpenFreeMap does.
      // We force-enable an extrusion layer at a slightly lower minzoom so the city looks 3D sooner.
      try {
        const sourceId = map.getSource('openmaptiles')
          ? 'openmaptiles'
          : map.getSource('composite')
            ? 'composite'
            : null;

        if (!sourceId) return;

        // If the style already has its own building extrusion, hide it to avoid double-rendering.
        if (map.getLayer('building-3d')) {
          map.setLayoutProperty('building-3d', 'visibility', 'none');
        }
        if (!map.getLayer('3d-buildings')) {
          const layers = map.getStyle().layers || [];
          const labelLayerId = layers.find((l) => l.type === 'symbol' && (l.layout as any)?.['text-field'])?.id;
          map.addLayer(
            {
              id: '3d-buildings',
              source: sourceId,
              'source-layer': 'building',
              type: 'fill-extrusion',
              minzoom: 12,
              paint: {
                'fill-extrusion-color': 'hsl(35, 8%, 85%)',
                'fill-extrusion-height': ['coalesce', ['get', 'render_height'], ['get', 'height'], 0],
                'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], ['get', 'min_height'], 0],
                'fill-extrusion-opacity': 0.85,
              },
            } as any,
            labelLayerId
          );
        }
      } catch {
        // If the style doesn't support it, skip quietly.
      }
    };

    map.on('style.load', handleStyleLoad);
    // In some environments the style can be loaded extremely quickly; ensure initialization still runs.
    if (map.isStyleLoaded()) {
      handleStyleLoad();
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update data sources when props change
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;

    // HMR-safe: if the map instance persisted, ensure the route source/layers exist.
    try {
      ensureRouteSourceWithLineMetrics(map, routeGeoJsonRef.current as any);
    } catch {
      // ignore
    }
    try {
      if (!map.getLayer(ROUTE_LINE_LAYER_ID)) {
        map.addLayer({
          id: ROUTE_LINE_LAYER_ID,
          type: 'line',
          source: ROUTE_SOURCE_ID,
          layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ROUTE_LINE_COLOR,
            'line-width': ROUTE_LINE_WIDTH,
            'line-opacity': ROUTE_LINE_OPACITY,
          },
        } as any);
      }
    } catch {
      // ignore
    }
    try {
      ensureRouteAnimLayer(map);
    } catch {
      // ignore
    }
  }, [styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const src = map.getSource(ROUTE_SOURCE_ID) as any;
    if (src?.setData) src.setData(routeGeoJson as any);

    // HMR/style-reload safe: ensure the animated overlay layer exists.
    try {
      ensureRouteAnimLayer(map);
    } catch {
      // ignore
    }
  }, [routeGeoJson, styleReady]);

  // Animate a moving highlight segment along the route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (path.length < 2) return;

    // Ensure the layer exists before animating.
    try {
      ensureRouteAnimLayer(map);
    } catch {
      // ignore
    }
    if (!map.getLayer(ROUTE_LINE_ANIM_LAYER_ID)) return;

    let raf = 0;
    let lastPaintUpdate = 0;
    const start = performance.now();

    // Speed is "line-progress" units per second.
    const speed = 0.14;
    const halfWindow = 0.06;

    const tick = (now: number) => {
      // Throttle paint updates a bit to avoid hammering the renderer.
      if (now - lastPaintUpdate >= 33) {
        lastPaintUpdate = now;
        const t = (((now - start) / 1000) * speed) % 1;
        const a = Math.max(0, t - halfWindow);
        const b = Math.min(1, t + halfWindow);

        const gradient: any = [
          'interpolate',
          ['linear'],
          ['line-progress'],
          0,
          'transparent',
          a,
          'transparent',
          t,
          ROUTE_LINE_COLOR,
          b,
          'transparent',
          1,
          'transparent',
        ];

        try {
          map.setPaintProperty(ROUTE_LINE_ANIM_LAYER_ID, 'line-gradient', gradient);
        } catch {
          // ignore
        }
      }

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [path, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const src = map.getSource(BUS_SOURCE_ID) as any;
    if (src?.setData) src.setData(busGeoJson as any);

    // HMR-safe: if the map instance persisted, upgrade the bus layer.
    try {
      ensureBusLayer(map);
    } catch {
      // ignore
    }
  }, [busGeoJson, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    const src = map.getSource('stops') as any;
    if (src?.setData) src.setData(stopsGeoJson as any);
  }, [stopsGeoJson, styleReady]);

  // Animate bus along the route polyline
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) return;
    if (path.length < 2) return;

    // Total route length in meters
    let totalMeters = 0;
    for (let i = 0; i < path.length - 1; i++) {
      totalMeters += haversineMeters(path[i], path[i + 1]);
    }
    if (!Number.isFinite(totalMeters) || totalMeters <= 0) return;

    const busData: any = {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          properties: {},
          geometry: { type: 'Point', coordinates: toLngLat(path[0]) },
        },
      ],
    };

    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsedSec = (now - start) / 1000;
      const meters = (elapsedSec * BUS_SPEED_METERS_PER_SECOND) % totalMeters;
      const pLatLon = pointAtDistanceMeters(path, meters);
      busData.features[0].geometry.coordinates = toLngLat(pLatLon);

      const src = map.getSource(BUS_SOURCE_ID) as any;
      if (src?.setData) src.setData(busData);

      raf = requestAnimationFrame(tick);
    };

    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [path, styleReady]);

  // Fit view to selected stop / route / center
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (selectedStop && showStopOnly) {
      map.easeTo({ center: [Number(selectedStop.stop_lon), Number(selectedStop.stop_lat)], zoom: 16, duration: 800 });
      return;
    }

    if (path.length > 0) {
      const coords = path.map(toLngLat);
      const bounds = coords.reduce(
        (b, c) => b.extend(c),
        new maplibregl.LngLatBounds(coords[0], coords[0])
      );
      map.fitBounds(bounds as unknown as LngLatBoundsLike, {
        padding: 60,
        maxZoom: 16,
        duration: 800,
        pitch: 65,
        bearing: -17,
      });
      return;
    }

    map.easeTo({ center: [mapCenter[1], mapCenter[0]], zoom: 14.5, pitch: 65, bearing: -17, duration: 800 });
  }, [path, mapCenter, selectedStop, showStopOnly]);

  return (
    <div className="relative w-full h-full">
      <div ref={containerRef} className="w-full h-full" />

      {routeInfo && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 sm:p-8 z-[1000] max-w-[calc(100vw-2rem)] sm:max-w-xs border border-black">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <div className="flex items-center text-gray-700">
              <Clock size={16} className="mr-1" />
              <span className="text-sm font-medium">{routeInfo.estimated_duration}</span>
            </div>
            <div className="flex items-center text-gray-700">
              <Route size={16} className="mr-1" />
              <span className="text-sm font-medium">{routeInfo.total_distance}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
