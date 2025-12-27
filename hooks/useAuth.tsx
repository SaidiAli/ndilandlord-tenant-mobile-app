import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useRouter } from 'expo-router';
import { User } from '../types';
import { secureStorage } from '../lib/storage';
import { authApi } from '../lib/api';

interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
}

interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUser: (userData: UpdateUserRequest) => Promise<void>;
  changePassword: (passwordData: ChangePasswordRequest) => Promise<void>;
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
        const token = await secureStorage.getToken();
        const storedUser = await secureStorage.getUser();

        if (token && storedUser) {
          // Optimistically set user to allow instant app access
          setUser(storedUser);

          // Verify token is still valid by calling /me endpoint in background
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            await secureStorage.setUser(currentUser); // Update stored user data
          } catch (error: any) {
            console.error('Auth verification failed:', error);
            // Only logout if it's explicitly an authentication error (401)
            // or if the user data is actually missing (404)
            if (error.response?.status === 401 || error.response?.status === 404 || error.message?.includes('User not found')) {
              console.log('Token expired or invalid, logging out');
              await logout();
            }
            // For network errors (500, timeout, etc), we stay logged in (offline mode)
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        // Only clear is absolutely necessary
        const token = await secureStorage.getToken();
        if (!token) {
          await secureStorage.clear();
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      const response = await authApi.login({ username, password });

      await secureStorage.setToken(response.token);
      await secureStorage.setUser(response.user);
      setUser(response.user);

      router.replace('/(tabs)');
    } catch (error: any) {
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
      await logout();
    }
  };

  const updateUser = async (userData: UpdateUserRequest) => {
    try {
      const updatedUser = await authApi.updateUser(userData);
      setUser(updatedUser);
      await secureStorage.setUser(updatedUser);
    } catch (error: any) {
      throw error;
    }
  };

  const changePassword = async (passwordData: ChangePasswordRequest) => {
    try {
      await authApi.changePassword(passwordData);
    } catch (error: any) {
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshUser,
    updateUser,
    changePassword,
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