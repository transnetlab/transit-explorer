import { useState } from 'react';
import { Route, Stop } from '../types';
import { MapPin, ChevronDown, ChevronUp, Bus } from 'lucide-react';
import { getRouteStops, getTripsAndStopTimesForRoute } from '../api';

interface RouteListProps {
  routes: Route[];
  onRouteSelect: (routeId: string) => void;
  searchQuery: string;
  selectedRouteId: string | null;
}

interface StopWithTimes extends Stop {
  times: { tripId: string; arrival: string; departure: string }[];
}

export function RouteList({ routes, onRouteSelect, searchQuery, selectedRouteId }: RouteListProps) {
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [expandedStop, setExpandedStop] = useState<string | null>(null);
  const [stopsWithTimes, setStopsWithTimes] = useState<StopWithTimes[]>([]);
  const [loadingRouteId, setLoadingRouteId] = useState<string | null>(null);

  const isTimeInPast = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const now = new Date();
    const timeToCheck = new Date();
    timeToCheck.setHours(hours, minutes, 0);
    return timeToCheck < now;
  };

  const filteredRoutes = routes.filter(route =>
    route.route_desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
    route.route_id.toString().includes(searchQuery)
  );

  const handleRouteClick = async (routeId: string) => {
    setLoadingRouteId(routeId);
    try {
      if (expandedRoute === routeId) {
        setExpandedRoute(null);
        setStopsWithTimes([]);
      } else {
        setExpandedRoute(routeId);

          const stops = await getRouteStops(routeId);
          const { stopTimes } = await getTripsAndStopTimesForRoute(routeId);

        // Create a map to hold stopId => array of arrival/departure times
        const stopTimesMap = new Map<string, { tripId: string; arrival: string; departure: string }[]>();
        stops.forEach(stop => stopTimesMap.set(stop.stop_id, []));

        stopTimes.forEach(time => {
          const stopId = String(time.stop_id);
          const existingTimes = stopTimesMap.get(stopId) || [];

          existingTimes.push({
            tripId: String(time.trip_id),
            arrival: String(time.arrival_time),
            departure: String(time.departure_time)
          });

          stopTimesMap.set(stopId, existingTimes);
        });

        const combinedStops: StopWithTimes[] = stops.map(stop => ({
          ...stop,
          times: stopTimesMap.get(stop.stop_id) || []
        }));

        setStopsWithTimes(combinedStops);
      }
    } catch (error) {
      console.error("Error fetching route data:", error);
    } finally {
      setLoadingRouteId(null);
    }
    onRouteSelect(routeId);
  };

  const handleStopClick = (stopId: string) => {
    setExpandedStop(prev => (prev === stopId ? null : stopId));
  };

  return (
    <div className="space-y-4">
      {filteredRoutes.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No routes found matching your search.
        </div>
      )}

      {filteredRoutes.map(route => (
        <div 
          key={route.route_id} 
          className={`bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden 
            ${selectedRouteId === route.route_id ? 'border-2 border-blue-500' : 'border border-transparent dark:border-gray-600'}`}
        >
          <div className="p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{route.route_desc}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm mt-1">Route ID: {route.route_id}</p>
              </div>
              <button
                onClick={() => handleRouteClick(route.route_id)}
                className={`flex items-center justify-center px-4 py-2 rounded-lg transition-colors w-full sm:w-auto
                  ${selectedRouteId === route.route_id 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'}`}
                disabled={loadingRouteId === route.route_id}
              >
                {loadingRouteId === route.route_id ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                ) : (
                  <>
                    <MapPin size={16} className="mr-2" />
                    Details
                    {expandedRoute === route.route_id ? (
                      <ChevronUp size={16} className="ml-2" />
                    ) : (
                      <ChevronDown size={16} className="ml-2" />
                    )}
                  </>
                )}
              </button>
            </div>
          </div>

          {expandedRoute === route.route_id && (
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-600">
              <div className="p-4">
                <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-4">Stops and Schedule:</h4>
                <div className="space-y-4">
                  {stopsWithTimes.map((stop, index) => (
                    <div 
                      key={stop.stop_id}
                      className={`bg-white dark:bg-gray-700 rounded-lg overflow-hidden transition-all duration-300 ${
                        expandedStop === stop.stop_id ? 'shadow-md' : 'shadow-sm'
                      }`}
                    >
                      <button
                        onClick={() => handleStopClick(stop.stop_id)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center font-medium">
                            {index + 1}
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-900 dark:text-gray-100">{stop.stop_name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">Stop ID: {stop.stop_id}</p>
                          </div>
                        </div>
                        <ChevronDown
                          size={20}
                          className={`text-gray-400 dark:text-gray-300 transform transition-transform duration-300 ${
                            expandedStop === stop.stop_id ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      {expandedStop === stop.stop_id && stop.times.length > 0 && (
                        <div className="ml-9 mt-2">
                          <div className="flex justify-between text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            <p>Arrival Times:</p>
                            <p>Departure Times:</p>
                          </div>
                          <div className="space-y-1">
                            {stop.times
                              .sort((a, b) => a.arrival.localeCompare(b.arrival))
                              .map((time, timeIndex) => {
                                const isPast = isTimeInPast(time.arrival);
                                return (
                                  <div key={`${stop.stop_id}-${time.tripId}-${timeIndex}`} className="text-sm text-gray-600 dark:text-gray-300 flex items-center">
                                    <Bus size={16} className={`mr-3 ${isPast ? 'text-red-400' : 'text-blue-500 dark:text-blue-400'}`} />
                                    <span className="w-20">{time.arrival}</span>
                                    <span className="mx-20">→</span>
                                    <span className="w-20">{time.departure}</span>
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
