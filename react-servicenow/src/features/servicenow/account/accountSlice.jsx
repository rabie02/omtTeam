import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'Account/getall',
  async (_, { rejectWithValue }) => {
    try {      
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/account", {
        headers: { authorization: access_token },
      });
      return response.data.result || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

// Slice
const AccountSlice = createSlice({
  name: 'Account',
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
      });
  },
});

export default AccountSlice.reducer;