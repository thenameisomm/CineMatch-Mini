import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add any auth headers if needed (tokens are in HttpOnly cookies)
    return config;
  },
  _error => Promise.reject(_error)
);

// Response interceptor
let isRefreshing = false;
type QueuePromise = {
  resolve: (_value: string | null) => void;
  reject: (_reason: unknown) => void;
};
let failedQueue: QueuePromise[] = [];

const processQueue = (_error: unknown, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (_error) {
      prom.reject(_error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Auth endpoints manage their own 401s — running them through the refresh
 * flow would recurse (refresh-of-refresh) or bounce the user off the very
 * login/register form they are filling in.
 */
export function isAuthRequest(url: string | undefined): boolean {
  if (!url) return false;
  return (
    url.includes('/auth/refresh') || url.includes('/auth/login') || url.includes('/auth/register')
  );
}

/**
 * Redirecting to /auth/login while already on an /auth/* page causes a full
 * page reload that re-fires the failing request — an infinite reload loop
 * that also burns through the API rate-limit budget.
 */
export function shouldRedirectToLogin(pathname: string): boolean {
  return !pathname.startsWith('/auth/');
}

api.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Handle 401 - token expired (never for auth requests themselves)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthRequest(originalRequest.url)
    ) {
      if (isRefreshing) {
        // Queue the request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call refresh endpoint
        await api.post('/auth/refresh');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        // Redirect to login, unless already there (prevents reload loop)
        if (typeof window !== 'undefined' && shouldRedirectToLogin(window.location.pathname)) {
          window.location.href = '/auth/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
