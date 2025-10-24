import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiClient } from '../../../shared/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('rupture_token'));

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('rupture_token');
      
      if (savedToken) {
        try {
          // Set token in API client
          apiClient.setAuthToken(savedToken);
          
          // Verify token and get user data
          const response = await apiClient.get('/auth/me');
          
          if (response.success) {
            setUser(response.data.user);
            setToken(savedToken);
          } else {
            // Token is invalid, clear it
            localStorage.removeItem('rupture_token');
            apiClient.setAuthToken(null);
            setToken(null);
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
          // Clear invalid token
          localStorage.removeItem('rupture_token');
          apiClient.setAuthToken(null);
          setToken(null);
        }
      }
      
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password
      });

      if (response.success) {
        const { user: userData, token: authToken } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('rupture_token', authToken);
        
        // Set token in API client
        apiClient.setAuthToken(authToken);
        
        // Update state
        setUser(userData);
        setToken(authToken);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.message || 'Login failed' 
        };
      }
    } catch (error) {
      console.error('Login error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed. Please try again.' 
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);

      if (response.success) {
        const { user: newUser, token: authToken } = response.data;
        
        // Save token to localStorage
        localStorage.setItem('rupture_token', authToken);
        
        // Set token in API client
        apiClient.setAuthToken(authToken);
        
        // Update state
        setUser(newUser);
        setToken(authToken);
        
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.message || 'Registration failed' 
        };
      }
    } catch (error) {
      console.error('Registration error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed. Please try again.' 
      };
    }
  };

  const logout = async () => {
    try {
      // Call logout endpoint to update user status
      if (token) {
        await apiClient.post('/auth/logout');
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear local state regardless of API call result
      localStorage.removeItem('rupture_token');
      apiClient.setAuthToken(null);
      setUser(null);
      setToken(null);
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiClient.put('/auth/profile', profileData);

      if (response.success) {
        setUser(response.data.user);
        return { success: true };
      } else {
        return { 
          success: false, 
          message: response.message || 'Profile update failed' 
        };
      }
    } catch (error) {
      console.error('Profile update error:', error);
      return { 
        success: false, 
        message: error.response?.data?.message || 'Profile update failed. Please try again.' 
      };
    }
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

