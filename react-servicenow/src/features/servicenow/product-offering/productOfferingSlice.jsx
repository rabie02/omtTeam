import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function to get auth headers
const getAuthHeaders = () => {
  const access_token = localStorage.getItem('access_token');
  return { headers: { authorization: access_token } };
};

// Async Thunks
export const getall = createAsyncThunk(
  'ProductOffering/getall',
  async ({ page = 1, limit = 6, q = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/product-offering`, {
        ...getAuthHeaders(),
        params: { page, limit, q }
      });
      return response.data || { data: [], page: 1, totalPages: 1, total: 0 };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getOne = createAsyncThunk(
  'ProductOffering/getOne',
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product-offering/${id}`,
        getAuthHeaders()
      );
      console.log(response.data.data);
      
      return response.data.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createProductOffering = createAsyncThunk(
  'ProductOffering/create',
  async (productData, { rejectWithValue }) => {
    try {
      console.log(JSON.stringify(productData, null, 2));
      const response = await axios.post(
        `${backendUrl}/api/product-offering`,
        productData,
        getAuthHeaders()
      );
      return response.data?.result || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProductOfferingStatus = createAsyncThunk(
  'ProductOffering/updateStatus',
  async (data, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/product-offering-status`,
        data,
        getAuthHeaders()
      );
      return response.data?.result || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProductOffering = createAsyncThunk(
  'ProductOffering/update',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/product-offering/${id}`,
        productData,
        getAuthHeaders()
      );
      return response.data || null;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteProductOffering = createAsyncThunk(
  'ProductOffering/delete',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${backendUrl}/api/product-offering/${id}`,
        getAuthHeaders()
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const ProductOfferingSlice = createSlice({
  name: 'ProductOffering',
  initialState: { 
    data: [],
    currentProductOffering: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: false,
    loadingProductOffering: false,
    error: null
  },
  reducers: {
    resetCurrentProductOffering: (state) => {
      state.currentProductOffering = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // getall
      .addCase(getall.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getall.fulfilled, (state, action) => {
        state.data = action.payload.data || [];
        console.log(state.data);
        
        state.currentPage = action.payload.page || 1;
        state.totalPages = action.payload.totalPages || 1;
        state.totalItems = action.payload.total || 0;
        state.limit = action.meta.arg?.limit || 6;
        state.loading = false;
      })
      .addCase(getall.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // getOne
      .addCase(getOne.pending, (state) => {
        state.loadingProductOffering = true;
        state.error = null;
      })
      .addCase(getOne.fulfilled, (state, action) => {
        state.currentProductOffering = action.payload; 
        state.loadingProductOffering = false;
      })
      .addCase(getOne.rejected, (state, action) => {
        state.error = action.payload;
        state.loadingProductOffering = false;
      })
      
      // createProductOffering
      .addCase(createProductOffering.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductOffering.fulfilled, (state, action) => {
        if (action.payload) {
          state.data.unshift(action.payload);
          state.totalItems += 1;
        }
        state.loading = false;
      })
      .addCase(createProductOffering.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // updateProductOffering
      .addCase(updateProductOffering.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductOffering.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.data.findIndex(p => p._id === action.payload._id);
          if (index !== -1) {
            state.data[index] = action.payload;
          }
          if (state.currentProductOffering?._id === action.payload._id) {
            state.currentProductOffering = action.payload;
          }
        }
        state.loading = false;
      })
      .addCase(updateProductOffering.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // updateProductOfferingStatus
      .addCase(updateProductOfferingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductOfferingStatus.fulfilled, (state, action) => {
        if (action.payload) {
          const index = state.data.findIndex(p => p.sys_id === action.payload.sys_id);
          if (index !== -1) {
            state.data[index] = action.payload;
          }
          if (state.currentProductOffering?.sys_id === action.payload.sys_id) {
            state.currentProductOffering = action.payload;
          }
        }
        state.loading = false;
      })
      .addCase(updateProductOfferingStatus.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // deleteProductOffering
      .addCase(deleteProductOffering.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProductOffering.fulfilled, (state, action) => {
        state.data = state.data.filter(p => p._id !== action.payload);
        state.totalItems = Math.max(0, state.totalItems - 1);
        // Clear current product if it was deleted
        if (state.currentProductOffering?._id === action.payload) {
          state.currentProductOffering = null;
        }
        state.loading = false;
      })
      .addCase(deleteProductOffering.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export const { resetCurrentProductOffering } = ProductOfferingSlice.actions;
export default ProductOfferingSlice.reducer;