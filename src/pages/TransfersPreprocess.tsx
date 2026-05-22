import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRightLeft, Info, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { copyGtfsFiles, preprocessTransfers } from '../api';

export function TransfersPreprocess() {
  const navigate = useNavigate();
  const { city } = useParams();

  const isDefaultCity =
    city === 'bangalore' ||
    city === 'paris' ||
    city === 'austin' ||
    city === 'sydney' ||
    city === 'colombia' ||
    city === 'dharwad';
  const DEFAULT_PREPROCESS_PAYLOAD = useMemo(
    () => ({ user_id: '123456', api_key: '123456', unique_city_id: '123456' }),
    []
  );

  const [showPrompt, setShowPrompt] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [doneMessage, setDoneMessage] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const payload = useMemo(() => {
    if (isDefaultCity) return DEFAULT_PREPROCESS_PAYLOAD;
    const user_id = String(localStorage.getItem('userId') || '');
    const api_key = String(localStorage.getItem('api_key') || '');
    const unique_city_id = String(
      localStorage.getItem('selectedCityUniqueId') ||
        localStorage.getItem('uniqueCityId') ||
        localStorage.getItem('unique_city_id') ||
        ''
    );
    return { user_id, api_key, unique_city_id };
  }, [DEFAULT_PREPROCESS_PAYLOAD, isDefaultCity]);

  const doneKey = useMemo(() => {
    if (isDefaultCity) {
      const c = (city || '').trim();
      return c ? `preprocessing:transfers_preprocess:done:default:${c}` : '';
    }
    const id = payload.unique_city_id;
    return id ? `preprocessing:transfers_preprocess:done:${id}` : '';
  }, [city, isDefaultCity, payload.unique_city_id]);

  const canRun = !!payload.user_id && !!payload.api_key && !!payload.unique_city_id;

  useEffect(() => {
    setShowPrompt(true);
  }, []);

  const run = async () => {
    setError(null);
    setDoneMessage(null);
    setRunning(true);
    setProgress(0);

    try {
      if (!canRun) {
        throw new Error('Missing user_id, api_key, or unique_city_id');
      }

      let pct = 5;
      const timer = setInterval(() => {
        pct = Math.min(95, pct + 1);
        setProgress(pct);
      }, 300);

      if (!isDefaultCity) {
        const copyRes = await copyGtfsFiles(payload);
        if (copyRes && typeof copyRes === 'object' && 'success' in copyRes && (copyRes as any).success === false) {
          throw new Error((copyRes as any)?.message || 'Copy GTFS files failed');
        }
      }

      const res = await preprocessTransfers(payload);
      if (res && typeof res === 'object' && 'success' in res && (res as any).success === false) {
        throw new Error((res as any)?.message || 'Transfers preprocessing failed');
      }

      clearInterval(timer);
      setProgress(100);
      setDoneMessage(res?.message || 'Transfers preprocessing completed successfully.');
      if (doneKey) {
        try {
          localStorage.setItem(doneKey, new Date().toISOString());
        } catch {}
      }
    } catch (e: any) {
      setError(e?.message || 'Failed to preprocess transfers');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 dark:text-gray-100 transition-colors">
      <div className="container mx-auto px-4 py-10 max-w-3xl">
        <div className="flex items-start justify-between gap-4 mb-6">
          <button
            onClick={() => {
              const selectedCity = city || localStorage.getItem('selectedCityId');
              if (selectedCity) navigate(`/${selectedCity}`);
              else navigate('/city-selection');
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Back"
          >
            <ArrowLeft size={24} className="text-blue-600 dark:text-blue-400" />
          </button>

          <div className="flex-1">
            <h1 className="text-2xl font-bold text-blue-600 dark:text-blue-400">Preprocess Transfers</h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">Preprocessing for {city}</p>
          </div>

          <button
            aria-label="Info"
            title="What does this do?"
            onClick={() => setShowInfo((v) => !v)}
            className="h-9 w-9 flex items-center justify-center text-blue-700 dark:text-blue-300 bg-white dark:bg-gray-900 border border-blue-200 dark:border-blue-700 rounded-full hover:bg-blue-50 dark:hover:bg-gray-800"
          >
            <Info className="h-4 w-4" />
          </button>
        </div>

        {showInfo && (
          <div className="mb-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 text-sm text-blue-800 dark:text-blue-200">
            <p className="font-medium mb-1">About this preprocessing</p>
            <p>
              Runs server-side preprocessing for GTFS transfers. A transfer is basically the “walking link” between two legs of a
              journey — for example: A → B (bus) → C (walk from B to C) → D (bus from C to D). Use this after uploading transfers
              so the backend can prepare derived transfer data for faster routing/analysis.
            </p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-semibold">Preprocess transfers</h2>
              <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                For default cities (Bangalore/Paris/Austin/Sydney/Colombia), this uses built-in credentials. Otherwise requires user_id, api_key, and
                unique_city_id in localStorage.
              </p>
            </div>

            <button
              onClick={() => setShowPrompt(true)}
              disabled={running}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <ArrowRightLeft className="h-4 w-4" />
              {running ? 'Running…' : 'Preprocess'}
            </button>
          </div>

          {!canRun && (
            <div className="mt-4 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
              Missing credentials. Make sure these localStorage keys are set: userId, api_key, and selectedCityUniqueId.
            </div>
          )}

          {running && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="h-4 w-4 text-blue-600 dark:text-blue-400 animate-spin" />
                <p className="text-xs text-gray-700 dark:text-gray-300">Processing…</p>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded overflow-hidden">
                <div
                  className="h-2 rounded bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {doneMessage && (
            <div className="mt-4 flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 rounded-lg p-3">
              <CheckCircle className="h-4 w-4" />
              <span className="text-xs">{doneMessage}</span>
            </div>
          )}

          {error && (
            <div className="mt-4 flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 rounded-lg p-3">
              <AlertCircle className="h-4 w-4" />
              <span className="text-xs">{error}</span>
            </div>
          )}
        </div>

        {showPrompt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-6 w-full max-w-md">
              <div className="flex items-center gap-3 mb-2">
                <AlertCircle className="h-6 w-6 text-yellow-500" />
                <h3 className="text-base font-semibold">This can take a few minutes</h3>
              </div>
              <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">This preprocessing prepares transfer data on the server.</p>
              {!canRun && (
                <div className="mb-4 text-xs text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
                  Missing credentials. Please select a city again to populate selectedCityUniqueId, and ensure you are signed in.
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowPrompt(false);
                    navigate(-1);
                  }}
                  className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    setShowPrompt(false);
                    await run();
                  }}
                  disabled={!canRun || running}
                  aria-disabled={!canRun || running}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 text-sm"
                >
                  Proceed
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
