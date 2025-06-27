import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

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
        `${backendUrl}/api/quote/${opportunityId}`, {},
        { headers: { authorization: access_token } }
      );
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateQuoteState = createAsyncThunk(
  'quotes/update',
  async ({ id, state }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
console.log(state);

      const response = await axios.patch(
        `${backendUrl}/api/quote-state/${id}`,
         {state},
        { headers: { authorization: access_token } }
      );
      return response.data.result; // Updated quote object
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message || 
        error.response?.data?.message || 
        error.message
      );
    }
  }
);

export const deleteQuote = createAsyncThunk(
  'quotes/delete',
  async (quoteId, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.delete(
        `${backendUrl}/api/quote/${quoteId}`,
        { headers: { authorization: access_token } }
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
      // Get Quotes
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
      
      // Create Quote
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
      })
      
      // Update Quote
      .addCase(updateQuoteState.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateQuoteState.fulfilled, (state, action) => {
        state.updateLoading = false;
        // Update specific quote in state
        state.data = state.data.map(quote => 
          quote._id === action.payload._id ? action.payload : quote
        );
      })
      .addCase(updateQuoteState.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete Quote
      .addCase(deleteQuote.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteQuote.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.data = state.data.filter(p => p._id !== action.payload._id);
        state.total -= 1;
      })
      .addCase(deleteQuote.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  }
});

export const { resetQuotes, setPage, setSearchQuery } = quoteSlice.actions;
export default quoteSlice.reducer;
