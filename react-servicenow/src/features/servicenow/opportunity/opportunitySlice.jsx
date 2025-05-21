import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const backendUrl = import.meta.env.VITE_BACKEND_URL;
// ServiceNow API headers
const getHeaders = () => ({
  'Content-Type': 'application/json',
  'authorization': `${localStorage.getItem('access_token')}`, // or your auth method
});

// Async Thunks for each operation in the workflow

//workflow request call
export const workflow = createAsyncThunk(
  'opportunity/workflow',
  async (opportunityData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/opportunity-workflow`,
        opportunityData,
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// 1. Opportunity CRUD operations
export const createOpportunity = createAsyncThunk(
  'opportunity/createOpportunity',
  async (opportunityData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/opportunity`,
        opportunityData,
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getOpportunities = createAsyncThunk(
  'opportunity/getOpportunities',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateOpportunityStatus = createAsyncThunk(
  'opportunity/updateOpportunityStatus',
  async ({ id, status }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/opportunity/${id}`,
        { state: status },
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const deleteOpportunity = createAsyncThunk(
  'opportunity/deleteOpportunity',
  async (id, { rejectWithValue }) => {
    try {
      await axios.delete(
        `${backendUrl}/api/opportunity/${id}`,
        { headers: getHeaders() }
      );
      return id;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);



// 3. Product Offering Price CRUD operations
export const createProductOfferingPrice = createAsyncThunk(
  'opportunity/createProductOfferingPrice',
  async (productOfferingPriceData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/product-offering-price`,
        productOfferingPriceData,
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// 4. Opportunity Line Item CRUD operations
export const createOpportunityLineItem = createAsyncThunk(
  'opportunity/createOpportunityLineItem',
  async (lineItemData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${backendUrl}/api/opportunity-line-item`,
        lineItemData,
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

// Reference data fetchers
export const getSalesCycleTypes = createAsyncThunk(
  'opportunity/getSalesCycleTypes',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity-sales-cycle-type`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getStages = createAsyncThunk(
  'opportunity/getStages',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity-stage`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getAccounts = createAsyncThunk(
  'opportunity/getAccounts',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/account`,
        { headers: getHeaders() }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getUnitOfMeasures = createAsyncThunk(
  'opportunity/getUnitOfMeasures',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/measurment-unit`,
        { headers: getHeaders() }
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const getProductOfferings = createAsyncThunk(
  'opportunity/getProductOfferings',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product-offering-sn`,
        { headers: getHeaders() }
      );
      return response.data.result;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const initialState = {
  opportunities: [],
  salesCycleTypes: [],
  stages: [],
  accounts: [],
  unitOfMeasures: [],
  productOfferings: [],
  loading: false,
  error: null,
  currentPage: 1,
  totalItems: 0,
  limit: 10,
};

const opportunitySlice = createSlice({
  name: 'opportunity',
  initialState,
  reducers: {
    resetError: (state) => {
      state.error = null;
    },
    setCurrentPage: (state, action) => {
      state.currentPage = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder

      //workflow
      .addCase(workflow.pending, (state) => {
        state.loading = true;
      })
      .addCase(workflow.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities.unshift(action.payload);
      })
      .addCase(workflow.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to create opportunity';
      })
      // Create Opportunity
      .addCase(createOpportunity.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOpportunity.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities.unshift(action.payload);
      })
      .addCase(createOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to create opportunity';
      })

      // Get Opportunities
      .addCase(getOpportunities.pending, (state) => {
        state.loading = true;
      })
      .addCase(getOpportunities.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities = action.payload;
        state.totalItems = action.payload.length;
      })
      .addCase(getOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch opportunities';
      })

      // Update Opportunity Status
      .addCase(updateOpportunityStatus.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOpportunityStatus.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.opportunities.findIndex(
          opp => opp.sys_id === action.payload.sys_id
        );
        if (index !== -1) {
          state.opportunities[index] = action.payload;
        }
      })
      .addCase(updateOpportunityStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to update opportunity status';
      })

      // Delete Opportunity
      .addCase(deleteOpportunity.pending, (state) => {
        state.loading = true;
      })
      .addCase(deleteOpportunity.fulfilled, (state, action) => {
        state.loading = false;
        state.opportunities = state.opportunities.filter(
          opp => opp.sys_id !== action.payload
        );
      })
      .addCase(deleteOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to delete opportunity';
      })

      // Create Product Offering Price
      .addCase(createProductOfferingPrice.pending, (state) => {
        state.loading = true;
      })
      .addCase(createProductOfferingPrice.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createProductOfferingPrice.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to create product offering price';
      })

      // Create Opportunity Line Item
      .addCase(createOpportunityLineItem.pending, (state) => {
        state.loading = true;
      })
      .addCase(createOpportunityLineItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(createOpportunityLineItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to create opportunity line item';
      })

      // Get Sales Cycle Types
      .addCase(getSalesCycleTypes.pending, (state) => {
        state.loading = true;
      })
      .addCase(getSalesCycleTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.salesCycleTypes = action.payload;
      })
      .addCase(getSalesCycleTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch sales cycle types';
      })

      // Get Stages
      .addCase(getStages.pending, (state) => {
        state.loading = true;
      })
      .addCase(getStages.fulfilled, (state, action) => {
        state.loading = false;
        state.stages = action.payload;
      })
      .addCase(getStages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch stages';
      })

      // Get Accounts
      .addCase(getAccounts.pending, (state) => {
        state.loading = true;
      })
      .addCase(getAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(getAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch accounts';
      })

      // Get Unit of Measures
      .addCase(getUnitOfMeasures.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUnitOfMeasures.fulfilled, (state, action) => {
        state.loading = false;
        state.unitOfMeasures = action.payload;
      })
      .addCase(getUnitOfMeasures.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch unit of measures';
      })

      // Get Product Offerings
      .addCase(getProductOfferings.pending, (state) => {
        state.loading = true;
      })
      .addCase(getProductOfferings.fulfilled, (state, action) => {
        state.loading = false;
        state.productOfferings = action.payload;
      })
      .addCase(getProductOfferings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to fetch product offerings';
      });
  },
});

export const { resetError, setCurrentPage } = opportunitySlice.actions;

export default opportunitySlice.reducer;