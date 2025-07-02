import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function to get authorization headers
const getHeaders = () => {
  const access_token = localStorage.getItem('access_token');
  return { authorization: access_token };
};

// Async Thunk for contract generation
export const getContractModels = createAsyncThunk(
  'contractModel/getAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/contract-model/`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message
      );
    }
  }
);



// Slice
const contractModelSlice = createSlice({
  name: 'contractModel',
  initialState: {
    contractModels: [],
    loading: false,        // Loading state for generation
    error: null,           // Error for generation
  },
  reducers: {
    clearContractModels: (state) => {
      state.contractModels = [];
    },
    clearContractError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Contract
      .addCase(getContractModels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContractModels.fulfilled, (state, action) => {
        state.loading = false;
        state.contractModels = action.payload;
      })
      .addCase(getContractModels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearContractModels,
  clearContractError,
} = contractModelSlice.actions;

export default contractModelSlice.reducer;