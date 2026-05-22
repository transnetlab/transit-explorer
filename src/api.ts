import { Route, Stop, Trip, StopTime, RouteResponse, StopRoutesResponse } from './types';
import { AGENCY_BASES, getBaseUrlsForPort, getLocalBaseUrlForPort } from './config';
import { axiosGetWithFallback, axiosPostWithFallback, fetchWithFallback } from './http';

const getCityBaseUrls = (): string[] => {
  const port = (localStorage.getItem('selectedCityPort') || '3001').trim();
  return getBaseUrlsForPort(port);
};

export const getRoutes = async (): Promise<Route[]> => {
  try {
    console.log("🚀 Fetching routes...");
    const selectedCityIsCustomRaw = (localStorage.getItem('selectedCityIsCustom') || '').trim();
    const selectedCityId = (localStorage.getItem('selectedCityId') || '').trim().toLowerCase();
    const isKnownDefaultCity =
      selectedCityId === 'bangalore' ||
      selectedCityId === 'paris' ||
      selectedCityId === 'austin' ||
      selectedCityId === 'sydney' ||
      selectedCityId === 'colombia' ||
      selectedCityId === 'dharwad';
    const isCustomCity = selectedCityIsCustomRaw === '1' || (!selectedCityIsCustomRaw && !!selectedCityId && !isKnownDefaultCity);

    // Custom cities: use the authenticated user+city routes endpoint.
    if (isCustomCity) {
      const user_id = (localStorage.getItem('userId') || '').trim();
      const api_key = (localStorage.getItem('api_key') || '').trim();
      const unique_city_id = (
        localStorage.getItem('selectedCityUniqueId') ||
        localStorage.getItem('unique_city_id') ||
        localStorage.getItem('uniqueCityId') ||
        ''
      ).trim();

      if (!user_id || !api_key || !unique_city_id) {
        console.warn('Missing credentials for /api/users-routes-data', {
          hasUserId: !!user_id,
          hasApiKey: !!api_key,
          hasUniqueCityId: !!unique_city_id,
        });
        return [];
      }

      const payload = {
        user_id,
        api_key,
        unique_city_id,
        page: 1,
        limit: 5000,
      };

      const response = await axiosPostWithFallback<any>(getBaseUrlsForPort(3001), '/api/users-routes-data', payload, {
        headers: { 'Content-Type': 'application/json' },
      });

      const raw = response.data;
      const routesArray: any[] =
        (raw && Array.isArray(raw.routes) && raw.routes) ||
        (raw && Array.isArray(raw.data) && raw.data) ||
        (raw && Array.isArray(raw.routes_data) && raw.routes_data) ||
        (raw && raw.response && Array.isArray(raw.response.routes) && raw.response.routes) ||
        [];

      const routes: Route[] = routesArray
        .map((r: any) => {
          const route_id = String(r?.route_id ?? r?.id ?? '').trim();
          if (!route_id) return null;
          const route_desc =
            String(
              r?.route_desc ??
                r?.route_long_name ??
                r?.route_short_name ??
                r?.route_name ??
                ''
            ) || `Route ${route_id}`;
          const route_type_raw = r?.route_type;
          const route_type = Number.isFinite(Number(route_type_raw)) ? Number(route_type_raw) : 3;
          return { route_id, route_desc, route_type } satisfies Route;
        })
        .filter(Boolean) as Route[];

      console.log(' Routes fetched (custom):', routes);
      return routes;
    }

    // Default cities: legacy public routes endpoint.
    const response = await fetchWithFallback(getCityBaseUrls(), '/api/routes');
    const data = await response.json();

    if (!data || !data.routes || !Array.isArray(data.routes)) {
      throw new Error("Invalid routes data received.");
    }

    const normalized: Route[] = data.routes
      .map((r: any) => {
        const route_id = String(r?.route_id ?? r?.id ?? '').trim();
        if (!route_id) return null;
        const route_desc = String(r?.route_desc ?? r?.route_long_name ?? r?.route_short_name ?? r?.route_name ?? '') || `Route ${route_id}`;
        const route_type_raw = r?.route_type;
        const route_type = Number.isFinite(Number(route_type_raw)) ? Number(route_type_raw) : 3;
        return { route_id, route_desc, route_type } satisfies Route;
      })
      .filter(Boolean) as Route[];

    console.log(" Routes fetched:", normalized);
    return normalized;
  } catch (error) {
    console.error(" Error fetching routes:", error);
    return [];
  }
};

export const getShortestPath = async (routeId: string, _cityId?: string): Promise<[number, number][]> => {
  try {
    const safeId = encodeURIComponent(String(routeId));
    const response = await axiosGetWithFallback(getCityBaseUrls(), `/api/fetch-polyline/${safeId}`);
    const routeDetails = response.data;

    if (!routeDetails || !routeDetails.response || !routeDetails.response.path_coords_list) {
      throw new Error(`No valid route details found for route ${routeId}`);
    }

    // Flatten the path_coords_list into a single array of coordinates
    const flattenedPath = routeDetails.response.path_coords_list.reduce(
      (acc: [number, number][], segment: [number, number][]) => {
        if (!Array.isArray(segment)) return acc; // Ensure segment is an array
        if (acc.length === 0) {
          return [...segment];
        }
        return [...acc, ...segment.slice(1)];
      },
      [] as [number, number][]
    );

    return flattenedPath;
  } catch (error) {
    console.error('Error in getShortestPath:', error);
    return [];
  }
};

export const getRouteStops = async (routeId: string): Promise<Stop[]> => {
  try {
    const safeId = encodeURIComponent(String(routeId));
    const response = await axiosGetWithFallback(getCityBaseUrls(), `/api/fetch-polyline/${safeId}`);
    const routeDetails = response.data;

    if (!routeDetails || !routeDetails.response) {
      throw new Error(`No route details found for route ${routeId}`);
    }

    return routeDetails.response.stops_with_details.map((stop: { 
      stop_id: string; 
      stop_name: string; 
      latitude: number; 
      longitude: number; 
    }) => ({
      stop_id: String(stop.stop_id),
      stop_name: stop.stop_name,
      stop_lat: stop.latitude,
      stop_lon: stop.longitude,
      location_type: null
    }));
  } catch (error) {
    console.error("Error fetching route stops:", error);
    return [];
  }
};

export const getRouteDetails = async (routeId: string): Promise<RouteResponse | null> => {
  try {
    const safeId = encodeURIComponent(String(routeId));
    const response = await axiosGetWithFallback(getCityBaseUrls(), `/api/fetch-polyline/${safeId}`);
    const routeDetails = response.data;

    if (!routeDetails || !routeDetails.response) {
      throw new Error(`No route details found for route ${routeId}`);
    }
    return routeDetails.response;
  } catch (error) {
    console.error("Error fetching route details:", error);
    return null;
  }
};

export const getTripsAndStopTimesForRoute = async (
  routeId: string
): Promise<{ trips: Trip[]; stopTimes: StopTime[] }> => {
  try {
    const safeId = encodeURIComponent(String(routeId));
    const response = await fetchWithFallback(
      getCityBaseUrls(),
      `/api/fetch-trip-stop-times/${safeId}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch trips and stop times");
    }

    const data = await response.json();
    console.log("Combined API response:", data);

    const trips: Trip[] = Array.isArray(data.trips) ? data.trips.map((t: any) => ({
      route_id: String(t.route_id ?? ''),
      service_id: String(t.service_id),
      trip_id: String(t.trip_id)
    })) : [];

    // Flatten all stopTimes from stopTimes_1, stopTimes_2, ...
    const stopTimes: StopTime[] = [];

    Object.keys(data).forEach((key) => {
      if (key.startsWith("stopTimes_")) {
        const stopTimeArray: StopTime[] = data[key].map((stopTime: any) => ({
          trip_id: String(stopTime.trip_id),
          arrival_time: String(stopTime.arrival_time),
          departure_time: String(stopTime.departure_time),
          stop_id: String(stopTime.stop_id),
          stop_sequence: Number(stopTime.stop_sequence),
        }));

        stopTimes.push(...stopTimeArray);
      }
    });

    // Optional: sort by trip_id then stop_sequence (string-safe)
    stopTimes.sort((a, b) =>
      a.trip_id !== b.trip_id
        ? a.trip_id.localeCompare(b.trip_id)
        : a.stop_sequence - b.stop_sequence
    );

    return { trips, stopTimes };
  } catch (error) {
    console.error("Error fetching trips and stop times:", error);
    return { trips: [], stopTimes: [] };
  }
};

export const getStops = async (): Promise<Stop[]> => {
  try {
    console.log("🚀 Fetching Stops...");
    const response = await fetchWithFallback(getCityBaseUrls(), '/api/stops');
    const data = await response.json();

    if (!data || !data.stops || !Array.isArray(data.stops)) {
      throw new Error("Invalid stops data received.");
    }
    console.log(" Stops fetched:", data.stops);
    // Normalize shape: ensure IDs are strings and lat/lon are numbers
    const normalized: Stop[] = data.stops
      .map((s: any) => {
        const stop_lat = Number(s.stop_lat ?? s.latitude);
        const stop_lon = Number(s.stop_lon ?? s.longitude);
        return {
          ...s,
          stop_id: String(s.stop_id),
          stop_lat,
          stop_lon,
        } as Stop;
      })
      .filter((s: Stop) => Number.isFinite(s.stop_lat) && Number.isFinite(s.stop_lon));

    return normalized;
  } catch (error) {
    console.error(" Error fetching stops:", error);
    return [];
  }
};

export const getStopRoutes = async (stopId: string): Promise<StopRoutesResponse | null> => {
  try {
    const response = await fetchWithFallback(getCityBaseUrls(), `/api/fetch-polyline-by-stop/${stopId}`);
    if (!response.ok) {
      throw new Error('Failed to fetch stop routes');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching stop routes:', error);
    return null;
  }
}
//NEED TO MAKE CHANGES TO THE MAP.TSX

// =========================
// Agency Data Endpoints
// =========================

// 1) Upload agency file to DB (multipart/form-data)
export const uploadAgencyFile = async (
  file: File,
  options: { api_key: string; user_id: string; unique_city_id: string }
): Promise<any> => {
  try {
    const formData = new FormData();
    formData.append('agencyFile', file);
    formData.append('api_key', options.api_key);
    formData.append('user_id', options.user_id);
    // Server expects capitalized key for upload (as provided): "Unique_city_id"
    formData.append('Unique_city_id', options.unique_city_id);

    const response = await axiosPostWithFallback(AGENCY_BASES, '/api/agency/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    console.error('Error uploading agency file:', error);
    throw error;
  }
};

// 2) Download sample file for agency data (returns Blob)
export const downloadAgencySample = async (
  params: { user_id: string; api_key: string; file_type: string }
): Promise<Blob> => {
  try {
    const response = await axiosPostWithFallback(
      AGENCY_BASES,
      '/api/agency-data/download',
      {
        user_id: params.user_id,
        api_key: params.api_key,
        file_type: params.file_type,
      },
      { responseType: 'blob' }
    );
    return response.data as Blob;
  } catch (error) {
    console.error('Error downloading agency sample file:', error);
    throw error;
  }
};

// Optional helper to save a Blob to a file in browser
export const saveBlobToFile = (blob: Blob, filename: string): void => {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
};

// 3) Users agency data (GET with query params)
export const getUsersAgencyData = async (
  params: {
    user_id: string;
    api_key: string;
    unique_city_id: string;
    agency_id?: string;
    agency_name?: string;
    cemv_support?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc' | string;
    limit?: number;
    offset?: number;
  }
): Promise<any> => {
  try {
    const response = await axiosGetWithFallback(AGENCY_BASES, '/api/users-agency-data', { params });
    return response.data;
  } catch (error) {
    console.error('Error fetching users agency data:', error);
    throw error;
  }
};

// 4) Trigger server-side generation of route stop sequences
export const generateRouteStopSequences = async (
  payload: { user_id: string; api_key: string; unique_city_id: string }
): Promise<any> => {
  try {
    const preprocessBases = getBaseUrlsForPort(3001);
    const response = await axiosPostWithFallback(
      preprocessBases,
      '/api/routes/preprocess',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error generating route stop sequences:', error);
    throw error;
  }
};

// 5) Trigger server-side preprocessing of transfers
export const preprocessTransfers = async (
  payload: { user_id: string; api_key: string; unique_city_id: string }
): Promise<any> => {
  try {
    const preprocessBases = getBaseUrlsForPort(3001);
    const response = await axiosPostWithFallback(
      preprocessBases,
      '/api/transfers/preprocess',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error preprocessing transfers:', error);
    throw error;
  }
};

// 6) Copy GTFS files on server (used before preprocessing)
export const copyGtfsFiles = async (
  payload: { user_id: string; api_key: string; unique_city_id: string }
): Promise<any> => {
  try {
    const preprocessBases = getBaseUrlsForPort(3001);
    const response = await axiosPostWithFallback(
      preprocessBases,
      '/api/copy-gtfs-files',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error copying GTFS files:', error);
    throw error;
  }
};

// 7) Fetch cities for user (custom cities metadata like center_lat/center_lng)
export const getUserCities = async (payload: { user_id: string | number; api_key?: string }): Promise<any> => {
  try {
    const response = await axiosPostWithFallback(
      AGENCY_BASES,
      '/api/city/user',
      payload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error) {
    console.error('Error fetching user cities:', error);
    throw error;
  }
};

// 8) Run RAPTOR (multi-leg transit + walk routing)
const normalizeGuestCityUniqueId = (raw: string): { uniqueCityId: string; bypassAuth: boolean } => {
  const trimmed = String(raw || '').trim();
  const m = trimmed.match(/^0*([12345])$/);
  if (!m) return { uniqueCityId: trimmed, bypassAuth: false };
  return { uniqueCityId: String(m[1]).padStart(10, '0'), bypassAuth: true };
};

export const runRaptor = async (payload: {
  user_id?: string;
  api_key?: string;
  unique_city_id: string;
  city_name: string;
  origin: { lat: number; lon: number };
  destination: { lat: number; lon: number };
  departure_time: string;
  disallowed_route_types?: string[];
}): Promise<any> => {
  try {
    const { uniqueCityId, bypassAuth } = normalizeGuestCityUniqueId(payload.unique_city_id);
    const userId = String(payload.user_id || '').trim();
    const apiKey = String(payload.api_key || '').trim();

    if (!bypassAuth && (!userId || !apiKey)) {
      throw new Error('Missing user_id / api_key for run-raptor');
    }

    const effectivePayload: Record<string, any> = {
      ...payload,
      unique_city_id: uniqueCityId,
    };
    if (bypassAuth) {
      delete effectivePayload.user_id;
      delete effectivePayload.api_key;
    } else {
      effectivePayload.user_id = userId;
      effectivePayload.api_key = apiKey;
    }

    let bases = getBaseUrlsForPort(3001);
    // In guest/bypass mode, the local backend may respond with a 4xx "missing_api_key/user_id".
    // Our fallback logic does not retry on 4xx, so prefer official first in this specific case.
    if (bypassAuth) {
      const localBase = String(getLocalBaseUrlForPort(3001) || '').trim();
      if (localBase) {
        bases = [...bases].sort((a, b) => {
          const aIsLocal = String(a || '').trim() === localBase;
          const bIsLocal = String(b || '').trim() === localBase;
          return Number(aIsLocal) - Number(bIsLocal);
        });
      }
    }
    const response = await axiosPostWithFallback(
      bases,
      '/run-raptor',
      effectivePayload,
      { headers: { 'Content-Type': 'application/json' } }
    );
    return response.data;
  } catch (error: any) {
    const msg =
      (error?.response?.data && (error.response.data.message || error.response.data.error)) ||
      error?.message ||
      'Failed to run RAPTOR';
    console.error('Error running RAPTOR:', error);
    throw new Error(String(msg));
  }
};

// 9) Default-city calendar range (no auth; default datasets only)
export const getDefaultCityCalendarRange = async (cityId: string, signal?: AbortSignal): Promise<any> => {
  const id = String(cityId || '').trim().toLowerCase();
  const port =
    id === 'bangalore' ? 3000 :
    id === 'paris' ? 3001 :
    id === 'austin' ? 3002 :
    id === 'sydney' ? 3003 :
    id === 'colombia' ? 3004 :
    undefined;
  if (!port) {
    throw new Error(`Unsupported default city for calendar range: ${cityId}`);
  }

  const local = getLocalBaseUrlForPort(port);
  const bases = Array.from(new Set([local, ...getBaseUrlsForPort(port)].map((b) => (b || '').trim()).filter(Boolean)));
  const res = await fetchWithFallback(bases, '/api/default-city-calendar-range', {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Failed to fetch default city calendar range');
    throw new Error(text || 'Failed to fetch default city calendar range');
  }

  return await res.json();
};

// 10) Default-city calendar check-service (GET; no auth; default datasets only)
export const getDefaultCityCalendarCheckService = async (
  cityId: string,
  date: string,
  signal?: AbortSignal
): Promise<any> => {
  const id = String(cityId || '').trim().toLowerCase();
  const dateStr = String(date || '').trim();
  if (!/^[0-9]{8}$/.test(dateStr)) {
    throw new Error(`Invalid date for default city check service: ${date}`);
  }

  const port =
    id === 'bangalore' ? 3000 :
    id === 'paris' ? 3001 :
    id === 'austin' ? 3002 :
    id === 'sydney' ? 3003 :
    id === 'colombia' ? 3004 :
    undefined;
  if (!port) {
    throw new Error(`Unsupported default city for check service: ${cityId}`);
  }

  const local = getLocalBaseUrlForPort(port);
  const bases = Array.from(new Set([local, ...getBaseUrlsForPort(port)].map((b) => (b || '').trim()).filter(Boolean)));
  const query = new URLSearchParams({ date: dateStr }).toString();
  const res = await fetchWithFallback(bases, `/api/calendar/default-city/check-service?${query}`, {
    method: 'GET',
    signal,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => 'Failed to check service for default city');
    throw new Error(text || 'Failed to check service for default city');
  }

  return await res.json();
};