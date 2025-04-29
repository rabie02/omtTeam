import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'ProductOffering/getall',
  async ({ page = 1, limit = 6 }, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/product-offering", {
        headers: { authorization: access_token },
        params: { page, limit }
      }); 
      
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const getOne = createAsyncThunk(
  'ProductOffering/getOne',
  async (id, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get(`/api/product-offering/${id}`, {
        headers: { authorization: access_token },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createProductOffering = createAsyncThunk(
  'ProductOffering/create',
  async (productData, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.post("/api/product-offering", productData, {
        headers: { authorization: access_token },
      });
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateProductOfferingStatus = createAsyncThunk(
  'ProductOffering/updateStatus',
  async (data , { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.patch(
        `/api/product-offering-status`,
        data,
        { headers: { authorization: access_token } }
      );
      return response.data.result;
    } catch (err) {
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateProductOffering = createAsyncThunk(
  'ProductOffering/update',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.patch(`/api/product-offering/${id}`, productData, {
        headers: { authorization: access_token },
      });
      return response;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteProductOffering = createAsyncThunk(
  'ProductOffering/delete',
  async (id, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      await axios.delete(`/api/product-offering/${id}`, {
        headers: { authorization: access_token },
      });
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
    selectedProduct: null,
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    limit: 6,
    loading: true,
    error: null
  },
  extraReducers: (builder) => {
    builder
      // getall
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
      
      // getOne
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
      
      // createProductOffering
      .addCase(createProductOffering.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createProductOffering.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.totalItems += 1;
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
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
        }
        state.loading = false;
      })
      .addCase(updateProductOffering.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      
      // updateProductOfferingStatus (corrected from updateCatalogStatus)
      .addCase(updateProductOfferingStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductOfferingStatus.fulfilled, (state, action) => {
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
        if (state.selectedProduct?.id === action.payload.id) {
          state.selectedProduct = action.payload;
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
        state.data = state.data.filter(p => p.id !== action.payload);
        state.loading = false;
      })
      .addCase(deleteProductOffering.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export default ProductOfferingSlice.reducer;