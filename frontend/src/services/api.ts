import axios, { AxiosInstance, AxiosError } from 'axios';
import { config } from '../config';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.apiBaseUrl,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // リクエストインターセプター
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest: any = error.config;

        // トークン期限切れの場合はリフレッシュを試みる
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const refreshToken = localStorage.getItem('refreshToken');
            if (refreshToken) {
              const response: any = await this.client.post('/auth/refresh', {
                refreshToken,
              });
              
              const { accessToken } = response.data;
              localStorage.setItem('accessToken', accessToken);

              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            // リフレッシュ失敗時はログアウト
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error.response?.data || error);
      }
    );
  }

  get<T = any>(url: string, params?: any) {
    return this.client.get<any, T>(url, { params });
  }

  post<T = any>(url: string, data?: any) {
    return this.client.post<any, T>(url, data);
  }

  put<T = any>(url: string, data?: any) {
    return this.client.put<any, T>(url, data);
  }

  delete<T = any>(url: string) {
    return this.client.delete<any, T>(url);
  }
}

export const apiClient = new ApiClient();
