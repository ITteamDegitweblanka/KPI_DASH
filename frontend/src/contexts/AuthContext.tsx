import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { authService, User } from '../services/authService';
import { ApiResponse } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<ApiResponse<{
    user: User;
    accessToken?: string;
    token?: string;
    refreshToken: string;
    expiresIn: number;
  }>>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (isMounted) {
          if (currentUser) {
            // Map backend 'name' field to 'displayName' in our frontend
            const displayName = (currentUser as any).name || currentUser.displayName || currentUser.email.split('@')[0];
            setUser({
              id: currentUser.id,
              email: currentUser.email,
              displayName,
              role: currentUser.role,
              isActive: currentUser.isActive,
              title: currentUser.title,
              phoneNumber: currentUser.phoneNumber,
              avatarUrl: currentUser.avatarUrl,
              team: currentUser.team,
              createdAt: currentUser.createdAt,
              updatedAt: currentUser.updatedAt
            });
          }
        }
      } catch (error) {
        console.error('Failed to load user:', error);
        // Clear any invalid tokens
        if (isMounted) {
          authService.logout();
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    // Check if we have a token before trying to load the user
    const token = localStorage.getItem('token');
    if (token) {
      loadUser();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    try {
      setIsLoading(true);
      const response = await authService.login(credentials);
      if (response?.data) {
        // Support both { user, token } and { user, accessToken } response shapes
        const userData = response.data.user;
        // Prefer accessToken, but allow token for backward compatibility
        const accessToken = response.data.accessToken || (response.data as any).token || '';
        const refreshToken = response.data.refreshToken;
        const expiresIn = response.data.expiresIn;
        authService.setAuthTokens(accessToken, refreshToken, expiresIn);
        const displayName = (userData as any).name || userData.displayName || userData.email.split('@')[0];
        setUser({
          id: userData.id,
          email: userData.email,
          displayName,
          role: userData.role,
          isActive: userData.isActive,
          title: userData.title,
          phoneNumber: userData.phoneNumber,
          avatarUrl: userData.avatarUrl,
          team: userData.team,
          createdAt: userData.createdAt,
          updatedAt: userData.updatedAt
        });
        // Add debug log
        console.log('[AuthContext] User set after login:', userData);
      }
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user && (typeof user.id === 'string' ? user.id.length > 0 : !!user.id),
        isLoading,
        login,
        logout,
      }}
    >
      {/* Debug log for user and isAuthenticated */}
      {(() => { console.log('[AuthContext.Provider] user:', user, 'isAuthenticated:', !!user && (typeof user.id === 'string' ? user.id.length > 0 : !!user.id)); return null; })()}
      {!isLoading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
