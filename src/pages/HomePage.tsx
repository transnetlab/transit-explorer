import { useNavigate, useParams } from 'react-router-dom';
import { Bus, MapPin, Navigation, Route, ArrowLeft, SplitSquareHorizontal, ArrowRightLeft, Info, X, CheckCircle2 } from 'lucide-react';
import { useEffect, useState } from 'react';

export function HomePage() {
  const navigate = useNavigate();
  const { city } = useParams();
  const [infoOpen, setInfoOpen] = useState<null | { title: string; description: string }>(null);

  const isDefaultCity = city === 'bangalore' || city === 'paris' || city === 'austin' || city === 'dharwad';

  const selectedUniqueCityId = String(
    localStorage.getItem('selectedCityUniqueId') ||
      localStorage.getItem('uniqueCityId') ||
      localStorage.getItem('unique_city_id') ||
      ''
  );

  const routeStopSequenceDone = (() => {
    if (isDefaultCity) {
      const c = (city || '').trim();
      if (!c) return false;
      const key = `preprocessing:route_stop_sequence:done:default:${c}`;
      return Boolean(localStorage.getItem(key));
    }

    if (!selectedUniqueCityId) return false;
    const key = `preprocessing:route_stop_sequence:done:${selectedUniqueCityId}`;
    return Boolean(localStorage.getItem(key));
  })();

  const transfersPreprocessDone = (() => {
    if (isDefaultCity) {
      const c = (city || '').trim();
      if (!c) return false;
      const key = `preprocessing:transfers_preprocess:done:default:${c}`;
      return Boolean(localStorage.getItem(key));
    }

    if (!selectedUniqueCityId) return false;
    const key = `preprocessing:transfers_preprocess:done:${selectedUniqueCityId}`;
    return Boolean(localStorage.getItem(key));
  })();

  // Only enforce gating when we actually have a backend unique_city_id.
  // (Default/demo cities may not have it.)
  const routePlanningAllowed = isDefaultCity || !selectedUniqueCityId || routeStopSequenceDone;
  

  useEffect(() => {
    const cityId = localStorage.getItem('selectedCityId');
    if (!cityId) navigate('/', { replace: true });
  }, [navigate]);

  const sections = [
    {
      title: 'View',
      description: 'Explore and visualize transit data',
      features: [
        { title: 'Route Explorer', description: 'View and explore bus routes on an interactive map', icon: Route, path: `/${city}/route-visualizer`, enabled: true },
        { title: 'Route Explorer 3D', description: 'View and explore bus routes on an interactive map', icon: Route, path: `/${city}/route-visualizer-3d`, enabled: true },
        { title: 'Stop Explorer', description: 'Explore bus stops and find routes passing through them', icon: MapPin, path: `/${city}/stop-explorer`, enabled: true },
      ],
    },
    {
      title: 'Preprocessing',
      description: 'Prepare and derive datasets for better analysis',
      features: [
        {
          title: 'Route Stop Sequence',
          description: 'Generate route stop sequences / route variants from your GTFS',
          icon: SplitSquareHorizontal,
          path: `/${city}/route-stop-sequence`,
          enabled: true,
          done: routeStopSequenceDone,
          info: {
            title: 'Route Stop Sequence',
            description:
              'This preprocessing step creates new route variants from unique stop sequences (unique segments) found in the trips. For example, if a route has trips using stops 1 → 3 → 5 → 4 and the same route also has trips using stops 1 → 3 → 4, it will create two new routes so each distinct stop pattern is represented separately.',
          },
        },
        {
          title: 'Preprocess Transfers',
          description: 'Run backend preprocessing for GTFS transfers',
          icon: ArrowRightLeft,
          path: `/${city}/transfers-preprocess`,
          enabled: true,
          done: transfersPreprocessDone,
          info: {
            title: 'Preprocess Transfers',
            description:
              'This preprocessing step prepares your GTFS transfers on the backend so transfer-related queries can run faster and more reliably. A transfer is basically the “walking link” between two legs of a journey — e.g., A → B (bus) → C (walk from B to C) → D (bus from C to D). Run this after uploading transfers.',
          },
        },
      ],
    },
    {
      title: 'Tools',
      description: 'Plan routes and optimize operations',
      features: [
        {
          title: 'Route Planning',
          description: 'Plan your journey with optimal routes',
          icon: Navigation,
          path: `/${city}/route-planning`,
          enabled: routePlanningAllowed,
          disabledReason: 'Run Route Stop Sequence preprocessing first',
        },
        { title: 'Fleet Optimization', description: 'Optimize the fleets', icon: Bus, path: `/${city}/fleet-optimization`, enabled: true },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between gap-4 mb-3">
          <button onClick={() => navigate('/city-selection')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={24} className="text-blue-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-2">Transit Explorer</h1>
            <p className="text-gray-600 dark:text-gray-300">Explore and visualize public transportation in {city}</p>
          </div>
          <div></div>
        </div>

        <div className="max-w-5xl mx-auto space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <div className="mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{section.title}</h2>
                <p className="text-sm text-gray-600 dark:text-gray-300">{section.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
                {section.features.map((feature) => (
                  <div
                    key={feature.title}
                    className={
                      `relative p-6 rounded-lg text-left transition-all transform hover:scale-105 ` +
                      (feature.enabled
                        ? 'bg-white dark:bg-gray-800 shadow-md hover:shadow-lg'
                        : 'bg-gray-100 dark:bg-gray-700 cursor-not-allowed opacity-60')
                    }
                  >
                    {(feature as any).done === true && (
                      <div
                        className="absolute top-4 right-14 h-8 w-8 flex items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                        aria-label="Preprocessing done"
                        title="Preprocessing done"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </div>
                    )}

                    {'info' in feature && feature.info && (
                      <button
                        type="button"
                        aria-label={`Info: ${feature.title}`}
                        title={`About ${feature.title}`}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setInfoOpen(feature.info);
                        }}
                        className="absolute top-4 right-4 h-8 w-8 flex items-center justify-center rounded-full border border-blue-200 dark:border-blue-700 text-blue-700 dark:text-blue-300 bg-white/90 dark:bg-gray-900/60 hover:bg-blue-50 dark:hover:bg-gray-800"
                      >
                        <Info className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => feature.enabled && navigate(feature.path)}
                      disabled={!feature.enabled}
                      aria-disabled={!feature.enabled}
                      className={
                        `w-full text-left ` +
                        (feature.enabled ? 'cursor-pointer' : 'cursor-not-allowed')
                      }
                    >
                      <div className="flex items-start space-x-4">
                        <div
                          className={
                            'p-3 rounded-full ' +
                            (feature.enabled
                              ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300'
                              : 'bg-gray-200 dark:bg-gray-600 text-gray-500 dark:text-gray-300')
                          }
                        >
                          <feature.icon size={24} />
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                          <p className="text-gray-600 dark:text-gray-300">{feature.description}</p>
                          {!feature.enabled && (
                            <span className="text-sm text-gray-500 dark:text-gray-400 mt-2 block">{(feature as any).disabledReason || 'Coming soon'}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {infoOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
            onClick={() => setInfoOpen(null)}
            role="presentation"
          >
            <div
              className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={infoOpen.title}
            >
              <div className="flex items-start justify-between gap-4 mb-2">
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">{infoOpen.title}</h3>
                <button
                  type="button"
                  aria-label="Close"
                  onClick={() => setInfoOpen(null)}
                  className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-gray-700 dark:text-gray-300">{infoOpen.description}</p>
            </div>
          </div>
        )}

        

      </div>
    </div>
  );
}