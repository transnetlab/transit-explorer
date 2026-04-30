import { useEffect, useState } from 'react';
import { SearchBar } from '../components/SearchBar';
import { Map } from '../components/Map';
import { Menu, X,ArrowLeft } from 'lucide-react';
import { StopList } from '../components/StopList';
import { Stop } from '../types';
import { getStops, getUserCities } from '../api';
import { useNavigate,useParams } from 'react-router-dom';
import { defaultCities } from './CitySelection';

export function StopVisualizer() {
  const navigate = useNavigate();
  const { city } = useParams();

  const [cityCenter, setCityCenter] = useState<[number, number]>(() => {
    const fallback: [number, number] = [12.9716, 77.5946];
    if (!city) return fallback;
    const cityObj = defaultCities.find((c: any) => c.id.toLowerCase() === city.toLowerCase());
    if (cityObj && cityObj.centerLat && cityObj.centerLon) {
      return [cityObj.centerLat, cityObj.centerLon];
    }
    const storedLat = Number(localStorage.getItem('selectedCityCenterLat'));
    const storedLng = Number(localStorage.getItem('selectedCityCenterLng'));
    if (Number.isFinite(storedLat) && Number.isFinite(storedLng)) {
      return [storedLat, storedLng];
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
        // ignore; keep existing center
      }
    })();
  }, [city]);

  useEffect(() => {
    const cityId = localStorage.getItem('selectedCityId');
    if (!cityId) {
      navigate('/', { replace: true });
    }
  }, [navigate]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStop, setSelectedStop] = useState<Stop | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [stops, setStops] = useState<Stop[]>([]);

  useEffect(() => {
    const fetchStops = async () => {
      const fetchedStops = await getStops();
      setStops(fetchedStops);
    };

    fetchStops();
  }, []);

  const handleStopSelect = (stop: Stop) => {
    setSelectedStop(stop);
    if (window.innerWidth < 768) {
      setIsSidebarOpen(false);
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
        <div className="h-full p-6 overflow-y-auto">
          <div className="pt-12 md:pt-0">
          <div className="flex items-center gap-4 mb-4">
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
              <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Stop Explorer</h1>
            </div>
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
            <div className="mt-6">
              <StopList
                stops={stops}
                onStopSelect={handleStopSelect}
                searchQuery={searchQuery}
                selectedStopId={selectedStop ? Number(selectedStop.stop_id) : null}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={`
        flex-1
        h-screen
        transition-[margin]
        duration-300
        ${isSidebarOpen ? 'md:ml-0' : ''}
      `}>
        <Map 
          path={[]} 
          selectedRouteId={null}
          selectedStop={selectedStop}
          showStopOnly={true}
          center={cityCenter}
        />
      </div>
    </div>
  );
}
