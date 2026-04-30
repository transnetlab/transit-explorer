// import { useEffect, useState } from 'react';
// import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
// import 'leaflet/dist/leaflet.css';
// import { getRouteStops } from '../api';
// import { Stop } from '../types';
// import L from 'leaflet';

// // Fix for default marker icons in react-leaflet
// const defaultIcon = L.icon({
//   iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// // Icons for start, end, and intermediate points
// const startIcon = L.icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const endIcon = L.icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// const intermediateIcon = L.icon({
//   iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
//   shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
//   iconSize: [25, 41],
//   iconAnchor: [12, 41],
//   popupAnchor: [1, -34],
//   shadowSize: [41, 41]
// });

// // Set default icon for all markers
// L.Marker.prototype.options.icon = defaultIcon;

// // Component to handle map bounds
// function BoundsUpdater({ path }: { path: [number, number][] }) {
//   const map = useMap();

//   useEffect(() => {
//     if (path.length > 0) {
//       const bounds = L.latLngBounds(path);
//       map.fitBounds(bounds, {
//         padding: [50, 50],
//         maxZoom: 15,
//         animate: true,
//         duration: 1
//       });
//     }
//   }, [path, map]);

// interface MapProps {
//   path: [number, number][];
//   selectedRouteId: number | null;
// }

// export function Map({ path, selectedRouteId }: MapProps) {
//   const center: [number, number] = [12.9716, 77.5946];
//   const [stops, setStops] = useState<Stop[]>([]);

//   useEffect(() => {
//     const fetchStops = async () => {
//       if (selectedRouteId !== null) {
//         try {
//           const routeStops = await getRouteStops(selectedRouteId);
//           setStops(routeStops);
//         } catch (error) {
//           console.error('Failed to fetch route stops:', error);
//           setStops([]);
//         }
//       } else {
//         setStops([]);
//       }
//     };

//     fetchStops();
//   }, [selectedRouteId]);

//   // Debug logging
//   useEffect(() => {
//     console.log('Path received:', path);
//     console.log('Selected Route ID:', selectedRouteId);
//     console.log('Stops:', stops);
//   }, [path, selectedRouteId, stops]);

//   // Polyline positions: use path if available, otherwise fallback to stops
//   const polylinePositions = path.length > 0 
//     ? path 
//     : stops.map(stop => [stop.stop_lat, stop.stop_lon] as [number, number]);

//   return (
//     <MapContainer
//       center={center}
//       zoom={12}
//       className="w-full h-full"
//       style={{ zIndex: 1 }}
//     >
//       <TileLayer
//         url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
//         subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
//         maxZoom={20}
//       />
      
//       {polylinePositions.length > 0 && (
//         <>
//           <Polyline
//             positions={polylinePositions}
//             pathOptions={{
//               color: 'blue',
//               weight: 4,
//               opacity: 0.7,
//               lineCap: 'round',
//               lineJoin: 'round'
//             }}
//           />
//           <BoundsUpdater path={polylinePositions} />
//         </>
//       )}
      
//       {stops.map((stop, index) => {
//         let markerIcon;
//         let label;
        
//         if (index === 0) {
//           markerIcon = startIcon;
//           label = "Start: " + stop.stop_name;
//         } else if (index === stops.length - 1) {
//           markerIcon = endIcon;
//           label = "End: " + stop.stop_name;
//         } else {
//           markerIcon = intermediateIcon;
//           label = stop.stop_name;
//         }

//         return (
//           <Marker 
//             key={stop.stop_id} 
//             position={[stop.stop_lat, stop.stop_lon]} 
//             icon={markerIcon}
//           >
//             <Popup>
//               <div className="font-semibold">{label}</div>
//               <div className="text-sm text-gray-600">Stop ID: {stop.stop_id}</div>
//               <div className="text-xs text-gray-500 mt-1">Stop {index + 1} of {stops.length}</div>
//             </Popup>
//           </Marker>
//         );
//       })}
//     </MapContainer>
//   );
// }
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getRouteStops, getRouteDetails } from '../api';
import { Stop, RouteResponse } from '../types';
import L from 'leaflet';
import { Clock, Route } from 'lucide-react';

// Fix for default marker icons in react-leaflet
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Create different icons for start, end, and intermediate points
const startIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const endIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const intermediateIcon = L.icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

// Set default icon for all markers
L.Marker.prototype.options.icon = defaultIcon;

// Component to handle map bounds and zoom
function BoundsUpdater({
  path,
  selectedStop,
  center,
}: {
  path: [number, number][];
  selectedStop?: Stop | null;
  center: [number, number];
}) {
  const map = useMap();

  useEffect(() => {
    if (selectedStop) {
      map.setView([selectedStop.stop_lat, selectedStop.stop_lon], 16, {
        animate: true,
      });
    } else if (path.length > 0) {
      const bounds = L.latLngBounds(path);
      map.fitBounds(bounds, {
        padding: [50, 50],
        maxZoom: 15,
        animate: true,
      });
    } else if (center && Number.isFinite(center[0]) && Number.isFinite(center[1])) {
      map.setView(center, 12, { animate: true });
    }
  }, [path, map, selectedStop, center]);

  return null;
}

interface MapProps {
  path: [number, number][];
  selectedRouteId: string | null;
  selectedStop?: Stop | null;
  showStopOnly?: boolean;
  center?: [number, number]; // Add center prop
}

export function Map({ path, selectedRouteId, selectedStop, showStopOnly = false, center }: MapProps) {
  const defaultCenter: [number, number] = [12.9716, 77.5946];
  const mapCenter = center || defaultCenter;
  const [stops, setStops] = useState<Stop[]>([]);
  const [routeInfo, setRouteInfo] = useState<RouteResponse | null>(null);

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

  // Debug logging
  useEffect(() => {
    console.log('Path:', path);
    console.log('Route Info:', routeInfo);
  }, [path, routeInfo]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={mapCenter}
        zoom={12}
        className="w-full h-full"
        style={{ zIndex: 1 }}
      >
        <TileLayer
          url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          subdomains={['mt0', 'mt1', 'mt2', 'mt3']}
          maxZoom={20}
        />

        {path.length > 0 && (
          <Polyline
            positions={path}
            pathOptions={{
              color: 'blue',
              weight: 4,
              opacity: 0.7,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}

        <BoundsUpdater path={path} selectedStop={selectedStop} center={mapCenter} />

        {showStopOnly && selectedStop ? (
          <Marker
            position={[selectedStop.stop_lat, selectedStop.stop_lon]}
            icon={startIcon}
          >
            <Popup>
              <div className="font-semibold">{selectedStop.stop_name}</div>
              <div className="text-sm text-gray-600">Stop ID: {selectedStop.stop_id}</div>
            </Popup>
          </Marker>
        ) : (
          stops.map((stop, index) => {
            let markerIcon;
            let label;

            if (index === 0) {
              markerIcon = startIcon;
              label = 'Start: ' + stop.stop_name;
            } else if (index === stops.length - 1) {
              markerIcon = endIcon;
              label = 'End: ' + stop.stop_name;
            } else {
              markerIcon = intermediateIcon;
              label = stop.stop_name;
            }

            return (
              <Marker
                key={stop.stop_id}
                position={[stop.stop_lat, stop.stop_lon]}
                icon={markerIcon}
              >
                <Popup>
                  <div className="font-semibold">{label}</div>
                  <div className="text-sm text-gray-600">Stop ID: {stop.stop_id}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Stop {index + 1} of {stops.length}
                  </div>
                </Popup>
              </Marker>
            );
          })
        )}
      </MapContainer>

      {routeInfo && (
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-8 z-[1000] max-w-xs border border-black">
          <div className="flex items-center space-x-4">
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
