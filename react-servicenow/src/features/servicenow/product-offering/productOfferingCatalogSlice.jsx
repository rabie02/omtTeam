import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'productOfferingCatalog/getall',
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/product-offering-catalog", {
        headers: { authorization: access_token },
        params: { page, limit, q }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getOne = createAsyncThunk(
  'productOfferingCatalog/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/product-offering-catalog/${id}`, {
        headers: { authorization: access_token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCatalog = createAsyncThunk(
  'productOfferingCatalog/create',
  async (productData, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.post("/api/product-offering-catalog", productData, {
        headers: { authorization: access_token },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateCatalogStatus = createAsyncThunk(
  'productOfferingCatalog/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      console.log(status);

      const response = await axios.patch(
        `/api/product-offering-catalog-status/${id}`, 
        { status: status },
        { headers: { authorization: access_token } }
      );
      console.log(response.data);
      return response.data.result;
      
      
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCatalog = createAsyncThunk(
  'productOfferingCatalog/update',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.patch(`/api/product-offering-catalog/${id}`, productData, {
        headers: { authorization: access_token },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteCatalog = createAsyncThunk(
  'productOfferingCatalog/delete',
  async (id, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      await axios.delete(`/api/product-offering-catalog/${id}`, {
        headers: { authorization: access_token },
      });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const productOfferingCatalogSlice = createSlice({
  name: 'productOfferingCatalog',
  initialState: { 
    data: [],
    selectedProduct: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: false,
    error: null
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Get All
      .addCase(getall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getall.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.total;
        state.limit = action.meta.arg?.limit || 6;
        state.loading = false;
      })
      .addCase(getall.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Get One
      .addCase(getOne.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOne.fulfilled, (state, action) => {
        state.selectedProduct = action.payload;
        state.loading = false;
      })
      .addCase(getOne.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Create
      .addCase(createCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCatalog.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.totalItems += 1;
        state.loading = false;
      })
      .addCase(createCatalog.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Update Status
      .addCase(updateCatalogStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCatalogStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateCatalogStatus.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Update
      .addCase(updateCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCatalog.fulfilled, (state, action) => {
       
        const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateCatalog.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Delete
      .addCase(deleteCatalog.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCatalog.fulfilled, (state, action) => {
        state.data = state.data.filter(p => p.sys_id !== action.payload);
        state.totalItems -= 1;
        state.loading = false;
      })
      .addCase(deleteCatalog.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

export default productOfferingCatalogSlice.reducer;