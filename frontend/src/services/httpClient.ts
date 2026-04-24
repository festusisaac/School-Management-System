import axios, { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios';
import { authSession, navigationSession } from './session';

interface RefreshQueueEntry {
  onSuccess: (token: string) => void;
  onFailed: (error: unknown) => void;
}

interface RetryableAxiosRequestConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

export function createApiHttpClient(baseURL: string): AxiosInstance {
  const axiosInstance = axios.create({
    baseURL,
    timeout: 30000,
  });

  let isRefreshing = false;
  let failedQueue: RefreshQueueEntry[] = [];

  axiosInstance.interceptors.request.use(
    (config) => {
      const token = authSession.getAccessToken();
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error),
  );

  axiosInstance.interceptors.response.use(
    (response) => {
      if (response.data && typeof response.data === 'object' && 'data' in response.data) {
        response.data = response.data.data;
      }
      return response;
    },
    async (error: AxiosError) => {
      const originalRequest = (error.config ?? {}) as RetryableAxiosRequestConfig;
      originalRequest.headers = originalRequest.headers ?? {};

      const isLoginRequest = originalRequest.url?.includes('/auth/login');
      const isRefreshRequest = originalRequest.url?.includes('/auth/refresh');

      if (error.response?.status === 401 && !originalRequest._retry && !isLoginRequest && !isRefreshRequest) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              onSuccess: (token: string) => {
                originalRequest.headers = originalRequest.headers ?? {};
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(axiosInstance(originalRequest));
              },
              onFailed: (refreshError: unknown) => {
                reject(refreshError);
              },
            });
          });
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const refreshToken = authSession.getRefreshToken();
          if (!refreshToken) {
            authSession.clear();
            if (!navigationSession.isOnRoute('/login')) {
              navigationSession.redirectToLogin();
            }
            return Promise.reject(new Error('No refresh token available'));
          }

          const response = await axiosInstance.post<{
            access_token: string;
            refresh_token: string;
          }>('/auth/refresh', { refresh_token: refreshToken });

          const { access_token, refresh_token: newRefreshToken } = response.data;

          authSession.setAccessToken(access_token);
          authSession.setRefreshToken(newRefreshToken);

          try {
            const meResponse = await axios.get(`${baseURL}/auth/me`, {
              headers: {
                Authorization: `Bearer ${access_token}`,
              },
            });
            const latestUser =
              meResponse.data && typeof meResponse.data === 'object' && 'data' in meResponse.data
                ? meResponse.data.data
                : meResponse.data;
            authSession.setUser(latestUser);
          } catch {
            // If profile refresh fails, keep the renewed token and let normal auth flow continue.
          }

          axiosInstance.defaults.headers.common.Authorization = `Bearer ${access_token}`;
          originalRequest.headers.Authorization = `Bearer ${access_token}`;

          failedQueue.forEach((entry) => entry.onSuccess(access_token));
          failedQueue = [];

          return axiosInstance(originalRequest);
        } catch (refreshError) {
          failedQueue.forEach((entry) => entry.onFailed(refreshError));
          failedQueue = [];

          authSession.clear();
          if (!navigationSession.isOnRoute('/login')) {
            navigationSession.redirectToLogin();
          }

          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      if (error.response?.status === 401) {
        authSession.clear();
        if (!navigationSession.isOnRoute('/login')) {
          navigationSession.redirectToLogin();
        }
      }

      if (error.response?.status === 403 && (error.response.data as { error?: string } | undefined)?.error === 'SystemNotInitialized') {
        if (!navigationSession.isOnRoute('/setup')) {
          navigationSession.redirectToSetup();
        }
      }

      return Promise.reject(error);
    },
  );

  return axiosInstance;
}
