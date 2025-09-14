import axios, { AxiosError, AxiosResponse } from 'axios';
import { secureStorage } from './storage';
import { ApiResponse, AuthResponse, LoginRequest, LoginRequestBackend, User } from '../types';

import { Platform } from 'react-native';

// Get the correct API URL based on platform
const getApiUrl = () => {
  // Default to localhost
  let baseUrl = 'http://192.168.100.30:4000/api';
  
  // For Android emulator, use 10.0.2.2 instead of localhost
  if (Platform.OS === 'android') {
    baseUrl = 'http://10.0.2.2:4000/api';
  }
  
  // For iOS simulator, localhost should work
  // For physical device, you'll need your computer's IP address like:
  // baseUrl = 'http://YOUR_IP_ADDRESS:4000/api';
  
  return baseUrl;
};

// Create axios instance
const api = axios.create({
  baseURL: getApiUrl(),
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // Increased timeout for slower connections
});

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const token = await secureStorage.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      await secureStorage.clear();
      // Note: Navigation will be handled by the auth context
    }
    return Promise.reject(error);
  }
);

// Auth API functions
export const authApi = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    try {
      // Transform username to userName for backend compatibility
      const requestData: LoginRequestBackend = {
        userName: credentials.username,
        password: credentials.password,
      };
      
      const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', requestData);
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Login failed');
      }
      
      // Ensure user has required fields
      const authData = response.data.data;
      if (!authData.user.firstName || !authData.token) {
        throw new Error('Invalid response data from server');
      }
      
      return authData;
    } catch (error: any) {
      if (error.response?.status === 401) {
        throw new Error('Invalid username or password');
      } else if (error.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else if (error.code === 'NETWORK_ERROR' || error.message.includes('Network Error')) {
        throw new Error('Unable to connect to server. Please check your connection and ensure the server is running.');
      }
      
      throw new Error(error.message || 'Login failed');
    }
  },

  getCurrentUser: async (): Promise<User> => {
    try {
      const response = await api.get<ApiResponse<User>>('/auth/me');
      
      if (!response.data.success || !response.data.data) {
        throw new Error(response.data.error || 'Failed to get user data');
      }
      
      return response.data.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Token expired or invalid
        await secureStorage.clear();
        throw new Error('Session expired. Please login again.');
      } else if (error.response?.status === 404) {
        throw new Error('User not found');
      }
      
      throw new Error(error.message || 'Failed to get user data');
    }
  },
};

// Tenant-specific API functions
export const tenantApi = {
  getDashboard: async () => {
    const response = await api.get('/tenant/dashboard');
    return response.data;
  },

  getLeaseInfo: async () => {
    const response = await api.get('/tenant/lease');
    return response.data;
  },

  getPayments: async () => {
    const response = await api.get('/payments');
    return response.data;
  },

  makePayment: async (paymentData: any) => {
    const response = await api.post('/payments', paymentData);
    return response.data;
  },

  getMaintenanceRequests: async () => {
    const response = await api.get('/maintenance');
    return response.data;
  },

  createMaintenanceRequest: async (requestData: any) => {
    const response = await api.post('/maintenance', requestData);
    return response.data;
  },

  getPropertyInfo: async () => {
    const response = await api.get('/tenant/property');
    return response.data;
  },
};

export default api;