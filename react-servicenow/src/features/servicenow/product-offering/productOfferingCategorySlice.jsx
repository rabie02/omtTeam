import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Async Thunks
export const getall = createAsyncThunk(
  'ProductOfferingCategory/getall',
  async ({ page = 1, limit = 6, q = '' } = {}, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-offering-category`, {
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
      const response = await axios.get(`${backendUrl}/api/product-offering-category-publish`, {
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
  'ProductOfferingCategory/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`${backendUrl}/api/product-offering-category/${id}`, { headers: { authorization: access_token } });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCategory = createAsyncThunk(
  'ProductOfferingCategory/create',
  async (productData, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.post(`${backendUrl}/api/product-offering-category`, productData, {
        headers: {
          authorization: access_token,
          'Content-Type': 'application/json'
        },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateCategoryStatus = createAsyncThunk(
  'ProductOfferingCategory/updateStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${backendUrl}/api/product-offering-category-status/${id}`,
        { status },
        { headers: { authorization: access_token } }
      );
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'ProductOfferingCategory/update',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `${backendUrl}/api/product-offering-category/${id}`,
        productData,
        { headers: { authorization: access_token } }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteCategory = createAsyncThunk(
  'ProductOfferingCategory/delete',
  async (id, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      console.log(id);
      await axios.delete(`${backendUrl}/api/product-offering-category/${id}`,
        { headers: { authorization: access_token } });
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const ProductOfferingCategorySlice = createSlice({
  name: 'ProductOfferingCategory',
  initialState: {
    data: [],
    publishedData: [], // Add this for published categories
    currentCategory: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: false,
    loadingPublished: false, // Add this for published loading state
    loadingCategory: false,
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

      // Get Published
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

      // Get One
      .addCase(getOne.pending, (state) => {
        state.loadingCategory = true;
        state.error = null;
      })
      .addCase(getOne.fulfilled, (state, action) => {
        state.currentCategory = action.payload;
        state.loadingCategory = false;
      })
      .addCase(getOne.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingCategory = false;
      })

      // Create
      .addCase(createCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCategory.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.totalItems += 1;
        state.loading = false;
      })
      .addCase(createCategory.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Update Status
      .addCase(updateCategoryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategoryStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateCategoryStatus.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Update
      .addCase(updateCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCategory.fulfilled, (state, action) => {
        const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateCategory.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })

      // Delete
      .addCase(deleteCategory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCategory.fulfilled, (state, action) => {
        state.data = state.data.filter(p => p.sys_id !== action.payload);
        state.totalItems -= 1;
        state.loading = false;
      })
      .addCase(deleteCategory.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  }
});

export default ProductOfferingCategorySlice.reducer;