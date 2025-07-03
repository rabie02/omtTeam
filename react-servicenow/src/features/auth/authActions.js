import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_BACKEND_URL;


export const userLogin = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue, dispatch }) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/login`,
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
          withCredentials: true,
          timeout: 8000
        }
      );
      
      // Fetch user info after successful login
      const userResponse = await dispatch(fetchUserInfo());
      
      return {
        ...data,
        user: userResponse.payload.user
      };
    } catch (error) {
      if (!error.response) {
        return rejectWithValue({
          type: 'network_error',
          message: 'Network error. Please check your connection.'
        });
      }

      return rejectWithValue({
        type: error.response.data?.error || 'authentication_failed',
        message: error.response.data?.error_description || 'Login failed'
      });
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/registerUser',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_URL}/api/request-registration`, userData);
      return response.data;
    } catch (err) {
      if (err.response) {
        // Ensure we return a string message, not an object
        return rejectWithValue(
          err.response.data?.message || 
          err.response.data?.error_description || 
          'Registration failed'
        );
      } else {
        return rejectWithValue('An error occurred while registering. Please try again.');
      }
    }
  }
);


export const userLogout = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Make logout request
      await axios.post(
        `${API_URL}/api/logout`,
        {},
        {
          withCredentials: true,
          headers: { 'Content-Type': 'application/json' },
          timeout: 10000 // 10 second timeout
        }
      );

      // Force clear cookies as fallback
      clearAllCookies();

      return true;
    } catch (error) {
      handleLogoutError(error);
      return rejectWithValue(formatError(error));
    }
  }
);

// Helper functions
function clearAllCookies() {
  document.cookie.split(';').forEach(cookie => {
    const [name] = cookie.trim().split('=');
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  });
}

function formatError(error) {
  if (error.response) {
    return {
      message: error.response.data?.message || 'Logout failed',
      status: error.response.status
    };
  }
  return {
    message: error.message || 'Network error during logout',
    status: 0
  };
}

function handleLogoutError(error) {
  if (error.code === 'ECONNABORTED') {
    console.warn('Logout timeout - session may still be active');
  } else {
    console.error('Logout error:', error);
  }
}

export const createAccount = createAsyncThunk(
  'auth/createAccount',
  async (userData, { rejectWithValue }) => {
    console.log(userData)
    try {
      const response = await axios.post('/api/request-creation', userData, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 10000
      });
      
      if (response.data.error === 'email_exists') {
        return rejectWithValue('email_exists');
      }
      
      return response.data;
    } catch (err) {
      if (err.response) {
        return rejectWithValue(err.response.data.message || 'Registration failed');
      } else if (err.request) {
        return rejectWithValue('Network error. Please check your connection.');
      } else {
        return rejectWithValue('An error occurred while registering. Please try again.');
      }
    }
  }
);
export const fetchUserInfo = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axios.get(`${API_URL}/api/me`, {
        withCredentials: true
      });
      
      if (!data?.user) {
        throw new Error('No user data returned');
      }
      
      return { user: data.user };
    } catch (err) {
      return rejectWithValue(err.response?.data || {
        error: 'fetch_failed',
        error_description: 'Could not fetch user information'
      });
    }
  }
);