import axios from 'axios';
import { createAsyncThunk } from '@reduxjs/toolkit';

const API_URL = import.meta.env.VITE_BACKEND_URL;


export const userLogin = createAsyncThunk(
  'auth/login',
  async ({ username, password }, { rejectWithValue }) => {
    try {
      const { data } = await axios.post(
        `${API_URL}/api/get-token`,
        { username, password },
        {
          headers: { 'Content-Type': 'application/json' },
          timeout: 8000,
          withCredentials: true
        }
      );
      return data;
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
  async () => {
    try {
      const token = localStorage.getItem('access_token');
      
      // Always clear client-side storage immediately
      localStorage.removeItem('access_token');
      
      // Only attempt API logout if we have a token
      if (token) {
        await axios.post(
          `${API_URL}/api/logout`,
          {},
          {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            withCredentials: true
          }
        );
      }
      
      // Optionally handle session/cookie removal here as well
      document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 GMT'; 

      return true;
    } catch (error) {
      console.error('Logout API error:', error);
      // Notify user of logout failure if needed
      return false;
    }
  }
);
