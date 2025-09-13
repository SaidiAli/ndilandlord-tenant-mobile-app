import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { User } from '../types';
import { secureStorage } from '../lib/storage';
import { authApi } from '../lib/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!user;

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('Initializing authentication...');
        
        const token = await secureStorage.getToken();
        const storedUser = await secureStorage.getUser();

        console.log('Stored auth data:', { 
          hasToken: !!token, 
          hasUser: !!storedUser,
          userRole: storedUser?.role 
        });

        if (token && storedUser) {
          // Verify token is still valid by calling /me endpoint
          try {
            console.log('Verifying token with server...');
            const currentUser = await authApi.getCurrentUser();
            console.log('Token verified, user data updated');
            setUser(currentUser);
            await secureStorage.setUser(currentUser); // Update stored user data
          } catch (error: any) {
            console.error('Token verification failed:', error);
            // Token is invalid, clear auth data
            await secureStorage.clear();
            setUser(null);
          }
        } else {
          console.log('No stored auth data found');
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        await secureStorage.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
        console.log('Auth initialization complete');
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      console.log('Login attempt for user:', username);
      
      const response = await authApi.login({ username, password });
      
      console.log('Login successful, storing user data');
      
      await secureStorage.setToken(response.token);
      await secureStorage.setUser(response.user);
      setUser(response.user);
      
      console.log('Redirecting to tabs');
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Login failed in useAuth:', error);
      throw error;
    }
  };

  const logout = async () => {
    await secureStorage.clear();
    setUser(null);
    router.replace('/(auth)/login');
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      await secureStorage.setUser(currentUser);
    } catch (error) {
      console.error('Failed to refresh user:', error);
      await logout();
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}