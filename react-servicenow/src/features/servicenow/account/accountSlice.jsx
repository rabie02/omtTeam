import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'authorization': `${localStorage.getItem('access_token')}`, // or your auth method
});

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const initialState = {
  data: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  deleteLoading: false,
  deleteError: null,
  page: 1,
  totalPages: 0,
  total: 0,
  limit: 6,
  searchQuery: ''
};


// Async Thunks
export const getAccount = createAsyncThunk(
  'account/getall',
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/account`, {
        headers: { authorization: access_token },
        params: { page, limit, q }
      });
      
      // Ensure the response matches what your backend returns
      return {
        data: response.data.result || response.data, // Adjust based on actual response
        total: response.data.total || response.data.result?.length || 0,
        page,
        limit,
        totalPages: Math.ceil((response.data.total || response.data.result?.length || 0) / limit)
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'account/delete',
  async (accountId, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${backendUrl}/api/account/${accountId}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const accountSlice = createSlice({
  name: 'account',
  initialState,
  reducers: {
    resetAccounts: () => initialState,
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data || [];  // Ensure data is always an array
        state.total = action.payload.total || 0;
        state.page = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 0;
        state.limit = action.payload.limit || state.limit;
      })
      .addCase(getAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = [];
        state.total = 0;
        state.totalPages = 0;
      })
      .addCase(deleteAccount.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.data = state.data.filter(p => p._id !== action.payload._id);
        state.total -= 1;
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  }
});

export const { resetAccounts, setPage, setSearchQuery } = accountSlice.actions;
export default accountSlice.reducer;