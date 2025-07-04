import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Async Thunks
export const getall = createAsyncThunk(
  'productOfferingCatalog/getall',
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-offering-catalog`, {
        headers: { authorization: access_token },
        params: { page, limit, q }
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getPublish = createAsyncThunk(
  'productOfferingCatalog/getPublish',
  async ({ q }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-offering-catalog-publish`, {
        headers: { authorization: access_token },
        params: { q }
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
      const response = await axios.get(`${backendUrl}/api/product-offering-catalog/${id}`, {
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
      // Ensure status is set to draft for new catalogs
      const catalogData = { ...productData, status: 'draft' };
      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.post(`${backendUrl}/api/product-offering-catalog`, catalogData, {
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
      const response = await axios.patch(
        `${backendUrl}/api/product-offering-catalog-status/${id}`,
        { status },
        { headers: { authorization: access_token } }
      );
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
      const response = await axios.patch(
        `${backendUrl}/api/product-offering-catalog/${id}`,
        productData,
        { headers: { authorization: access_token } }
      );
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
      await axios.delete(`${backendUrl}/api/product-offering-catalog/${id}`, {
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
    currentCatalog: null, // Changed from selectedProduct
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: false,
    loadingCatalog: false, // New loading state for single catalog
    error: null
  },
  reducers: {
    // Add a reset action to clear currentCatalog
    resetCurrentCatalog: (state) => {
      state.currentCatalog = null;
    }
  },
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

      // Get Publish
      .addCase(getPublish.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPublish.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.currentPage = action.payload.page;
        state.totalPages = action.payload.totalPages;
        state.totalItems = action.payload.total;
        state.limit = action.meta.arg?.limit || 6;
        state.loading = false;
      })
      .addCase(getPublish.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Get One - use separate loading state
      .addCase(getOne.pending, (state) => {
        state.loadingCatalog = true;
        state.error = null;
      })
      .addCase(getOne.fulfilled, (state, action) => {
        state.currentCatalog = action.payload;
        state.loadingCatalog = false;
      })
      .addCase(getOne.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingCatalog = false;
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
        const updatedProduct = action.payload;
        state.data = state.data.map(product =>
          product._id === updatedProduct._id ? updatedProduct : product
        );
        if (state.currentCatalog?._id === updatedProduct._id) {
          state.currentCatalog = updatedProduct;
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
        const updatedProduct = action.payload;
        state.data = state.data.map(product =>
          product._id === updatedProduct._id ? updatedProduct : product
        );
        if (state.currentCatalog?._id === updatedProduct._id) {
          state.currentCatalog = updatedProduct;
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
        state.data = state.data.filter(p => p._id !== action.payload);
        state.totalItems -= 1;
        state.loading = false;
      })
      .addCase(deleteCatalog.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

export const { resetCurrentCatalog } = productOfferingCatalogSlice.actions;
export default productOfferingCatalogSlice.reducer;