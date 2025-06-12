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
export const getAccount = createAsyncThunk(
  'account/getall',
  async ({ page = 1, limit = 6, q = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/account`, {
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

export const createAccount = createAsyncThunk(
  'account/create',
  async (accountData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/account`,
        accountData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAccount = createAsyncThunk(
  'account/update',
  async ({ id, ...accountData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/account/${id}`,
        accountData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateAccountStatus = createAsyncThunk(
  'account/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/account/${id}/status`,
        { status },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteAccount = createAsyncThunk(
  'account/delete',
  async (accountId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${backendUrl}/api/account/${accountId}`,
        { headers: getHeaders() }
      );
      return accountId;
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
      // Get All Accounts
      .addCase(getAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalItems = action.payload.totalItems;
        state.limit = action.payload.limit;
      })
      .addCase(getAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Account
      .addCase(createAccount.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createAccount.fulfilled, (state, action) => {
        state.createLoading = false;
        state.data = [action.payload, ...state.data].slice(0, state.limit);
        state.totalItems += 1;
      })
      .addCase(createAccount.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // Update Account
      .addCase(updateAccount.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateAccount.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(account => 
          account._id === action.payload._id ? action.payload : account
        );
      })
      .addCase(updateAccount.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Update Account Status
      .addCase(updateAccountStatus.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateAccountStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(account => 
          account._id === action.payload._id ? action.payload : account
        );
      })
      .addCase(updateAccountStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete Account
      .addCase(deleteAccount.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteAccount.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.data = state.data.filter(account => account._id !== action.payload);
        state.totalItems -= 1;
        
        // Adjust current page if we deleted the last item on the page
        if (state.data.length === 0 && state.currentPage > 1) {
          state.currentPage -= 1;
        }
      })
      .addCase(deleteAccount.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  }
});

export const { 
  resetAccounts, 
  setCurrentPage, 
  setSearchQuery,
  setLimit
} = accountSlice.actions;

export default accountSlice.reducer;