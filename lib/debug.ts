import axios from 'axios';
import { Platform } from 'react-native';

// Get the correct API URL based on platform
const getApiUrl = () => {
  // Default to localhost
  let baseUrl = 'http://localhost:4000/api';
  
  // For Android emulator, use 10.0.2.2 instead of localhost
  if (Platform.OS === 'android') {
    baseUrl = 'http://10.0.2.2:4000/api';
  }
  
  return baseUrl;
};

const API_BASE_URL = getApiUrl();

export const debugAPI = {
  // Test if the server is reachable
  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing connection to:', API_BASE_URL);
      
      // Try to make a simple request to the server
      const response = await axios.get(`${API_BASE_URL}/health`, {
        timeout: 5000
      });
      
      return {
        success: true,
        message: `Server is reachable. Status: ${response.status}`
      };
    } catch (error: any) {
      console.error('Connection test failed:', error);
      
      if (error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Connection refused. Make sure the server is running on localhost:4000'
        };
      } else if (error.code === 'NETWORK_ERROR') {
        return {
          success: false,
          message: 'Network error. Check your internet connection.'
        };
      } else if (error.response?.status === 404) {
        return {
          success: false,
          message: 'Server is running but /health endpoint not found. This might be normal.'
        };
      }
      
      return {
        success: false,
        message: `Connection failed: ${error.message}`
      };
    }
  },

  // Test auth endpoint specifically
  async testAuthEndpoint(): Promise<{ success: boolean; message: string }> {
    try {
      console.log('Testing auth endpoint...');
      
      // Try to make a request with invalid credentials to see if endpoint exists
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        userName: 'test',
        password: 'test'
      }, {
        timeout: 5000,
        validateStatus: (status) => status < 500 // Accept 4xx responses
      });
      
      if (response.status === 401) {
        return {
          success: true,
          message: 'Auth endpoint is working (returned 401 for invalid credentials)'
        };
      }
      
      return {
        success: true,
        message: `Auth endpoint responded with status: ${response.status}`
      };
    } catch (error: any) {
      console.error('Auth endpoint test failed:', error);
      
      return {
        success: false,
        message: `Auth endpoint test failed: ${error.message}`
      };
    }
  }
};

// Helper function to get network info
export const getNetworkInfo = () => {
  return {
    apiUrl: API_BASE_URL,
    platform: require('react-native').Platform.OS,
    // Add more debug info as needed
  };
};