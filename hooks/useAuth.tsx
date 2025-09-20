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
          // Verify token is still valid by calling /me endpoint
          try {
            const currentUser = await authApi.getCurrentUser();
            setUser(currentUser);
            await secureStorage.setUser(currentUser); // Update stored user data
          } catch (error: any) {
            // Token is invalid, clear auth data
            await secureStorage.clear();
            setUser(null);
          }
        }
      } catch (error) {
        await secureStorage.clear();
        setUser(null);
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