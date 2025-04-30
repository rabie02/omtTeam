// features/aiSearch/aiSearchSlice.js
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

export const searchAI = createAsyncThunk(
  'aiSearch/search',
  async (searchTerm, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/api/ai-search?term=${encodeURIComponent(searchTerm)}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.error || 'AI search failed');
    }
  }
);

const aiSearchSlice = createSlice({
  name: 'aiSearch',
  initialState: {
    results: [],
    loading: false,
    error: null,
    searchTerm: ''
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    clearResults: (state) => {
      state.results = [];
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchAI.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchAI.fulfilled, (state, action) => {
        state.loading = false;
        state.results = action.payload;
      })
      .addCase(searchAI.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  }
});

export const { setSearchTerm, clearResults } = aiSearchSlice.actions;
export default aiSearchSlice.reducer;