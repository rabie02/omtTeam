import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';


const backendUrl = import.meta.env.VITE_BACKEND_URL;

// Helper function to get authorization headers
const getHeaders = () => {
  const access_token = localStorage.getItem('access_token');
  return { authorization: access_token };
};

// Async Thunk for contract generation
export const generateContract = createAsyncThunk(
  'contract-q/generate',
  async ({quoteId, body}, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/quote-contract/${quoteId}`,
        body,
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
const contractQSlice = createSlice({
  name: 'contractQ',
  initialState: {
    generatedContract: null,
    loading: false,        // Loading state for generation
    error: null,           // Error for generation
  },
  reducers: {
    clearGeneratedContract: (state) => {
      state.generatedContract = null;
    },
    clearContractError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Contract
      .addCase(generateContract.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateContract.fulfilled, (state, action) => {
        state.loading = false;
        state.generatedContract = action.payload;
      })
      .addCase(generateContract.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const {
  clearGeneratedContract,
  clearContractError,
} = contractQSlice.actions;

export default contractQSlice.reducer;