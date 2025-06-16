import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'authorization': `${localStorage.getItem('access_token')}`,
});

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const initialState = {
  data: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  updateLoading: false,
  updateError: null,
  deleteLoading: false,
  deleteError: null,
  currentPage: 1,
  totalItems: 0,
  limit: 6,
  searchQuery: ''
};

// Async Thunks
export const getLocations = createAsyncThunk(
  'location/getall',
  async ({ page = 1, limit = 6, q = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/location`, {
        headers: getHeaders(),
        params: { page, limit, q }
      });
      
      return {
        data: response.data.result || [],
        currentPage: page,
        totalItems: response.data.total || 0,
        limit
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createLocation = createAsyncThunk(
  'location/create',
  async (locationData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/location`,
        locationData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateLocation = createAsyncThunk(
  'location/update',
  async ({ id, ...locationData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/location/${id}`,
        locationData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateLocationStatus = createAsyncThunk(
  'location/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/location/${id}/status`,
        { status },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteLocation = createAsyncThunk(
  'location/delete',
  async (locationId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${backendUrl}/api/location/${locationId}`,
        { headers: getHeaders() }
      );
      return locationId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const locationSlice = createSlice({
  name: 'location',
  initialState,
  reducers: {
    resetLocations: () => initialState,
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Locations
      .addCase(getLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalItems = action.payload.totalItems;
        state.limit = action.payload.limit;
      })
      .addCase(getLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Location
      .addCase(createLocation.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createLocation.fulfilled, (state, action) => {
        state.createLoading = false;
        state.data = [action.payload, ...state.data].slice(0, state.limit);
        state.totalItems += 1;
      })
      .addCase(createLocation.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // Update Location
      .addCase(updateLocation.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateLocation.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(location => 
          location._id === action.payload._id ? action.payload : location
        );
      })
      .addCase(updateLocation.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Update Location Status
      .addCase(updateLocationStatus.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateLocationStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(location => 
          location._id === action.payload._id ? action.payload : location
        );
      })
      .addCase(updateLocationStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete Location
      .addCase(deleteLocation.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteLocation.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.data = state.data.filter(location => location._id !== action.payload);
        state.totalItems -= 1;
        
        // Adjust current page if we deleted the last item on the page
        if (state.data.length === 0 && state.currentPage > 1) {
          state.currentPage -= 1;
        }
      })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  }
});

export const { 
  resetLocations, 
  setCurrentPage, 
  setSearchQuery,
  setLimit
} = locationSlice.actions;

export default locationSlice.reducer;