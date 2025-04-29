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
          });
      },
    });
    
export default ProductSpecificationSlice.reducer;