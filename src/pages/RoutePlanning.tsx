// import { useMemo, useState, useEffect } from 'react';
// import { useNavigate, useParams } from 'react-router-dom';
// import { MapContainer, TileLayer, Marker, Polyline, Popup, useMapEvents } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import L from 'leaflet';
// import { ArrowLeft, MapPin, Navigation, RefreshCcw, Shuffle, Menu, X, Clock, Route as RouteIcon } from 'lucide-react';
// import { defaultCities } from './CitySelection';

// // Marker icons
// // default icon available if needed in future

// const startIcon = L.icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ city: cityString || 'Bangalore, Karnataka, India', start_coords, end_coords })
//       });
//       if (!res.ok) {
//         const text = await res.text().catch(() => 'Failed to fetch route');
//         throw new Error(text || 'Failed to fetch route');
//       }
//       const json = await res.json();
//       if (!json?.success) {
//         throw new Error(json?.message || 'Route not available');
//       }
//       const data = json.data || {};
//       const coords = Array.isArray(data.path_coords) ? data.path_coords : [];
//       const mapped: [number, number][] = coords.map((p: any) => [Number(p[0]), Number(p[1])]).filter((p: [number, number]) => Number.isFinite(p[0]) && Number.isFinite(p[1]));
//       if (mapped.length === 0) throw new Error('Empty route path');
//       setRoutePath(mapped);
//       setRouteInfo({
//         estimated_duration: data.estimated_duration || '',
//         total_distance: data.total_distance || ''
//       });
//     } catch (err: any) {
//       setServerError(err?.message || 'Failed to compute route');
//       setRoutePath([]);
//       setRouteInfo(null);
//     } finally {
//       setLoading(false);
//     }
//   };

//   // Parse strings like "2h 32min" or "45 min" into milliseconds
//   const parseDurationToMs = (s: string): number => {
//     if (!s) return 0;
//     const lc = s.toLowerCase();
//     let hours = 0;
//     let minutes = 0;
//     const hMatch = lc.match(/(\d+(?:\.\d+)?)\s*h/);
//     const mMatch = lc.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minutes?)/);
//     if (hMatch) hours = parseFloat(hMatch[1]);
//     if (mMatch) minutes = parseFloat(mMatch[1]);
//     // Fallback: patterns like "150" alone treated as minutes
//     if (!hMatch && !mMatch) {
//       const numOnly = lc.match(/\d+/);
//       if (numOnly) minutes = parseFloat(numOnly[0]);
//     }
//     const totalMin = hours * 60 + minutes;
//     return Math.max(0, Math.round(totalMin)) * 60 * 1000;
//   };

//   const etaString = useMemo(() => {
//     if (!routeInfo?.estimated_duration) return null;
//     const ms = parseDurationToMs(routeInfo.estimated_duration);
//     if (!ms) return null;
//     const etaDate = new Date(Date.now() + ms);
//     return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   }, [routeInfo?.estimated_duration]);

//   return (
//     <div className="h-screen relative flex flex-col md:flex-row bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors">
//       {/* Mobile sidebar toggle */}
//       <button
//         onClick={() => setIsSidebarOpen(!isSidebarOpen)}
//         className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
//       >
//         {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
//       </button>

//       {/* Sidebar */}
//       <div
//         className={`
//           ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
//           transition-transform duration-300
//           md:translate-x-0
//           w-full md:w-1/3 lg:w-1/4
//           bg-gray-50 dark:bg-gray-800
//           fixed md:relative
//           h-screen
//           z-40
//           overflow-hidden
//         `}
//       >
//         <div className="h-full p-6 overflow-y-auto">
//           <div className="pt-12 md:pt-0">
//             <div className="flex items-center gap-4 mb-4">
//               <button
//                 onClick={() => {
//                   const selectedCity = city || localStorage.getItem('selectedCityId');
//                   if (selectedCity) {
//                     navigate(`/${selectedCity}`);
//                   } else {
//                     navigate('/city-selection');
//                   }
//                 }}
//                 className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
//               >
//                 <ArrowLeft size={24} className="text-blue-600" />
//               </button>
//               <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Route Planning</h1>
//             </div>
//             <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Pick two points in {city} by typing coordinates or clicking on the map.</p>

//             {routeInfo && (
//               <div className="mb-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
//                 <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Estimated Trip</h2>
//                 <div className="flex flex-wrap gap-4 text-sm text-gray-800 dark:text-gray-200">
//                   <div className="flex items-center"><Clock size={16} className="mr-2 text-blue-600" />{routeInfo.estimated_duration}</div>
//                   <div className="flex items-center"><RouteIcon size={16} className="mr-2 text-blue-600" />{routeInfo.total_distance}</div>
//                   {etaString && (
//                     <div className="flex items-center"><Clock size={16} className="mr-2 text-blue-600" />ETA {etaString}</div>
//                   )}
//                 </div>
//               </div>
//             )}

//             <div className="space-y-4">
//               <div>
//                 <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Source (lat, lon)</label>
//                 <div className="mt-2 grid grid-cols-2 gap-2">
//                   <input
//                     className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Latitude (e.g., 12.9716)"
//                     value={source.lat ?? ''}
//                     onChange={(e) => {
//                       const v = e.target.value === '' ? null : clampLat(parseFloat(e.target.value));
//                       setSource(s => ({ ...s, lat: Number.isFinite(v as number) ? (v as number) : null }));
//                     }}
//                   />
//                   <input
//                     className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Longitude (e.g., 77.5946)"
//                     value={source.lon ?? ''}
//                     onChange={(e) => {
//                       const v = e.target.value === '' ? null : clampLon(parseFloat(e.target.value));
//                       setSource(s => ({ ...s, lon: Number.isFinite(v as number) ? (v as number) : null }));
//                     }}
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setPickMode('source')}
//                   className={`mt-2 inline-flex items-center px-3 py-2 rounded-lg text-sm transition-colors shadow-sm ${pickMode === 'source' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
//                 >
//                   <MapPin size={16} className="mr-2" /> Pick Source on Map
//                 </button>
//               </div>

//               <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
//                 <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Destination (lat, lon)</label>
//                 <div className="mt-2 grid grid-cols-2 gap-2">
//                   <input
//                     className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Latitude (e.g., 12.9750)"
//                     value={dest.lat ?? ''}
//                     onChange={(e) => {
//                       const v = e.target.value === '' ? null : clampLat(parseFloat(e.target.value));
//                       setDest(s => ({ ...s, lat: Number.isFinite(v as number) ? (v as number) : null }));
//                     }}
//                   />
//                   <input
//                     className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
//                     placeholder="Longitude (e.g., 77.6000)"
//                     value={dest.lon ?? ''}
//                     onChange={(e) => {
//                       const v = e.target.value === '' ? null : clampLon(parseFloat(e.target.value));
//                       setDest(s => ({ ...s, lon: Number.isFinite(v as number) ? (v as number) : null }));
//                     }}
//                   />
//                 </div>
//                 <button
//                   type="button"
//                   onClick={() => setPickMode('dest')}
//                   className={`mt-2 inline-flex items-center px-3 py-2 rounded-lg text-sm transition-colors shadow-sm ${pickMode === 'dest' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
//                 >
//                   <MapPin size={16} className="mr-2" /> Pick Destination on Map
//                 </button>
//               </div>

//               <div className="flex gap-2 pt-2">
//                 <button
//                   type="button"
//                   onClick={handleSwap}
//                   className="inline-flex items-center px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
//                   disabled={!bothSet}
//                   title={!bothSet ? 'Set both points first' : 'Swap points'}
//                 >
//                   <Shuffle size={16} className="mr-2" /> Swap
//                 </button>
//                 <button
//                   type="button"
//                   onClick={handleReset}
//                   className="inline-flex items-center px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
//                 >
//                   <RefreshCcw size={16} className="mr-2" /> Reset
//                 </button>
//               </div>

//               <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
//                 {pickMode ? (
//                   <div className="py-2 px-3 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
//                     Click on the map to set the {pickMode === 'source' ? 'source' : 'destination'} point.
//                   </div>
//                 ) : (
//                   <div className="py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
//                     Tip: You can type coordinates or use the map pickers.
//                   </div>
//                 )}
//               </div>

//               {bothSet && (
//                 <div className="mt-3 p-3 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
//                   <div className="font-medium mb-1 flex items-center">
//                     <Navigation size={16} className="mr-2" /> Points ready
//                   </div>
//                   <div>Source: {source.lat?.toFixed(6)}, {source.lon?.toFixed(6)}</div>
//                   <div>Destination: {dest.lat?.toFixed(6)}, {dest.lon?.toFixed(6)}</div>
//                     <button
//                       type="button"
//                       onClick={planRoute}
//                       className="mt-3 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
//                       disabled={loading}
//                     >
//                       {loading ? (
//                         <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Planning…</span>
//                       ) : (
//                         <span className="flex items-center"><Navigation size={16} className="mr-2" />Plan Route</span>
//                       )}
//                     </button>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Map side */}
//       <div className={`
//         flex-1
//         h-screen
//         transition-[margin]
//         duration-300
//         ${isSidebarOpen ? 'md:ml-0' : ''}
//       `}>
//         {loading && (
//           <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-20">
//             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
//           </div>
//         )}
//         {serverError && (
//           <div className="absolute top-4 right-4 z-20 bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm shadow">
//             {serverError}
//           </div>
//         )}
//         <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
//           {pickMode ? (
//             <div className="flex items-center"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>Click the map to set {pickMode === 'source' ? 'Source' : 'Destination'}</div>
//           ) : (
//             <div className="flex items-center gap-3">
//               <div className="flex items-center"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>Source</div>
//               <div className="flex items-center"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>Destination</div>
//             </div>
//           )}
//         </div>
//         {/* Bottom-left route stats */
//         }
//         {routeInfo && (
//           <div className="absolute bottom-4 left-4 z-10 bg-white/95 dark:bg-gray-900/90 border border-gray-200 dark:border-gray-700 rounded-lg shadow px-4 py-3 text-sm text-gray-800 dark:text-gray-200 flex gap-6">
//             <div className="flex items-center"><Clock size={16} className="mr-2" />{routeInfo.estimated_duration}</div>
//             <div className="flex items-center"><RouteIcon size={16} className="mr-2" />{routeInfo.total_distance}</div>
//             {etaString && (
//               <div className="flex items-center"><Clock size={16} className="mr-2" />ETA {etaString}</div>
//             )}
//           </div>
//         )}
//         <MapContainer center={cityCenter} zoom={12} className="w-full h-full">
//           <TileLayer
//             url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
//             subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
//             maxZoom={20}
//           />
//           <ClickCatcher />
//           {source.lat !== null && source.lon !== null && (
//             <Marker
//               position={[source.lat, source.lon]}
//               icon={startIcon}
//               draggable
//               eventHandlers={{
//                 dragend: (e) => {
//                   const latlng = (e.target as any).getLatLng();
//                   setSource({ lat: clampLat(latlng.lat), lon: clampLon(latlng.lng) });
//                 }
//               }}
//             >
//               <Popup>
//                 <div className="font-semibold">Source</div>
//                 <div className="text-xs text-gray-600">{source.lat.toFixed(6)}, {source.lon.toFixed(6)}</div>
//               </Popup>
//             </Marker>
//           )}
//           {dest.lat !== null && dest.lon !== null && (
//             <Marker
//               position={[dest.lat, dest.lon]}
//               icon={endIcon}
//               draggable
//               eventHandlers={{
//                 dragend: (e) => {
//                   const latlng = (e.target as any).getLatLng();
//                   setDest({ lat: clampLat(latlng.lat), lon: clampLon(latlng.lng) });
//                 }
//               }}
//             >
//               <Popup>
//                 <div className="font-semibold">Destination</div>
//                 <div className="text-xs text-gray-600">{dest.lat.toFixed(6)}, {dest.lon.toFixed(6)}</div>
//               </Popup>
//             </Marker>
//           )}
//           {(routePath.length > 0 || straightPath.length > 0) && (
//             <Polyline
//               positions={routePath.length > 0 ? routePath : straightPath}
//               pathOptions={{ color: routePath.length > 0 ? 'blue' : 'gray', weight: 4, opacity: 0.8 }}
//             />
//           )}
//         </MapContainer>
//       </div>
//     </div>
//   );
// }

// export default RoutePlanning;
import { useMemo, useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Polyline, Popup, Tooltip, useMapEvents, useMap, Circle, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { ArrowLeft, MapPin, Navigation, RefreshCcw, Shuffle, Menu, X, Clock, Route as RouteIcon } from 'lucide-react';
import { defaultCities } from './CitySelection';
import { getDefaultCityCalendarCheckService, getDefaultCityCalendarRange, getStops, getUserCities, runRaptor } from '../api';
import { Stop } from '../types';
import { API_2_BASES } from '../config';
import { fetchWithFallback } from '../http';

// Marker icons
// default icon available if needed in future

const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const legPinIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

type Point = { lat: number | null; lon: number | null };

type RouteOptionKey = '1' | '2' | '3';
type RouteOptionView = RouteOptionKey | 'all';

type RouteSegmentMode = 'transit' | 'walk' | 'unknown';
type RouteSegment = {
  path: [number, number][];
  mode: RouteSegmentMode;
  label?: string;
  anchor?: [number, number];
  fromStopId?: string;
  toStopId?: string;
  fromCoord?: [number, number];
  toCoord?: [number, number];
  fromName?: string;
  toName?: string;
  estimatedDuration?: string;
  estimatedDistance?: string;
  departTime?: string;
  arriveTime?: string;
};

type RouteOption = {
  path: [number, number][];
  segments: RouteSegment[];
  info: { estimated_duration: string; total_distance: string } | null;
};

const ROUTE_OPTION_COLORS: Record<RouteOptionKey, string> = {
  '1': 'blue',
  // Darker pink to improve visibility on the map and UI.
  '2': '#be185d',
  '3': 'green',
};

const LEG_FLAG_ICON_CACHE = new Map<string, any>();

const makeLegFlagIcon = (tag: 'TRANSIT' | 'WALK', label: string, color: string) => {
  const cleanLabel = String(label || '').trim() || (tag === 'WALK' ? 'Walk' : 'Transit');
  const cacheKey = tag === 'WALK' ? `${tag}||${color}` : `${tag}||${color}||${cleanLabel}`;
  const cached = LEG_FLAG_ICON_CACHE.get(cacheKey);
  if (cached) return cached;

  const safe = cleanLabel;
  const html = `
    <div style="
      display:inline-flex;
      align-items:center;
      gap:6px;
      padding:2px 6px;
      border-radius:9999px;
      background:rgba(255,255,255,0.92);
      border:1.5px solid ${color};
      color:${color};
      font-size:11px;
      font-weight:600;
      line-height:14px;
      box-shadow:0 1px 2px rgba(0,0,0,0.15);
      white-space:nowrap;
    ">
      <span style="font-size:10px; font-weight:700;">${tag}</span>
      ${tag === 'WALK' ? '' : `<span>${safe.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</span>`}
    </div>
  `.trim();

  const icon = L.divIcon({
    html,
    className: 'transit-flag-icon',
    iconSize: undefined,
    iconAnchor: [0, 0],
  });

  LEG_FLAG_ICON_CACHE.set(cacheKey, icon);
  return icon;
};

const isRaptorFixtureEnabled = (): boolean => {
  // Primarily a dev/testing tool. Allow enabling on localhost even in non-DEV builds
  // (e.g., Electron packaged app or preview) so it remains testable.
  const isLocalHost = (() => {
    try {
      const h = String(window.location.hostname || '').toLowerCase();
      return h === 'localhost' || h === '127.0.0.1' || h === '::1';
    } catch {
      return false;
    }
  })();

  if (!import.meta.env.DEV && !isLocalHost) return false;
  try {
    const qs = new URLSearchParams(window.location.search);
    if (qs.get('raptorFixture') === '1') return true;
  } catch {
    // ignore
  }
  // HashRouter puts route + query inside the hash, e.g.
  //   http://localhost:3000/#/austin/route-planning?raptorFixture=1
  // so we also parse querystring from window.location.hash.
  try {
    const hash = String(window.location.hash || '');
    const qIndex = hash.indexOf('?');
    if (qIndex >= 0 && qIndex + 1 < hash.length) {
      const qs = new URLSearchParams(hash.slice(qIndex + 1));
      if (qs.get('raptorFixture') === '1') return true;
    }
  } catch {
    // ignore
  }
  try {
    return (localStorage.getItem('raptorFixture') || '').trim() === '1';
  } catch {
    return false;
  }
};

export function RoutePlanning() {
  const navigate = useNavigate();
  const location = useLocation();
  const { city } = useParams();
  const [source, setSource] = useState<Point>({ lat: null, lon: null });
  const [dest, setDest] = useState<Point>({ lat: null, lon: null });
  const [pickMode, setPickMode] = useState<'source' | 'dest' | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [routeInfo, setRouteInfo] = useState<{ estimated_duration: string; total_distance: string } | null>(null);
  const [routeOptions, setRouteOptions] = useState<Partial<Record<RouteOptionKey, RouteOption>>>({});
  const [routeOptionView, setRouteOptionView] = useState<RouteOptionView>('1');
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  // Use centralized API base
  // Non-functional UI state (visible only)
  const [departureTime, setDepartureTime] = useState<string>(''); // e.g., "2025-11-05T09:00"
  const [departureWindowMin, setDepartureWindowMin] = useState<number>(15);
  const [sourceName, setSourceName] = useState<string>('');
  const [destName, setDestName] = useState<string>('');
  const [disallowedModes, setDisallowedModes] = useState<string[]>([]); // ['bus','metro','ferry','walk']
  const [walkingTimeLimitMin, setWalkingTimeLimitMin] = useState<number>(10);
  const [waitingTimeLimitMin, setWaitingTimeLimitMin] = useState<number>(15);
  // Stop name autocomplete state
  const [sourceSuggestionsVisible, setSourceSuggestionsVisible] = useState<boolean>(false);
  const [destSuggestionsVisible, setDestSuggestionsVisible] = useState<boolean>(false);
  // Nearby stops support
  const [stops, setStops] = useState<Stop[]>([]);
  const [nearbyStops, setNearbyStops] = useState<Stop[]>([]);
  const [showNearbyStops, setShowNearbyStops] = useState<boolean>(true);
  const [nearbyRadius, setNearbyRadius] = useState<number>(1000); // meters
  // Calendar service availability
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [serviceAvailability, setServiceAvailability] = useState<Record<string, boolean>>({}); // key YYYYMMDD -> available
  const [availabilityCache, setAvailabilityCache] = useState<Record<string, Record<string, boolean>>>({}); // key YYYY-MM -> map
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [timePart, setTimePart] = useState<string>('');
  const monthKey = useMemo(() => `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth()+1).padStart(2,'0')}`, [calendarMonth]);
  const [monthLoading, setMonthLoading] = useState<boolean>(false);
  const fallbackMaxYear = new Date().getFullYear();
  const fallbackMinYear = fallbackMaxYear - 10;
  const [calendarYearBounds, setCalendarYearBounds] = useState<{
    minYear: number;
    maxYear: number;
    minStartDate?: Date;
    maxEndDate?: Date;
  } | null>(null);
  const [calendarRangeLoading, setCalendarRangeLoading] = useState<boolean>(true);
  const didInitCalendarFromRangeRef = useRef<boolean>(false);

  const raptorFixtureEnabled = useMemo(() => isRaptorFixtureEnabled(), [location.search, location.hash]);

  const [floatingCardOffset, setFloatingCardOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const floatingDragRef = useRef<{
    active: boolean;
    pointerId: number | null;
    startClientX: number;
    startClientY: number;
    startOffsetX: number;
    startOffsetY: number;
  }>({
    active: false,
    pointerId: null,
    startClientX: 0,
    startClientY: 0,
    startOffsetX: 0,
    startOffsetY: 0,
  });

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!floatingDragRef.current.active) return;
      if (floatingDragRef.current.pointerId !== null && e.pointerId !== floatingDragRef.current.pointerId) return;
      const dx = e.clientX - floatingDragRef.current.startClientX;
      const dy = e.clientY - floatingDragRef.current.startClientY;
      setFloatingCardOffset({
        x: floatingDragRef.current.startOffsetX + dx,
        y: floatingDragRef.current.startOffsetY + dy,
      });
    };

    const onUp = (e: PointerEvent) => {
      if (!floatingDragRef.current.active) return;
      if (floatingDragRef.current.pointerId !== null && e.pointerId !== floatingDragRef.current.pointerId) return;
      floatingDragRef.current.active = false;
      floatingDragRef.current.pointerId = null;
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  const parseDdMmYyyyToDate = (s: string | undefined | null): Date | undefined => {
    const raw = (s || '').trim();
    const m = raw.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (!m) return undefined;
    const day = Number(m[1]);
    const month = Number(m[2]);
    const year = Number(m[3]);
    if (!Number.isFinite(day) || !Number.isFinite(month) || !Number.isFinite(year)) return undefined;
    if (month < 1 || month > 12) return undefined;
    if (day < 1 || day > 31) return undefined;
    const d = new Date(year, month - 1, day);
    // Basic sanity check to avoid Date auto-rollover (e.g., 31-02-2025)
    if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return undefined;
    return d;
  };

  // Fetch dynamic calendar year range for this user + city
  useEffect(() => {
    didInitCalendarFromRangeRef.current = false;
    const selectedCityIdLc = (getSelectedCityId() || '').toLowerCase();
    const isDefaultCityRange = ['bangalore', 'paris', 'austin'].includes(selectedCityIdLc);

    const user_id = (localStorage.getItem('userId') || '').trim();
    const api_key = (localStorage.getItem('api_key') || '').trim();
    const unique_city_id = (getUniqueCityId() || '').trim();

    // Default cities use a dedicated unauthenticated range endpoint.
    if (isDefaultCityRange) {
      const controller = new AbortController();
      setCalendarRangeLoading(true);
      (async () => {
        try {
          // NOTE: uses getBaseUrlsForPort() internally, so it will use your configured IP/host (not hardcoded localhost).
          const json = await getDefaultCityCalendarRange(selectedCityIdLc, controller.signal);
          if (!json?.success) {
            setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
            return;
          }
          const minStart = parseDdMmYyyyToDate(json?.data?.min_start_date);
          const maxEnd = parseDdMmYyyyToDate(json?.data?.max_end_date);
          if (!minStart || !maxEnd) {
            setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
            return;
          }
          setCalendarYearBounds({
            minYear: minStart.getFullYear(),
            maxYear: maxEnd.getFullYear(),
            minStartDate: minStart,
            maxEndDate: maxEnd,
          });
        } catch (e: any) {
          if (e?.name === 'AbortError') return;
          setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
        } finally {
          if (!controller.signal.aborted) setCalendarRangeLoading(false);
        }
      })();

      return () => controller.abort();
    }

    // Custom cities: this API expects backend unique_city_id (numeric string)
    if (!user_id || !api_key || !unique_city_id || !/^\d+$/.test(unique_city_id)) {
      setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
      setCalendarRangeLoading(false);
      return;
    }

    const controller = new AbortController();
    setCalendarRangeLoading(true);
    (async () => {
      try {
        const res = await fetchWithFallback(API_2_BASES, '/api/users-calendar-range', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ user_id, api_key, unique_city_id }),
          signal: controller.signal
        });
        const json = await res.json().catch(() => null);
        if (!res.ok || !json?.success) {
          setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
          return;
        }
        const minStart = parseDdMmYyyyToDate(json?.data?.min_start_date);
        const maxEnd = parseDdMmYyyyToDate(json?.data?.max_end_date);
        if (!minStart || !maxEnd) {
          setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
          return;
        }
        const minYear = minStart.getFullYear();
        const maxYear = maxEnd.getFullYear();
        setCalendarYearBounds({ minYear, maxYear, minStartDate: minStart, maxEndDate: maxEnd });
      } catch (e: any) {
        if (e?.name === 'AbortError') return;
        setCalendarYearBounds({ minYear: fallbackMinYear, maxYear: fallbackMaxYear });
      } finally {
        if (!controller.signal.aborted) setCalendarRangeLoading(false);
      }
    })();

    return () => controller.abort();
  }, [city]);

  // After we have a valid range, auto-jump the calendar to the start month (once).
  useEffect(() => {
    if (didInitCalendarFromRangeRef.current) return;
    const minStart = calendarYearBounds?.minStartDate;
    const maxEnd = calendarYearBounds?.maxEndDate;
    if (!minStart || !maxEnd) return;
    didInitCalendarFromRangeRef.current = true;
    setCalendarMonth(() => {
      const d = new Date(minStart);
      d.setDate(1);
      return d;
    });
  }, [calendarYearBounds?.minStartDate, calendarYearBounds?.maxEndDate]);

  // Keep the calendarMonth year within the fetched bounds
  useEffect(() => {
    if (!calendarYearBounds) return;
    setCalendarMonth((m) => {
      const current = new Date(m);
      const y = current.getFullYear();
      if (y < calendarYearBounds.minYear) current.setFullYear(calendarYearBounds.minYear);
      else if (y > calendarYearBounds.maxYear) current.setFullYear(calendarYearBounds.maxYear);
      current.setDate(1);
      return current;
    });
  }, [calendarYearBounds?.minYear, calendarYearBounds?.maxYear]);

  // Helpers to pull user & city IDs
  const getUserId = (): number | undefined => {
    const raw = localStorage.getItem('userId');
    if (!raw) return undefined;
    const n = Number(raw);
    return Number.isFinite(n) ? n : undefined;
  };
  const getUniqueCityId = (): string | undefined => {
    // Use backend-provided unique_city_id (numeric string)
    const stored =
      localStorage.getItem('selectedCityUniqueId') ||
      localStorage.getItem('uniqueCityId') ||
      localStorage.getItem('unique_city_id');
    if (stored) return stored;
    // Fallback: for default cities without backend IDs
    return localStorage.getItem('selectedCityId') || undefined;
  };

  // Helper: selected city id
  const getSelectedCityId = (): string | undefined => {
    const ls = localStorage.getItem('selectedCityId');
    if (ls) return ls;
    return city?.toLowerCase();
  };

  // Fetch service availability for month
  useEffect(() => {
    const userId = getUserId();
    const uniqueCityId = getUniqueCityId();
    const selectedCityId = (getSelectedCityId() || '').toLowerCase();
    const isDefaultCity = ['bangalore', 'paris', 'austin'].includes(selectedCityId);

    // Default cities: use the dedicated GET check-service endpoint (no auth).
    if (isDefaultCity) {
      // Use cache if present
      if (availabilityCache[monthKey]) {
        setServiceAvailability(availabilityCache[monthKey]);
        return;
      }

      setMonthLoading(true);
      const year = calendarMonth.getFullYear();
      const month = calendarMonth.getMonth(); // 0-based
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const controller = new AbortController();
      (async () => {
        const results: Record<string, boolean> = {};
        const promises: Promise<void>[] = [];
        for (let day = 1; day <= daysInMonth; day++) {
          const dateStr = `${year}${String(month + 1).padStart(2, '0')}${String(day).padStart(2, '0')}`;
          promises.push((async () => {
            try {
              const json = await getDefaultCityCalendarCheckService(selectedCityId, dateStr, controller.signal);
              const available = Boolean(json?.success);
              results[dateStr] = available;
            } catch {
              results[dateStr] = false;
            }
          })());
        }
        await Promise.all(promises);
        if (!controller.signal.aborted) {
          setServiceAvailability(results);
          setAvailabilityCache(prev => ({ ...prev, [monthKey]: results }));
          setMonthLoading(false);
        }
      })();
      return () => controller.abort();
    }

    // Custom cities: require user + uniqueCityId
    if (!userId || !uniqueCityId) {
      console.warn('[Calendar] Missing userId or uniqueCityId; skipping availability fetch');
      return;
    }
    // Use cache if present
    if (availabilityCache[monthKey]) {
      setServiceAvailability(availabilityCache[monthKey]);
      return;
    }
    setMonthLoading(true);
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth(); // 0-based
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const controller = new AbortController();
    (async () => {
      const results: Record<string, boolean> = {};
      const promises: Promise<void>[] = [];
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}${String(month + 1).padStart(2,'0')}${String(day).padStart(2,'0')}`; // YYYYMMDD
        promises.push((async () => {
          try {
            const res = await fetchWithFallback(API_2_BASES, '/api/calendar/check-service', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ user_id: userId, unique_city_id: uniqueCityId, date: dateStr, ...(localStorage.getItem('api_key') ? { api_key: localStorage.getItem('api_key') } : {}) }),
              signal: controller.signal
            });
            const json = await res.json().catch(() => null);
            const available = !!json?.success;
            // Log each day result for debugging first month load only
            if (day === 1) {
              console.log(`[Calendar] Fetched day ${dateStr} available=${available}`);
            }
            results[dateStr] = available;
          } catch {
            results[dateStr] = false; // treat error as unavailable
          }
        })());
      }
      await Promise.all(promises);
      if (!controller.signal.aborted) {
        setServiceAvailability(results);
        setAvailabilityCache(prev => ({ ...prev, [monthKey]: results }));
        setMonthLoading(false);
      }
    })();
    return () => controller.abort();
  }, [calendarMonth, monthKey]);

  // Derive departureTime string from selected date + time part
  useEffect(() => {
    if (!selectedDate) return;
    const datePortion = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth()+1).padStart(2,'0')}-${String(selectedDate.getDate()).padStart(2,'0')}`;
    const composed = timePart ? `${datePortion}T${timePart}` : `${datePortion}T00:00`;
    setDepartureTime(composed);
  }, [selectedDate, timePart]);

  // Redirect if city not selected
  useEffect(() => {
    const cityId = localStorage.getItem('selectedCityId');
    if (!cityId) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  // Gate Route Planning behind Route Stop Sequence preprocessing.
  // Only enforce when we have a backend unique_city_id.
  useEffect(() => {
    const selectedCityIdLc = String(city || localStorage.getItem('selectedCityId') || '').toLowerCase();
    const isDefaultCity =
      selectedCityIdLc === 'bangalore' ||
      selectedCityIdLc === 'paris' ||
      selectedCityIdLc === 'austin' ||
      selectedCityIdLc === 'dharwad';
    if (isDefaultCity) return;

    const unique_city_id = String(
      localStorage.getItem('selectedCityUniqueId') ||
        localStorage.getItem('uniqueCityId') ||
        localStorage.getItem('unique_city_id') ||
        ''
    );
    if (!unique_city_id) return;

    const doneKey = `preprocessing:route_stop_sequence:done:${unique_city_id}`;
    const done = Boolean(localStorage.getItem(doneKey));
    if (done) return;

    const selectedCity = city || localStorage.getItem('selectedCityId');
    if (selectedCity) {
      navigate(`/${selectedCity}/route-stop-sequence`, { replace: true });
    }
  }, [city, navigate]);

  // Determine city center similar to RouteVisualizer and build a human-readable city string for API
  let cityCenter: [number, number] = [12.9716, 77.5946];
  let cityString: string | undefined = undefined;
  const storedSelectedCityName = (localStorage.getItem('selectedCityName') || '').trim();
  if (storedSelectedCityName) {
    cityString = storedSelectedCityName;
  }
  if (city) {
    let customCities: any[] = [];
    try {
      const localCustom = localStorage.getItem('transit-cities');
      if (localCustom) customCities = JSON.parse(localCustom);
    } catch {}
    const allCities = [...customCities, ...defaultCities];
    const cityObj = allCities.find(c => c.id && c.id.toLowerCase() === city.toLowerCase());
    if (cityObj && cityObj.centerLat && cityObj.centerLon) {
      cityCenter = [cityObj.centerLat, cityObj.centerLon];
    }
    if (!cityString && cityObj?.name) {
      cityString = cityObj.name; // defaultCities now hold full names
    } else if (!cityString) {
      cityString = city; // fallback to route param
    }
  }

  const resolveCityNameForRouteInfo = async (): Promise<string> => {
    const stored = (localStorage.getItem('selectedCityName') || '').trim();
    if (stored) return stored;

    const selectedCityIdLc = (getSelectedCityId() || '').toLowerCase();
    const isDefaultCity = ['bangalore', 'paris', 'austin', 'dharwad'].includes(selectedCityIdLc);
    if (isDefaultCity) {
      const defaultObj = defaultCities.find((c: any) => (c.id || '').toLowerCase() === selectedCityIdLc);
      if (defaultObj?.name) return String(defaultObj.name);
    }

    const user_id = getUserId();
    const api_key = (localStorage.getItem('api_key') || '').trim();
    const unique_city_id = (
      localStorage.getItem('selectedCityUniqueId') ||
      localStorage.getItem('uniqueCityId') ||
      localStorage.getItem('unique_city_id') ||
      ''
    ).trim();

    if (user_id && unique_city_id) {
      try {
        const payload: any = { user_id };
        if (api_key) payload.api_key = api_key;
        const resp = await getUserCities(payload);
        const citiesFromApi = Array.isArray(resp?.data?.cities)
          ? resp.data.cities
          : (Array.isArray(resp?.cities) ? resp.cities : []);
        const match = citiesFromApi.find((c: any) => String(c?.unique_city_id) === String(unique_city_id));
        const apiName = (match?.city_name || match?.name || '').trim();
        if (apiName) {
          localStorage.setItem('selectedCityName', apiName);
          return apiName;
        }
      } catch (e) {
        console.error('[RoutePlanning] Failed to resolve city name from /api/city/user', e);
      }
    }

    return cityString || 'Bangalore, Karnataka, India';
  };

  const [dynamicCityCenter, setDynamicCityCenter] = useState<[number, number] | null>(() => {
    if (!city) return null;
    const cityLower = city.toLowerCase();
    const defaultObj = defaultCities.find((c: any) => c.id.toLowerCase() === cityLower);
    if (defaultObj) return null;
    const storedLat = Number(localStorage.getItem('selectedCityCenterLat'));
    const storedLng = Number(localStorage.getItem('selectedCityCenterLng'));
    if (Number.isFinite(storedLat) && Number.isFinite(storedLng)) {
      return [storedLat, storedLng];
    }
    return null;
  });
  useEffect(() => {
    if (!city) return;
    const cityLower = city.toLowerCase();

    // Default cities keep hardcoded centers
    const defaultObj = defaultCities.find((c: any) => c.id.toLowerCase() === cityLower);
    if (defaultObj && defaultObj.centerLat && defaultObj.centerLon) {
      setDynamicCityCenter(null);
      return;
    }

    // Custom city: fetch center_lat/center_lng dynamically
    const user_id = localStorage.getItem('userId');
    if (!user_id) return;
    const api_key = localStorage.getItem('api_key') || undefined;
    const slugify = (s: string) => s.toLowerCase().replace(/\s+/g, '-');

    (async () => {
      try {
        const data = await getUserCities({ user_id, ...(api_key ? { api_key } : {}) });
        const citiesFromApi = Array.isArray((data as any)?.cities)
          ? (data as any).cities
          : Array.isArray((data as any)?.data?.cities)
            ? (data as any).data.cities
            : [];
        const match = citiesFromApi.find((c: any) => slugify(String(c.city_name || c.name || '')) === cityLower);
        const lat = Number(match?.center_lat);
        const lng = Number(match?.center_lng);
        if (Number.isFinite(lat) && Number.isFinite(lng)) {
          setDynamicCityCenter([lat, lng]);
        }
      } catch {
        // ignore; keep existing
      }
    })();
  }, [city]);

  // No dynamic route type population; present static modes instead

  // Fetch stops for current city once
  useEffect(() => {
    let cancelled = false;
    setStops([]);
    setNearbyStops([]);

    (async () => {
      try {
        const s = await getStops();
        if (!cancelled) setStops(s);
      } catch (e) {
        if (!cancelled) setStops([]);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [city]);

  // Compute nearby stops whenever source or radius changes
  useEffect(() => {
    const anchor = (source.lat !== null && source.lon !== null)
      ? { lat: source.lat, lon: source.lon }
      : (dest.lat !== null && dest.lon !== null)
        ? { lat: dest.lat, lon: dest.lon }
        : null;

    if (!anchor || stops.length === 0) {
      setNearbyStops([]);
      return;
    }
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371000; // meters
    const haversine = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    };
    const filtered = stops.filter(s => haversine(anchor.lat!, anchor.lon!, s.stop_lat, s.stop_lon) <= nearbyRadius);
    setNearbyStops(filtered);
  }, [source.lat, source.lon, dest.lat, dest.lon, stops, nearbyRadius]);

  const bothSet = useMemo(() => (
    source.lat !== null && source.lon !== null && dest.lat !== null && dest.lon !== null
  ), [source, dest]);

  const handleSwap = () => {
    setSource(dest);
    setDest(source);
    setRouteInfo(null);
    setRouteOptions({});
    setServerError(null);
  };

  const handleReset = () => {
    setSource({ lat: null, lon: null });
    setDest({ lat: null, lon: null });
    setPickMode(null);
    setRouteInfo(null);
    setRouteOptions({});
    setServerError(null);
  };

  const clampLat = (v: number) => Math.max(-90, Math.min(90, v));
  const clampLon = (v: number) => Math.max(-180, Math.min(180, v));
  // Month names for calendar selection
  const monthNames = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];

  // Autocomplete: compute matches for source/destination names
  const sourceMatches = useMemo(() => {
    const q = (sourceName || '').trim().toLowerCase();
    if (q.length < 2) return [] as Stop[];
    return stops
      .filter(s => (s.stop_name || '').toLowerCase().includes(q))
      .slice(0, 12);
  }, [sourceName, stops]);

  const destMatches = useMemo(() => {
    const q = (destName || '').trim().toLowerCase();
    if (q.length < 2) return [] as Stop[];
    return stops
      .filter(s => (s.stop_name || '').toLowerCase().includes(q))
      .slice(0, 12);
  }, [destName, stops]);

  const applyStopToSource = (s: Stop) => {
    const lat = clampLat(Number(s.stop_lat));
    const lon = clampLon(Number(s.stop_lon));
    setSource({ lat, lon });
    setSourceName(s.stop_name || '');
    setSourceSuggestionsVisible(false);
    setRouteInfo(null);
    setRouteOptions({});
    setServerError(null);
  };

  const applyStopToDest = (s: Stop) => {
    const lat = clampLat(Number(s.stop_lat));
    const lon = clampLon(Number(s.stop_lon));
    setDest({ lat, lon });
    setDestName(s.stop_name || '');
    setDestSuggestionsVisible(false);
    setRouteInfo(null);
    setRouteOptions({});
    setServerError(null);
  };

  function ClickCatcher() {
    useMapEvents({
      click(e) {
        if (!pickMode) return;
        const { lat, lng } = e.latlng;
        const point = { lat: clampLat(lat), lon: clampLon(lng) };
        if (pickMode === 'source') setSource(point);
        if (pickMode === 'dest') setDest(point);
        setPickMode(null);
        // Clear previous route if user changes points
        setRouteInfo(null);
        setRouteOptions({});
        setServerError(null);
      }
    });
    return null;
  }

  function FitBoundsController({ points, boundsKey }: { points: [number, number][]; boundsKey: string }) {
    const map = useMap();

    useEffect(() => {
      if (!boundsKey || !points.length) return;

      const latLngs = points
        .filter((p) => Array.isArray(p) && p.length === 2 && Number.isFinite(p[0]) && Number.isFinite(p[1]))
        .map(([lat, lon]) => L.latLng(lat, lon));
      if (!latLngs.length) return;

      const bounds = L.latLngBounds(latLngs);
      if (!bounds.isValid()) return;

      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      if (ne.lat === sw.lat && ne.lng === sw.lng) {
        map.setView(bounds.getCenter(), Math.min(16, map.getMaxZoom() || 16), { animate: false });
        return;
      }

      map.fitBounds(bounds, { padding: [40, 40], animate: false, maxZoom: 17 });
    }, [map, boundsKey]);

    return null;
  }

  const routeOptionKeys: RouteOptionKey[] = useMemo(() => {
    const keys = (Object.keys(routeOptions || {}) as RouteOptionKey[]).filter((k) => k === '1' || k === '2' || k === '3');
    return keys.sort((a, b) => Number(a) - Number(b));
  }, [routeOptions]);

  // Keep displayed routeInfo in sync with the selected option.
  useEffect(() => {
    if (!routeOptionKeys.length) return;
    const firstKey = routeOptionKeys[0];
    const keyToUse: RouteOptionKey = routeOptionView === 'all' ? firstKey : routeOptionView;
    const opt = routeOptions[keyToUse];
    if (!opt) return;
    setRouteInfo(opt.info);
  }, [routeOptionView, routeOptionKeys, routeOptions]);

  // If the selected view isn't available anymore (or "all" is meaningless), coerce it.
  useEffect(() => {
    if (!routeOptionKeys.length) return;
    if (routeOptionView === 'all' && routeOptionKeys.length < 2) {
      setRouteOptionView(routeOptionKeys[0]);
      return;
    }
    if (routeOptionView !== 'all' && !routeOptions[routeOptionView]) {
      setRouteOptionView(routeOptionKeys[0]);
    }
  }, [routeOptionKeys, routeOptions, routeOptionView]);

  const straightPath = bothSet ? ([[source.lat!, source.lon!], [dest.lat!, dest.lon!]] as [number, number][]) : [];

  const fitBoundsInfo = useMemo(() => {
    // Only auto-fit after a route is displayed (i.e., we have options).
    if (!routeOptionKeys.length) return null;

    const points: [number, number][] = [];

    const pushPath = (path?: [number, number][] | null) => {
      if (!path?.length) return;
      for (const p of path) {
        if (!Array.isArray(p) || p.length !== 2) continue;
        const lat = Number(p[0]);
        const lon = Number(p[1]);
        if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
        points.push([lat, lon]);
      }
    };

    const pushOption = (opt?: RouteOption | null) => {
      if (!opt) return;
      if (opt.segments?.length) {
        for (const s of opt.segments) pushPath(s.path);
      } else {
        pushPath(opt.path);
      }
    };

    if (routeOptionView === 'all') {
      for (const k of routeOptionKeys) pushOption(routeOptions[k]);
    } else {
      const k = routeOptionView as RouteOptionKey;
      pushOption(routeOptions[k]);
    }

    if (!points.length) return null;
    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;
    for (const [lat, lon] of points) {
      minLat = Math.min(minLat, lat);
      maxLat = Math.max(maxLat, lat);
      minLon = Math.min(minLon, lon);
      maxLon = Math.max(maxLon, lon);
    }
    if (!Number.isFinite(minLat) || !Number.isFinite(minLon) || !Number.isFinite(maxLat) || !Number.isFinite(maxLon)) return null;

    // Key is based on the selected option + route geometry bounds (not marker position).
    const key = `${routeOptionView}|${minLat.toFixed(5)},${minLon.toFixed(5)},${maxLat.toFixed(5)},${maxLon.toFixed(5)}`;
    return { points, key };
  }, [routeOptionView, routeOptionKeys, routeOptions]);

  const getOptionEnds = (opt: RouteOption | undefined | null): { start?: [number, number]; end?: [number, number] } => {
    const segs = opt?.segments || [];
    const nonEmpty = segs.filter((s) => Array.isArray(s.path) && s.path.length);
    if (!nonEmpty.length) return {};
    const start = nonEmpty[0].path[0];
    const lastSeg = nonEmpty[nonEmpty.length - 1];
    const end = lastSeg.path[lastSeg.path.length - 1];
    if (!start || !end) return {};
    if (!Number.isFinite(start[0]) || !Number.isFinite(start[1]) || !Number.isFinite(end[0]) || !Number.isFinite(end[1])) return {};
    return { start, end };
  };

  const midpoint = (a: [number, number], b: [number, number]): [number, number] | undefined => {
    const lat = (Number(a[0]) + Number(b[0])) / 2;
    const lon = (Number(a[1]) + Number(b[1])) / 2;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return undefined;
    return [lat, lon];
  };

  const walkConnectorStyle = { color: 'orange', weight: 3, opacity: 0.9, dashArray: '2 10', lineCap: 'round' as const };

  const normalizeLatLonPair = (p: any): [number, number] | undefined => {
    const a = Number(p?.[0]);
    const b = Number(p?.[1]);
    if (!Number.isFinite(a) || !Number.isFinite(b)) return undefined;

    const absA = Math.abs(a);
    const absB = Math.abs(b);

    // Most of our backend returns [lat, lon]. Some systems return [lon, lat].
    // Auto-detect and normalize.
    const looksLikeLatLon = absA <= 90 && absB <= 180;
    const looksLikeLonLat = absA <= 180 && absB <= 90;
    if (looksLikeLatLon) return [a, b];
    if (looksLikeLonLat) return [b, a];
    return undefined;
  };

  const haversineMeters = (a: [number, number], b: [number, number]): number => {
    const R = 6371000;
    const toRad = (d: number) => (d * Math.PI) / 180;
    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);
    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);
    const s1 = Math.sin(dLat / 2);
    const s2 = Math.sin(dLon / 2);
    const q = s1 * s1 + Math.cos(lat1) * Math.cos(lat2) * s2 * s2;
    return 2 * R * Math.asin(Math.min(1, Math.sqrt(q)));
  };

  // Some backend shapes occasionally include isolated “teleport” points (one point far away
  // followed immediately by a return near the original location). Those create crazy zigzags
  // on the map. This removes only obvious isolated spikes without smoothing or reordering.
  const removeIsolatedSpikes = (path: [number, number][]): [number, number][] => {
    if (!Array.isArray(path) || path.length < 3) return path;

    const SPIKE_FAR_METERS = 2000;
    const SPIKE_NEAR_METERS = 200;

    const out: [number, number][] = [];
    for (let i = 0; i < path.length; i++) {
      const prev = i > 0 ? path[i - 1] : undefined;
      const cur = path[i];
      const next = i + 1 < path.length ? path[i + 1] : undefined;

      if (prev && next) {
        const dPrevCur = haversineMeters(prev, cur);
        const dCurNext = haversineMeters(cur, next);
        const dPrevNext = haversineMeters(prev, next);
        const isSpike = dPrevCur > SPIKE_FAR_METERS && dCurNext > SPIKE_FAR_METERS && dPrevNext < SPIKE_NEAR_METERS;
        if (isSpike) continue;
      }

      const last = out[out.length - 1];
      if (last && last[0] === cur[0] && last[1] === cur[1]) continue;
      out.push(cur);
    }
    return out;
  };

  // Render helper: break a polyline into multiple pieces when there’s a large discontinuity.
  // This avoids drawing a straight line “across town” when the backend provides discontinuous points.
  const splitPathOnLargeJumps = (path: [number, number][]): [number, number][][] => {
    if (!Array.isArray(path) || path.length < 2) return [];
    const MAX_JUMP_METERS = 8000;

    const parts: [number, number][][] = [];
    let cur: [number, number][] = [path[0]];

    for (let i = 1; i < path.length; i++) {
      const a = path[i - 1];
      const b = path[i];
      const d = haversineMeters(a, b);
      if (d > MAX_JUMP_METERS) {
        if (cur.length >= 2) parts.push(cur);
        cur = [b];
      } else {
        cur.push(b);
      }
    }
    if (cur.length >= 2) parts.push(cur);
    return parts.length ? parts : [path];
  };

  const buildDepartureIso = (date: Date, hhmm: string): string => {
    const [hhRaw, mmRaw] = (hhmm || '00:00').split(':');
    const hh = Math.max(0, Math.min(23, Number(hhRaw) || 0));
    const mm = Math.max(0, Math.min(59, Number(mmRaw) || 0));
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    const H = String(hh).padStart(2, '0');
    const M = String(mm).padStart(2, '0');
    return `${y}-${m}-${d}T${H}:${M}:00`;
  };

  const parseRaptorRootToOptions = (root: any) => {
    const toNum = (v: any): number | undefined => {
      const n = Number(v);
      return Number.isFinite(n) ? n : undefined;
    };

    const stopNameById = new Map<string, string>();
    const stopCoordById = new Map<string, [number, number]>();
    for (const s of stops) {
      const id = String((s as any)?.stop_id ?? '').trim();
      const name = String((s as any)?.stop_name ?? '').trim();
      if (id && name) stopNameById.set(id, name);

      const lat = toNum((s as any)?.stop_lat);
      const lon = toNum((s as any)?.stop_lon);
      if (id && lat !== undefined && lon !== undefined) {
        stopCoordById.set(id, [lat, lon]);
      }
    }

    const prettyEndpointName = (id: string, fallback: string): string => {
      const lc = (id || '').trim().toLowerCase();
      if (lc === 'source') return 'Source';
      if (lc === 'target') return 'Target';
      return fallback;
    };

    const parseDurationSeconds = (raw: any): number | undefined => {
      if (raw === null || raw === undefined) return undefined;
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      const s = String(raw).trim().toLowerCase();
      if (!s) return undefined;

      let hours = 0;
      let minutes = 0;
      let seconds = 0;
      const h = s.match(/([0-9]+)\s*(?:h|hr|hrs|hour|hours)/);
      const m = s.match(/([0-9]+)\s*(?:m|min|mins|minute|minutes)/);
      const sec = s.match(/([0-9]+)\s*(?:s|sec|secs|second|seconds)/);
      if (h) hours = Number(h[1]) || 0;
      if (m) minutes = Number(m[1]) || 0;
      if (sec) seconds = Number(sec[1]) || 0;

      const total = hours * 3600 + minutes * 60 + seconds;
      return total > 0 ? total : undefined;
    };

    const parseDistanceMeters = (raw: any): number | undefined => {
      if (raw === null || raw === undefined) return undefined;
      if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
      const s = String(raw).trim().toLowerCase();
      if (!s) return undefined;

      let km = 0;
      let m = 0;
      const kmMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*km/);
      const mMatch = s.match(/([0-9]+(?:\.[0-9]+)?)\s*m/);
      if (kmMatch) km = Number(kmMatch[1]) || 0;
      if (mMatch) m = Number(mMatch[1]) || 0;
      const total = Math.round(km * 1000 + m);
      return total > 0 ? total : undefined;
    };

    const pushSegment = (acc: [number, number][], seg: [number, number][]) => {
      if (!Array.isArray(seg) || seg.length === 0) return;
      for (let i = 0; i < seg.length; i++) {
        const pt = seg[i];
        if (!pt || !Number.isFinite(pt[0]) || !Number.isFinite(pt[1])) continue;
        const last = acc[acc.length - 1];
        if (last && last[0] === pt[0] && last[1] === pt[1]) continue;
        acc.push(pt);
      }
    };

    const formatDuration = (seconds: number): string => {
      const s = Math.max(0, Math.round(seconds));
      const hrs = Math.floor(s / 3600);
      const mins = Math.floor((s % 3600) / 60);
      if (hrs > 0) return `${hrs} hr ${mins} min`;
      return `${Math.max(1, mins)} min`;
    };

    const formatDistance = (meters: number): string => {
      const m = Math.max(0, Math.round(meters));
      if (m >= 1000) return `${(m / 1000).toFixed(2)} km`;
      return `${m} m`;
    };

    const pickAnchor = (path: [number, number][]): [number, number] | undefined => {
      if (!Array.isArray(path) || path.length === 0) return undefined;
      return path[Math.floor(path.length / 2)];
    };

    const originCoord: [number, number] | undefined =
      Number.isFinite(source.lat as number) && Number.isFinite(source.lon as number)
        ? ([source.lat as number, source.lon as number] as [number, number])
        : undefined;
    const destinationCoord: [number, number] | undefined =
      Number.isFinite(dest.lat as number) && Number.isFinite(dest.lon as number)
        ? ([dest.lat as number, dest.lon as number] as [number, number])
        : undefined;

    const getLegStartCandidate = (leg: any, fromId?: string): [number, number] | undefined => {
      const aLat = toNum(leg?.from_stop_lat);
      const aLon = toNum(leg?.from_stop_lon);
      if (aLat !== undefined && aLon !== undefined) return [aLat, aLon];

      const stopCoord = fromId ? stopCoordById.get(fromId) : undefined;
      if (stopCoord) return stopCoord;

      const coords = Array.isArray(leg?.path_coords) ? leg.path_coords : [];
      const rawPath: [number, number][] = coords
        .map(normalizeLatLonPair)
        .filter((p: any): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      return rawPath.length ? rawPath[0] : undefined;
    };
    const getLegEndCandidate = (leg: any, toId?: string): [number, number] | undefined => {
      const bLat = toNum(leg?.to_stop_lat);
      const bLon = toNum(leg?.to_stop_lon);
      if (bLat !== undefined && bLon !== undefined) return [bLat, bLon];

      const stopCoord = toId ? stopCoordById.get(toId) : undefined;
      if (stopCoord) return stopCoord;

      const coords = Array.isArray(leg?.path_coords) ? leg.path_coords : [];
      const rawPath: [number, number][] = coords
        .map(normalizeLatLonPair)
        .filter((p: any): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      return rawPath.length ? rawPath[rawPath.length - 1] : undefined;
    };

    const findNextAvailableCoord = (itineraryObj: any, legKeys: string[], startIdxExclusive: number): [number, number] | undefined => {
      for (let j = startIdxExclusive + 1; j < legKeys.length; j++) {
        const legJ = itineraryObj[legKeys[j]];
        const fromIdJ = String(legJ?.from ?? legJ?.from_stop_id ?? legJ?.from_stop ?? '').trim();
        const toIdJ = String(legJ?.to ?? legJ?.to_stop_id ?? legJ?.to_stop ?? '').trim();
        const cStart = getLegStartCandidate(legJ, fromIdJ);
        if (cStart) return cStart;
        const cEnd = getLegEndCandidate(legJ, toIdJ);
        if (cEnd) return cEnd;
      }
      return undefined;
    };

    const legacyCoordsCandidate =
      (Array.isArray((root as any).path_coords) && (root as any).path_coords) ||
      (Array.isArray((root as any).path) && (root as any).path) ||
      (Array.isArray((root as any).coordinates) && (root as any).coordinates) ||
      null;

    let mappedPath: [number, number][] = [];
    let info: { estimated_duration: string; total_distance: string } | null = null;
    const nextOptions: Partial<Record<RouteOptionKey, RouteOption>> = {};

    if (legacyCoordsCandidate) {
      const basePath: [number, number][] = legacyCoordsCandidate
        .map(normalizeLatLonPair)
        .filter((p: any): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
      mappedPath = removeIsolatedSpikes(basePath);
      info = {
        estimated_duration: String((root as any).estimated_duration || ''),
        total_distance: String((root as any).total_distance || ''),
      };

      nextOptions['1'] = {
        path: mappedPath,
        segments: mappedPath.length ? [{ path: mappedPath, mode: 'transit' }] : [],
        info,
      };
    } else {
      const itineraryKeys = (Object.keys(root || {})
        .filter((k) => k === '1' || k === '2' || k === '3')
        .sort((a, b) => Number(a) - Number(b)) as RouteOptionKey[]);

      for (const itineraryKey of itineraryKeys) {
        const itineraryObj = (root as any)[itineraryKey];
        if (!itineraryObj || typeof itineraryObj !== 'object') continue;

        const legKeys = Object.keys(itineraryObj)
          .filter((k) => /^\d+$/.test(k))
          .sort((a, b) => Number(a) - Number(b));
        if (legKeys.length === 0) continue;

        const pathAcc: [number, number][] = [];
        const segments: RouteSegment[] = [];

        let totalSeconds = 0;
        let totalMeters = 0;
        let hadAnyDuration = false;
        let hadAnyDistance = false;

        for (let idx = 0; idx < legKeys.length; idx++) {
          const lk = legKeys[idx];
          const leg = itineraryObj[lk];
          const nextLeg = idx + 1 < legKeys.length ? itineraryObj[legKeys[idx + 1]] : undefined;

          const modeRaw = String(leg?.mode || '').trim().toLowerCase();
          const segmentMode: RouteSegmentMode =
            modeRaw === 'transit' ? 'transit' : modeRaw === 'walk' ? 'walk' : 'unknown';

          const fromId = String(leg?.from ?? leg?.from_stop_id ?? leg?.from_stop ?? '').trim();
          const toId = String(leg?.to ?? leg?.to_stop_id ?? leg?.to_stop ?? '').trim();
          const fromNameFallback =
            String(leg?.from_stop_name || '').trim() ||
            stopNameById.get(fromId) ||
            (fromId ? `Stop ${fromId}` : '');
          const toNameFallback =
            String(leg?.to_stop_name || '').trim() ||
            stopNameById.get(toId) ||
            (toId ? `Stop ${toId}` : '');
          const fromName = prettyEndpointName(fromId, fromNameFallback);
          const toName = prettyEndpointName(toId, toNameFallback);

          const departTimeRaw = String(leg?.from_arrival_time || '').trim();
          const arriveTimeRaw = String(leg?.to_arrival_time || '').trim();

          const legSec =
            parseDurationSeconds(leg?.estimated_duration) ??
            parseDurationSeconds(leg?.path_estimated_duration);
          const derivedLegSec = legSec !== undefined ? legSec : diffSecondsFromApiTimes(departTimeRaw, arriveTimeRaw);
          if (derivedLegSec !== undefined) {
            totalSeconds += derivedLegSec;
            hadAnyDuration = true;
          }

          const legMeters =
            parseDistanceMeters(leg?.estimated_distance) ??
            parseDistanceMeters(leg?.path_total_distance);
          if (legMeters !== undefined) {
            totalMeters += legMeters;
            hadAnyDistance = true;
          }

          const coords = Array.isArray(leg?.path_coords) ? leg.path_coords : [];
          const rawPathBase: [number, number][] = coords
            .map(normalizeLatLonPair)
            .filter((p: any): p is [number, number] => Array.isArray(p) && Number.isFinite(p[0]) && Number.isFinite(p[1]));
          const rawPath: [number, number][] = removeIsolatedSpikes(rawPathBase);

          const explicitStart = getLegStartCandidate(leg, fromId);
          const explicitEnd = getLegEndCandidate(leg, toId);
          const nextFromId = nextLeg ? String(nextLeg?.from ?? nextLeg?.from_stop_id ?? nextLeg?.from_stop ?? '').trim() : '';
          const nextStart = nextLeg ? getLegStartCandidate(nextLeg, nextFromId) : undefined;
          const nextAny = findNextAvailableCoord(itineraryObj, legKeys, idx);

          const lastAccPoint = pathAcc.length ? pathAcc[pathAcc.length - 1] : undefined;
          const fallbackStart = explicitStart ?? lastAccPoint ?? (idx === 0 ? originCoord : undefined);
          const fallbackEnd =
            explicitEnd ??
            nextStart ??
            nextAny ??
            (idx === legKeys.length - 1 ? destinationCoord : undefined);

          let segPath: [number, number][] = [];
          if (segmentMode === 'transit') {
            // Prefer backend geometry; otherwise draw a straight connector between inferred endpoints.
            if (rawPath.length >= 2) segPath = rawPath;
            else if (fallbackStart && fallbackEnd) segPath = [fallbackStart, fallbackEnd];
          } else if (segmentMode === 'walk') {
            // Walk: if backend provides geometry, draw it accurately.
            // Otherwise, fall back to a straight connector.
            if (rawPath.length >= 2) segPath = rawPath;
            else if (fallbackStart && fallbackEnd) segPath = [fallbackStart, fallbackEnd];
          } else {
            if (rawPath.length >= 2) segPath = rawPath;
            else if (fallbackStart && fallbackEnd) segPath = [fallbackStart, fallbackEnd];
          }

          if (segPath.length >= 2) {
            pushSegment(pathAcc, segPath);
            const label =
              segmentMode === 'transit'
                ? String(leg?.route_name || leg?.route || 'Transit')
                : segmentMode === 'walk'
                  ? 'Walk'
                  : 'Leg';

            // Important: Stop pin coordinates must correspond to the stop itself.
            // If we don't have a real coordinate for the stop (via stop list or path geometry),
            // do NOT infer it from fallback segment geometry.
            const fromCoord: [number, number] | undefined = explicitStart;
            const toCoord: [number, number] | undefined = explicitEnd;

            const durationText = String(leg?.estimated_duration || '').trim() || (derivedLegSec !== undefined ? formatDuration(derivedLegSec) : '');
            const distanceText = String(leg?.estimated_distance || '').trim() || (legMeters !== undefined ? formatDistance(legMeters) : '');
            segments.push({
              path: segPath,
              mode: segmentMode,
              label,
              anchor: pickAnchor(segPath),
              fromStopId: fromId || undefined,
              toStopId: toId || undefined,
              fromCoord,
              toCoord,
              fromName: fromName || undefined,
              toName: toName || undefined,
              estimatedDuration: durationText || undefined,
              estimatedDistance: distanceText || undefined,
              departTime: departTimeRaw || undefined,
              arriveTime: arriveTimeRaw || undefined,
            });
          }
        }

        if (pathAcc.length === 0) continue;

        const itineraryInfo = {
          estimated_duration: hadAnyDuration ? formatDuration(totalSeconds) : '',
          total_distance: hadAnyDistance ? formatDistance(totalMeters) : '',
        };

        nextOptions[itineraryKey] = { path: pathAcc, segments, info: itineraryInfo };
      }

      const picked = (Object.keys(nextOptions) as RouteOptionKey[]).sort((a, b) => Number(a) - Number(b))[0];
      if (picked) {
        mappedPath = nextOptions[picked]?.path || [];
        info = nextOptions[picked]?.info || null;
      }
    }

    return { mappedPath, info, nextOptions };
  };

  const planRoute = async () => {
    const fixtureEnabled = isRaptorFixtureEnabled();
    if (!bothSet && !fixtureEnabled) return;

    if (fixtureEnabled) {
      setLoading(true);
      setServerError(null);
      setRouteOptions({});
      try {
        const mod = await import('../fixtures/raptorFixture');
        const root = (mod as any)?.RAPTOR_FIXTURE_SAMPLE || {};
        const { mappedPath, info, nextOptions } = parseRaptorRootToOptions(root);

        if (!mappedPath.length) throw new Error('Fixture did not include a usable path geometry');

        setRouteOptions(nextOptions);
        const availableKeys = (Object.keys(nextOptions) as RouteOptionKey[]).sort((a, b) => Number(a) - Number(b));
        const firstKey = availableKeys[0];
        const desiredKey: RouteOptionKey | undefined =
          routeOptionView === 'all' ? firstKey : (routeOptionView as RouteOptionKey);
        const keyToUse = (desiredKey && nextOptions[desiredKey] ? desiredKey : firstKey) || '1';
        setRouteInfo(nextOptions[keyToUse]?.info || info);

        // If user hasn't set points, seed them from the rendered option.
        if (source.lat === null || source.lon === null || dest.lat === null || dest.lon === null) {
          const ends = getOptionEnds(nextOptions[keyToUse]);
          if (ends.start) setSource({ lat: ends.start[0], lon: ends.start[1] });
          if (ends.end) setDest({ lat: ends.end[0], lon: ends.end[1] });
        }
      } catch (err: any) {
        setServerError(err?.message || 'Failed to load fixture route');
        setRouteInfo(null);
        setRouteOptions({});
      } finally {
        setLoading(false);
      }
      return;
    }

    // Strict date availability enforcement
    if (!selectedDate) {
      setServerError('Select a departure date with available service first');
      return;
    }
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;
    const day = selectedDate.getDate();
    const dateKey = `${year}${String(month).padStart(2,'0')}${String(day).padStart(2,'0')}`; // YYYYMMDD
    if (!serviceAvailability[dateKey]) {
      setServerError('Service not available on selected date');
      return;
    }
    // Final server recheck for robustness
    const selectedCityIdLc = (getSelectedCityId() || '').toLowerCase();
    const isDefaultCity = ['bangalore', 'paris', 'austin'].includes(selectedCityIdLc);
    try {
      if (isDefaultCity) {
        const verifyJson = await getDefaultCityCalendarCheckService(selectedCityIdLc, dateKey);
        if (!verifyJson?.success) {
          setServerError('Service verification failed for selected date');
          return;
        }
      } else {
        const userIdFinal = getUserId();
        const uniqueCityIdFinal = getUniqueCityId();
        if (userIdFinal && uniqueCityIdFinal) {
          const verifyRes = await fetchWithFallback(API_2_BASES, '/api/calendar/check-service', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userIdFinal, unique_city_id: uniqueCityIdFinal, date: dateKey, ...(localStorage.getItem('api_key') ? { api_key: localStorage.getItem('api_key') } : {}) })
          });
          const verifyJson = await verifyRes.json().catch(() => null);
          if (!verifyJson?.success) {
            setServerError('Service verification failed for selected date');
            return;
          }
        }
      }
    } catch (e) {
      console.error('[Calendar] Verification error', e);
      setServerError('Unable to verify service availability');
      return;
    }
    setLoading(true);
    setServerError(null);
    setRouteOptions({});
    try {
      const resolvedCityName = await resolveCityNameForRouteInfo();
      const user_id = (localStorage.getItem('userId') || '').trim();
      const api_key = (localStorage.getItem('api_key') || '').trim();
      const unique_city_id = (getUniqueCityId() || '').trim();

      if (!user_id || !api_key || !unique_city_id) {
        throw new Error('Missing user_id / api_key / unique_city_id for route planning');
      }
      if (source.lat === null || source.lon === null || dest.lat === null || dest.lon === null) {
        throw new Error('Missing origin/destination coordinates');
      }

      const departure_time = selectedDate ? buildDepartureIso(selectedDate, (timePart || '00:00').trim()) : '';
      if (!departure_time) {
        throw new Error('Missing departure time');
      }

      const payload = {
        user_id,
        api_key,
        unique_city_id,
        city_name: resolvedCityName,
        origin: { lat: source.lat, lon: source.lon },
        destination: { lat: dest.lat, lon: dest.lon },
        departure_time,
      };

      const json = await runRaptor(payload);

      const root = (json && (json.data ?? json.response ?? json)) || {};
      const { mappedPath, info, nextOptions } = parseRaptorRootToOptions(root);

      if (mappedPath.length === 0) {
        console.warn('[run-raptor] Response did not include a usable path geometry', json);
        throw new Error('Route computed but no path geometry returned');
      }

      setRouteOptions(nextOptions);

      const availableKeys = (Object.keys(nextOptions) as RouteOptionKey[]).sort((a, b) => Number(a) - Number(b));
      const firstKey = availableKeys[0];
      const desiredKey: RouteOptionKey | undefined =
        routeOptionView === 'all' ? firstKey : (routeOptionView as RouteOptionKey);
      const keyToUse = (desiredKey && nextOptions[desiredKey] ? desiredKey : firstKey) || '1';

      setRouteInfo(nextOptions[keyToUse]?.info || info);
    } catch (err: any) {
      setServerError(err?.message || 'Failed to compute route');
      setRouteInfo(null);
      setRouteOptions({});
    } finally {
      setLoading(false);
    }
  };

  // Parse strings like "2h 32min" or "45 min" into milliseconds
  const parseDurationToMs = (s: string): number => {
    if (!s) return 0;
    const lc = s.toLowerCase();
    let hours = 0;
    let minutes = 0;
    const hMatch = lc.match(/(\d+(?:\.\d+)?)\s*h/);
    const mMatch = lc.match(/(\d+(?:\.\d+)?)\s*(?:m|min|minutes?)/);
    if (hMatch) hours = parseFloat(hMatch[1]);
    if (mMatch) minutes = parseFloat(mMatch[1]);
    // Fallback: patterns like "150" alone treated as minutes
    if (!hMatch && !mMatch) {
      const numOnly = lc.match(/\d+/);
      if (numOnly) minutes = parseFloat(numOnly[0]);
    }
    const totalMin = hours * 60 + minutes;
    return Math.max(0, Math.round(totalMin)) * 60 * 1000;
  };

  const etaString = useMemo(() => {
    if (!routeInfo?.estimated_duration) return null;
    const ms = parseDurationToMs(routeInfo.estimated_duration);
    if (!ms) return null;
    const etaDate = new Date(Date.now() + ms);
    return etaDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }, [routeInfo?.estimated_duration]);

  const timePart12 = useMemo(() => {
    const raw = (timePart || '').trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    let hh = 0;
    let mm = '00';
    if (m) {
      hh = Math.max(0, Math.min(23, Number(m[1]) || 0));
      const mins = Math.max(0, Math.min(59, Number(m[2]) || 0));
      mm = String(mins).padStart(2, '0');
    }
    const ampm: 'AM' | 'PM' = hh >= 12 ? 'PM' : 'AM';
    let h12 = hh % 12;
    if (h12 === 0) h12 = 12;
    return { hour12: String(h12), minute: mm, ampm };
  }, [timePart]);

  const format12FromTimePart = (tp: string): string => {
    const raw = (tp || '').trim();
    const m = raw.match(/^(\d{1,2}):(\d{2})$/);
    if (!m) return '';
    const hh = Math.max(0, Math.min(23, Number(m[1]) || 0));
    const mm = String(Math.max(0, Math.min(59, Number(m[2]) || 0))).padStart(2, '0');
    const ampm = hh >= 12 ? 'PM' : 'AM';
    let h12 = hh % 12;
    if (h12 === 0) h12 = 12;
    return `${h12}:${mm} ${ampm}`;
  };

  const formatApiDateTimeTo12 = (raw: any): string => {
    const s = String(raw || '').trim();
    if (!s) return '';
    const iso = s.includes('T') ? s : s.replace(' ', 'T');
    const t = Date.parse(iso);
    if (!Number.isFinite(t)) return '';
    return new Date(t).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const diffSecondsFromApiTimes = (fromRaw: any, toRaw: any): number | undefined => {
    const a = String(fromRaw || '').trim();
    const b = String(toRaw || '').trim();
    if (!a || !b) return undefined;
    const aIso = a.includes('T') ? a : a.replace(' ', 'T');
    const bIso = b.includes('T') ? b : b.replace(' ', 'T');
    const ta = Date.parse(aIso);
    const tb = Date.parse(bIso);
    if (!Number.isFinite(ta) || !Number.isFinite(tb)) return undefined;
    const diff = Math.round((tb - ta) / 1000);
    return diff > 0 ? diff : undefined;
  };

  const selectedRouteOptionKey: RouteOptionKey | undefined = useMemo(() => {
    if (!routeOptionKeys.length) return undefined;
    if (routeOptionView === 'all') return routeOptionKeys[0];
    if (routeOptions[routeOptionView as RouteOptionKey]) return routeOptionView as RouteOptionKey;
    return routeOptionKeys[0];
  }, [routeOptionKeys, routeOptionView, routeOptions]);

  const getOptionAccent = (k: RouteOptionKey | undefined) => {
    if (k === '2') return { text: 'text-pink-700', border: 'border-pink-700', chipBg: 'bg-pink-100 dark:bg-pink-900/30' };
    if (k === '3') return { text: 'text-green-600', border: 'border-green-600', chipBg: 'bg-green-50 dark:bg-green-900/20' };
    return { text: 'text-blue-600', border: 'border-blue-600', chipBg: 'bg-blue-50 dark:bg-blue-900/20' };
  };

  const renderLegRow = (seg: RouteSegment, idx: number, total: number, accent: { text: string; border: string; chipBg: string }) => {
    const fromTo = seg.fromName && seg.toName ? `${seg.fromName} → ${seg.toName}` : (seg.fromName || seg.toName || '');
    const modeLabel = seg.mode === 'transit' ? 'Transit' : seg.mode === 'walk' ? 'Walk' : 'Leg';
    const head = fromTo || seg.label || modeLabel;

    const duration = (seg.estimatedDuration || '').trim();
    const distance = (seg.estimatedDistance || '').trim();
    const depart = formatApiDateTimeTo12(seg.departTime);
    const arrive = formatApiDateTimeTo12(seg.arriveTime);

    const isWalk = seg.mode === 'walk';
    const stepAccent = isWalk
      ? { text: 'text-orange-600', border: 'border-orange-500', chipBg: 'bg-orange-50 dark:bg-orange-900/20' }
      : accent;

    const chipText =
      seg.mode === 'transit'
        ? (seg.label ? `${modeLabel} • ${seg.label}` : modeLabel)
        : modeLabel;

    return (
      <div key={`leg-${idx}-${head}`} className="py-2">
        <div className="flex gap-3">
          <div className="flex flex-col items-center pt-0.5">
            <div
              className={`w-6 h-6 rounded-full border ${stepAccent.border} ${stepAccent.text} flex items-center justify-center text-[11px] font-semibold bg-white dark:bg-gray-900`}
            >
              {idx + 1}
            </div>
            {idx < total - 1 && (
              <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {head}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${stepAccent.chipBg} ${stepAccent.text}`}>
                {chipText}
              </span>
            </div>
          </div>

          <div className="shrink-0 text-right">
            {(depart || arrive) && (
              <div className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                {depart || '—'} → {arrive || '—'}
              </div>
            )}
            {duration && <div className="text-xs text-gray-600 dark:text-gray-300">{duration}</div>}
            {distance && <div className="text-xs text-gray-600 dark:text-gray-300">{distance}</div>}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen relative flex flex-col md:flex-row bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors">
      {/* Mobile sidebar toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <div
        className={`
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          transition-transform duration-300
          md:translate-x-0
          w-full md:w-1/3 lg:w-1/4
          bg-gray-50 dark:bg-gray-800
          fixed md:relative
          h-screen
          z-40
          overflow-hidden
        `}
      >
        <div className="h-full p-6 overflow-y-auto">
          <div className="pt-12 md:pt-0">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => {
                  const selectedCity = city || localStorage.getItem('selectedCityId');
                  if (selectedCity) {
                    navigate(`/${selectedCity}`);
                  } else {
                    navigate('/city-selection');
                  }
                }}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <ArrowLeft size={24} className="text-blue-600" />
              </button>
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Route Planning</h1>
              <div />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">Pick two points in {city} by typing coordinates or clicking on the map.</p>

            {/* Planning Preferences (non-functional UI) */}
            <div className="mb-4 p-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm">
              <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-3">Planning Preferences</h2>
              <div className="grid grid-cols-1 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Service Calendar (select departure date)</label>
                  <div className="space-y-2">
                    {(calendarRangeLoading || !calendarYearBounds) ? (
                      <div className="text-xs text-gray-600 dark:text-gray-300 py-4">
                        Loading calendar...
                      </div>
                    ) : (
                      <>
                        <div className="text-[10px] text-gray-500 dark:text-gray-400">
                          {(() => {
                            const minStart = calendarYearBounds.minStartDate;
                            const maxEnd = calendarYearBounds.maxEndDate;
                            const monthRange = (minStart && maxEnd)
                              ? `${monthNames[minStart.getMonth()]} ${minStart.getFullYear()} – ${monthNames[maxEnd.getMonth()]} ${maxEnd.getFullYear()}`
                              : `${calendarYearBounds.minYear} – ${calendarYearBounds.maxYear}`;
                            return `Month range: ${monthRange} | Year range: ${calendarYearBounds.minYear} – ${calendarYearBounds.maxYear}`;
                          })()}
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            aria-label="Select month"
                            value={calendarMonth.getMonth()}
                            onChange={(e) => {
                              const newMonth = Number(e.target.value);
                              setCalendarMonth(m => { const d = new Date(m); d.setMonth(newMonth); return d; });
                            }}
                            className="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {monthNames.map((name, idx) => (
                              <option key={name} value={idx}>{name}</option>
                            ))}
                          </select>
                          <select
                            aria-label="Select year"
                            value={calendarMonth.getFullYear()}
                            onChange={(e) => {
                              const newYear = Number(e.target.value);
                              setCalendarMonth(m => { const d = new Date(m); d.setFullYear(newYear); return d; });
                            }}
                            className="px-2 py-1 text-xs rounded border bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            {(() => {
                              const years: number[] = [];
                              for (let i = calendarYearBounds.maxYear; i >= calendarYearBounds.minYear; i--) years.push(i);
                              return years;
                            })().map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center">{d}</div>)}
                        </div>
                        {(() => {
                          const year = calendarMonth.getFullYear();
                          const month = calendarMonth.getMonth();
                          const firstDay = new Date(year, month, 1).getDay();
                          const daysInMonth = new Date(year, month + 1, 0).getDate();
                          const cells: JSX.Element[] = [];
                          for (let i=0;i<firstDay;i++) cells.push(<div key={'pad-'+i}></div>);
                          for (let day=1; day<=daysInMonth; day++) {
                            const dateKey = `${year}${String(month+1).padStart(2,'0')}${String(day).padStart(2,'0')}`;
                            const available = Object.prototype.hasOwnProperty.call(serviceAvailability, dateKey) ? serviceAvailability[dateKey] : undefined; // undefined => loading
                            const isSelected = selectedDate && selectedDate.getDate()===day && selectedDate.getMonth()===month && selectedDate.getFullYear()===year;
                            cells.push(
                              <button
                                key={dateKey}
                                type="button"
                                disabled={available === false}
                                onClick={() => {
                                  if (available !== true) return;
                                  const d = new Date(year, month, day);
                                  setSelectedDate(d);
                                }}
                                className={`relative flex items-center justify-center rounded-md h-8 text-xs border
                                  ${available === true ? 'bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 hover:bg-blue-50 dark:hover:bg-gray-700' : available === false ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 border-gray-200 dark:border-gray-800 cursor-not-allowed' : 'bg-white dark:bg-gray-900 border-dashed border-gray-300 dark:border-gray-700'}
                                  ${isSelected ? 'ring-2 ring-blue-500 font-semibold' : ''}`}
                              >
                                {day}
                                {available === true && (
                                  <span className="absolute bottom-1 right-1 inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                )}
                                {available === undefined && monthLoading && (
                                  <span className="absolute bottom-1 right-1 inline-block w-2 h-2 rounded-full bg-yellow-400 animate-pulse"></span>
                                )}
                              </button>
                            );
                          }
                          return <div className="grid grid-cols-7 gap-1">{cells}</div>;
                        })()}
                      </>
                    )}
                    <div>
                      <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Time (12-hour)</label>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={timePart12.hour12}
                          onChange={(e) => {
                            const hour12 = Math.max(1, Math.min(12, Number(e.target.value) || 12));
                            const minute = timePart12.minute;
                            const ampm = timePart12.ampm;
                            let hh = hour12 % 12;
                            if (ampm === 'PM') hh += 12;
                            setTimePart(`${String(hh).padStart(2, '0')}:${minute}`);
                          }}
                          className="w-full px-2 py-1 border rounded-lg text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                            <option key={h} value={String(h)}>
                              {h}
                            </option>
                          ))}
                        </select>

                        <select
                          value={timePart12.minute}
                          onChange={(e) => {
                            const hour12 = Number(timePart12.hour12) || 12;
                            const minute = String(e.target.value || '00').padStart(2, '0');
                            const ampm = timePart12.ampm;
                            let hh = (hour12 % 12);
                            if (ampm === 'PM') hh += 12;
                            setTimePart(`${String(hh).padStart(2, '0')}:${minute}`);
                          }}
                          className="w-full px-2 py-1 border rounded-lg text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>

                        <select
                          value={timePart12.ampm}
                          onChange={(e) => {
                            const hour12 = Number(timePart12.hour12) || 12;
                            const minute = timePart12.minute;
                            const ampm = (e.target.value === 'PM' ? 'PM' : 'AM') as 'AM' | 'PM';
                            let hh = (hour12 % 12);
                            if (ampm === 'PM') hh += 12;
                            setTimePart(`${String(hh).padStart(2, '0')}:${minute}`);
                          }}
                          className="w-full px-2 py-1 border rounded-lg text-xs bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>
                    <div className="text-[10px] text-gray-500 dark:text-gray-400">Unavailable dates are greyed out.</div>
                    {departureTime && (
                      <div className="mt-1 text-[11px] text-gray-600 dark:text-gray-300">
                        Selected departure: {departureTime.split('T')[0]} {format12FromTimePart(timePart || '00:00')}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Departure time window (minutes)</label>
                  <input
                    type="number"
                    min={0}
                    step={5}
                    value={departureWindowMin}
                    onChange={e => setDepartureWindowMin(Number(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., 15"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Source name (optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={sourceName}
                        onChange={e => { setSourceName(e.target.value); setSourceSuggestionsVisible(true); }}
                        onFocus={() => setSourceSuggestionsVisible(true)}
                        onBlur={() => setTimeout(() => setSourceSuggestionsVisible(false), 150)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Yeshwanthpur"
                      />
                      {sourceSuggestionsVisible && sourceMatches.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                          {sourceMatches.map((s) => (
                            <button
                              key={(s as any).stop_id || (s as any).stop_code || `${s.stop_lat}-${s.stop_lon}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyStopToSource(s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                            >
                              <div className="font-medium text-gray-800 dark:text-gray-200">{s.stop_name}</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{Number(s.stop_lat).toFixed(5)}, {Number(s.stop_lon).toFixed(5)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Destination name (optional)</label>
                    <div className="relative">
                      <input
                        type="text"
                        value={destName}
                        onChange={e => { setDestName(e.target.value); setDestSuggestionsVisible(true); }}
                        onFocus={() => setDestSuggestionsVisible(true)}
                        onBlur={() => setTimeout(() => setDestSuggestionsVisible(false), 150)}
                        className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., Attibele"
                      />
                      {destSuggestionsVisible && destMatches.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full max-h-56 overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow">
                          {destMatches.map((s) => (
                            <button
                              key={(s as any).stop_id || (s as any).stop_code || `${s.stop_lat}-${s.stop_lon}`}
                              type="button"
                              onMouseDown={(e) => e.preventDefault()}
                              onClick={() => applyStopToDest(s)}
                              className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 dark:hover:bg-gray-700"
                            >
                              <div className="font-medium text-gray-800 dark:text-gray-200">{s.stop_name}</div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400">{Number(s.stop_lat).toFixed(5)}, {Number(s.stop_lon).toFixed(5)}</div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Disallowed route types</label>
                  <div className="rounded-md border border-gray-200 dark:border-gray-700 p-2 bg-gray-50 dark:bg-gray-800">
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { key: 'bus', label: 'Bus' },
                        { key: 'metro', label: 'Metro' },
                        { key: 'ferry', label: 'Ferry' },
                        { key: 'tram', label: 'Tram' },
                      ].map(opt => (
                        <label key={opt.key} className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                          <input
                            type="checkbox"
                            checked={disallowedModes.includes(opt.key)}
                            onChange={(e) => {
                              setDisallowedModes(prev => e.target.checked ? [...prev, opt.key] : prev.filter(k => k !== opt.key));
                            }}
                            className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                          />
                          <span className="lowercase first-letter:uppercase">{opt.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Walking time limit (min)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g., 10"
                      value={walkingTimeLimitMin}
                      onChange={(e) => setWalkingTimeLimitMin(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Waiting time limit (min)</label>
                    <input
                      type="number"
                      min={0}
                      placeholder="e.g., 8"
                      value={waitingTimeLimitMin}
                      onChange={(e) => setWaitingTimeLimitMin(Math.max(0, Number(e.target.value) || 0))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <label className="inline-flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                    <input
                      type="checkbox"
                      checked={showNearbyStops}
                      onChange={e => setShowNearbyStops(e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                    />
                    Show nearby bus stops
                  </label>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">Nearby stops radius (meters)</label>
                    <input
                      type="number"
                      min={100}
                      step={50}
                      value={nearbyRadius}
                      onChange={e => setNearbyRadius(Math.max(100, Number(e.target.value) || 1000))}
                      className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Source (lat, lon)</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Latitude (e.g., 12.9716)"
                    value={source.lat ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : clampLat(parseFloat(e.target.value));
                      setSource(s => ({ ...s, lat: Number.isFinite(v as number) ? (v as number) : null }));
                    }}
                  />
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Longitude (e.g., 77.5946)"
                    value={source.lon ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : clampLon(parseFloat(e.target.value));
                      setSource(s => ({ ...s, lon: Number.isFinite(v as number) ? (v as number) : null }));
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPickMode('source')}
                  className={`mt-2 inline-flex items-center px-3 py-2 rounded-lg text-sm transition-colors shadow-sm ${pickMode === 'source' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
                >
                  <MapPin size={16} className="mr-2" /> Pick Source on Map
                </button>
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Destination (lat, lon)</label>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Latitude (e.g., 12.9750)"
                    value={dest.lat ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : clampLat(parseFloat(e.target.value));
                      setDest(s => ({ ...s, lat: Number.isFinite(v as number) ? (v as number) : null }));
                    }}
                  />
                  <input
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Longitude (e.g., 77.6000)"
                    value={dest.lon ?? ''}
                    onChange={(e) => {
                      const v = e.target.value === '' ? null : clampLon(parseFloat(e.target.value));
                      setDest(s => ({ ...s, lon: Number.isFinite(v as number) ? (v as number) : null }));
                    }}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setPickMode('dest')}
                  className={`mt-2 inline-flex items-center px-3 py-2 rounded-lg text-sm transition-colors shadow-sm ${pickMode === 'dest' ? 'bg-blue-600 text-white' : 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
                >
                  <MapPin size={16} className="mr-2" /> Pick Destination on Map
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleSwap}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                  disabled={!bothSet}
                  title={!bothSet ? 'Set both points first' : 'Swap points'}
                >
                  <Shuffle size={16} className="mr-2" /> Swap
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center px-3 py-2 rounded-lg text-sm border bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <RefreshCcw size={16} className="mr-2" /> Reset
                </button>
              </div>

              <div className="mt-3 text-xs text-gray-600 dark:text-gray-400">
                {pickMode ? (
                  <div className="py-2 px-3 rounded-md bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                    Click on the map to set the {pickMode === 'source' ? 'source' : 'destination'} point.
                  </div>
                ) : (
                  <div className="py-2 px-3 rounded-md bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                    Tip: You can type coordinates or use the map pickers.
                  </div>
                )}
              </div>

              {(bothSet || raptorFixtureEnabled) && (
                <div className="mt-3 p-3 rounded-md bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm">
                  <div className="font-medium mb-1 flex items-center">
                    <Navigation size={16} className="mr-2" /> {raptorFixtureEnabled && !bothSet ? 'Fixture ready' : 'Points ready'}
                  </div>
                  {bothSet ? (
                    <>
                      <div>Source: {source.lat?.toFixed(6)}, {source.lon?.toFixed(6)}</div>
                      <div>Destination: {dest.lat?.toFixed(6)}, {dest.lon?.toFixed(6)}</div>
                    </>
                  ) : (
                    <div className="text-xs opacity-90">Loads the hardcoded RAPTOR result (dev-only).</div>
                  )}
                    <button
                      type="button"
                      onClick={planRoute}
                      className="mt-3 inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                      disabled={raptorFixtureEnabled ? loading : (loading || !selectedDate || !serviceAvailability[`${selectedDate.getFullYear()}${String(selectedDate.getMonth()+1).padStart(2,'0')}${String(selectedDate.getDate()).padStart(2,'0')}`])}
                    >
                      {loading ? (
                        <span className="flex items-center"><span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></span>Planning…</span>
                      ) : (
                        <span className="flex items-center"><Navigation size={16} className="mr-2" />Plan Route</span>
                      )}
                    </button>
                </div>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Map side */}
      <div className={`
        relative
        flex-1
        h-screen
        transition-[margin]
        duration-300
        ${isSidebarOpen ? 'md:ml-0' : ''}
      `}>
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-70 dark:bg-opacity-70 flex items-center justify-center z-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-3 w-[22rem] max-w-[calc(100vw-2rem)] pointer-events-auto">
          {serverError && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm shadow">
              {serverError}
            </div>
          )}

          {(routeInfo || routeOptionKeys.length > 0) && (
            <div
              className="bg-white/95 dark:bg-gray-900/90 backdrop-blur-sm border border-black dark:border-white/30 rounded-lg shadow text-gray-800 dark:text-gray-200 overflow-hidden max-h-[70vh]"
              style={{ transform: `translate3d(${floatingCardOffset.x}px, ${floatingCardOffset.y}px, 0)` }}
            >
              <div
                className="px-4 py-2 border-b border-black/20 dark:border-white/20 cursor-move select-none touch-none"
                onPointerDown={(e) => {
                  // Only left-click drags with mouse; touch/pen is fine.
                  if (e.pointerType === 'mouse' && e.button !== 0) return;
                  floatingDragRef.current.active = true;
                  floatingDragRef.current.pointerId = e.pointerId;
                  floatingDragRef.current.startClientX = e.clientX;
                  floatingDragRef.current.startClientY = e.clientY;
                  floatingDragRef.current.startOffsetX = floatingCardOffset.x;
                  floatingDragRef.current.startOffsetY = floatingCardOffset.y;
                  try {
                    (e.currentTarget as any).setPointerCapture?.(e.pointerId);
                  } catch {
                    // ignore
                  }
                  e.preventDefault();
                }}
              >
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-700 dark:text-gray-200">Route details</div>
                  <div className="text-[10px] text-gray-500 dark:text-gray-400">Drag</div>
                </div>
              </div>

              <div className="px-4 py-3 overflow-y-auto max-h-[calc(70vh-40px)]">
              {routeOptionKeys.length > 0 && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-2">Route option</label>
                  <select
                    value={routeOptionView}
                    onChange={(e) => setRouteOptionView(e.target.value as RouteOptionView)}
                    className="w-full px-3 py-2 border rounded-lg text-sm bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {routeOptionKeys.length > 1 && <option value="all">All (1/2/3)</option>}
                    {routeOptionKeys.includes('1') && <option value="1">Option 1</option>}
                    {routeOptionKeys.includes('2') && <option value="2">Option 2</option>}
                    {routeOptionKeys.includes('3') && <option value="3">Option 3</option>}
                  </select>
                  {routeOptionKeys.length > 1 && (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-700 dark:text-gray-300">
                      {routeOptionKeys.includes('1') && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-blue-600" />
                          Option 1
                        </div>
                      )}
                      {routeOptionKeys.includes('2') && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-pink-700" />
                          Option 2
                        </div>
                      )}
                      {routeOptionKeys.includes('3') && (
                        <div className="flex items-center gap-2">
                          <span className="inline-block h-2 w-2 rounded-full bg-green-600" />
                          Option 3
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {routeInfo && (
                <div className="mb-4">
                  <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Estimated Trip</h2>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-800 dark:text-gray-200">
                    <div className="flex items-center"><Clock size={16} className="mr-2" />{routeInfo.estimated_duration}</div>
                    <div className="flex items-center"><RouteIcon size={16} className="mr-2" />{routeInfo.total_distance}</div>
                    {etaString && (
                      <div className="flex items-center"><Clock size={16} className="mr-2" />ETA {etaString}</div>
                    )}
                  </div>
                </div>
              )}

              {routeOptionKeys.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Directions</h2>
                    {routeOptionView !== 'all' && selectedRouteOptionKey && (
                      (() => {
                        const a = getOptionAccent(selectedRouteOptionKey);
                        return (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${a.chipBg} ${a.text}`}>
                            Option {selectedRouteOptionKey}
                          </span>
                        );
                      })()
                    )}
                  </div>
                  {routeOptionView === 'all' ? (
                    <div className="space-y-3">
                      {routeOptionKeys.map((k) => {
                        const opt = routeOptions[k];
                        const segs = opt?.segments || [];
                        if (!segs.length) return null;
                        const accent = getOptionAccent(k);
                        return (
                          <div key={`legs-${k}`}>
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`inline-block h-2 w-2 rounded-full ${k === '1' ? 'bg-blue-600' : k === '2' ? 'bg-pink-700' : 'bg-green-600'}`} />
                              <div className={`text-xs font-semibold ${accent.text}`}>Option {k}</div>
                            </div>
                            <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2">
                              {segs.map((s, idx) => renderLegRow(s, idx, segs.length, accent))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    (() => {
                      const k = selectedRouteOptionKey;
                      const segs = k ? (routeOptions[k]?.segments || []) : [];
                      const accent = getOptionAccent(k);
                      return (
                        <div className="rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-2">
                          {segs.length ? segs.map((s, idx) => renderLegRow(s, idx, segs.length, accent)) : (
                            <div className="text-xs text-gray-600 dark:text-gray-300 py-2">No legs available for this option.</div>
                          )}
                        </div>
                      );
                    })()
                  )}
                </div>
              )}
              </div>
            </div>
          )}
        </div>
        <div className="absolute top-4 left-4 z-10 bg-white/90 dark:bg-gray-900/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg shadow px-3 py-2 text-xs text-gray-700 dark:text-gray-200">
          {pickMode ? (
            <div className="flex items-center"><span className="mr-2 inline-block h-2 w-2 rounded-full bg-blue-500"></span>Click the map to set {pickMode === 'source' ? 'Source' : 'Destination'}</div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-green-500"></span>Source</div>
              <div className="flex items-center"><span className="mr-1 inline-block h-2 w-2 rounded-full bg-red-500"></span>Destination</div>
            </div>
          )}
        </div>
        {/* Bottom-left route stats removed (now shown in right floating card) */}
        {(() => {
          const mapCenter = dynamicCityCenter ?? cityCenter;
          const nearbyAnchor: [number, number] | null =
            source.lat !== null && source.lon !== null
              ? [source.lat, source.lon]
              : dest.lat !== null && dest.lon !== null
                ? [dest.lat, dest.lon]
                : null;
          return (
            <MapContainer
              key={`${mapCenter[0]}-${mapCenter[1]}`}
              center={mapCenter}
              zoom={12}
              className="w-full h-full"
            >
          <TileLayer
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
            maxZoom={20}
          />
          <ClickCatcher />
          {fitBoundsInfo && (
            <FitBoundsController points={fitBoundsInfo.points} boundsKey={fitBoundsInfo.key} />
          )}
          {source.lat !== null && source.lon !== null && (
            <Marker
              position={[source.lat, source.lon]}
              icon={startIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = (e.target as any).getLatLng();
                  setSource({ lat: clampLat(latlng.lat), lon: clampLon(latlng.lng) });
                }
              }}
            >
              <Popup>
                <div className="font-semibold">Source</div>
                <div className="text-xs text-gray-600">{source.lat.toFixed(6)}, {source.lon.toFixed(6)}</div>
              </Popup>
            </Marker>
          )}
          {dest.lat !== null && dest.lon !== null && (
            <Marker
              position={[dest.lat, dest.lon]}
              icon={endIcon}
              draggable
              eventHandlers={{
                dragend: (e) => {
                  const latlng = (e.target as any).getLatLng();
                  setDest({ lat: clampLat(latlng.lat), lon: clampLon(latlng.lng) });
                }
              }}
            >
              <Popup>
                <div className="font-semibold">Destination</div>
                <div className="text-xs text-gray-600">{dest.lat.toFixed(6)}, {dest.lon.toFixed(6)}</div>
              </Popup>
            </Marker>
          )}
          {routeOptionKeys.length > 0 ? (
            routeOptionView === 'all' ? (
              <>
                {/* Connect source/destination markers to each option's route start/end */}
                {source.lat !== null && source.lon !== null && dest.lat !== null && dest.lon !== null && (
                  <>
                    {routeOptionKeys.flatMap((k) => {
                      const ends = getOptionEnds(routeOptions[k]);
                      const items: any[] = [];
                      if (ends.start) {
                        const a: [number, number] = [source.lat as number, source.lon as number];
                        const b: [number, number] = ends.start;
                        const mid = midpoint(a, b);
                        items.push(
                          <Polyline
                            key={`connector-${k}-start`}
                            positions={[
                              a,
                              b,
                            ]}
                            pathOptions={walkConnectorStyle}
                          />
                        );
                        if (mid) {
                          items.push(
                            <Marker
                              key={`connector-${k}-start-flag`}
                              position={mid}
                              icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                            />
                          );
                        }
                      }
                      if (ends.end) {
                        const a: [number, number] = ends.end;
                        const b: [number, number] = [dest.lat as number, dest.lon as number];
                        const mid = midpoint(a, b);
                        items.push(
                          <Polyline
                            key={`connector-${k}-end`}
                            positions={[
                              a,
                              b,
                            ]}
                            pathOptions={walkConnectorStyle}
                          />
                        );
                        if (mid) {
                          items.push(
                            <Marker
                              key={`connector-${k}-end-flag`}
                              position={mid}
                              icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                            />
                          );
                        }
                      }
                      return items;
                    })}
                  </>
                )}

                {routeOptionKeys.flatMap((k) => {
                  const opt = routeOptions[k];
                  const segs = opt?.segments || [];
                  const color = ROUTE_OPTION_COLORS[k];
                  const stopPins = new Map<
                    string,
                    { coord: [number, number]; name: string }
                  >();

                  for (const s of segs) {
                    if (s.fromStopId && s.fromCoord && s.fromName && !stopPins.has(s.fromStopId)) {
                      stopPins.set(s.fromStopId, { coord: s.fromCoord, name: s.fromName });
                    }
                    if (s.toStopId && s.toCoord && s.toName && !stopPins.has(s.toStopId)) {
                      stopPins.set(s.toStopId, { coord: s.toCoord, name: s.toName });
                    }
                  }

                  return [
                    ...segs.flatMap((s, idx) => {
                    const baseKey = `route-option-${k}-seg-${idx}`;
                    const pinColor = s.mode === 'walk' ? 'orange' : color;
                    const parts = splitPathOnLargeJumps(s.path);
                    const items: any[] = parts.map((p, partIdx) => (
                      <Polyline
                        key={`${baseKey}-part-${partIdx}`}
                        positions={p}
                        pathOptions={{
                          color: s.mode === 'walk' ? 'orange' : color,
                          weight: 4,
                          opacity: 0.85,
                          ...(s.mode === 'walk' ? { dashArray: '2 10', lineCap: 'round' } : {}),
                        }}
                      />
                    ));

                    if (s.mode === 'transit' && s.anchor) {
                      items.push(
                        <Marker
                          key={`${baseKey}-flag`}
                          position={s.anchor}
                          icon={makeLegFlagIcon('TRANSIT', s.label || 'Transit', color)}
                        >
                          <Popup>
                            <div className="text-xs">
                              <div className="font-semibold">Transit</div>
                              <div>{s.label || 'Transit'}</div>
                              <div className="text-gray-600">Option {k}</div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    if (s.mode === 'walk' && s.anchor) {
                      items.push(
                        <Marker
                          key={`${baseKey}-walk-flag`}
                          position={s.anchor}
                          icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                        >
                          <Popup>
                            <div className="text-xs">
                              <div className="font-semibold">Walk</div>
                              <div className="text-gray-600">Option {k}</div>
                            </div>
                          </Popup>
                        </Marker>
                      );
                    }
                    return items;
                  }),
                    ...Array.from(stopPins.entries()).map(([stopId, v]) => (
                      <Marker
                        key={`stop-pin-${k}-${stopId}`}
                        position={v.coord}
                        icon={legPinIcon}
                      >
                        <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                          <div className="text-xs">
                            <div className="font-semibold">{stopId}</div>
                            <div>{v.name}</div>
                          </div>
                        </Tooltip>
                      </Marker>
                    )),
                  ];
                })}
              </>
            ) : (
              (() => {
                const k = routeOptionView as RouteOptionKey;
                const opt = routeOptions[k];
                const segs = opt?.segments || [];
                const color = ROUTE_OPTION_COLORS[k] || 'blue';
                return (
                  <>
                    {/* Connect source/destination markers to the selected option */}
                    {source.lat !== null && source.lon !== null && dest.lat !== null && dest.lon !== null && (() => {
                      const ends = getOptionEnds(opt);
                      const items: any[] = [];
                      if (ends.start) {
                        const a: [number, number] = [source.lat as number, source.lon as number];
                        const b: [number, number] = ends.start;
                        const mid = midpoint(a, b);
                        items.push(
                          <Polyline
                            key={`connector-${k}-start`}
                            positions={[
                              a,
                              b,
                            ]}
                            pathOptions={walkConnectorStyle}
                          />
                        );
                        if (mid) {
                          items.push(
                            <Marker
                              key={`connector-${k}-start-flag`}
                              position={mid}
                              icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                            />
                          );
                        }
                      }
                      if (ends.end) {
                        const a: [number, number] = ends.end;
                        const b: [number, number] = [dest.lat as number, dest.lon as number];
                        const mid = midpoint(a, b);
                        items.push(
                          <Polyline
                            key={`connector-${k}-end`}
                            positions={[
                              a,
                              b,
                            ]}
                            pathOptions={walkConnectorStyle}
                          />
                        );
                        if (mid) {
                          items.push(
                            <Marker
                              key={`connector-${k}-end-flag`}
                              position={mid}
                              icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                            />
                          );
                        }
                      }
                      return items;
                    })()}

                    {(() => {
                      const stopPins = new Map<string, { coord: [number, number]; name: string }>();
                      for (const s of segs) {
                        if (s.fromStopId && s.fromCoord && s.fromName && !stopPins.has(s.fromStopId)) {
                          stopPins.set(s.fromStopId, { coord: s.fromCoord, name: s.fromName });
                        }
                        if (s.toStopId && s.toCoord && s.toName && !stopPins.has(s.toStopId)) {
                          stopPins.set(s.toStopId, { coord: s.toCoord, name: s.toName });
                        }
                      }

                      return (
                        <>
                          {segs.flatMap((s, idx) => {
                      const baseKey = `route-option-${k}-seg-${idx}`;
                      const pinColor = s.mode === 'walk' ? 'orange' : color;
                      const parts = splitPathOnLargeJumps(s.path);
                      const items: any[] = parts.map((p, partIdx) => (
                        <Polyline
                          key={`${baseKey}-part-${partIdx}`}
                          positions={p}
                          pathOptions={{
                            color: s.mode === 'walk' ? 'orange' : color,
                            weight: 4,
                            opacity: 0.85,
                            ...(s.mode === 'walk' ? { dashArray: '2 10', lineCap: 'round' } : {}),
                          }}
                        />
                      ));

                      if (s.mode === 'transit' && s.anchor) {
                        items.push(
                          <Marker
                            key={`${baseKey}-flag`}
                            position={s.anchor}
                            icon={makeLegFlagIcon('TRANSIT', s.label || 'Transit', color)}
                          >
                            <Popup>
                              <div className="text-xs">
                                <div className="font-semibold">Transit</div>
                                <div>{s.label || 'Transit'}</div>
                                <div className="text-gray-600">Option {k}</div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      if (s.mode === 'walk' && s.anchor) {
                        items.push(
                          <Marker
                            key={`${baseKey}-walk-flag`}
                            position={s.anchor}
                            icon={makeLegFlagIcon('WALK', 'Walk', 'orange')}
                          >
                            <Popup>
                              <div className="text-xs">
                                <div className="font-semibold">Walk</div>
                                <div className="text-gray-600">Option {k}</div>
                              </div>
                            </Popup>
                          </Marker>
                        );
                      }
                      return items;
                          })}

                          {Array.from(stopPins.entries()).map(([stopId, v]) => (
                            <Marker
                              key={`stop-pin-${k}-${stopId}`}
                              position={v.coord}
                              icon={legPinIcon}
                            >
                              <Tooltip direction="top" offset={[0, -20]} opacity={1}>
                                <div className="text-xs">
                                  <div className="font-semibold">{stopId}</div>
                                  <div>{v.name}</div>
                                </div>
                              </Tooltip>
                            </Marker>
                          ))}
                        </>
                      );
                    })()}
                  </>
                );
              })()
            )
          ) : (
            straightPath.length > 0 && (
              <Polyline positions={straightPath} pathOptions={{ color: 'gray', weight: 4, opacity: 0.8 }} />
            )
          )}
          {showNearbyStops && nearbyAnchor && (
            <>
              <Circle
                center={nearbyAnchor}
                radius={nearbyRadius}
                pathOptions={{ color: 'green', fillOpacity: 0.08, weight: 1 }}
              />
              {nearbyStops.map(s => (
                <CircleMarker
                  key={s.stop_id}
                  center={[s.stop_lat, s.stop_lon]}
                  radius={5}
                  pathOptions={{ color: '#ff1f3d', fillColor: '#ff1f3d', fillOpacity: 0.9, weight: 2 }}
                >
                  <Popup>
                    <div className="text-xs">
                      <div className="font-semibold text-red-600">{s.stop_name}</div>
                      <div className="text-gray-600">{s.stop_lat.toFixed(5)}, {s.stop_lon.toFixed(5)}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              ))}
            </>
          )}
            </MapContainer>
          );
        })()}
      </div>
    </div>
  );
}

export default RoutePlanning;
