import { apiService, ApiResponse } from './api';
import { API_ENDPOINTS } from '../config/api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: string;
  isActive: boolean;
  title?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  team?: {
    id: string;
    name: string;
    branch?: {
      id: string;
      name: string;
    };
  };
  createdAt?: string;
  updatedAt?: string;
}

// Extend ApiResponse type to allow token and user for login
export interface LoginApiResponse {
  token: string;
  user: User;
  [key: string]: any;
}

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

class AuthService {
  public async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; accessToken: string; refreshToken: string; expiresIn: number }>> {
    try {
      console.log('[AuthService] Attempting login with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password
      });
      
      const response = await apiService.post<any>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      console.log('[AuthService] Login response:', response);
      
      // Handle login response
      if (response && response.data) {
        // If response.data has a 'data' property, use it; otherwise, use response.data directly
        const loginData = (response.data as any).data ? (response.data as any).data : response.data;
        const { token, refreshToken, expiresIn, user } = loginData as LoginApiResponse & { refreshToken?: string; expiresIn?: number };
        if (token && user) {
          localStorage.setItem('token', token);
          localStorage.setItem('user', JSON.stringify(user));
        }
        return {
          success: true,
          data: {
            user,
            accessToken: token,
            refreshToken: refreshToken || '',
            expiresIn: expiresIn || 3600,
          },
          message: 'Login successful',
        };
      }
      // fallback for unexpected response shape
      return {
        success: false,
        data: {
          user: {} as User,
          accessToken: '',
          refreshToken: '',
          expiresIn: 0,
        },
        message: 'Unexpected login response',
      };
    } catch (error: any) {
      console.error('[AuthService] Login failed:', {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
        headers: error.response?.headers,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          data: error.config?.data,
          headers: error.config?.headers,
        },
      });
      this.clearAuthTokens();
      if (error.response) {
        const { status, data } = error.response;
        if (status === 401) {
          throw new Error(data?.message || 'Invalid email or password');
        } else if (status === 403) {
          throw new Error(data?.message || 'Account is deactivated');
        } else if (status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else {
          throw new Error(data?.message || `Request failed with status ${status}`);
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        console.error('Request setup error:', error.message);
        throw new Error(`Request failed: ${error.message}`);
      }
    }
  }
  
  public setAuthTokens(token: string, refreshToken?: string, expiresIn?: number): void {
    localStorage.setItem('token', token);
    
    if (refreshToken) {
      localStorage.setItem('refreshToken', refreshToken);
    }
    
    // Store the expiration time
    if (expiresIn) {
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn);
      localStorage.setItem('token_expires_at', expiresAt.toISOString());
    }
  }
  
  private clearAuthTokens(): void {
    // Remove all authentication-related data
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('token_expires_at');
    
    // Clear any user-related data
    localStorage.removeItem('user');
    
    // Clear any other application-specific auth data
    // localStorage.removeItem('user-settings'); // Uncomment if needed
  }

  public logout(): void {
    this.clearAuthTokens();
    // Redirect to login page
    window.location.href = '/login';
  }

  public async getCurrentUser(): Promise<User | null> {
    const token = localStorage.getItem('token');
    if (!token) {
      this.clearAuthTokens();
      return null;
    }
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      if (currentTime > expirationTime) {
        this.clearAuthTokens();
        return null;
      }
    }
    try {
      const response = await apiService.get(API_ENDPOINTS.AUTH.ME);
      // Support both { user } and { success, data: { user } } response shapes
      const data = response.data as any;
      if (data.user) return data.user;
      if (data.data && data.data.user) return data.data.user;
      return null;
    } catch (error) {
      this.clearAuthTokens();
      return null;
    }
  }

  public isAuthenticated(): boolean {
    const token = localStorage.getItem('token');
    if (!token) return false;

    // Check token expiration
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      
      if (currentTime > expirationTime) {
        this.clearAuthTokens();
        return false;
      }
    }

    return true;
  }

  public getAuthToken(): string | null {
    return localStorage.getItem('token');
  }
}

export const authService = new AuthService();
