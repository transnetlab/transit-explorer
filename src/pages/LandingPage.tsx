import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, BusFront, GraduationCap, Layers, Map, X } from 'lucide-react';

export function LandingPage() {
  const navigate = useNavigate();
  const [creditsOpen, setCreditsOpen] = useState(false);

  const sponsors = useMemo(
    () => [
      { name: 'Ministry of Education', Icon: GraduationCap },
      { name: 'BMTC', Icon: BusFront },
      { name: 'Vishal', Icon: Layers },
      { name: 'Dabbu Mothsera', Icon: Layers },
      { name: 'Tarun Rambha', Icon: Layers },
    ],
    []
  );

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
    const isGuest = (localStorage.getItem('isGuest') || 'false') === 'true';
    if (isAuthenticated && !isGuest) {
      navigate('/city-selection', { replace: true });
    }
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="w-11/12 max-w-6xl">
        <div className="min-h-[75vh] flex flex-col justify-center bg-white/90 dark:bg-gray-800/80 backdrop-blur rounded-2xl border border-gray-200 dark:border-gray-700 shadow-lg p-6 sm:p-12">
          <div className="text-center mb-8">
            <div className="mx-auto h-16 w-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center mb-4">
              <span className="text-2xl font-bold text-white">T</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100">TransitXplorer</h1>
            {/* <p className="text-gray-600 dark:text-gray-300 mt-2 max-w-2xl mx-auto">
              Choose an app to continue. Sign in comes next.
            </p> */}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="group relative rounded-xl text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    <Layers className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">TransitX</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200">
                        Documentation
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      The overall suite for GTFS onboarding, preprocessing pipelines, and analysis workflows.
                    </p>
                    {/* <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Continue to Sign In</p> */}
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-300 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>

            <button
              type="button"
              onClick={() => navigate('/signin')}
              className="group relative rounded-xl text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-6 hover:border-blue-300 dark:hover:border-blue-700 hover:bg-blue-50/40 dark:hover:bg-gray-800 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-800"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300">
                    <Map className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Transit Explorer</h2>
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 border border-blue-200 dark:border-blue-800">
                        GUI
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                      Explore routes and stops, generate route variants from unique stop sequences, and run planning/optimization tools.
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">Continue to Sign In</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-blue-600 dark:text-blue-300 opacity-70 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          </div>

          <div className="mt-7 text-center">
            <button
              type="button"
              onClick={() => setCreditsOpen(true)}
              className="text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-300 underline underline-offset-4"
            >
              Credits
            </button>
          </div>
        </div>
      </div>

      {creditsOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setCreditsOpen(false)}
          role="presentation"
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Credits"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Credits</h3>
                <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">Sponsors</p>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCreditsOpen(false)}
                className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              {sponsors.map((s) => (
                <div
                  key={s.name}
                  className="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/30 px-3 py-2"
                >
                  <div className="h-9 w-9 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-200 flex items-center justify-center border border-blue-100 dark:border-blue-800">
                    <s.Icon className="h-5 w-5" />
                  </div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{s.name}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
