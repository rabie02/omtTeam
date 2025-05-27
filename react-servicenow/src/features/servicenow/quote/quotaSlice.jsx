import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const initialState = {
  data: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  page: 1,
  totalPages: 0,
  total: 0,
  limit: 6,
  searchQuery: ''
};

// Async Thunks
export const getQuotes = createAsyncThunk(
  'quotes/getall',
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/quote`, {
        headers: { authorization: access_token },
        params: { page, limit, q }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createQuote = createAsyncThunk(
  'quotes/create',
  async (opportunityId, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');    
      
      const response = await axios.post(
        `${backendUrl}/api/quote/${opportunityId}`,{},
        {
          headers: { authorization: access_token },
        }
      );
      
      return response.data;
    } catch (error) {      
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const quoteSlice = createSlice({
  name: 'quotes',
  initialState,
  reducers: {
    resetQuotes: () => initialState,
    setPage: (state, action) => {
      state.page = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(getQuotes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getQuotes.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.limit = action.payload.limit || state.limit;
      })
      .addCase(getQuotes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.data = [];
        state.total = 0;
        state.totalPages = 0;
      })
      .addCase(createQuote.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createQuote.fulfilled, (state) => {
        state.createLoading = false;
      })
      .addCase(createQuote.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      });
  }
});

export const { resetQuotes, setPage, setSearchQuery } = quoteSlice.actions;
export default quoteSlice.reducer;