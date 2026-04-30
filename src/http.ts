import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';

const stripTrailingSlashes = (s: string) => s.replace(/\/+$/, '');
const stripLeadingSlashes = (s: string) => s.replace(/^\/+/, '');

export const joinUrl = (base: string, path: string): string => {
  const b = stripTrailingSlashes(base);
  const p = stripLeadingSlashes(path);
  return `${b}/${p}`;
};

const shouldFallbackResponse = (res: Response): boolean => {
  // Only fall back for server-side failures; do not hide auth/validation errors.
  return res.status >= 500;
};

export async function fetchWithFallback(
  bases: readonly string[],
  path: string,
  init?: RequestInit
): Promise<Response> {
  const uniqueBases = Array.from(new Set(bases.map((b) => b.trim()).filter(Boolean)));
  let lastError: unknown;

  for (let i = 0; i < uniqueBases.length; i++) {
    const base = uniqueBases[i];
    const url = joinUrl(base, path);

    try {
      const res = await fetch(url, init);
      if (res.ok) return res;

      if (i < uniqueBases.length - 1 && shouldFallbackResponse(res)) {
        continue;
      }

      return res;
    } catch (err) {
      lastError = err;
      if (i < uniqueBases.length - 1) continue;
      throw err;
    }
  }

  throw lastError ?? new Error('Request failed');
}

const shouldFallbackAxiosError = (err: any): boolean => {
  const status = err?.response?.status;
  // Network error => no response
  if (typeof status !== 'number') return true;
  return status >= 500;
};

export async function axiosGetWithFallback<T = any>(
  bases: readonly string[],
  path: string,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const uniqueBases = Array.from(new Set(bases.map((b) => b.trim()).filter(Boolean)));
  let lastError: unknown;

  for (let i = 0; i < uniqueBases.length; i++) {
    const url = joinUrl(uniqueBases[i], path);
    try {
      return await axios.get<T>(url, config);
    } catch (err: any) {
      lastError = err;
      if (i < uniqueBases.length - 1 && shouldFallbackAxiosError(err)) continue;
      throw err;
    }
  }

  throw lastError ?? new Error('Request failed');
}

export async function axiosPostWithFallback<T = any>(
  bases: readonly string[],
  path: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<AxiosResponse<T>> {
  const uniqueBases = Array.from(new Set(bases.map((b) => b.trim()).filter(Boolean)));
  let lastError: unknown;

  for (let i = 0; i < uniqueBases.length; i++) {
    const url = joinUrl(uniqueBases[i], path);
    try {
      return await axios.post<T>(url, data, config);
    } catch (err: any) {
      lastError = err;
      if (i < uniqueBases.length - 1 && shouldFallbackAxiosError(err)) continue;
      throw err;
    }
  }

  throw lastError ?? new Error('Request failed');
}
