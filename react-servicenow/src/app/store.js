import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice';
import productOfferingCatalogReducer from '../features/servicenow/product-offering/productOfferingCatalogSlice';
import productOfferingCategoryReducer from '../features/servicenow/product-offering/productOfferingCategorySlice';
import productOfferingReducer from '../features/servicenow/product-offering/productOfferingSlice';
import productSpecificationReducer from '../features/servicenow/product-specification/productSpecificationSlice';
import channelReducer from '../features/servicenow/channel/channelSlice';
import aiSearchReducer from '../features/servicenow/ai-search/aiSearchSlice';
import customerOrderReducer from '../features/servicenow/customer-order/customerOrderSlice';
import accountReducer from '../features/servicenow/account/accountSlice';
const store = configureStore({
  reducer: {
    auth: authReducer,
    productOfferingCatalog: productOfferingCatalogReducer,
    productOfferingCategory: productOfferingCategoryReducer,
    productOffering: productOfferingReducer,
    productSpecification: productSpecificationReducer,
    channel: channelReducer,
    aiSearch: aiSearchReducer,
    customerOrder: customerOrderReducer,
    account: accountReducer,
  },
});

export default store;
