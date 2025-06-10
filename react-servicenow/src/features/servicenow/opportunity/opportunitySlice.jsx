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
      
      return response.data.data;
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
  async ({ page = 1, limit = 6, q }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity`,
        { 
          headers: getHeaders(),
          params: { page, limit, q }
         },
        
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateOpportunityPricing = createAsyncThunk(
  'opportunity/updateOpportunityPricing',
  async ( body , { rejectWithValue }) => {
    try {
      const response = await axios.patch(
        `${backendUrl}/api/opportunity-edit`,
        body,
        { headers: getHeaders() }
      );
      return response.data;
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
      return response.data.result;
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


export const generateContract = createAsyncThunk(
  'opportunity/generateContract',
  async (op_id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity-generate-contract/${op_id}`,
        {headers: getHeaders()},
        
      );
      
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const downloadContract = createAsyncThunk(
  'opportunity/downloadContract',
  async (contract_id, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/opportunity-download-contract/${contract_id}`,
        {
          headers: getHeaders(),
          responseType: 'blob'
        },
        
      );
      
      return {id: contract_id, file:response.data};
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
  loading: false,
  partiallyLoading:false,
  error: null,
  currentPage: 1,
  totalItems: 0,
  limit: 6,
  totalPages: 1
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
        state.currentPage = action.payload.pagination.page;
        state.totalPages = action.payload.pagination.totalPages;
        state.totalItems = action.payload.pagination.total;
        state.limit = action.payload.pagination.limit || 6;
        state.opportunities = action.payload.data;
      })
      .addCase(getOpportunities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error || 'Failed to fetch opportunities';
      })

      // Update Opportunity Status
      .addCase(updateOpportunityPricing.pending, (state) => {
        state.loading = true;
      })
      .addCase(updateOpportunityPricing.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.opportunities.findIndex(
          opp => opp._id === action.payload.data._id
        );
        if (index !== -1) {
          state.opportunities[index] = action.payload.data;
        }
      })
      .addCase(updateOpportunityPricing.rejected, (state, action) => {
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
          opp => opp._id !== action.payload
        );
      })
      .addCase(deleteOpportunity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.error?.message || 'Failed to delete opportunity';
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


      // Generate Contract
      .addCase(generateContract.pending, (state) => {
        state.partiallyLoading = true;
      })
      .addCase(generateContract.fulfilled, (state, action) => {
        state.partiallyLoading = false;
        const index = state.opportunities.findIndex(
          opp => opp._id === action.payload.opportunity
        );
        if (index !== -1) {
          state.opportunities[index].contract = action.payload;
        }
      })
      .addCase(generateContract.rejected, (state, action) => {
        state.partiallyLoading = false;
        state.error = action.payload?.error || 'Failed to generate contract';
      })


      // Download Contract
      .addCase(downloadContract.pending, (state) => {
        state.partiallyLoading = true;
      })
      .addCase(downloadContract.fulfilled, (state, action) => {
        const id =action.payload.id;
        const file = action.payload.file;
        state.partiallyLoading = false;
        const opportunity = state.opportunities.find(
          opp => opp.contract && opp.contract._id === id
        );

        let fileName = opportunity ? opportunity.contract.file_name :'contract.pdf';
        
        // Download the file
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      })
      .addCase(downloadContract.rejected, (state, action) => {
        state.partiallyLoading = false;
        state.error = action.payload?.error || 'Failed to download contract';
      });
  },
});

export const { resetError, setCurrentPage } = opportunitySlice.actions;

export default opportunitySlice.reducer;