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

export interface AuthResponseData {
  user: User;
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

type AuthResponse = ApiResponse<AuthResponseData>;

class AuthService {
  public async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      console.log('[AuthService] Attempting login with credentials:', {
        email: credentials.email,
        hasPassword: !!credentials.password
      });
      
      const response = await apiService.post<AuthResponseData>(
        API_ENDPOINTS.AUTH.LOGIN,
        credentials
      );
      
      console.log('[AuthService] Login response:', response);
      
      if (!response || !response.data) {
        throw new Error('No response received from server');
      }
      
      if (!response.data.success) {
        throw new Error(response.data.message || 'Authentication failed');
      }
      
      const { accessToken, refreshToken, expiresIn, user } = response.data.data;
      
      if (!accessToken) {
        throw new Error('Authentication failed: No access token received');
      }
      
      // Store tokens in localStorage with expiration
      this.setAuthTokens(accessToken, refreshToken, expiresIn);
      
      // Store user data in localStorage
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
      }
      
      console.log('[AuthService] Login successful, tokens stored');
      return {
        success: true,
        data: {
          user,
          accessToken,
          refreshToken,
          expiresIn
        }
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
      
      // Provide more specific error messages
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
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
        // The request was made but no response was received
        console.error('No response received:', error.request);
        throw new Error('No response from server. Please check your connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
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
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!token || !refreshToken) {
      this.clearAuthTokens();
      return null;
    }

    // Check if token is expired but refresh token is still valid
    const expiresAt = localStorage.getItem('token_expires_at');
    if (expiresAt) {
      const expirationTime = new Date(expiresAt).getTime();
      const currentTime = new Date().getTime();
      const bufferTime = 5 * 60 * 1000; // 5 minutes buffer

      if (currentTime + bufferTime > expirationTime) {
        try {
          // Try to refresh the token
          const response = await apiService.post<AuthResponseData>(
            API_ENDPOINTS.AUTH.REFRESH,
            { refreshToken }
          );

          if (response?.data?.success && response.data.data) {
            const { accessToken, refreshToken: newRefreshToken, expiresIn, user } = response.data.data;
            
            if (accessToken) {
              this.setAuthTokens(accessToken, newRefreshToken, expiresIn);
              localStorage.setItem('user', JSON.stringify(user));
              return user;
            } else {
              this.clearAuthTokens();
              return null;
            }
          } else {
            this.clearAuthTokens();
            return null;
          }
        } catch (error) {
          console.error('Failed to refresh token:', error);
          this.clearAuthTokens();
          return null;
        }
      }
    }

    try {
      const response = await apiService.get<{ user: User }>(API_ENDPOINTS.AUTH.ME);

      if (response.data.success && response.data.data) {
        return response.data.data.user;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching current user:', error);
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
