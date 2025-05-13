import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Async Thunks
export const getall = createAsyncThunk(
  'ProductOfferingCategory/getall',
  async ({ page = 1, limit = 6, search = '' }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      const response = await axios.get("/api/product-offering-category", {
        headers: { authorization: access_token },
        params: { page, limit, search }
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
      
      // Extract catalog if it exists in the productData
      const { catalog, ...categoryData } = productData;
      
      // Create the category
      const response = await axios.post("/api/product-offering-category", categoryData, {
        headers: { authorization: access_token },
      });
      
      // If catalog is provided and status is published, create the relationship
      if (catalog && productData.status === 'published') {
        try {
          await axios.post(
            "/api/catalog-category-relationship",
            {
              catalog: catalog,
              category: response.data.result.sys_id
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': access_token
              }
            }
          );
        } catch (relationshipError) {
          console.error('Failed to create relationship:', relationshipError);
          // Continue without failing the whole operation
        }
      }
      
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || error.message);
    }
  }
);

export const createCatalogCategoryRelationship = createAsyncThunk(
  'ProductOfferingCategory/createRelationship',
  async ({ catalogId, categoryId }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      
      
      console.log('Creating relationship with:', {
        catalog: catalogId,
        category: categoryId
      });
      
      const response = await axios.post(
        "/api/category-catalog-relation",
        {
          catalog: catalogId,
          category: categoryId
        },
        {
          headers: { 
            'Content-Type': 'application/json',
            authorization: access_token  // Changez 'Authorization' en 'authorization' avec un 'a' minuscule
          }
        }
      );
      
      console.log('Relationship API response:', response.data);
      return response.data.result || response.data;
    } catch (error) {
      console.error('Relationship API error:', error);
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

      console.log('Sending status update request with:', {
        sys_id: id,
        status: newStatus
      });

      // Update the status using the correct endpoint
      const response = await axios.patch(
        `/api/product-offering-category-status`, 
        { 
          sys_id: id,
          status: newStatus 
        },
        { 
          headers: { 
            'Content-Type': 'application/json',
            authorization: access_token  // Changez 'Authorization' en 'authorization' avec un 'a' minuscule
          }
        }
      );
      
      console.log('Status update API response:', response.data);
      return response.data.result || response.data;
    } catch (err) {
      console.error('Status update API error:', err);
      return rejectWithValue(err.response?.data?.message || err.message);
    }
  }
);

export const updateCategory = createAsyncThunk(
  'ProductOfferingCategory/update',
  async ({ id, ...productData }, { rejectWithValue }) => {
    try {
      const access_token = localStorage.getItem('access_token');
      
      // Extract catalog if it exists
      const { catalog, ...categoryData } = productData;
      
      // Update the category
      const response = await axios.patch(
        `/api/product-offering-category/${id}`, 
        categoryData, 
        {
          headers: { 
            authorization: access_token, 
            'Content-Type': 'multipart/form-data'  
          } 
        }
      );
      
      // If catalog is provided and status is published, create/update the relationship
      if (catalog && productData.status === 'published') {
        try {
          await axios.post(
            "/api/catalog-category-relationship",
            {
              catalog: catalog,
              category: id
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': access_token
              }
            }
          );
        } catch (relationshipError) {
          console.error('Failed to create relationship:', relationshipError);
          // Continue without failing the whole operation
        }
      }
      
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
    error: null,
    searchTerm: '',
    relationshipStatus: {
      loading: false,
      error: null,
      success: false
    }
  },
  reducers: {
    setSearchTerm: (state, action) => {
      state.searchTerm = action.payload;
    },
    resetRelationshipStatus: (state) => {
      state.relationshipStatus = {
        loading: false,
        error: null,
        success: false
      };
    }
  },
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
        // Update search term if necessary
        if (action.meta.arg?.search !== undefined) {
          state.searchTerm = action.meta.arg.search;
        }
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

      // Create Relationship
      .addCase(createCatalogCategoryRelationship.pending, (state) => {
        state.relationshipStatus.loading = true;
        state.relationshipStatus.error = null;
        state.relationshipStatus.success = false;
      })
      .addCase(createCatalogCategoryRelationship.fulfilled, (state) => {
        state.relationshipStatus.loading = false;
        state.relationshipStatus.success = true;
      })
      .addCase(createCatalogCategoryRelationship.rejected, (state, action) => {
        state.relationshipStatus.loading = false;
        state.relationshipStatus.error = action.payload;
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
export const { setSearchTerm, resetRelationshipStatus } = ProductOfferingCategorySlice.actions;