import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { apiConfig, API_ENDPOINTS } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

class ApiService {
  private api: AxiosInstance;
  private static instance: ApiService;
  private refreshTokenPromise: Promise<{ accessToken: string; refreshToken: string }> | null = null;

  private constructor() {
    this.api = axios.create(apiConfig);
    this.setupInterceptors();
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => {
        console.log('API Response:', {
          status: response.status,
          url: response.config.url,
          data: response.data
        });
        return response;
      },
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        
        console.error('API Error:', {
          status: error.response?.status,
          url: originalRequest?.url,
          data: error.response?.data,
          message: error.message
        });
        
        // Handle 401 Unauthorized errors
        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.refreshTokenPromise) {
            try {
              const { accessToken } = await this.refreshTokenPromise;
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return this.api(originalRequest);
            } catch (refreshError) {
              console.error('Failed to refresh token:', refreshError);
              this.clearAuth();
              return Promise.reject(refreshError);
            }
          }
          
          originalRequest._retry = true;
          
          try {
            this.refreshTokenPromise = this.refreshAccessToken();
            const { accessToken } = await this.refreshTokenPromise;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            this.refreshTokenPromise = null;
            return this.api(originalRequest);
          } catch (refreshError) {
            console.error('Failed to refresh token:', refreshError);
            this.refreshTokenPromise = null;
            this.clearAuth();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }
  
  private clearAuth(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token_expires_at');
    window.location.href = '/login';
  }
  
  private async refreshAccessToken(): Promise<{ accessToken: string; refreshToken: string }> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    
    try {
      const response = await axios.post<ApiResponse<{
        accessToken: string;
        refreshToken: string;
        expiresIn: number;
      }>>(API_ENDPOINTS.AUTH.REFRESH, { refreshToken });
      
      if (!response.data.success || !response.data.data) {
        throw new Error('Invalid refresh token response');
      }
      
      const { accessToken, refreshToken: newRefreshToken, expiresIn } = response.data.data;
      
      // Store the new tokens
      localStorage.setItem('token', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      // Update token expiration
      if (expiresIn) {
        const expiresAt = new Date();
        expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
        localStorage.setItem('token_expires_at', expiresAt.toISOString());
      }
      
      return { accessToken, refreshToken: newRefreshToken };
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearAuth();
      throw error;
    }
  }
  
  // HTTP Methods
  public async get<T>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.get<ApiResponse<T>>(url, config);
  }
  
  public async post<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.post<ApiResponse<T>>(url, data, config);
  }
  
  public async put<T>(
    url: string, 
    data?: any, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.put<ApiResponse<T>>(url, data, config);
  }
  
  public async delete<T>(
    url: string, 
    config?: AxiosRequestConfig
  ): Promise<AxiosResponse<ApiResponse<T>>> {
    return this.api.delete<ApiResponse<T>>(url, config);
  }
}

export const apiService = ApiService.getInstance();
