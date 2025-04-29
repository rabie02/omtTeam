import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'ProductOfferingCategory/getall',
  async ({ page = 1, limit = 6 }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/product-offering-category", {
        headers: { authorization: access_token },
        params: { page, limit }
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
      const response = await axios.get(`/api/product-offering-category/${id}`, {
        headers: { authorization: access_token },
      });
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
      const response = await axios.post("/api/product-offering-category", productData, {
        headers: { authorization: access_token },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updatecategoryStatus = createAsyncThunk(
  'ProductOfferingCategory/updateStatus',
  async ({ id, currentStatus }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const newStatus = currentStatus === 'draft' ? 'published' 
                      : currentStatus === 'published' ? 'retired'
                      : currentStatus;

      const response = await axios.patch(
        `/api/product-offering-category/${id}`, 
        { status: newStatus },
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

      console.log(productData);
      
      const response = await axios.patch(`/api/product-offering-category/${id}`, productData, {
         headers: { authorization: access_token, 'Content-Type': 'multipart/form-data'  } 
      });
      console.log(response);
      
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
      await axios.delete(`/api/product-offering-category/${id}`, {
        headers: { authorization: access_token },
      });
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
    selectedProduct: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: true,
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
      .addCase(updatecategoryStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatecategoryStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        state.loading = false;
      })
      .addCase(updatecategoryStatus.rejected, (state, action) => {
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