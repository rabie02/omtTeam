import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// ServiceNow API headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'authorization': `${localStorage.getItem('access_token')}`,
});

// CREATE Price List
export const createPriceList = createAsyncThunk(
  'opportunity/createPriceList',
  async (priceListData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/price-list`,
        priceListData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// GET Price List with pagination
export const getPriceList = createAsyncThunk(
  'opportunity/getPriceList',
  async ({ q, page = 1, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/price-list`,
        {
          headers: getHeaders(),
          params: { q, page, limit }
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// GET One Price List
export const getOnePriceList = createAsyncThunk(
  'opportunity/getOnePriceList',
  async ({ id }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/price-list/${id}`,
        {headers: getHeaders()}
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// DELETE Price List
export const deletePriceList = createAsyncThunk(
  'opportunity/deletePriceList',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.delete(
        `${backendUrl}/api/price-list/${id}`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Initial state
const initialState = {
  priceLists: [],
  currentPriceList: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 10,
  loading: false,
  loadingPriceList: false,
  error: null
};

const priceListSlice = createSlice({
  name: 'priceList',
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setCurrentPriceList: (state, action) => {
      state.currentPriceList = action.payload;
    },
    resetCurrentPriceList: (state)=>{
      state.currentPriceList = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Create Price List
      .addCase(createPriceList.pending, (state) => {
        state.loading = true;
      })
      .addCase(createPriceList.fulfilled, (state, action) => {
        state.priceLists.unshift(action.payload);
        state.totalItems += 1;
        state.totalPages = Math.ceil(state.totalItems / state.limit);
        state.loading = false;
      })
      .addCase(createPriceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to create price list';
      })

      // Get Price List
      .addCase(getPriceList.pending, (state) => {
        state.loading = true;
      })
      .addCase(getPriceList.fulfilled, (state, action) => {
        state.loading = false;
        state.priceLists = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.totalItems;
        state.limit = action.payload.limit;
      })
      .addCase(getPriceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch Price List';
      })

      // Get One Price List
      .addCase(getOnePriceList.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOnePriceList.fulfilled, (state, action) => {
        state.loading = false;
        state.currentPriceList = action.payload;
      })
      .addCase(getOnePriceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch Price List';
      })

      // Delete Price List
      .addCase(deletePriceList.pending, (state) => {
        state.loading = true;
      })
      .addCase(deletePriceList.fulfilled, (state, action) => {
        state.priceLists = state.priceLists.filter(p => p._id !== action.payload.mongoId);
        state.totalItems -= 1;
        state.totalPages = Math.ceil(state.totalItems / state.limit);
        
        // Adjust current page if we're on a page that no longer exists
        if (state.currentPage > state.totalPages && state.totalPages > 0) {
          state.currentPage = state.totalPages;
        }
        state.loading = false;
      })
      .addCase(deletePriceList.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to delete Price List';
      });
  },
});

export const { resetError, setCurrentPage, setCurrentPriceList, resetCurrentPriceList } = priceListSlice.actions;

export default priceListSlice.reducer;