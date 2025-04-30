import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

export const getall = createAsyncThunk(
    'ProductOffering/getallSpec',
    async (_, { rejectWithValue }) => {
      try {      
        const access_token = localStorage.getItem('access_token');
        const response = await axios.get("/api/product-spec", {
          headers: { authorization: access_token },
        
        }); 
        
        return response.data || [];
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
    }
  );

export const getPublished = createAsyncThunk(
    'ProductOffering/getallPubSpec',
    async ({ page = 1, limit = 8 }, { rejectWithValue }) => {
      try {      
        const access_token = localStorage.getItem('access_token');
        const response = await axios.get("/api/product-specification", {
          headers: { authorization: access_token },
          params: { page, limit, status: 'published'}
        });
        return response.data || [];
      } catch (error) {
        return rejectWithValue(error.response?.data?.message || error.message);
      }
    }
  );


const ProductSpecificationSlice = createSlice({
    name: 'ProductSpecification',
    initialState: { 
      data: [],
      selectedProduct: null,
      loading: true,
      error: null
    },
    extraReducers: (builder) => {
      builder
        // getall
        .addCase(getall.pending, (state)=>{
            state.loading = true;
            state.loading = null;
          })
          .addCase(getall.fulfilled, (state, action)=>{
            state.data = action.payload;
            state.loading = null;
          })
          .addCase(getall.rejected, (state, action)=>{
            state.error = action.payload;
            state.loading = null;
          })
          .addCase(getPublished.pending, (state)=>{
            state.loading = true;
            state.loading = null;
          })
          .addCase(getPublished.fulfilled, (state, action)=>{
            state.data = action.payload.data;
            state.currentPage = action.payload.page;
            state.totalPages = action.payload.totalPages;
            state.totalItems = action.payload.total;
            state.limit = action.meta.arg?.limit || 6;
            state.loading = false;
          })
          .addCase(getPublished.rejected, (state, action)=>{
            state.error = action.payload;
            state.loading = null;
          });
      },
    });
    
export default ProductSpecificationSlice.reducer;