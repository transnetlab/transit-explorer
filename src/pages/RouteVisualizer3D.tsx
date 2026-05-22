import { useEffect, useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { RouteList } from '../components/RouteList';
import { Map3D } from '../components/Map3D';
import { Route } from '../types';
import { getRoutes, getShortestPath, getUserCities } from '../api';
import { Menu, X, ArrowLeft } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { defaultCities } from './CitySelection';

export function RouteVisualizer3D() {
  const navigate = useNavigate();
  const { city } = useParams();
  const [routes, setRoutes] = useState<Route[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<[number, number][]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null);

  const [cityCenter, setCityCenter] = useState<[number, number]>(() => {
    const fallback: [number, number] = [12.9716, 77.5946];
    if (!city) return fallback;

    const cityLower = city.toLowerCase();
    const defaultObj = defaultCities.find((c: any) => c.id.toLowerCase() === cityLower);
    if (defaultObj && defaultObj.centerLat && defaultObj.centerLon) {
      return [defaultObj.centerLat, defaultObj.centerLon];
    }

    const storedLat = Number(localStorage.getItem('selectedCityCenterLat'));
    const storedLng = Number(localStorage.getItem('selectedCityCenterLng'));
    if (Number.isFinite(storedLat) && Number.isFinite(storedLng)) {
      return [storedLat, storedLng];
    }

    let customCities: any[] = [];
    try {
      const localCustom = localStorage.getItem('transit-cities');
      if (localCustom) customCities = JSON.parse(localCustom);
    } catch {}
    const allCities = [...customCities, ...defaultCities];
    const cityObj = allCities.find((c: any) => c.id && c.id.toLowerCase() === city.toLowerCase());
    if (cityObj && cityObj.centerLat && cityObj.centerLon) {
      return [cityObj.centerLat, cityObj.centerLon];
    }
    return fallback;
  });

  useEffect(() => {
    if (!city) return;
    const cityLower = city.toLowerCase();

    const defaultObj = defaultCities.find((c: any) => c.id.toLowerCase() === cityLower);
    if (defaultObj && defaultObj.centerLat && defaultObj.centerLon) {
      setCityCenter([defaultObj.centerLat, defaultObj.centerLon]);
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
          setCityCenter([lat, lng]);
        }
      } catch {
        // ignore
      }
    })();
  }, [city]);

  useEffect(() => {
    const cityId = localStorage.getItem('selectedCityId');
    if (!cityId) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const fetchRoutes = async () => {
      try {
        setError(null);
        const data = await getRoutes();
        setRoutes(data);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to fetch routes';
        setError(errorMessage);
        console.error('Failed to fetch routes:', error);
      }
    };
    fetchRoutes();
  }, [city]);

  const handleRouteSelect = async (routeId: string) => {
    setLoading(true);
    setError(null);
    setSelectedRouteId(routeId);
    try {
      const path = await getShortestPath(routeId, city);
      setSelectedPath(path);
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch shortest path';
      setError(errorMessage);
      console.error('Failed to fetch shortest path:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen relative flex flex-col md:flex-row bg-white dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-lg"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

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
        <div className="h-full p-4 sm:p-6 overflow-y-auto">
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
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Route Finder (3D)</h1>
              <div />
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {error}
              </div>
            )}
            <div className="mt-6">
              <RouteList
                routes={routes}
                onRouteSelect={handleRouteSelect}
                searchQuery={searchQuery}
                selectedRouteId={selectedRouteId}
              />
            </div>
          </div>
        </div>
      </div>

      <div
        className={`
          flex-1
          h-screen
          transition-[margin]
          duration-300
          ${isSidebarOpen ? 'md:ml-0' : ''}
        `}
      >
        {loading && (
          <div className="absolute inset-0 bg-white dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-70 flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}
        <Map3D path={selectedPath} selectedRouteId={selectedRouteId} center={cityCenter} />
      </div>
    </div>
  );
}
