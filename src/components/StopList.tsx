import { useState, useEffect } from 'react';
import { Stop, StopRoutesResponse } from '../types';
import { MapPin, ChevronDown, Bus } from 'lucide-react';
import { getStopRoutes } from '../api';

interface StopListProps {
  stops: Stop[] | Record<string, Stop> | undefined | null;
  onStopSelect: (stop: Stop) => void;
  searchQuery: string;
  selectedStopId: number | null;
}

export function StopList({
  stops,
  onStopSelect,
  searchQuery,
  selectedStopId,
}: StopListProps) {
  const [expandedStop, setExpandedStop] = useState<number | null>(null);
  const [stopRoutes, setStopRoutes] = useState<StopRoutesResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasFetchedOnce, setHasFetchedOnce] = useState(false);

  const stopArray: Stop[] = Array.isArray(stops)
    ? stops
    : typeof stops === 'object' && stops !== null
    ? Object.values(stops)
    : [];

  const filteredStops = stopArray.filter((stop) =>
    (stop?.stop_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stop?.stop_id?.toString().includes(searchQuery))
  );

  useEffect(() => {
  const fetchStopRoutes = async (stopId: number) => {
      setLoading(true);
      try {
    const routes = await getStopRoutes(stopId.toString());
        setStopRoutes(routes);
      } catch (error) {
        console.error('Error fetching stop routes:', error);
        setStopRoutes(null);
      } finally {
        setLoading(false);
        setHasFetchedOnce(true);
      }
    };

    if (expandedStop) {
      fetchStopRoutes(expandedStop);
    } else {
      setStopRoutes(null);
      setHasFetchedOnce(false);
    }
  }, [expandedStop]);

  const handleStopClick = (stop: Stop) => {
    onStopSelect(stop);
    const numericId = Number(stop.stop_id);
    setExpandedStop(expandedStop === numericId ? null : numericId);
  };

  return (
    <div className="space-y-4">
      {filteredStops.map((stop) => (
        <div
          key={stop.stop_id}
          className={`bg-white dark:bg-gray-700 rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden ${
            selectedStopId === Number(stop.stop_id) ? 'border-2 border-blue-500' : 'border border-transparent dark:border-gray-600'
          }`}
        >
          <button onClick={() => handleStopClick(stop)} className="w-full p-4 text-left hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-gray-900 dark:text-gray-100">{stop.stop_name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm">Stop ID: {stop.stop_id}</p>
                </div>
              </div>
              <ChevronDown
                size={20}
                className={`text-gray-400 dark:text-gray-300 transform transition-transform duration-300 ${
                  expandedStop === Number(stop.stop_id) ? 'rotate-180' : ''
                }`}
              />
            </div>
          </button>

          {expandedStop === Number(stop.stop_id) && (
            <div className="bg-gray-50 dark:bg-gray-800 border-t border-gray-100 dark:border-gray-600 p-4">
              <h4 className="font-semibold text-gray-700 dark:text-gray-200 mb-3">
                Routes passing through this stop:
              </h4>
              {loading ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                </div>
              ) : hasFetchedOnce && stopRoutes && stopRoutes.routes.length > 0 ? (
                <div className="space-y-2">
                  {stopRoutes.routes.map((route) => (
                    <div
                      key={route.route_id}
                      className="bg-white dark:bg-gray-700 p-3 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-center space-x-2">
                        <Bus size={16} className="text-blue-500 dark:text-blue-400" />
                        <span className="font-medium text-gray-900 dark:text-gray-100">{route.route_desc}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Route ID: {route.route_id}
                      </p>
                    </div>
                  ))}
                </div>
              ) : hasFetchedOnce ? (
                <div className="text-center py-4 text-gray-500 dark:text-gray-400">
                  No routes information available
                </div>
              ) : null}
            </div>
          )}
        </div>
      ))}

      {filteredStops.length === 0 && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No stops found matching your search.
        </div>
      )}
    </div>
  );
}
