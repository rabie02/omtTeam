import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Fetch single specification
export const getone = createAsyncThunk(
  'ProductSpecification/getone',
  async (id, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-specification/${id}`, {
        headers: { authorization: access_token },
      });    
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Fetch published specifications
export const getPublished = createAsyncThunk(
  'ProductSpecification/getPublished',
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-specification`, {
        headers: { authorization: access_token },
        params: { page, limit, q }
      });
     
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const initialState = {
  data: [],
  currentSpec: null,
  currentPage: 1,
  totalPages: 1,
  totalItems: 0,
  limit: 6,
  loading: false,         // For list operations
  loadingSpec: false,     // For single spec operations
  error: null
};

const ProductSpecificationSlice = createSlice({
  name: 'ProductSpecification',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Handle getone (single spec)
      .addCase(getone.pending, (state) => {
        state.loadingSpec = true;
        state.error = null;
      })
      .addCase(getone.fulfilled, (state, action) => {    
        state.currentSpec = action.payload.data;
        state.loadingSpec = false;
      })
      .addCase(getone.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingSpec = false;
      })
      
      // Handle getPublished (list)
      .addCase(getPublished.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPublished.fulfilled, (state, action) => {
        state.data = action.payload.data || [];
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.totalItems = action.payload.total || 0;
        state.limit = action.payload.limit || state.limit;
        state.loading = false;
      })
      .addCase(getPublished.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

export default ProductSpecificationSlice.reducer;