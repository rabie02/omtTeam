import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import axios from 'axios';

const getHeaders = () => ({
  'Content-Type': 'application/json',
  'authorization': `${localStorage.getItem('access_token')}`,
});

const backendUrl = import.meta.env.VITE_BACKEND_URL;

const initialState = {
  data: [],
  loading: false,
  error: null,
  createLoading: false,
  createError: null,
  updateLoading: false,
  updateError: null,
  deleteLoading: false,
  deleteError: null,
  currentPage: 1,
  totalItems: 0,
  limit: 6,
  searchQuery: ''
};

// Async Thunks
export const getContacts = createAsyncThunk(
  'contact/getall',
  async ({ page = 1, limit = 6, q = '' }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${backendUrl}/api/contact`, {
        headers: getHeaders(),
        params: { page, limit, q }
      });
      
      return {
        data: response.data.result || [],
        currentPage: page,
        totalItems: response.data.total || 0,
        limit
      };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createContact = createAsyncThunk(
  'contact/create',
  async (contactData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/contact`,
        contactData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateContact = createAsyncThunk(
  'contact/update',
  async ({ id, ...contactData }, { rejectWithValue }) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/contact/${id}`,
        contactData,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const updateContactStatus = createAsyncThunk(
  'contact/updateStatus',
  async ({ id, active }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/contact/${id}/status`,
        { active },
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const deleteContact = createAsyncThunk(
  'contact/delete',
  async (contactId, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${backendUrl}/api/contact/${contactId}`,
        { headers: getHeaders() }
      );
      return contactId;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

const contactSlice = createSlice({
  name: 'contact',
  initialState,
  reducers: {
    resetContacts: () => initialState,
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setLimit: (state, action) => {
      state.limit = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Get All Contacts
      .addCase(getContacts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getContacts.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.data;
        state.currentPage = action.payload.currentPage;
        state.totalItems = action.payload.totalItems;
        state.limit = action.payload.limit;
      })
      .addCase(getContacts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      
      // Create Contact
      .addCase(createContact.pending, (state) => {
        state.createLoading = true;
        state.createError = null;
      })
      .addCase(createContact.fulfilled, (state, action) => {
        state.createLoading = false;
        state.data = [action.payload, ...state.data].slice(0, state.limit);
        state.totalItems += 1;
      })
      .addCase(createContact.rejected, (state, action) => {
        state.createLoading = false;
        state.createError = action.payload;
      })
      
      // Update Contact
      .addCase(updateContact.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateContact.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(contact => 
          contact._id === action.payload._id ? action.payload : contact
        );
      })
      .addCase(updateContact.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Update Contact Status
      .addCase(updateContactStatus.pending, (state) => {
        state.updateLoading = true;
        state.updateError = null;
      })
      .addCase(updateContactStatus.fulfilled, (state, action) => {
        state.updateLoading = false;
        state.data = state.data.map(contact => 
          contact._id === action.payload._id ? action.payload : contact
        );
      })
      .addCase(updateContactStatus.rejected, (state, action) => {
        state.updateLoading = false;
        state.updateError = action.payload;
      })
      
      // Delete Contact
      .addCase(deleteContact.pending, (state) => {
        state.deleteLoading = true;
        state.deleteError = null;
      })
      .addCase(deleteContact.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.data = state.data.filter(contact => contact._id !== action.payload);
        state.totalItems -= 1;
        
        // Adjust current page if we deleted the last item on the page
        if (state.data.length === 0 && state.currentPage > 1) {
          state.currentPage -= 1;
        }
      })
      .addCase(deleteContact.rejected, (state, action) => {
        state.deleteLoading = false;
        state.deleteError = action.payload;
      });
  }
});

export const { 
  resetContacts, 
  setCurrentPage, 
  setSearchQuery,
  setLimit
} = contactSlice.actions;

export default contactSlice.reducer;