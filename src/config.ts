type ApiPreferred = 'local' | 'official';

const isLoopbackHostname = (hostname: string): boolean => {
  const h = (hostname || '').trim().toLowerCase();
  return h === 'localhost' || h === '127.0.0.1' || h === '::1';
};

const detectLanIpv4 = (): string => {
  // Best-effort: only works when Node is available (Electron renderer with nodeIntegration).
  try {
    const anyGlobal = globalThis as any;
    const req = anyGlobal.require || anyGlobal.window?.require;
    if (typeof req !== 'function') return '';
    const os = req('os');
    const nets = os?.networkInterfaces?.();
    if (!nets || typeof nets !== 'object') return '';

    const candidates: string[] = [];
    for (const name of Object.keys(nets)) {
      const entries = nets[name] || [];
      for (const entry of entries) {
        const family = String(entry?.family || '').toLowerCase();
        const address = String(entry?.address || '').trim();
        const internal = Boolean(entry?.internal);
        const isV4 = family === 'ipv4' || entry?.family === 4;
        if (!isV4 || internal || !address) continue;
        candidates.push(address);
      }
    }

    // Prefer typical private LAN ranges first.
    const preferred =
      candidates.find((ip) => ip.startsWith('192.168.')) ||
      candidates.find((ip) => ip.startsWith('10.')) ||
      candidates.find((ip) => ip.startsWith('172.16.')) ||
      candidates[0];

    return preferred || '';
  } catch {
    return '';
  }
};

const normalizeUrl = (raw: string): string => {
  const v = (raw || '').trim();
  if (!v) return '';
  if (/^https?:\/\//i.test(v)) return v;
  return `http://${v}`;
};

const getLocalHostAndDefaultPort = (): { hostOrigin: string; defaultPort: number } => {
  const preferredHost = normalizeUrl(import.meta.env.VITE_LOCAL_HOST || '');
  const legacy = normalizeUrl(import.meta.env.VITE_LOCAL_GATEWAY_BASE || '');
  const source = preferredHost || legacy;

  let hostOrigin = '';
  let derivedPort: number | undefined;

  if (source) {
    try {
      const u = new URL(source);
      hostOrigin = `${u.protocol}//${u.hostname}`;
      if (u.port) derivedPort = Number(u.port);
    } catch {
      // ignore
    }
  }

  // If unset, or explicitly configured to loopback, prefer the current LAN IP.
  // This enables calling local services from other devices on the network.
  try {
    const configuredHostname = hostOrigin ? new URL(hostOrigin).hostname : '';
    if (!hostOrigin || isLoopbackHostname(configuredHostname)) {
      const ip = detectLanIpv4();
      if (ip) hostOrigin = `http://${ip}`;
    }
  } catch {
    const ip = detectLanIpv4();
    if (ip) hostOrigin = `http://${ip}`;
  }

  const envPort = (import.meta.env.VITE_LOCAL_DEFAULT_PORT || '').toString().trim();
  const defaultPort = Number(envPort || derivedPort || 3001);
  return { hostOrigin, defaultPort: Number.isFinite(defaultPort) ? defaultPort : 3001 };
};

export const API_PREFERRED: ApiPreferred =
  ((import.meta.env.VITE_API_PREFERRED || '').toString().trim().toLowerCase() as ApiPreferred) ||
  (import.meta.env.VITE_LOCAL_HOST || import.meta.env.VITE_LOCAL_GATEWAY_BASE ? 'local' : 'official');

export const API_1_BASE: string =
  import.meta.env.VITE_API_1_BASE || 'https://api.transitx.org/api_1';

export const API_2_BASE: string =
  import.meta.env.VITE_API_2_BASE || 'https://api.transitx.org/api_2';

export const API_3_BASE: string =
  import.meta.env.VITE_API_3_BASE || 'https://api.transitx.org/api_3';

export const LOCAL_HOST_ORIGIN: string = getLocalHostAndDefaultPort().hostOrigin;
export const LOCAL_DEFAULT_PORT: number = getLocalHostAndDefaultPort().defaultPort;

const officialBaseForPort = (port: number): string => {
  if (port === 3000) return API_1_BASE;
  if (port === 3002) return API_3_BASE;
  return API_2_BASE;
};

const localBaseForPort = (port: number): string => {
  if (!LOCAL_HOST_ORIGIN) return '';
  return `${LOCAL_HOST_ORIGIN}:${port}`;
};

export const getLocalBaseUrlForPort = (port: string | number | null | undefined): string => {
  const numericPort = Number((port ?? '').toString().trim() || LOCAL_DEFAULT_PORT || 3001);
  const p = Number.isFinite(numericPort) ? numericPort : 3001;
  return localBaseForPort(p);
};

export const getBaseUrlsForPort = (port: string | number | null | undefined): string[] => {
  const numericPort = Number((port ?? '').toString().trim() || LOCAL_DEFAULT_PORT || 3001);
  const p = Number.isFinite(numericPort) ? numericPort : 3001;

  const local = localBaseForPort(p);
  const official = officialBaseForPort(p);

  const ordered = API_PREFERRED === 'local' ? [local, official] : [official, local];
  const unique = Array.from(new Set(ordered.map((b) => (b || '').trim()).filter(Boolean)));
  return unique;
};

// Convenience arrays for legacy port mapping.
export const API_1_BASES: string[] = getBaseUrlsForPort(3000);
export const API_2_BASES: string[] = getBaseUrlsForPort(3001);
export const API_3_BASES: string[] = getBaseUrlsForPort(3002);

export const AGENCY_BASES: string[] = getBaseUrlsForPort(LOCAL_DEFAULT_PORT || 3001);
export const AGENCY_BASE: string = AGENCY_BASES[0] || API_2_BASE;

export const BASE_URLS_BY_PORT: Record<string, string[]> = {
  '3000': API_1_BASES,
  '3001': API_2_BASES,
  '3002': API_3_BASES,
};

export const BASE_URL_BY_PORT: Record<string, string> = {
  '3000': API_1_BASES[0] || API_1_BASE,
  '3001': API_2_BASES[0] || API_2_BASE,
  '3002': API_3_BASES[0] || API_3_BASE,
};
