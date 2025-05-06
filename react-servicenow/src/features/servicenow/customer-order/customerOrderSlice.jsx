import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'CustomerOrder/getall',
  async (_, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/customer-order", {
        headers: { authorization: access_token }
      }); 
      
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


export const create = createAsyncThunk(
  'CustomerOrder/create',
  async (productData, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.post("/api/customer-order", productData, {
        headers: { authorization: access_token },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);


// Slice
const CustomerOrderSlice = createSlice({
  name: 'CustomerOrder',
  initialState: { 
    data: [],
    selectedProduct: null,
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
        state.data = action.payload;
        state.loading = false;
      })
      .addCase(getall.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      })
      // Create
      .addCase(create.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(create.fulfilled, (state, action) => {
        state.data.unshift(action.payload);
        state.loading = false;
      })
      .addCase(create.rejected, (state, action) => {
        state.error = action.payload;
        state.loading = false;
      });
  },
});

export default CustomerOrderSlice.reducer;